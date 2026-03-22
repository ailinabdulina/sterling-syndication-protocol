import React, { useState, useMemo, useEffect } from 'react';
import { Check, ArrowRightLeft, X, Zap, ShieldCheck, Activity, Sparkles, Gem, Circle, Users, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { TreasureChest } from '../icons/TreasureChest';
import { InvestorOutput } from '../../types';

interface OfferCardProps {
  offer: InvestorOutput & { id: string; status: 'accept' | 'reject' | 'counter' | 'pending'; avatar: string; isBestOffer?: boolean };
  onViewOffer?: (offer: InvestorOutput) => void;
  hasSignedContract?: boolean;
  activePhrase?: string | null;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onViewOffer, hasSignedContract, activePhrase }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [hasFlippedOnce, setHasFlippedOnce] = useState(false);
  const prevStatusRef = React.useRef(offer.status);

  const shortWallet = offer.wallet_address 
    ? `${offer.wallet_address.slice(0, 6)}...${offer.wallet_address.slice(-4)}`
    : '0x...';

  useEffect(() => {
    if (prevStatusRef.current === 'pending' && offer.status !== 'pending') {
      setIsShaking(true);
      const shakeTimer = setTimeout(() => setIsShaking(false), 500);
      
      const flipTimer = setTimeout(() => {
        setIsFlipped(true);
        setHasFlippedOnce(true);
      }, 1500);
      
      return () => {
        clearTimeout(shakeTimer);
        clearTimeout(flipTimer);
      };
    }
    prevStatusRef.current = offer.status;
  }, [offer.status]);

  const amountUsd = offer.offer?.amount_usd || 0;
  const equityPct = offer.offer?.equity_pct || 0;

  const getRarityConfig = (agentName?: string) => {
    const name = (agentName || '').toLowerCase();
    if (name.includes('barnaby')) return { color: 'bg-[#FDE073]', borderColor: 'border-[#FDE073]', icon: <Sparkles className="w-3 h-3 text-black" />, text: 'Legendary' };
    if (name.includes('crypto_bunny') || name.includes('laser_eyes_99')) return { color: 'bg-[#C8BFF4]', borderColor: 'border-[#C8BFF4]', icon: <Gem className="w-3 h-3 text-black" />, text: 'Epic' };
    if (name.includes('diamond hands') || name.includes('agent_x9')) return { color: 'bg-[#A5DDF8]', borderColor: 'border-[#A5DDF8]', icon: <Gem className="w-3 h-3 text-black" />, text: 'Rare' };
    return { color: 'bg-[#E4E3E0]', borderColor: 'border-[#E4E3E0]', icon: <Circle className="w-3 h-3 text-black" />, text: 'Common' };
  };

  const rarityConfig = getRarityConfig(offer.agent_name);

  const getGlowShadow = () => {
    if (hasFlippedOnce) return 'shadow-[4px_4px_0px_rgba(0,0,0,1)]';
    if (offer.status === 'accept') return 'shadow-[0_0_30px_rgba(134,242,159,0.8),4px_4px_0px_rgba(0,0,0,1)]';
    if (offer.status === 'counter') return 'shadow-[0_0_30px_rgba(253,224,115,0.8),4px_4px_0px_rgba(0,0,0,1)]';
    if (offer.status === 'reject') return 'shadow-[0_0_30px_rgba(255,163,197,0.8),4px_4px_0px_rgba(0,0,0,1)]';
    return 'shadow-[4px_4px_0px_rgba(0,0,0,1)]';
  };

  const roiValue = useMemo(() => {
    if (offer.investment_conviction !== undefined) return offer.investment_conviction;
    if (offer.roi) {
      const parsed = parseInt(String(offer.roi).replace(/[^0-9-]/g, ''));
      if (!isNaN(parsed)) return parsed;
    }
    const nameLen = offer.agent_name?.length || 5;
    const base = (nameLen * 17) % 200;
    const isNegative = (nameLen % 3) === 0;
    return isNegative ? -(base % 30) : base;
  }, [offer.agent_name, offer.roi, offer.investment_conviction]);

  const roiString = offer.investment_conviction !== undefined ? `${roiValue}%` : (roiValue > 0 ? `+${roiValue}%` : `${roiValue}%`);
  
  const getRoiColor = (roi: number) => {
    if (offer.investment_conviction !== undefined) {
      if (roi >= 70) return 'bg-[#86F29F] text-black';
      if (roi >= 40) return 'bg-[#FDE073] text-black';
      return 'bg-[#FFA3C5] text-black';
    }
    if (roi > 50) return 'bg-[#86F29F] text-black';
    if (roi > 0) return 'bg-[#FDE073] text-black';
    return 'bg-[#FFA3C5] text-black';
  };

  const formatBalance = (balance: number | undefined) => {
    if (balance === undefined) return '???';
    const rounded = Math.round(balance);
    if (rounded >= 1000000) return `₮${(rounded / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (rounded >= 1000) return `₮${(rounded / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return `₮${rounded.toLocaleString()}`;
  };

  return (
    <div 
      className={`relative h-full w-full cursor-pointer group [perspective:1000px] ${isShaking ? 'animate-shake' : ''}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.no-flip')) {
          return;
        }
        setIsFlipped(!isFlipped);
        setHasFlippedOnce(true);
      }}
    >
      <div className={`w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
        
        {/* FRONT FACE */}
        <div className={`absolute inset-0 [backface-visibility:hidden] bg-white rounded-[2rem] border-[3px] border-black p-2.5 sm:p-3 flex flex-col transition-shadow duration-500 ${getGlowShadow()}`}>
          {/* Top Header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-black">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#A5DDF8] border-[2px] border-black flex items-center justify-center">
                <div className="w-1 h-1 bg-black rounded-full" />
              </div>
              {offer.status === 'reject' ? 'NO OFFER' : `OFFER: ${offer.status !== 'pending' && amountUsd > 0 ? `₮${Math.round(amountUsd).toLocaleString()} FOR ${equityPct}%` : '???'}`}
            </div>
            <div className="flex-1 h-[2px] sm:h-[3px] bg-black mx-2 sm:mx-3 rounded-full" />
            <div className="font-black text-xs sm:text-sm uppercase text-black">{shortWallet}</div>
          </div>

          {/* Title */}
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter leading-none truncate pr-2">
              {offer.agent_name}
            </h3>
          </div>

          {/* Main Image Area */}
          <div className={`flex-1 relative border-[2px] ${rarityConfig.borderColor} rounded-xl sm:rounded-2xl overflow-hidden transition-colors duration-500 ${offer.status === 'pending' ? 'bg-gray-200' : offer.status === 'accept' ? 'bg-[#86F29F]' : offer.status === 'counter' ? 'bg-[#FDE073]' : 'bg-[#FFA3C5]'}`}>
            {/* Top Left Badges */}
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5 items-start">
              {/* Rarity Badge */}
              <div className={`flex items-center gap-1 px-2 py-1 border-[2px] border-black rounded-lg text-[10px] font-black uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] ${rarityConfig.color}`}>
                {rarityConfig.icon}
                {rarityConfig.text}
              </div>
              {offer.isBestOffer && (
                <div className="flex items-center gap-1 px-2 py-1 border-[2px] border-black rounded-lg text-[10px] font-black uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] bg-[#86F29F] text-black">
                  <Sparkles className="w-3 h-3 text-black" />
                  Best Offer
                </div>
              )}
            </div>

            {/* Avatar */}
            <img 
              src={offer.avatar} 
              alt="" 
              className={`absolute inset-0 w-full h-full z-10 object-cover object-center transition-all duration-500`}
            />

            {/* Speech Bubble */}
            {offer.status === 'pending' && activePhrase && (
              <div className="absolute top-[45%] right-2 z-30 max-w-[80%] -translate-y-1/2 animate-in fade-in zoom-in duration-300">
                <div className="relative bg-white border-[2px] sm:border-[3px] border-black rounded-2xl p-2 sm:p-2.5 shadow-[3px_3px_0px_rgba(0,0,0,1)] z-10">
                  <p className="text-[10px] sm:text-xs font-black uppercase text-black leading-tight">
                    {activePhrase}
                  </p>
                </div>
                {/* Tail pointing left */}
                <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-3 h-3 bg-white border-b-[2px] sm:border-b-[3px] border-l-[2px] sm:border-l-[3px] border-black transform rotate-45 z-0" />
              </div>
            )}
          </div>

          {/* Bottom Stats */}
          <div className="flex items-end justify-between mt-2 sm:mt-3 h-12 sm:h-14 px-1">
            <div className="flex gap-2 sm:gap-3">
              {[
                { val: roiString, icon: <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" strokeWidth={3} />, colorClass: getRoiColor(roiValue) },
                { val: formatBalance(offer.wallet_balance_usdt), icon: <TreasureChest className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" strokeWidth={3} />, colorClass: 'bg-[#FDE073] text-black' }
              ].map((stat, i) => (
                <div key={i} className={`relative transition-all duration-500`}>
                  <div className={`px-2 sm:px-3 h-10 sm:h-12 min-w-[3.5rem] sm:min-w-[4rem] border-[2px] sm:border-[3px] border-black rounded-lg sm:rounded-xl flex items-center justify-center font-black text-[10px] sm:text-xs uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] ${stat.colorClass}`}>
                    {stat.val}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-white border-[2px] border-black rounded-full flex items-center justify-center shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    {stat.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Status Badge */}
            <div className="relative mb-1">
              {offer.status === 'pending' ? (
                <div className="border-[2px] sm:border-[3px] border-black bg-white px-2.5 py-1 sm:px-4 sm:py-2 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shadow-[2px_2px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_rgba(0,0,0,1)] transform rotate-[-5deg] text-black">
                  THINKING
                  <span className="inline-flex ml-0.5 tracking-widest">
                    <span className="animate-typing-dot" style={{ animationDelay: '0s' }}>.</span>
                    <span className="animate-typing-dot" style={{ animationDelay: '0.2s' }}>.</span>
                    <span className="animate-typing-dot" style={{ animationDelay: '0.4s' }}>.</span>
                  </span>
                </div>
              ) : (
                <div 
                  onClick={(e) => {
                    if (offer.status === 'accept' || offer.status === 'counter') {
                      e.stopPropagation();
                      onViewOffer?.(offer);
                    }
                  }}
                  className={`no-flip border-[2px] sm:border-[3px] border-black px-2.5 py-1 sm:px-4 sm:py-2 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shadow-[2px_2px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_rgba(0,0,0,1)] transform rotate-[-5deg] ${
                    offer.status === 'accept' ? 'bg-[#86F29F] text-black cursor-pointer hover:scale-105 transition-transform' : 
                    offer.status === 'counter' ? 'bg-[#FDE073] text-black cursor-pointer hover:scale-105 transition-transform' : 
                    'bg-[#FFA3C5] text-black'
                  }`}
                >
                  {offer.status === 'accept' ? 'ACCEPTED' : offer.status === 'counter' ? 'VIEW OFFER' : 'REJECTED'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white rounded-[2rem] border-[3px] border-black p-6 sm:p-8 flex flex-col transition-shadow duration-500 overflow-hidden ${getGlowShadow()}`}>
          {/* Decorative elements */}
          <div className={`absolute top-0 left-0 w-full h-3 ${offer.status === 'accept' ? 'bg-[#86F29F]' : offer.status === 'counter' ? 'bg-[#FDE073]' : offer.status === 'reject' ? 'bg-[#FFA3C5]' : 'bg-gray-300'}`} />
          
          <div className="flex-1 flex flex-col items-center justify-center w-full h-full mt-2">
            {offer.status === 'pending' ? (
              <div className="text-gray-400 font-bold text-sm uppercase tracking-widest">
                Analyzing IP
                <span className="inline-flex ml-0.5 tracking-widest">
                  <span className="animate-typing-dot" style={{ animationDelay: '0s' }}>.</span>
                  <span className="animate-typing-dot" style={{ animationDelay: '0.2s' }}>.</span>
                  <span className="animate-typing-dot" style={{ animationDelay: '0.4s' }}>.</span>
                </span>
              </div>
            ) : (
              <div className="flex-1 w-full flex flex-col min-h-0 relative">
                <div className="flex-1 flex flex-col items-center justify-start relative">
                  {/* View Offer Button inside verdict box at the top */}
                  {offer.status !== 'pending' && (
                    <div className="w-full mb-4 flex flex-row flex-wrap justify-center items-center gap-2 relative z-50 no-flip">
                      {offer.fit_assessment && (
                        <div className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-[2px] border-black rounded-full shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-1 ${
                          offer.fit_assessment === 'strong_fit' ? 'bg-[#86F29F] text-black' :
                          offer.fit_assessment === 'conditional_fit' ? 'bg-[#FDE073] text-black' :
                          'bg-[#FFA3C5] text-black'
                        }`}>
                          {offer.fit_assessment === 'strong_fit' ? 'GOOD FIT' : 
                           offer.fit_assessment === 'conditional_fit' ? 'OK FIT' : 
                           'BAD FIT'}
                        </div>
                      )}

                      {offer.status === 'reject' ? (
                        <button 
                          disabled
                          className="px-3 py-1.5 border-[2px] border-black rounded-full font-black text-[10px] uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] bg-[#FFA3C5] text-black cursor-not-allowed flex items-center gap-1"
                        >
                          <X className="w-3 h-3" strokeWidth={3} />
                          REJECTED
                        </button>
                      ) : (offer.status === 'accept' || offer.status === 'counter') ? (
                        <>
                          <button 
                            type="button"
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation(); 
                              onViewOffer?.(offer); 
                            }}
                            className={`relative z-50 no-flip px-3 py-1.5 border-[2px] border-black rounded-full font-black text-[10px] uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1 ${offer.status === 'accept' ? 'bg-[#86F29F] cursor-pointer' : 'bg-[#FDE073] cursor-pointer'}`}
                          >
                            {hasSignedContract && offer.isBestOffer ? 'SIGNED' : offer.isBestOffer ? 'ACCEPT' : 'VIEW'}
                          </button>
                          
                          {offer.onchain_offer && (
                            offer.onchain_offer.lock_tx_hash ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(`https://sepolia.etherscan.io/tx/${offer.onchain_offer.lock_tx_hash}`, '_blank');
                                }}
                                className="relative z-50 no-flip px-3 py-1.5 border-[2px] border-black rounded-full font-black text-[10px] uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all bg-[#86F29F] text-black cursor-pointer flex items-center gap-1"
                              >
                                <ShieldCheck className="w-3 h-3" strokeWidth={3} />
                                LOCKED
                              </button>
                            ) : (
                              <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                                {offer.onchain_offer.lock_tx_status?.startsWith('failed') && <><AlertCircle className="w-3 h-3 text-red-600" /> <span className="text-red-600">Failed</span></>}
                              </div>
                            )
                          )}
                        </>
                      ) : null}
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 w-full flex flex-col gap-3 pb-2">
                    {offer.thesis && (
                      <div className="bg-gray-50 border-[2px] border-black p-3 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] text-left">
                        <div className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1">Thesis</div>
                        <p className={`text-black font-medium ${
                          offer.thesis.length > 200 ? 'text-xs leading-snug' : 'text-sm leading-relaxed'
                        }`}>
                          "{offer.thesis}"
                        </p>
                      </div>
                    )}

                    {offer.main_risk && (
                      <div className="bg-[#FFA3C5]/20 border-[2px] border-black p-3 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] text-left">
                        <div className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1 flex items-center gap-1">
                          Main Risk
                        </div>
                        <p className={`text-black font-medium ${
                          offer.main_risk.length > 200 ? 'text-xs leading-snug' : 'text-sm leading-relaxed'
                        }`}>
                          {offer.main_risk}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
