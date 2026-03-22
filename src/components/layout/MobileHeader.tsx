import React from 'react';
import { Plus, Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface MobileHeaderProps {
  currentView: 'dashboard' | 'new' | 'syndicate' | 'advertising' | 'history';
  setCurrentView: (view: 'dashboard' | 'new' | 'syndicate' | 'advertising' | 'history') => void;
  hasStory?: boolean;
  isAnalyzing?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ currentView, setCurrentView, hasStory = false, isAnalyzing = false }) => {
  return (
    <div className="xl:hidden flex flex-col shrink-0 gap-4 p-4 bg-[#FDF06B] text-black border-b-4 border-black">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-xl uppercase tracking-tighter whitespace-nowrap">
            {currentView === 'dashboard' ? 'Dashboard' : currentView === 'syndicate' ? 'The Syndicate' : currentView === 'advertising' ? "Sterling's Cabinet" : currentView === 'history' ? 'History' : 'New Story'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {(currentView === 'dashboard' || currentView === 'syndicate' || currentView === 'history') && (
            <button 
              onClick={() => !isAnalyzing && setCurrentView('new')} 
              disabled={isAnalyzing}
              className={`p-2 bg-black text-white rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
          <UserMenu setCurrentView={setCurrentView} isAnalyzing={isAnalyzing} />
        </div>
      </div>
    </div>
  );
};
