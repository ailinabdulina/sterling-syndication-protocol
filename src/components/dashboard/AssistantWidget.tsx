import React, { useState } from 'react';
import { Check, CircleX } from 'lucide-react';
import { ContractModal } from './ContractModal';
import { StoryData } from '../../types';

interface AssistantWidgetProps {
  verdict?: string;
  monetizationApproved?: boolean;
  storyData?: StoryData | null;
}

export const AssistantWidget: React.FC<AssistantWidgetProps> = ({ verdict, monetizationApproved = true, storyData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getSterlingImage = (v?: string, isMonetizable: boolean = true) => {
    if (!isMonetizable) return "https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2Fsterling_cry.png?alt=media&token=dc59b0ba-6aa5-42f3-89be-5f8217508acc";
    if (v === 'WATCH') return "https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2Fsterling_hmm.webp?alt=media&token=d9d2dc9a-60d3-479b-8287-8ff5f0023ace";
    if (v === 'PASS' || v === 'REJECTED') return "https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2Fsterling_cry.png?alt=media&token=dc59b0ba-6aa5-42f3-89be-5f8217508acc";
    return "https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2Fsterling2.webp?alt=media&token=0d6297ad-4fc4-463c-a244-82c362eade71";
  };

  const getBackgroundColor = (v?: string, isMonetizable: boolean = true) => {
    if (!isMonetizable) return 'bg-[#FFA3C5]';
    switch (v) {
      case 'INVEST': return 'bg-[#86F29F]';
      case 'INCUBATE': return 'bg-[#FDE073]';
      case 'WATCH': return 'bg-[#A5DDF8]';
      case 'PASS':
      case 'REJECTED': return 'bg-[#FFA3C5]';
      default: return 'bg-gradient-to-tr from-[#C4A4F9] to-[#86F29F]';
    }
  };

  let displayMessage = "The metrics look solid. Shall we proceed with the contract?";
  if (!monetizationApproved) {
    displayMessage = "IP issues detected. Monetization is blocked. We cannot proceed with the contract.";
  } else if (verdict === 'PASS') {
    displayMessage = "The metrics are screaming 'PASS'. We can't fund this right now.";
  }

  const canGetOffer = monetizationApproved && verdict !== 'PASS';

  return (
    <>
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40 flex flex-col items-end gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
        {/* Message Bubble */}
        {isExpanded && (
          <div className="bg-[#222222] border border-white/10 rounded-2xl rounded-br-none p-4 shadow-2xl max-w-[260px] md:max-w-[300px] relative mb-2">
            <p className="text-sm md:text-base text-white font-medium mb-3 leading-snug">
              {displayMessage}
            </p>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  if (canGetOffer) {
                    setIsExpanded(false);
                    setIsModalOpen(true);
                  }
                }}
                disabled={!canGetOffer}
                className={`flex-1 text-xs md:text-sm font-bold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 group ${
                  canGetOffer 
                    ? 'bg-[#86F29F] hover:bg-[#75d88c] text-black' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className={canGetOffer ? 'animate-wiggle group-hover:animate-none group-hover:rotate-12 transition-transform' : ''}>
                  <Check className="w-4 h-4" /> 
                </div>
                {!monetizationApproved ? 'Blocked' : verdict === 'PASS' ? 'No Offers' : 'Yes, sign'}
              </button>
              <button 
                onClick={() => setIsExpanded(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-bold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <CircleX className="w-4 h-4" /> Not yet
              </button>
            </div>
          </div>
        )}

        {/* Avatar */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-20 h-20 md:w-28 md:h-28 rounded-full ${getBackgroundColor(verdict, monetizationApproved)} p-1 shadow-lg shrink-0 cursor-pointer hover:scale-105 transition-transform overflow-hidden`}
        >
          <img 
            src={getSterlingImage(verdict, monetizationApproved)}
            alt="Sterling"
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <ContractModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => setIsModalOpen(false)}
        monetizationApproved={monetizationApproved}
        storyData={storyData}
      />
    </>
  );
};
