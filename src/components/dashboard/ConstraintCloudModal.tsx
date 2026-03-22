import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, ArrowDown, ArrowRight, Zap } from 'lucide-react';
import { ConstraintCloud } from '../../types';

interface ConstraintCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudData?: ConstraintCloud;
}

export const ConstraintCloudModal: React.FC<ConstraintCloudModalProps> = ({ isOpen, onClose, cloudData }) => {
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [step]);

  if (!isOpen || !cloudData) return null;

  const renderSoftField = (field: any) => {
    if (!field) return null;
    if (typeof field === 'string') {
      return <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">{field}</p>;
    }
    if (typeof field === 'object') {
      return (
        <div className="flex flex-col gap-3">
          {field.conflict && <p className="text-lg text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">{field.conflict}</p>}
          {field.statement && <p className="text-lg text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">{field.statement}</p>}
          {field.explanation && <p className="text-base sm:text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">{field.explanation}</p>}
        </div>
      );
    }
    return null;
  };

  const getSummaryText = () => {
    if (typeof cloudData.creative_tension === 'string') return cloudData.creative_tension;
    if (cloudData.creative_tension?.label) return cloudData.creative_tension.label;
    if (cloudData.creative_tension?.conflict) return cloudData.creative_tension.conflict;
    return "There is a core conflict limiting your story's potential.";
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="relative bg-[#F5F5F0] border-4 border-black rounded-3xl w-full max-w-6xl max-h-[90vh] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[70] p-2 bg-white border-2 border-black rounded-xl hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pt-16 sm:pt-20 bg-[#F5F5F0] custom-scrollbar flex flex-col relative">
          
          {/* Step 0: Summary */}
          <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto w-full z-20 relative">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-[#FF6B6B]" />
              <h3 className="text-xl font-black">Your story is stuck</h3>
            </div>
            <p className="text-gray-800 text-base sm:text-lg font-medium leading-relaxed">
              {getSummaryText()}
            </p>
          </div>

          {/* Diagram Area */}
          <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-6 lg:gap-2 w-full mt-8 relative z-10">
            
            {/* Col 1: What's happening */}
            <div className={`flex flex-col relative w-full lg:w-[30%] ${step >= 1 ? 'animate-in fade-in slide-in-from-left-4 duration-500' : 'hidden lg:flex opacity-0 pointer-events-none'}`}>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">What's happening</div>
              
              <div className="relative flex flex-col gap-6 flex-1 justify-center">
                <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10">
                  {renderSoftField(cloudData.story_engine)}
                </div>
                
                {/* Conflict indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-[#FF6B6B] text-white w-10 h-10 rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Zap className="w-5 h-5 fill-current" />
                </div>

                <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10">
                  {renderSoftField(cloudData.main_constraint)}
                </div>
              </div>
            </div>

            {/* Mobile Arrow 1 */}
            <div className={`lg:hidden flex justify-center ${step >= 2 ? 'animate-in fade-in duration-500' : 'hidden'}`}>
              <ArrowDown className="w-6 h-6 text-gray-300" />
            </div>

            {/* Desktop Arrow 1 */}
            <div className={`hidden lg:flex flex-col justify-center items-center px-2 self-center mt-8 ${step >= 2 ? 'animate-in fade-in duration-500' : 'opacity-0 pointer-events-none'}`}>
              <ArrowRight className="w-8 h-8 text-gray-300" />
            </div>

            {/* Col 2: Why this happens / How to fix */}
            <div className={`flex flex-col relative w-full lg:w-[30%] ${step >= 2 ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden lg:flex opacity-0 pointer-events-none'}`}>
              <div className="text-xs font-bold uppercase tracking-widest mb-4 text-center transition-colors duration-500">
                <span className={step >= 4 ? "text-[#0066CC]" : "text-gray-400"}>
                  {step >= 4 ? "How to fix it" : "Why this happens"}
                </span>
              </div>
              
              <div className="relative w-full flex-1 flex flex-col justify-center">
                {/* Assumption */}
                <div className={`bg-white border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-500 ${step >= 4 ? 'opacity-20 scale-95 blur-[1px]' : ''}`}>
                  {renderSoftField(cloudData.hidden_assumption)}
                </div>

                {/* Injection */}
                {step >= 4 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[105%] sm:w-[115%] bg-[#E8F4FD] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 animate-in zoom-in duration-500 rotate-1">
                    {renderSoftField(cloudData.injection)}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Arrow 2 */}
            <div className={`lg:hidden flex justify-center ${step >= 3 ? 'animate-in fade-in duration-500' : 'hidden'}`}>
              <ArrowDown className="w-6 h-6 text-gray-300" />
            </div>

            {/* Desktop Arrow 2 */}
            <div className={`hidden lg:flex flex-col justify-center items-center px-2 self-center mt-8 ${step >= 3 ? 'animate-in fade-in duration-500' : 'opacity-0 pointer-events-none'}`}>
              <ArrowRight className="w-8 h-8 text-gray-300" />
            </div>

            {/* Col 3: Why it matters */}
            <div className={`flex flex-col relative w-full lg:w-[30%] ${step >= 3 ? 'animate-in fade-in slide-in-from-right-4 duration-500' : 'hidden lg:flex opacity-0 pointer-events-none'}`}>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Why it matters</div>
              <div className="relative w-full flex-1 flex flex-col justify-center">
                <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {renderSoftField(cloudData.creative_tension)}
                </div>
              </div>
            </div>
          </div>

          {/* Spacer for sticky footer */}
          <div className={`shrink-0 transition-all duration-500 ${step >= 5 ? 'h-64 sm:h-72' : 'h-32'}`} />
        </div>

        {/* Sticky Footer Area */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end z-50 pointer-events-none rounded-b-[1.25rem]">
          {/* Background that becomes solid at step 5 to cover content behind the Next Move block */}
          <div className={`absolute inset-0 transition-all duration-500 -z-10 rounded-b-[1.25rem] ${step >= 5 ? 'bg-white border-t-4 border-black shadow-[0_-8px_30px_rgba(0,0,0,0.1)]' : 'bg-gradient-to-t from-[#F5F5F0] via-[#F5F5F0] to-transparent'}`} />
          
          <div className="w-full p-4 sm:p-6 flex flex-col items-center">
            {step >= 5 && (
              <div className="w-full max-w-3xl mx-auto mb-4 sm:mb-6 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-xs font-bold text-[#008A3C] uppercase tracking-widest mb-2 text-center">Your next move</div>
                <div className="bg-[#E6FCEF] border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {renderSoftField(cloudData.best_next_move)}
                </div>
              </div>
            )}

            <button 
              onClick={() => {
                if (step < 5) setStep(step + 1);
                else onClose();
              }}
              className="pointer-events-auto bg-black text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:scale-105 hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              {step === 0 ? "👉 What's happening" :
               step === 1 ? "👉 Why this happens" :
               step === 2 ? "👉 Why it matters" :
               step === 3 ? "👉 How to fix it" :
               step === 4 ? "👉 Your next move" :
               "Got it"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
