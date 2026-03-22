import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Megaphone, Plus, LogIn, LogOut, Copy, Check, Clock, Store } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { StoryData } from '../../types';

interface SidebarProps {
  currentView: 'dashboard' | 'new' | 'syndicate' | 'advertising' | 'history';
  setCurrentView: (view: 'dashboard' | 'new' | 'syndicate' | 'advertising' | 'history') => void;
  hasStory?: boolean;
  hasRequestedOffers?: boolean;
  hasSignedContract?: boolean;
  isAnalyzing?: boolean;
  analyzedStory?: StoryData | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, hasStory = false, hasRequestedOffers = false, hasSignedContract = false, isAnalyzing = false, analyzedStory }) => {
  const { user, loginWithGoogle, logout, walletAddress, walletBalance } = useAuth();
  const [showWallet, setShowWallet] = useState(false);
  const [copied, setCopied] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const isMockData = analyzedStory?.taskId === 'mock-task-id';
  const canAccessAdvertising = hasSignedContract || isMockData;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowWallet(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleHistoryClick = () => {
    if (!isAnalyzing) {
      setCurrentView('history');
      setShowWallet(false);
    }
  };

  return (
    <div className="hidden xl:flex w-[90px] bg-[#FDF06B] rounded-r-[2rem] flex-col items-center py-6 justify-between shrink-0">
      <div className="flex flex-col gap-4 items-center">
        {user ? (
          <>
            <div className="relative" ref={popupRef}>
              <img 
                src={user.photoURL || ''} 
                alt="User" 
                className="w-14 h-14 rounded-full border-4 border-[#FDF06B] shadow-sm cursor-pointer hover:scale-105 transition-transform" 
                referrerPolicy="no-referrer" 
                onClick={() => setShowWallet(!showWallet)}
              />
              {showWallet && (
                <div className="absolute right-full mr-6 top-0 bg-white text-black p-5 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black z-50 w-80">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-black/10">
                      <img src={user.photoURL || ''} alt="User" className="w-10 h-10 rounded-full border-2 border-black" referrerPolicy="no-referrer" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-black text-sm truncate">{user.displayName || 'User'}</span>
                        <span className="text-xs text-black/50 font-bold truncate">{user.email}</span>
                      </div>
                    </div>
                    {walletAddress && (
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-black/40 mb-1">Smart Wallet (Sepolia)</div>
                        <div className="font-mono text-sm font-bold break-all mb-4 text-black">{walletAddress}</div>
                        <div className="flex items-center justify-between bg-[#FDF06B] border-2 border-black rounded-xl p-3 mb-4">
                          <span className="text-xs font-black text-black uppercase tracking-wider">Balance</span>
                          <span className="text-lg font-black text-black">₮{walletBalance}</span>
                        </div>
                        <button 
                          onClick={handleCopy}
                          className="flex items-center gap-2 text-sm bg-white hover:bg-black hover:text-white border-2 border-black px-3 py-2.5 rounded-xl transition-colors w-full justify-center mb-2 font-bold"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Copied!' : 'Copy Address'}
                        </button>
                      </div>
                    )}
                    
                    <button 
                      onClick={handleHistoryClick}
                      disabled={isAnalyzing}
                      className={`flex items-center gap-2 text-sm bg-[#E5E7EB] hover:bg-black hover:text-white border-2 border-black px-3 py-2.5 rounded-xl transition-colors w-full justify-center font-black uppercase tracking-widest ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Clock className="w-4 h-4" />
                      History
                    </button>
                  </div>
                  <div className="absolute top-6 -right-3 w-5 h-5 bg-white border-t-4 border-r-4 border-black transform rotate-45"></div>
                </div>
              )}
            </div>
            <button 
              onClick={logout}
              className="w-10 h-10 rounded-full flex items-center justify-center text-black hover:bg-black/10 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button 
            onClick={loginWithGoogle}
            className="w-14 h-14 rounded-full bg-black overflow-hidden border-4 border-[#FDF06B] shadow-sm flex items-center justify-center text-white hover:scale-105 transition-transform cursor-pointer"
            title="Sign In with Google"
          >
            <LogIn className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 items-center">
        <div className="relative group">
          <button 
            onClick={() => !isAnalyzing && setCurrentView('new')}
            disabled={isAnalyzing}
            className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${currentView === 'new' ? 'bg-black text-white shadow-xl' : 'text-black hover:bg-black/10'}`}
          >
            <Plus className="w-7 h-7" />
          </button>
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
            Evaluate new story
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-black"></div>
          </div>
        </div>
        <div className="relative group">
          <button 
            onClick={() => !isAnalyzing && hasStory && setCurrentView('dashboard')}
            disabled={!hasStory || isAnalyzing}
            className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${!hasStory || isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${currentView === 'dashboard' ? 'bg-black text-white shadow-xl' : 'text-black hover:bg-black/10'}`}
          >
            <LayoutDashboard className="w-7 h-7" />
          </button>
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
            {!hasStory ? 'Analyze a story first' : 'Dashboard'}
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-black"></div>
          </div>
        </div>
        <div className="relative group">
          <button 
            onClick={() => !isAnalyzing && hasRequestedOffers && setCurrentView('syndicate')}
            disabled={!hasRequestedOffers || isAnalyzing}
            className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${!hasRequestedOffers || isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${currentView === 'syndicate' ? 'bg-black text-white shadow-xl' : 'text-black hover:bg-black/10'}`}
          >
            <Store className="w-7 h-7" />
          </button>
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
            {!hasRequestedOffers ? 'Request offers first' : 'The Syndicate'}
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-black"></div>
          </div>
        </div>
        <div className="relative group">
          <button 
            onClick={() => !isAnalyzing && canAccessAdvertising && setCurrentView('advertising')}
            disabled={!canAccessAdvertising || isAnalyzing}
            className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${!canAccessAdvertising || isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${currentView === 'advertising' ? 'bg-black text-white shadow-xl' : 'text-black hover:bg-black/10'}`}
          >
            <Megaphone className="w-7 h-7" />
          </button>
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
            {!canAccessAdvertising ? 'Sign contract first' : 'Advertising'}
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-black"></div>
          </div>
        </div>
      </div>

      <div className="h-14"></div> {/* Spacer to maintain justify-between balance */}
    </div>
  );
};
