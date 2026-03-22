import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { MobileHeader } from './components/layout/MobileHeader';
import { DashboardView } from './views/DashboardView';
import { NewAnalysisView } from './views/NewAnalysisView';
import { SyndicateView } from './views/SyndicateView';
import { AdvertisingView } from './views/AdvertisingView';
import { HistoryView } from './views/HistoryView';
import { AuthProvider } from './contexts/AuthContext';
import { StoryData } from './types';
import { z } from 'zod';
import { StoryDataSchema } from './schemas';
import { unwrapBackendResponse } from './utils/jsonUtils';
import { Bell, X } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'new' | 'syndicate' | 'advertising' | 'history'>('new');
  const [analyzedStory, setAnalyzedStory] = useState<StoryData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<StoryData[]>([]);
  const [hasRequestedOffers, setHasRequestedOffers] = useState(false);
  const [hasSignedContract, setHasSignedContract] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isAnalyzing) {
        e.preventDefault();
        e.returnValue = 'Detecting morally questionable decisions… This may take up to 3 minutes. Are you sure you want to leave? Data may be lost.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAnalyzing]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('sterling_history');
    if (savedHistory) {
      try {
        let parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          parsedHistory = parsedHistory.map(item => unwrapBackendResponse(item));
        }
        const HistorySchema = z.array(StoryDataSchema);
        const validation = HistorySchema.safeParse(parsedHistory);
        if (validation.success) {
          setHistory(validation.data as StoryData[]);
        } else {
          console.warn("Zod validation failed for history:", validation.error);
          setHistory(parsedHistory); // Fallback to parsed data
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const handleSetAnalyzedStory = (story: StoryData, unlockOffers: boolean = false) => {
    setAnalyzedStory(story);
    setHasRequestedOffers(unlockOffers || story.hasRequestedOffers || false);
    setHasSignedContract(story.hasSignedContract || false);
    setHistory(prev => {
      const newTitle = story.story_title || story.Title || "Untitled";
      const newAuthor = story.author || story.Author || "Unknown";
      
      // Filter out any existing story with the same title and author
      const filteredHistory = prev.filter(item => {
        const itemTitle = item.story_title || item.Title || "Untitled";
        const itemAuthor = item.author || item.Author || "Unknown";
        return !(itemTitle === newTitle && itemAuthor === newAuthor);
      });

      const newHistory = [story, ...filteredHistory].slice(0, 50);
      localStorage.setItem('sterling_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleContractSigned = (txHash?: string, tokenId?: number) => {
    setHasSignedContract(true);
    if (analyzedStory) {
      const updatedStory = { ...analyzedStory, hasSignedContract: true, txHash, tokenId };
      setAnalyzedStory(updatedStory);
      setHistory(prev => {
        const newHistory = prev.map(item => {
          const itemTitle = item.story_title || item.Title || "Untitled";
          const itemAuthor = item.author || item.Author || "Unknown";
          const currentTitle = analyzedStory.story_title || analyzedStory.Title || "Untitled";
          const currentAuthor = analyzedStory.author || analyzedStory.Author || "Unknown";
          if (itemTitle === currentTitle && itemAuthor === currentAuthor) {
            return updatedStory;
          }
          return item;
        });
        localStorage.setItem('sterling_history', JSON.stringify(newHistory));
        return newHistory;
      });
    }
  };

  const handleRequestOffers = () => {
    setHasRequestedOffers(true);
    if (analyzedStory) {
      const updatedStory = { ...analyzedStory, hasRequestedOffers: true };
      setAnalyzedStory(updatedStory);
      setHistory(prev => {
        const newHistory = prev.map(item => {
          const itemTitle = item.story_title || item.Title || "Untitled";
          const itemAuthor = item.author || item.Author || "Unknown";
          const currentTitle = analyzedStory.story_title || analyzedStory.Title || "Untitled";
          const currentAuthor = analyzedStory.author || analyzedStory.Author || "Unknown";
          if (itemTitle === currentTitle && itemAuthor === currentAuthor) {
            return updatedStory;
          }
          return item;
        });
        localStorage.setItem('sterling_history', JSON.stringify(newHistory));
        return newHistory;
      });
    }
  };

  const handleVerdictsReady = () => {
    if (currentView !== 'syndicate') {
      setShowNotification(true);
    }
  };

  useEffect(() => {
    if (currentView === 'syndicate') {
      setShowNotification(false);
    }
  }, [currentView]);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#E5E7EB] flex items-center justify-center p-0 sm:p-4 md:p-4 font-sans antialiased relative">
        {showNotification && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white text-black p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 relative">
              <button 
                onClick={() => setShowNotification(false)}
                className="absolute top-4 right-4 p-2 text-black/40 hover:text-black hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-6">
                <Bell className="w-8 h-8 text-black" />
              </div>
              <h4 className="font-black text-2xl uppercase tracking-tight mb-2">Verdicts Ready</h4>
              <p className="text-black/60 text-base mb-8">The investors have reached a decision.</p>
              <button 
                onClick={() => {
                  setCurrentView('syndicate');
                  setShowNotification(false);
                }}
                className="w-full px-6 py-4 bg-black text-white text-sm font-black uppercase tracking-widest rounded-xl hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all"
              >
                View Investor Verdicts
              </button>
            </div>
          </div>
        )}
        <div className="w-full max-w-[1920px] h-[100dvh] sm:h-[calc(100dvh-32px)] md:h-[96vh] bg-[#1A1A1A] rounded-none sm:rounded-[2rem] md:rounded-[2.5rem] flex flex-col xl:flex-row overflow-hidden shadow-2xl border-0 sm:border-4 md:border-8 border-[#1A1A1A]">
          
          <MobileHeader currentView={currentView} setCurrentView={setCurrentView} hasStory={!!analyzedStory} isAnalyzing={isAnalyzing} />

          {currentView === 'dashboard' && (
            <DashboardView setCurrentView={setCurrentView} analyzedStory={analyzedStory} isAnalyzing={isAnalyzing} history={history} onRequestOffers={handleRequestOffers} hasSignedContract={hasSignedContract} />
          )}
          
          {analyzedStory && hasRequestedOffers && (
            <SyndicateView 
              isActive={currentView === 'syndicate'} 
              setCurrentView={setCurrentView} 
              analyzedStory={analyzedStory} 
              onContractSigned={handleContractSigned} 
              hasSignedContract={hasSignedContract} 
              onVerdictsReady={handleVerdictsReady} 
            />
          )}

          {currentView === 'advertising' && (
            <AdvertisingView setCurrentView={setCurrentView} analyzedStory={analyzedStory} />
          )}

          {currentView === 'history' && (
            <HistoryView setCurrentView={setCurrentView} history={history} setAnalyzedStory={handleSetAnalyzedStory} />
          )}

          {currentView === 'new' && (
            <NewAnalysisView 
              setCurrentView={setCurrentView} 
              setAnalyzedStory={handleSetAnalyzedStory} 
              setIsAnalyzing={setIsAnalyzing} 
              analysisError={analysisError}
              setAnalysisError={setAnalysisError}
            />
          )}

          <Sidebar currentView={currentView} setCurrentView={setCurrentView} hasStory={!!analyzedStory} hasRequestedOffers={hasRequestedOffers} hasSignedContract={hasSignedContract} isAnalyzing={isAnalyzing} analyzedStory={analyzedStory} />

        </div>
      </div>
    </AuthProvider>
  );
}
