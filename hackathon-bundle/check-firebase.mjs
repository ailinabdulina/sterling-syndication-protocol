// This script is executed by OpenClaw via cron
// It checks Firebase and returns tasks for processing

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the script directory
dotenv.config({ path: join(__dirname, '.env') });

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "twislysyndicate");

async function checkTasks() {
  try {
    await signInWithEmailAndPassword(auth, process.env.AGENT_EMAIL, process.env.AGENT_PASSWORD);
    
    const q = query(collection(db, "agent_tasks"), where("status", "==", "pending"));
    const snapshot = await getDocs(q);
    
    const tasks = [];
    snapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    
    return tasks;
  } catch (error) {
    console.error("Error:", error.message);
    return [];
  }
}

async function markProcessing(taskId) {
  const docRef = doc(db, "agent_tasks", taskId);
  await updateDoc(docRef, { status: "processing" });
}

async function markCompleted(taskId, result) {
  const docRef = doc(db, "agent_tasks", taskId);
  await updateDoc(docRef, { 
    status: "completed",
    result: result,
    completedAt: new Date().toISOString()
  });
}

async function markError(taskId, error) {
  const docRef = doc(db, "agent_tasks", taskId);
  await updateDoc(docRef, { 
    status: "error",
    errorMessage: error.message 
  });
}

// If executed directly, print pending tasks
if (import.meta.url === `file://${process.argv[1]}`) {
  const tasks = await checkTasks();
  console.log(JSON.stringify(tasks, null, 2));
}

export { checkTasks, markProcessing, markCompleted, markError };
