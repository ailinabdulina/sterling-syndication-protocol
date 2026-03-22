import React, { useState } from 'react';
import { TrendingUp, Activity, Zap, X, Maximize2, TriangleAlert, Target, Share2, DollarSign } from 'lucide-react';
import { StoryData } from '../../types';

interface BudgetRoiWidgetProps {
  storyData: StoryData;
  tsiScore: number;
  teiScore: number;
  verdict: string;
}

export const BudgetRoiWidget: React.FC<BudgetRoiWidgetProps> = ({ storyData, verdict }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const insights = storyData.business_insights || {
    ip_copyright_status: "Unknown",
    target_audience_tags: [],
    virality_surface: "Unknown",
    unit_economics_forecast: {
      estimated_cac_usd: "Unknown",
      estimated_ltv_potential: "Unknown",
      retention_driver: "Unknown"
    },
    monetization_hook: "Unknown",
    pivot_opportunity: "Unknown"
  };

  const ipStatusRaw = insights.ip_copyright_status;
  const ipStatusString = typeof ipStatusRaw === 'string' 
    ? ipStatusRaw 
    : (ipStatusRaw as any)?.frontend_warning_message || JSON.stringify(ipStatusRaw) || "Unknown";
  
  const isCleanIp = typeof ipStatusRaw === 'object' && ipStatusRaw !== null
    ? (ipStatusRaw as any).monetization_approved !== false
    : ipStatusString.includes("Clean IP");
  
  return (
    <>
      {/* Main Widget */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="h-full bg-[#FDE073] border-2 border-black rounded-3xl p-4 flex flex-col min-h-[160px] relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group"
      >
        <div className="flex justify-between items-center mb-3 z-10 relative pointer-events-none">
          <h3 className="text-lg md:text-xl font-black text-black uppercase tracking-tighter flex items-center gap-2">
            Business Insights
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-white bg-black px-3 py-1 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] pointer-events-auto">
              {verdict}
            </span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col relative z-10 gap-2 overflow-hidden">
          <div className="bg-white border-2 border-black rounded-2xl p-4 flex flex-col gap-2 h-full relative group-hover:bg-[#F5F5F0] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-black uppercase font-black flex items-center justify-between gap-1.5 text-xs tracking-widest">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Monetization Hook
              </div>
              <Maximize2 className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-black" />
            </div>
            <div className="text-black font-bold text-sm md:text-base leading-5 md:leading-6 line-clamp-3">
              {insights.monetization_hook}
            </div>
            <div className="mt-auto pt-2 text-xs text-black font-black uppercase tracking-widest text-right underline decoration-2 underline-offset-4">
              View all insights &rarr;
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-3xl bg-[#E4E3E0] border-2 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b-2 border-black bg-[#FDE073] shrink-0">
              <h2 className="text-3xl font-black text-black uppercase tracking-tighter">Business Insights</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-white hover:bg-black hover:text-white border-2 border-black rounded-xl transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              {insights.overall_conclusion && (
                <div className="bg-[#FDE073] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-sm font-black uppercase tracking-widest text-black mb-3 flex items-center gap-2 bg-white w-fit px-3 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Zap className="w-5 h-5" /> Overall Conclusion
                  </div>
                  <p className="text-lg md:text-xl font-bold text-black leading-snug">{insights.overall_conclusion}</p>
                </div>
              )}

              {!isCleanIp && (
                <div className="bg-[#FFA3C5] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-4">
                  <div className="bg-white p-2 border-2 border-black rounded-lg shrink-0">
                    <TriangleAlert className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase tracking-widest text-black mb-1">
                      IP Copyright Status
                    </div>
                    <p className="text-lg md:text-xl font-bold text-black leading-snug">
                      {ipStatusString}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-[#C8BFF4] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-sm font-black uppercase tracking-widest text-black mb-3 flex items-center gap-2 bg-white w-fit px-3 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <DollarSign className="w-5 h-5" /> Monetization Hook
                </div>
                <p className="text-lg md:text-xl font-bold text-black leading-snug">{insights.monetization_hook}</p>
              </div>

              <div className="bg-[#A5DDF8] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-sm font-black uppercase tracking-widest text-black mb-3 flex items-center gap-2 bg-white w-fit px-3 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <TrendingUp className="w-5 h-5" /> Unit Economics
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-black/60 mb-1">Estimated CAC</p>
                    <p className="text-lg md:text-xl font-bold text-black">{insights.unit_economics_forecast?.estimated_cac_usd || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-black/60 mb-1">LTV Potential</p>
                    <p className="text-lg md:text-xl font-bold text-black">{insights.unit_economics_forecast?.estimated_ltv_potential || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-black/60 mb-1">Retention Driver</p>
                    <p className="text-lg md:text-xl font-bold text-black">{insights.unit_economics_forecast?.retention_driver || "Unknown"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#86F29F] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-sm font-black uppercase tracking-widest text-black mb-3 flex items-center gap-2 bg-white w-fit px-3 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Zap className="w-5 h-5" /> Pivot Opportunity
                </div>
                <p className="text-lg md:text-xl font-bold text-black leading-snug">{insights.pivot_opportunity}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-sm font-black uppercase tracking-widest text-black mb-3 flex items-center gap-2 bg-[#FDE073] w-fit px-3 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Share2 className="w-5 h-5" /> Virality Surface
                  </div>
                  <p className="text-lg md:text-xl font-bold text-black leading-snug">{insights.virality_surface}</p>
                </div>

                <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-sm font-black uppercase tracking-widest text-black mb-3 flex items-center gap-2 bg-[#FFA3C5] w-fit px-3 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Target className="w-5 h-5" /> Target Audience
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(insights.target_audience_tags || []).map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-black text-white text-sm font-bold rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
