import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, LogOut, Copy, Check, Clock } from 'lucide-react';

interface UserMenuProps {
  setCurrentView?: (view: 'dashboard' | 'new' | 'syndicate' | 'advertising' | 'history') => void;
  isAnalyzing?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ setCurrentView, isAnalyzing = false }) => {
  const { user, loginWithGoogle, logout, walletAddress, walletBalance } = useAuth();
  const [showWallet, setShowWallet] = useState(false);
  const [copied, setCopied] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

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
    if (setCurrentView && !isAnalyzing) {
      setCurrentView('history');
      setShowWallet(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <div className="relative" ref={popupRef}>
            <img 
              src={user.photoURL || ''} 
              alt={user.displayName || 'User'} 
              className="w-10 h-10 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all" 
              referrerPolicy="no-referrer" 
              onClick={() => setShowWallet(!showWallet)}
            />
            {showWallet && (
              <div className="absolute right-0 top-full mt-4 bg-white text-black p-5 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black z-50 w-80">
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
                  
                  {setCurrentView && (
                    <button 
                      onClick={handleHistoryClick}
                      disabled={isAnalyzing}
                      className={`flex items-center gap-2 text-sm bg-[#E5E7EB] hover:bg-black hover:text-white border-2 border-black px-3 py-2.5 rounded-xl transition-colors w-full justify-center font-black uppercase tracking-widest ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Clock className="w-4 h-4" />
                      History
                    </button>
                  )}
                </div>
                <div className="absolute -top-3 right-4 w-5 h-5 bg-white border-t-4 border-l-4 border-black transform rotate-45"></div>
              </div>
            )}
          </div>
          <button 
            onClick={logout}
            className="p-2 bg-white border-2 border-black rounded-xl hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </>
      ) : (
        <button 
          onClick={loginWithGoogle}
          className="w-10 h-10 flex items-center justify-center bg-white border-2 border-black rounded-full hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          title="Sign In"
        >
          <LogIn className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
