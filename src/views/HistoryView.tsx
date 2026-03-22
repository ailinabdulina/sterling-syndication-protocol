import React, { useState } from 'react';
import { StoryData } from '../types';
import { Clock, ArrowRight, Trash2, X, FileText } from 'lucide-react';
import { TrustBadge } from '../components/dashboard/TrustBadge';

interface HistoryViewProps {
  setCurrentView: (view: 'dashboard' | 'new' | 'syndicate' | 'advertising' | 'history') => void;
  history: StoryData[];
  setAnalyzedStory: (story: StoryData, unlockAll?: boolean) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ setCurrentView, history, setAnalyzedStory }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedOriginalText, setSelectedOriginalText] = useState<{title: string, text: string} | null>(null);

  const handleSelectStory = (story: StoryData) => {
    setAnalyzedStory(story);
    setCurrentView('dashboard');
  };

  const handleClearHistory = () => {
    localStorage.removeItem('sterling_history');
    window.location.reload();
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col p-4 sm:p-6 md:p-8 w-full overflow-hidden bg-[#E4E3E0] relative">
      <div className="bg-[#F5F5F0] border-4 border-black rounded-3xl p-6 sm:p-8 flex flex-col h-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        
        <div className="flex justify-between items-center mb-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter">
              Analysis History
            </h2>
          </div>
          {history.length > 0 && (
            <button 
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black rounded-lg text-sm font-black uppercase hover:bg-red-500 hover:text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar -mx-2 px-2">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Clock className="w-16 h-16 mb-4" />
              <p className="text-xl font-black uppercase tracking-widest">No history yet</p>
              <p className="text-sm font-bold mt-2">Analyze a story to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {history.map((story, index) => {
                const title = story.story_title || story.Title || "Untitled";
                const author = story.author || story.Author || "Unknown";
                const tsiScore = Math.round(
                  ((story.tsi_evaluation?.CMA?.score || 0) * 0.40) + 
                  ((story.tsi_evaluation?.PSP?.score || 0) * 0.40) + 
                  ((story.tsi_evaluation?.IER?.score || 0) * 0.20)
                );
              
                const teiScore = Math.round(
                  ((story.tei_evaluation?.TWS?.score || 0) * 0.20) + 
                  ((story.tei_evaluation?.PEL?.score || 0) * 0.20) + 
                  ((story.tei_evaluation?.ACV?.score || 0) * 0.15) + 
                  ((story.tei_evaluation?.HTR?.score || 0) * 0.15) + 
                  ((story.tei_evaluation?.VRS?.score || 0) * 0.15) + 
                  ((story.tei_evaluation?.SMR?.score || 0) * 0.15)
                );

                const getVerdict = (tsi: number, tei: number) => {
                  if (tsi >= 70 && tei >= 70) return "INVEST";
                  if (tsi >= 70 || tei >= 70) return "INCUBATE";
                  if (tsi >= 40 && tei >= 40) return "WATCH";
                  return "PASS";
                };

                const verdict = story.business_insights?.overall_conclusion || story.sterling_verdict || getVerdict(tsiScore, teiScore);

                return (
                  <div 
                    key={index}
                    onClick={() => handleSelectStory(story)}
                    className="bg-white border-4 border-black rounded-2xl p-5 cursor-pointer hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col gap-4 group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xl font-black uppercase tracking-tight truncate">{title}</h3>
                        {story.verification_report?.trust_score !== undefined && (
                          <TrustBadge score={story.verification_report.trust_score} />
                        )}
                      </div>
                      <p className="text-sm font-bold text-black/60 uppercase tracking-widest truncate">By {author}</p>
                    </div>
                    
                    <div className="flex gap-2 mt-auto">
                      <div className="flex-1 bg-[#E4E3E0] border-2 border-black rounded-lg p-2 text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-black/60">TSI</div>
                        <div className="text-lg font-black">{tsiScore}</div>
                      </div>
                      <div className="flex-1 bg-[#E4E3E0] border-2 border-black rounded-lg p-2 text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-black/60">TEI</div>
                        <div className="text-lg font-black">{teiScore}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t-2 border-black/10">
                      <span className="text-xs font-black uppercase tracking-widest truncate max-w-[50%]">{verdict}</span>
                      <div className="flex items-center gap-2">
                        {story.original_text && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOriginalText({ title, text: story.original_text! });
                            }}
                            className="p-1.5 hover:bg-black/10 rounded-lg transition-colors"
                            title="View Original Text"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Custom Confirm Modal */}
      {showConfirm && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#E4E3E0] border-4 border-black rounded-3xl p-6 max-w-sm w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Clear History?</h3>
              <button onClick={() => setShowConfirm(false)} className="p-1 hover:bg-black/10 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm font-bold mb-6">This will permanently delete all your saved story analyses. This action cannot be undone.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border-4 border-black rounded-xl font-black uppercase tracking-widest hover:bg-black/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearHistory}
                className="flex-1 py-3 bg-red-500 text-white border-4 border-black rounded-xl font-black uppercase tracking-widest hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Original Text Modal */}
      {selectedOriginalText && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8">
          <div className="bg-[#F5F5F0] border-4 border-black rounded-3xl p-6 sm:p-8 w-full max-w-4xl h-[80vh] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 shrink-0 border-b-4 border-black pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter line-clamp-1">{selectedOriginalText.title}</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-black/60">Original Manuscript</p>
                </div>
              </div>
              <button onClick={() => setSelectedOriginalText(null)} className="p-2 hover:bg-black/10 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar bg-white border-4 border-black rounded-2xl p-6">
              <div className="whitespace-pre-wrap font-medium text-base sm:text-lg leading-relaxed">
                {selectedOriginalText.text}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
