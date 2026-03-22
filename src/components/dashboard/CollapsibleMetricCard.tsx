import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface CollapsibleMetricCardProps {
  abbreviation: string;
  title: string;
  score: number | string;
  interpretation: string;
  color: string;
  icon: any;
  tooltip?: string;
}

export const CollapsibleMetricCard: React.FC<CollapsibleMetricCardProps> = ({ 
  abbreviation, 
  title, 
  score, 
  interpretation, 
  color, 
  icon: Icon,
  tooltip
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreBgColor = (s: number | string) => {
    const num = Number(s);
    if (isNaN(num)) return 'bg-white';
    if (num >= 85) return 'bg-[#86F29F]'; // Mint Green
    if (num >= 70) return 'bg-[#A5DDF8]'; // Light Blue
    if (num >= 55) return 'bg-white';     // Neutral
    if (num >= 40) return 'bg-[#FDE073]'; // Yellow
    if (num >= 30) return 'bg-[#FDE073]'; // Orange
    return 'bg-[#FFA3C5]';                // Pink
  };

  return (
    <div 
      className="rounded-3xl p-4 sm:p-5 text-black relative cursor-pointer transition-all duration-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      style={{ backgroundColor: color }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-lg sm:text-xl font-black uppercase tracking-[0.2em] leading-none truncate">{abbreviation}</span>
              {tooltip && <InfoTooltip text={tooltip} />}
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider opacity-60 leading-none truncate w-full">{title}</span>
          </div>
        </div>
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className={`px-3 py-1 rounded-full border-2 border-black flex items-center justify-center text-sm sm:text-base font-black shrink-0 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${getScoreBgColor(score)}`}>
            {score}
          </div>
          <ChevronDown className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t-2 border-black/10' : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0 border-transparent'}`}>
        <div className="overflow-hidden">
          <p className="text-sm sm:text-base text-black font-medium leading-tight">
            {interpretation}
          </p>
        </div>
      </div>
    </div>
  );
};
