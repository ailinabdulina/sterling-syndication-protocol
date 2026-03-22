import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface TrustBadgeProps {
  score?: number;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ score }) => {
  if (score === undefined) return null;
  
  const isPerfect = score === 100;
  
  return (
    <div className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-black uppercase tracking-widest cursor-help transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${isPerfect ? 'bg-[#86F29F] text-black' : 'bg-[#FDE073] text-black'}`}>
      {isPerfect ? <ShieldCheck className="w-3.5 h-3.5" strokeWidth={3} /> : <ShieldAlert className="w-3.5 h-3.5" strokeWidth={3} />}
      <span>Trust: {score}%</span>
      
      <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[220px] opacity-0 transition-opacity group-hover:opacity-100 z-50">
        <div className="bg-black text-white text-[10px] font-medium px-3 py-2 rounded-lg shadow-xl border border-white/20 text-center leading-tight">
          {isPerfect 
            ? 'Data integrity verified. Strict JSON, schema validated, and math checks passed.' 
            : 'Partial validation. Some integrity checks failed or data is incomplete.'}
        </div>
        <div className="w-2 h-2 bg-black border-t border-l border-white/20 transform rotate-45 absolute -top-1 left-1/2 -translate-x-1/2"></div>
      </div>
    </div>
  );
};
