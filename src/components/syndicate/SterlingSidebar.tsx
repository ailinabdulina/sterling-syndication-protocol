import React, { useState, useRef, useEffect } from 'react';
import { Check, ArrowRightLeft, X, Bot, User, ExternalLink } from 'lucide-react';
import { FeedItem } from '../../types/syndicate';

const SENDER_COLORS: Record<string, string> = {
  'agent_x9': 'bg-[#FFA3C5] text-black',
  'crypto_bunny': 'bg-[#FDE073] text-black',
  'barnaby': 'bg-[#86F29F] text-black',
  'safe_paws': 'bg-[#A5DDF8] text-black',
  'diamond_hands': 'bg-[#C8BFF4] text-black',
  'laser_eyes_99': 'bg-[#FFA3C5] text-black',
  'sterling': 'bg-white text-black'
};

interface SterlingSidebarProps {
  feed: FeedItem[];
  isAnalyzing?: boolean;
  isChatComplete?: boolean;
  bestOffer?: any;
  onAcceptBestOffer?: () => void;
  hasSignedContract?: boolean;
  onNavigate?: (view: 'dashboard' | 'new' | 'syndicate' | 'advertising' | 'history') => void;
  typingAgent?: string | null;
  hasAcceptedOffer?: boolean;
  onViewAllOffers?: () => void;
}

