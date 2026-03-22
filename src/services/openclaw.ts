import { db } from '../firebase';
import { collection, addDoc, doc, onSnapshot, serverTimestamp, updateDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { StoryData, SyndicateReviewResult } from '../types';
import { MOCK_SYNDICATE_RESULT } from '../utils/mockData';
import { StoryDataSchema, SyndicateReviewResultSchema } from '../schemas';
import { jsonrepair } from 'jsonrepair';
import { extractJsonFromString, unwrapBackendResponse } from '../utils/jsonUtils';

export interface AgentVerdict {
  nickname: string;
  status: 'accept' | 'reject' | 'counter';
  reason: string;
  investmentAmount?: number;
}

/**
 * OpenClaw Service (Firebase Queue Pattern)
 * 
 * This service communicates with your local laptop securely via Firestore.
 * The frontend writes a "task" document to Firestore.
 * Your laptop listens to Firestore, processes the task, and writes the result back.
 * No open ports or ngrok required!
 */
export const openclawService = {
  /**
   * Requests story analysis by writing a task to Firestore and listening for the result.
   */
  async analyzeStory(
    text: string, 
    authorUid: string, 
    onComplete: (result: StoryData) => void, 
    onError: (err: Error) => void
  ): Promise<string> {
    try {
      // 1. Create a task document in the 'agent_tasks' collection
      const docRef = await addDoc(collection(db, 'agent_tasks'), {
        authorUid: authorUid,
        type: 'analyze_story',
        status: 'pending',
        payload: {
          text: text
        },
        createdAt: new Date().toISOString()
      });

      // 2. Listen for changes to this specific document
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        if (data.status === 'completed' && data.result) {
          console.log("Raw agent result from OpenClaw:", data.result);
          try {
            let parsedResult;
            if (typeof data.result === 'string') {
              // Clean up markdown code blocks if present
              let cleanString = data.result.trim();
              
              // Skip known API errors silently
              if (cleanString.includes('⚠️ API rat') || cleanString.startsWith('⚠️')) {
                throw new Error("API rate limit or warning encountered");
              }
              
              cleanString = extractJsonFromString(cleanString);
              try {
                parsedResult = JSON.parse(cleanString);
              } catch (e) {
                console.warn("JSON parse failed in analyzeStory, attempting to repair...", e);
                try {
                  const repaired = jsonrepair(cleanString);
                  parsedResult = JSON.parse(repaired);
                } catch (repairError) {
                  throw new Error(`Failed to parse and repair JSON. Raw output:\n\n${cleanString}`);
                }
              }
            } else {
              parsedResult = data.result;
            }

            parsedResult = unwrapBackendResponse(parsedResult);

            // Inject top-level verificationReport if it exists
            if (data.verificationReport && !parsedResult.verification_report) {
              parsedResult.verification_report = data.verificationReport;
            }

            // Inject original text if available
            if (data.payload?.text && !parsedResult.original_text) {
              parsedResult.original_text = data.payload.text;
            }

            const validationResult = StoryDataSchema.safeParse(parsedResult);
            if (!validationResult.success) {
              console.warn("Zod validation failed for StoryData:", validationResult.error);
              throw new Error(`Invalid data format from agent: ${validationResult.error.message}`);
            }

            onComplete(parsedResult as StoryData);
          } catch (e) {
            console.error("Failed to parse agent result:", e);
            const rawOutput = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
            onError(new Error(`Failed to parse agent result as JSON. Raw output:\n\n${rawOutput}`));
          }
          unsubscribe(); // Stop listening
        } else if (data.status === 'error') {
          let msg = data.errorMessage || 'Agent encountered an error';
          if (data.errorCode === 'PROMPT_INJECTION_DETECTED') {
            msg = 'Review Failed / отклонено по безопасности: I wanted to eat carrots, but you gave me a prompt injection. We are not going to be friends.';
          }
          onError(new Error(msg));
          unsubscribe(); // Stop listening
        } else if (data.status === 'rejected') {
          let msg = data.errorMessage || 'Task was rejected';
          if (data.errorCode === 'PROMPT_INJECTION_DETECTED' || data.reason === 'prompt_injection_detected') {
            msg = 'Review Failed / отклонено по безопасности: I wanted to eat carrots, but you gave me a prompt injection. We are not going to be friends.';
          }
          onError(new Error(msg));
          unsubscribe();
        }
      }, (err) => {
        onError(err);
        unsubscribe();
      });

      return docRef.id; // Return task ID so UI can track it
    } catch (error) {
      console.error('Error creating analysis task:', error);
      throw error;
    }
  },

  /**
   * Requests Syndicate verdicts for a signed contract.
   */
  async getSyndicateVerdicts(
    sourceTaskId: string,
    authorUid: string,
    onComplete: (result: SyndicateReviewResult, isExisting?: boolean) => void,
    onError: (err: Error) => void
  ): Promise<string> {
    if (sourceTaskId === 'mock-task-id') {
      setTimeout(() => {
        onComplete(MOCK_SYNDICATE_RESULT, false);
      }, 1500); // Simulate network delay
      return 'mock-task-id';
    }

    try {
      const q = query(
        collection(db, 'agent_tasks'),
        where('authorUid', '==', authorUid),
        where('type', '==', 'syndicate_review'),
        where('payload.sourceTaskId', '==', sourceTaskId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      let docRef;

      if (!querySnapshot.empty) {
        docRef = querySnapshot.docs[0].ref;
        const existingData = querySnapshot.docs[0].data();
        
        // If it's already completed, we can just return the result immediately
        if (existingData.status === 'completed' && existingData.result) {
          try {
            let parsedResult = existingData.result;
            if (typeof parsedResult === 'string') {
              let cleanString = parsedResult.trim();
              cleanString = extractJsonFromString(cleanString);
              try {
                parsedResult = JSON.parse(cleanString);
              } catch (e) {
                console.warn("JSON parse failed in getSyndicateVerdicts (existing), attempting to repair...", e);
                try {
                  const repaired = jsonrepair(cleanString);
                  parsedResult = JSON.parse(repaired);
                } catch (repairError) {
                  throw new Error(`Failed to parse and repair JSON. Raw output:\n\n${cleanString}`);
                }
              }
            }
            
            // Inject top-level verificationReport if it exists
            if (existingData.verificationReport && !parsedResult.verification_report) {
              parsedResult.verification_report = existingData.verificationReport;
            }
            
            const validationResult = SyndicateReviewResultSchema.safeParse(parsedResult);
            if (!validationResult.success) {
              console.warn("Zod validation failed for existing SyndicateReviewResult:", validationResult.error);
              throw new Error(`Invalid data format from syndicate: ${validationResult.error.message}`);
            }
            
            onComplete(parsedResult as SyndicateReviewResult, true);
            return docRef.id;
          } catch (e) {
            console.error("Failed to parse existing syndicate result:", e);
          }
        }
      } else {
        docRef = await addDoc(collection(db, 'agent_tasks'), {
          authorUid: authorUid,
          type: 'syndicate_review',
          status: 'pending',
          payload: {
            sourceTaskId
          },
          createdAt: new Date().toISOString()
        });
      }

      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        if (data.status === 'completed' && data.result) {
          console.log("Raw syndicate result from OpenClaw:", data.result);
          try {
            let parsedResult;
            if (typeof data.result === 'string') {
              let cleanString = data.result.trim();
              
              // Skip known API errors silently
              if (cleanString.includes('⚠️ API rat') || cleanString.startsWith('⚠️')) {
                throw new Error("API rate limit or warning encountered");
              }
              
              cleanString = extractJsonFromString(cleanString);
              try {
                parsedResult = JSON.parse(cleanString);
              } catch (e) {
                console.warn("JSON parse failed in getSyndicateVerdicts (new), attempting to repair...", e);
                try {
                  const repaired = jsonrepair(cleanString);
                  parsedResult = JSON.parse(repaired);
                } catch (repairError) {
                  throw new Error(`Failed to parse and repair JSON. Raw output:\n\n${cleanString}`);
                }
              }
            } else {
              parsedResult = data.result;
            }

            parsedResult = unwrapBackendResponse(parsedResult);

            // Inject top-level verificationReport if it exists
            if (data.verificationReport && !parsedResult.verification_report) {
              parsedResult.verification_report = data.verificationReport;
            }

            const validationResult = SyndicateReviewResultSchema.safeParse(parsedResult);
            if (!validationResult.success) {
              console.warn("Zod validation failed for SyndicateReviewResult:", validationResult.error);
              throw new Error(`Invalid data format from syndicate: ${validationResult.error.message}`);
            }

            onComplete(parsedResult as SyndicateReviewResult);
          } catch (e) {
            console.error("Failed to parse syndicate result:", e);
            const rawOutput = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
            onError(new Error(`Failed to parse syndicate result as JSON. Raw output:\n\n${rawOutput}`));
          }
          unsubscribe();
        } else if (data.status === 'error') {
          let msg = data.errorMessage || 'Syndicate encountered an error';
          if (data.errorCode === 'PROMPT_INJECTION_DETECTED') {
            msg = 'Review Failed / отклонено по безопасности: I wanted to eat carrots, but you gave me a prompt injection. We are not going to be friends.';
          }
          onError(new Error(msg));
          unsubscribe();
        } else if (data.status === 'rejected') {
          let msg = data.errorMessage || 'Syndicate review was rejected';
          if (data.errorCode === 'PROMPT_INJECTION_DETECTED' || data.reason === 'prompt_injection_detected') {
            msg = 'Review Failed / отклонено по безопасности: I wanted to eat carrots, but you gave me a prompt injection. We are not going to be friends.';
          }
          onError(new Error(msg));
          unsubscribe();
        }
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating syndicate task:', error);
      throw error;
    }
  }
};
