export function unwrapBackendResponse(parsedResult: any): any {
  if (parsedResult && typeof parsedResult === 'object') {
    // Check if it has the wrapper structure
    if (parsedResult.status === 'completed' || parsedResult.processorVersion || parsedResult.validationPassed !== undefined) {
      // The actual data might be nested in score, result, output, or data
      const rootProps = { ...parsedResult };
      delete rootProps.score;
      delete rootProps.result;
      delete rootProps.output;
      delete rootProps.data;
      delete rootProps.status;
      delete rootProps.processorVersion;
      delete rootProps.validationPassed;
      
      if (parsedResult.score && typeof parsedResult.score === 'object') {
        return { ...rootProps, ...parsedResult.score, verification_report: parsedResult.verificationReport || parsedResult.verification_report };
      }
      if (parsedResult.result && typeof parsedResult.result === 'object') {
        return { ...rootProps, ...parsedResult.result, verification_report: parsedResult.verificationReport || parsedResult.verification_report };
      }
      if (parsedResult.output && typeof parsedResult.output === 'object') {
        return { ...rootProps, ...parsedResult.output, verification_report: parsedResult.verificationReport || parsedResult.verification_report };
      }
      if (parsedResult.data && typeof parsedResult.data === 'object') {
        return { ...rootProps, ...parsedResult.data, verification_report: parsedResult.verificationReport || parsedResult.verification_report };
      }
    }
  }
  return parsedResult;
}

export function extractJsonFromString(str: string): string {
  let cleanStr = str.trim();
  
  // 1. Try to extract from markdown blocks
  const markdownMatch = cleanStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }
  
  // 2. If no markdown block, try to find the first { or [ and last } or ]
  const firstBrace = cleanStr.indexOf('{');
  const firstBracket = cleanStr.indexOf('[');
  
  let firstIndex = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    firstIndex = Math.min(firstBrace, firstBracket);
  } else {
    firstIndex = Math.max(firstBrace, firstBracket);
  }
  
  if (firstIndex !== -1) {
    const lastBrace = cleanStr.lastIndexOf('}');
    const lastBracket = cleanStr.lastIndexOf(']');
    
    let lastIndex = -1;
    if (lastBrace !== -1 && lastBracket !== -1) {
      lastIndex = Math.max(lastBrace, lastBracket);
    } else {
      lastIndex = Math.max(lastBrace, lastBracket);
    }
    
    if (lastIndex !== -1 && lastIndex >= firstIndex) {
      return cleanStr.substring(firstIndex, lastIndex + 1);
    }
  }
  
  // 3. Fallback to original string
  return cleanStr;
}
