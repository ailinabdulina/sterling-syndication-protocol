import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, className = '' }) => {
  return (
    <div className={`group relative inline-flex items-center justify-center ${className}`}>
      <Info className="w-3.5 h-3.5 opacity-60 hover:opacity-100 cursor-help transition-opacity" />
      <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-max max-w-[200px] opacity-0 transition-opacity group-hover:opacity-100 z-50">
        <div className="bg-[#1A1A1A] text-white text-[10px] sm:text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 text-left leading-tight">
          {text}
        </div>
        <div className="w-2 h-2 bg-[#1A1A1A] border-b border-r border-white/10 transform rotate-45 absolute -bottom-1 left-1.5"></div>
      </div>
    </div>
  );
};
