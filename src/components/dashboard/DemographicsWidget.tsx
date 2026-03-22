import React from 'react';
import { CircleHelp } from 'lucide-react';
import { PredictedDemographics } from '../../types';

interface DemographicsWidgetProps {
  data: PredictedDemographics;
}

export const DemographicsWidget: React.FC<DemographicsWidgetProps> = ({ data }) => {
  const genderSplit = data?.gender_split || "M: 50%, F: 50%";
  const mMatch = genderSplit.match(/M:\s*(\d+)%/);
  const fMatch = genderSplit.match(/F:\s*(\d+)%/);

  const mPct = mMatch ? parseInt(mMatch[1]) : 50;
  const fPct = fMatch ? parseInt(fMatch[1]) : 50;

  return (
    <div className="h-full bg-[#FFA3C5] border-2 border-black rounded-3xl p-4 flex flex-col min-h-[160px] relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group">
      <div className="flex justify-between items-center mb-3 z-10 relative pointer-events-none">
        <h3 className="text-lg md:text-xl font-black text-black uppercase tracking-tighter flex items-center gap-2">
          Demographics
        </h3>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 relative z-10">
        {/* Gender Split (Divided Square) */}
        <div className="bg-white border-2 border-black rounded-2xl overflow-hidden flex shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div 
            className={`bg-[#FDE073] flex flex-col items-center justify-center transition-all duration-1000 ${fPct > 0 && mPct > 0 ? 'border-r-2 border-black' : ''}`}
            style={{ flex: fPct, minWidth: fPct > 0 ? '44px' : '0' }}
            title={`Female: ${fPct}%`}
          >
            {fPct > 0 && (
              <>
                <span className="font-black text-2xl md:text-3xl leading-none mb-0.5">F</span>
                <span className="font-bold text-[10px] md:text-xs leading-none">{fPct}%</span>
              </>
            )}
          </div>
          <div 
            className="bg-[#A5DDF8] flex flex-col items-center justify-center transition-all duration-1000" 
            style={{ flex: mPct, minWidth: mPct > 0 ? '44px' : '0' }}
            title={`Male: ${mPct}%`}
          >
            {mPct > 0 && (
              <>
                <span className="font-black text-2xl md:text-3xl leading-none mb-0.5">M</span>
                <span className="font-bold text-[10px] md:text-xs leading-none">{mPct}%</span>
              </>
            )}
          </div>
        </div>

        {/* Age (Top Right) */}
        <div className="bg-[#86F29F] border-2 border-black rounded-2xl p-2 flex flex-col justify-center items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-0">
          <div className="font-black text-black text-xl md:text-2xl lg:text-3xl leading-tight truncate w-full text-center px-1 pb-1" title={data?.core_age_group || "Unknown"}>
            {data?.core_age_group || "Unknown"}
          </div>
          <div className="text-black/60 uppercase font-black text-[10px] mt-1 tracking-widest shrink-0">Core Age</div>
        </div>

        {/* WTP Proxy (Bottom Left) */}
        <div className="bg-[#FDE073] border-2 border-black rounded-2xl p-2 flex flex-col justify-center items-center relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-0">
          <div className="absolute top-2 right-2 text-black cursor-help group/tooltip">
            <CircleHelp className="w-4 h-4" />
            <div className="absolute bottom-full right-0 mb-2 w-max bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
              Willingness to Pay
              <div className="absolute top-full right-2 border-4 border-transparent border-t-black"></div>
            </div>
          </div>
          <div className="text-black/50 uppercase font-black text-[9px] md:text-[10px] mb-1 tracking-widest shrink-0">WTP Proxy</div>
          <div className="font-black text-black text-lg md:text-xl lg:text-2xl tracking-tighter leading-tight truncate w-full text-center px-1 pb-1">
            {data?.wtp_proxy || "Unknown"}
          </div>
        </div>

        {/* CAC Proxy (Bottom Right) */}
        <div className="bg-[#C8BFF4] border-2 border-black rounded-2xl p-2 flex flex-col justify-center items-center relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-0">
          <div className="absolute top-2 right-2 text-black cursor-help group/tooltip">
            <CircleHelp className="w-4 h-4" />
            <div className="absolute bottom-full right-0 mb-2 w-max bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
              Customer Acquisition Cost
              <div className="absolute top-full right-2 border-4 border-transparent border-t-black"></div>
            </div>
          </div>
          <div className="text-black/50 uppercase font-black text-[9px] md:text-[10px] mb-1 tracking-widest shrink-0">CAC Proxy</div>
          <div className="font-black text-black text-lg md:text-xl lg:text-2xl tracking-tighter leading-tight truncate w-full text-center px-1 pb-1">
            {data?.cac_proxy || "Unknown"}
          </div>
        </div>
      </div>
    </div>
  );
};