export const SterlingSidebar: React.FC<SterlingSidebarProps> = ({ feed, isAnalyzing, isChatComplete, bestOffer, onAcceptBestOffer, hasSignedContract, onNavigate, typingAgent, hasAcceptedOffer, onViewAllOffers }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed, isAnalyzing, typingAgent]);

  return (
    <div className="flex flex-col overflow-hidden shrink-0 flex-1 min-h-0">
      
      {/* Unified Feed */}
      <div className="flex-1 min-h-0 bg-white flex flex-col rounded-[2rem] border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden relative">
        <div className="p-4 sm:p-5 border-b-[3px] border-black font-black text-base uppercase tracking-wider text-black bg-[#A5DDF8] shrink-0">
          Syndicate Feed
        </div>
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-5 custom-scrollbar"
          style={{
            backgroundColor: '#D4E4ED',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='rgba(0,0,0,0.06)' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cg transform='translate(15, 15) rotate(15) scale(1.2)'%3E%3Cpath d='M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.36C5.77 11.84 2.27 21.7 2.27 21.7zM8.64 14l-2.05-2.04M15.34 15.34l-2.04-2.05M14.6 4.08l-1.14-.03M16.13 2.67l-.65 1.03M18.96 4.08l-.91 1.15M21.69 6.5l-1.38.69M20.46 9.14l-1.04-.65M21.69 11.5l-1.15-.91'/%3E%3C/g%3E%3Cg transform='translate(75, 25) rotate(-10) scale(1.2)'%3E%3Cpath d='M13 16a3 3 0 0 1 2.24 5M18 12h.01M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3M20 8.54V4a2 2 0 1 0-4 0v3'/%3E%3C/g%3E%3Cg transform='translate(25, 75) rotate(-15) scale(1.2)'%3E%3Crect width='20' height='12' x='2' y='6' rx='2'/%3E%3Ccircle cx='12' cy='12' r='2'/%3E%3Cpath d='M6 12h.01M18 12h.01'/%3E%3C/g%3E%3Cg transform='translate(85, 85) rotate(20) scale(1.2)'%3E%3Ccircle cx='8' cy='8' r='6'/%3E%3Cpath d='M18.09 10.37A6 6 0 1 1 10.34 18'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px'
          }}
        >
          {feed.map((item, index) => {
            if (!item) return null;
            if (item?.type === 'system') {
              return (
                <div key={`system-${item.id}-${index}`} className="flex flex-col gap-2">
                  <div className="text-xs font-black uppercase tracking-wider text-center text-gray-500 bg-white/50 py-1 px-3 rounded-full self-center border-[2px] border-black/10">
                    {item.text}
                  </div>
                  {item.tx_hash && (
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${item.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-black bg-[#C8BFF4] border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] py-1.5 px-3 self-center hover:bg-[#A5DDF8] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 mt-2"
                    >
                      <span className="font-black uppercase tracking-wider">TX</span> 
                      <span className="opacity-80">{item.tx_hash.slice(0, 8)}...{item.tx_hash.slice(-6)}</span>
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={3} />
                    </a>
                  )}
                </div>
              );
            }

            const isSterling = item.from?.toLowerCase() === 'sterling';
            const normalizedSender = (item.from?.toLowerCase() || '').replace(/\s+/g, '_');
            const senderColorClass = SENDER_COLORS[normalizedSender] || 'bg-[#C8BFF4] text-black';

            if (!item.text && !item.verdict) return null;

            return (
              <div key={`msg-${item.id}-${index}`} className="flex flex-col gap-2">
                {item.text && (
                  <div className={`text-sm leading-relaxed p-3 rounded-xl border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] relative mt-2 ${isSterling ? 'bg-[#A5DDF8] ml-4' : 'bg-white mr-4'}`}>
                    <div className={`absolute -top-3 ${isSterling ? 'right-3' : 'left-3'} ${senderColorClass} px-2 py-0.5 rounded-md border-[2px] border-black font-black text-[10px] uppercase tracking-wider shadow-[1px_1px_0px_rgba(0,0,0,1)]`}>
                      {item.from}
                    </div>
                    <div className="mt-1 text-black font-bold">{item.text}</div>
                    {item.action && onNavigate && (
                      <button
                        onClick={() => onNavigate(item.action!.view)}
                        className="mt-3 w-full py-2 bg-black text-white font-black uppercase tracking-widest text-xs rounded-lg border-2 border-black hover:bg-white hover:text-black transition-colors"
                      >
                        {item.action.label}
                      </button>
                    )}
                  </div>
                )}
                
                {item.verdict && (
                  <div className={`text-sm leading-relaxed flex flex-col gap-2 p-3 rounded-xl border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] relative ${!item.text ? 'mt-2' : ''} ${
                    item.verdict.status === 'ACCEPTED' ? 'bg-[#86F29F]' : 
                    item.verdict.status === 'COUNTER' ? 'bg-[#FDE073]' : 
                    'bg-[#FFA3C5]'
                  } ${isSterling ? 'ml-4' : 'mr-4'}`}>
                    {!item.text && (
                      <div className={`absolute -top-3 ${isSterling ? 'right-3' : 'left-3'} ${senderColorClass} px-2 py-0.5 rounded-md border-[2px] border-black font-black text-[10px] uppercase tracking-wider shadow-[1px_1px_0px_rgba(0,0,0,1)]`}>
                        {item.from}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full shrink-0 border-[2px] border-black text-black bg-white">
                        {item.verdict.status === 'ACCEPTED' && <Check className="w-3 h-3" strokeWidth={3} />}
                        {item.verdict.status === 'REJECTED' && <X className="w-3 h-3" strokeWidth={3} />}
                        {item.verdict.status === 'COUNTER' && <ArrowRightLeft className="w-3 h-3" strokeWidth={3} />}
                      </div>
                      <span className="text-black font-black uppercase text-xs tracking-wider">
                        {item.verdict.status === 'COUNTER' ? 'OFFER' : item.verdict.status}
                      </span>
                      {item.verdict.offer && (
                        <span className="text-black font-black text-xs ml-auto bg-white px-2 py-0.5 rounded border-[2px] border-black">
                          {item.verdict.offer}
                        </span>
                      )}
                    </div>
                    {(item.verdict.short || item.verdict.note) && (
                      <div className="text-black/80 font-bold text-xs mt-1">
                        {item.verdict.short || item.verdict.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {typingAgent && (
            <div className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-2 px-2 italic">
              {typingAgent.charAt(0).toUpperCase() + typingAgent.slice(1).replace(/_/g, ' ')} is typing
              <span className="inline-flex ml-0.5 tracking-widest">
                <span className="animate-typing-dot" style={{ animationDelay: '0s' }}>.</span>
                <span className="animate-typing-dot" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="animate-typing-dot" style={{ animationDelay: '0.4s' }}>.</span>
              </span>
            </div>
          )}
          
          {(hasAcceptedOffer || (isChatComplete && bestOffer)) && (
            <div className="mt-4 mb-2 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              {isChatComplete && bestOffer && !hasAcceptedOffer && !hasSignedContract && (
                <>
                  <button
                    onClick={onViewAllOffers}
                    className="w-full py-3 bg-white border-[3px] border-black rounded-xl font-black uppercase tracking-widest text-sm text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                  >
                    View All Offers
                  </button>
                  <button
                    onClick={onAcceptBestOffer}
                    className="w-full py-3 bg-[#86F29F] border-[3px] border-black rounded-xl font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" strokeWidth={3} />
                    Accept Best Offer
                  </button>
                </>
              )}

              {hasAcceptedOffer && !hasSignedContract && (
                <button
                  onClick={onViewAllOffers}
                  className="w-full py-3 bg-white border-[3px] border-black rounded-xl font-black uppercase tracking-widest text-sm text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                >
                  View All Offers
                </button>
              )}

              {hasSignedContract && (
                <button
                  onClick={onViewAllOffers}
                  className="w-full py-3 bg-white border-[3px] border-black rounded-xl font-black uppercase tracking-widest text-sm text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" strokeWidth={3} />
                  View Signed Contract
                </button>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};
