import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

interface AssistantBlockProps {
  setCurrentView: (view: 'dashboard' | 'new' | 'syndicate' | 'advertising') => void;
  verdict: string;
  monetizationApproved?: boolean;
  onRequestOffers?: () => void;
  hasSignedContract?: boolean;
}

export const AssistantBlock: React.FC<AssistantBlockProps> = ({ setCurrentView, verdict, monetizationApproved = true, onRequestOffers, hasSignedContract }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getSterlingImage = (v: string, isMonetizable: boolean) => {
    if (!isMonetizable) return "https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2Fsterling_cry3.png?alt=media&token=025eb81c-4ae5-49aa-8ca0-0184de43a3c7";
    if (v === 'WATCH') return "https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2Fsterling_thin_3.png?alt=media&token=716459b1-3e57-4ab0-9a50-911f8214bbaa";
    if (v === 'PASS' || v === 'REJECTED') return "https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2Fsterling_cry3.png?alt=media&token=025eb81c-4ae5-49aa-8ca0-0184de43a3c7";
    return "https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2Fsterling3.png?alt=media&token=0f88a1c4-7a19-4e29-a919-502f73fa868a";
  };

  const bgImage = "https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2Fbackground.jpg?alt=media&token=03673db9-29b8-4eec-9a58-48ed7f82a9b9";

  let displayMessage = `"The metrics are screaming '${verdict}'. Ready to make history?"`;

  if (!monetizationApproved) {
    displayMessage = `"We can't find investors for someone else's intellectual property. Sorry, kid."`;
  } else if (verdict === 'PASS') {
    displayMessage = `"The metrics are screaming 'PASS'. We can't fund this right now."`;
  }

  const canGetOffer = monetizationApproved && verdict !== 'PASS';

  return (
    <>
      <div className="flex flex-col rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative mt-[25px] transition-colors duration-500">
        
        {/* Background Image (clipped to rounded corners) */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${bgImage}')` }}
          />
        </div>

        {/* Rabbit Image (NOT clipped, can overflow top) */}
        <img 
          src={getSterlingImage(verdict, monetizationApproved)} 
          alt="Sterling" 
          className="absolute bottom-[50px] left-1/2 -translate-x-1/2 w-[85%] max-w-none pointer-events-none z-10"
        />

        {/* Character Card Section */}
        <div className="relative w-full h-[240px] z-20">
          {/* Content Container */}
          <div className="relative h-full flex flex-col p-6">
            {/* Spacer to push content to bottom */}
            <div className="flex-1" />

            {/* Speech Bubble */}
            <div className="mb-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="bg-white border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative rounded-xl">
                <p className="text-black font-bold text-sm leading-snug text-center">
                  {displayMessage}
                </p>
                {/* Bubble Tail pointing UP towards the mouth */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-black rotate-45"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button - Integrated as Footer */}
        <button 
          onClick={() => {
            if (onRequestOffers) onRequestOffers();
            setCurrentView('syndicate');
          }}
          disabled={!canGetOffer}
          className={`w-full font-black py-4 px-6 transition-all flex items-center justify-center gap-3 group border-t-2 border-black rounded-b-[22px] relative z-20 ${
            canGetOffer 
              ? 'bg-[#86F29F] hover:bg-[#6CE086] text-black active:scale-[0.98] cursor-pointer' 
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }`}
        >
          {canGetOffer ? (
            <div className="animate-wiggle group-hover:animate-none group-hover:rotate-12 transition-transform">
              <Check className="w-7 h-7" strokeWidth={4} />
            </div>
          ) : (
            <X className="w-7 h-7" strokeWidth={4} />
          )}
          <span className="text-xl uppercase tracking-tighter">
            {!monetizationApproved ? 'IP Blocked' : verdict === 'PASS' ? 'No Offers Available' : hasSignedContract ? 'View Offers' : 'Initialize Syndicate Swarm'}
          </span>
        </button>
      </div>
    </>
  );
};
