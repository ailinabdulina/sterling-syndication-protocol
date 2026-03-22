import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Wallet, Copy, Check } from 'lucide-react';

export const WalletWidget: React.FC = () => {
  const { user, walletAddress, walletBalance } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) {
    return null; // Don't show widget if not logged in
  }

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 bg-white border-4 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-black" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/50 leading-none">WDK (Sepolia)</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm font-black text-black leading-none">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Loading...'}
              </span>
              <button onClick={handleCopy} className="text-black/50 hover:text-black transition-colors" title="Copy Address">
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
        <div className="w-1 h-8 bg-black/10 mx-2"></div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-black/50 leading-none">Balance</span>
          <span className="text-sm font-black text-[#86F29F] drop-shadow-[1px_1px_0_rgba(0,0,0,1)] leading-none mt-1">
            ₮{walletBalance}
          </span>
        </div>
      </div>
    </div>
  );
};
