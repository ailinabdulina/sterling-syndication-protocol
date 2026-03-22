import React, { useState } from 'react';
import { X, Carrot, Loader2, Database } from 'lucide-react';
import { openclawService } from '../services/openclaw';
import { useAuth } from '../contexts/AuthContext';
import { StoryData } from '../types';
import { MOCK_STORY_DATA } from '../utils/mockData';

interface NewAnalysisViewProps {
  setCurrentView: (view: 'dashboard' | 'new' | 'syndicate' | 'advertising') => void;
  setAnalyzedStory: (story: StoryData, unlockAll?: boolean) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  analysisError: string | null;
  setAnalysisError: (error: string | null) => void;
}

export const NewAnalysisView: React.FC<NewAnalysisViewProps> = ({ setCurrentView, setAnalyzedStory, setIsAnalyzing, analysisError, setAnalysisError }) => {
  const [storyText, setStoryText] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'processing' | 'error'>(analysisError ? 'error' : 'idle');
  const { user, ensureWallet } = useAuth();

  const handleLoadMockData = () => {
    setAnalyzedStory(MOCK_STORY_DATA, true);
    setCurrentView('dashboard');
  };

  const handleAnalyze = async () => {
    if (!user) {
      setAnalysisError("Please login first to analyze a story.");
      setStatus('error');
      return;
    }
    
    // Ensure wallet exists before allowing analysis
    const walletAddress = await ensureWallet();
    if (!walletAddress) {
      setAnalysisError("You must unlock your Web3 wallet to analyze a story.");
      setStatus('error');
      return;
    }

    if (!storyText.trim()) {
      setAnalysisError("Please enter some text.");
      setStatus('error');
      return;
    }

    setStatus('sending');
    setAnalysisError(null);
    setIsAnalyzing(true);
    setCurrentView('dashboard');
    
    try {
      const taskId = await openclawService.analyzeStory(
        storyText,
        user.uid,
        (metrics) => {
          console.log('Task completed:', metrics);
          metrics.taskId = taskId;
          metrics.original_text = storyText;
          setAnalyzedStory(metrics);
          setStatus('idle');
          setIsAnalyzing(false);
        },
        (err) => {
          console.error('Task error:', err);
          setAnalysisError(err.message);
          setStatus('error');
          setIsAnalyzing(false);
          setCurrentView('new'); // Go back to new view to show error
        }
      );
      
      setStatus('processing');
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'Failed to send task');
      setStatus('error');
      setIsAnalyzing(false);
      setCurrentView('new');
    }
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col p-4 sm:p-6 md:p-8 w-full overflow-hidden bg-[#E4E3E0]">
      <div className="bg-[#F5F5F0] border-4 border-black rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col h-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
        <div className="flex justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black uppercase tracking-tighter">
                I'm Sterling, your agent.
              </h2>
              <p className="text-black font-bold mt-2 text-sm sm:text-base uppercase tracking-widest">Drop your manuscript below. Let's see what you've got and how much it's worth on the market.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
          </div>
        </div>
        
        <textarea 
          className="flex-1 w-full bg-white border-4 border-black rounded-2xl p-6 text-base sm:text-lg resize-none focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hide-scrollbar font-medium placeholder:text-gray-400"
          placeholder="Paste your story, script, or manuscript text here..."
          value={storyText}
          onChange={(e) => setStoryText(e.target.value)}
          disabled={status === 'sending' || status === 'processing'}
          maxLength={30000}
        />
        
        <div className="flex justify-end mt-2">
          <span className={`text-xs font-bold uppercase tracking-widest ${storyText.length >= 30000 ? 'text-red-500' : 'text-gray-500'}`}>
            {storyText.length.toLocaleString()} / 30,000
          </span>
        </div>
        
        {status === 'error' && analysisError && (
          <div className="mt-4 p-4 bg-red-100 border-2 border-red-500 text-red-800 rounded-xl font-bold overflow-auto max-h-64">
            Error: <pre className="whitespace-pre-wrap text-sm mt-2">{analysisError}</pre>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <button 
            onClick={handleLoadMockData}
            className="px-6 py-3.5 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-widest bg-[#FDE073] text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Database className="w-5 h-5" /> View Mock Data
          </button>
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-black hover:bg-black/10 transition-colors"
              disabled={status === 'sending' || status === 'processing'}
            >
              Cancel
            </button>
            <button 
              onClick={handleAnalyze}
              disabled={status === 'sending' || status === 'processing' || !user}
              className="px-8 py-3.5 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-widest bg-[#86F29F] text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'sending' || status === 'processing' ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
              ) : (
                <><Carrot className="w-5 h-5" /> Feed text to Sterling</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
