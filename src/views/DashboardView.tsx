import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ShieldCheck, Target, Activity, LayoutGrid, Zap, CircleCheck, TriangleAlert, CircleAlert, Share2, FastForward, Magnet, TrendingUp, Image as ImageIcon, Loader2, FileText, X } from 'lucide-react';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { storyData as mockStoryData } from '../data/mockData';
import { SterlingAgent } from '../components/dashboard/SterlingAgent';
import { BudgetRoiWidget } from '../components/dashboard/BudgetRoiWidget';
import { CollapsibleMetricCard } from '../components/dashboard/CollapsibleMetricCard';
import { CollapsibleListCard } from '../components/dashboard/CollapsibleListCard';
import { AudienceMapWidget } from '../components/dashboard/AudienceMapWidget';
import { AssistantBlock } from '../components/dashboard/AssistantBlock';
import { DemographicsWidget } from '../components/dashboard/DemographicsWidget';
import { TrustBadge } from '../components/dashboard/TrustBadge';
import { ConstraintCloudModal } from '../components/dashboard/ConstraintCloudModal';
import { StoryData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

import { StoryDataSchema } from '../schemas';
import { extractJsonFromString, unwrapBackendResponse } from '../utils/jsonUtils';

const LOADING_PHRASES = [
  "Consulting the demon about your choices…",
  "Checking how many souls this story costs…",
  "Measuring existential despair levels…",
  "Simulating morally catastrophic decisions…",
  "Calculating guilt per chapter…",
  "Detecting monetizable suffering…",
  "Searching for expensive moral dilemmas…",
  "Estimating branching timeline chaos…",
  "Calculating how many bad decisions players will make…",
  "Preparing alternate endings…",
  "Searching for future fandom wars…",
  "Detecting potential shipping disasters…",
  "Calculating meme potential…",
  "Predicting reaction thread chaos…",
  "Checking quote-post energy…",
  "Checking if the protagonist makes bad decisions…",
  "Counting how many people will cry…",
  "Looking for emotionally devastating plot twists…",
  "Evaluating how painful the choices are…",
  "Measuring cliffhanger toxicity…",
  "Estimating if TikTok will ruin this character…",
  "Calculating fan obsession probability…",
  "Predicting how many readers will scream at their screens…",
  "Estimating how expensive the cliffhangers will be…",
  "Running “Would fans ship this?” simulation…",
  "Computing dramatic tension per chapter…",
  "Scanning narrative structure…",
  "Interrogating your protagonist…",
  "Checking if the villain is hot enough for fan edits…",
  "Measuring emotional damage levels…",
  "Detecting morally questionable decisions…",
  "Calculating the number of future therapy sessions for readers…"
];

interface DashboardViewProps {
  setCurrentView: (view: 'dashboard' | 'new' | 'syndicate' | 'advertising') => void;
  analyzedStory?: StoryData | null;
  isAnalyzing?: boolean;
  history?: StoryData[];
  onRequestOffers?: () => void;
  hasSignedContract?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setCurrentView, analyzedStory, isAnalyzing, history, onRequestOffers, hasSignedContract }) => {
  const { user } = useAuth();
  const storyData = analyzedStory || mockStoryData;
  const [loadingPhrase, setLoadingPhrase] = useState(() => LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]);
  const [globalStories, setGlobalStories] = useState<StoryData[]>([]);
  const [showOriginalText, setShowOriginalText] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setLoadingPhrase(LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  useEffect(() => {
    const q = query(
      collection(db, 'agent_tasks'),
      where('type', '==', 'analyze_story'),
      where('status', '==', 'completed'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const stories: StoryData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.result) {
          try {
            let parsedResult = data.result;
            if (typeof parsedResult === 'string') {
              let cleanStr = parsedResult.trim();
              
              // Skip known API errors silently
              if (cleanStr.includes('⚠️ API rat') || cleanStr.startsWith('⚠️')) {
                return; // skip this document
              }
              
              // Strip markdown code blocks
              cleanStr = extractJsonFromString(cleanStr);
              
              parsedResult = JSON.parse(cleanStr);
            }
            
            parsedResult = unwrapBackendResponse(parsedResult);

            // Inject top-level verificationReport if it exists
            if (data.verificationReport && !parsedResult.verification_report) {
              parsedResult.verification_report = data.verificationReport;
            }

            // Inject original text if available
            if (data.payload?.text && !parsedResult.original_text) {
              parsedResult.original_text = data.payload.text;
            }
            
            const validationResult = StoryDataSchema.safeParse(parsedResult);
            if (validationResult.success) {
              stories.push(validationResult.data as StoryData);
            } else {
              console.warn("Invalid story data format:", validationResult.error);
            }
          } catch (e) {
            // Silently ignore parsing errors to keep console clean
          }
        }
      });
      setGlobalStories(stories);
    }, (error) => {
      console.error("Error fetching global stories in real-time:", error);
    });

    return () => unsubscribe();
  }, []);

  const getTier = (score: number) => {
    if (score >= 80) return "Tier 1";
    if (score >= 50) return "Tier 2";
    if (score >= 20) return "Tier 3";
    return "Tier 4";
  };

  const tsiScore = Math.round(
    ((storyData.tsi_evaluation?.CMA?.score || 0) * 0.40) + 
    ((storyData.tsi_evaluation?.PSP?.score || 0) * 0.40) + 
    ((storyData.tsi_evaluation?.IER?.score || 0) * 0.20)
  );

  const teiScore = Math.round(
    ((storyData.tei_evaluation?.TWS?.score || 0) * 0.20) + 
    ((storyData.tei_evaluation?.PEL?.score || 0) * 0.20) + 
    ((storyData.tei_evaluation?.ACV?.score || 0) * 0.15) + 
    ((storyData.tei_evaluation?.HTR?.score || 0) * 0.15) + 
    ((storyData.tei_evaluation?.VRS?.score || 0) * 0.15) + 
    ((storyData.tei_evaluation?.SMR?.score || 0) * 0.15)
  );

  const getVerdict = (tsi: number, tei: number) => {
    if (tsi >= 70 && tei >= 70) return "INVEST";
    if (tsi >= 70 || tei >= 70) return "INCUBATE";
    if (tsi >= 40 && tei >= 40) return "WATCH";
    return "PASS";
  };
  const verdict = getVerdict(tsiScore, teiScore);

  const ipStatusRaw = storyData.business_insights?.ip_copyright_status;
  const ipStatusString = typeof ipStatusRaw === 'string' 
    ? ipStatusRaw 
    : (ipStatusRaw as any)?.frontend_warning_message || JSON.stringify(ipStatusRaw) || "Unknown";
    
  const monetizationApproved = typeof ipStatusRaw === 'object' && ipStatusRaw !== null
    ? (ipStatusRaw as any).monetization_approved !== false
    : !ipStatusString.includes("RED FLAG");

  return (
    <div className="flex-1 flex flex-col xl:flex-row min-h-0 overflow-y-auto xl:overflow-hidden relative">
      {isAnalyzing && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-[#F5F5F0] border-2 border-black rounded-3xl p-8 max-w-md w-full mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            <div className="w-48 h-48 mb-2">
              <DotLottieReact
                src="https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2FCrazy%20bottle%20rocker.lottie?alt=media&token=5d6b5705-2de4-436b-9df6-e96acab8871b"
                loop
                autoplay
              />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-black uppercase tracking-widest mb-4 animate-pulse">{loadingPhrase}</h3>
            <p className="text-black/60 font-bold text-sm md:text-base">This may take up to 3 minutes.</p>
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col xl:flex-row min-h-0 w-full transition-all duration-500 ${isAnalyzing ? 'blur-md pointer-events-none opacity-50' : ''}`}>
        {/* Left Content (Main Area) */}
        <div className="flex-none xl:flex-1 min-h-0 min-w-0 flex flex-col gap-6 p-4 md:p-8 xl:overflow-y-auto overflow-x-hidden hide-scrollbar relative bg-[#E4E3E0]">
        
        {/* Top Panel: Brutalist Style */}
        <div className="flex-none xl:flex-1 bg-[#F5F5F0] border-2 border-black rounded-3xl p-4 md:p-[22px] flex flex-col relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {/* Header */}
          <div className="flex flex-row justify-between items-start gap-4 mb-4">
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-black uppercase leading-none truncate">
                  {storyData.story_title || storyData.Title || "Untitled"}
                </h1>
                {(() => {
                  const rating = storyData.age_rating_us || 
                                 storyData.business_insights?.age_rating_us || 
                                 (storyData.predicted_demographics as any)?.age_rating_us ||
                                 (storyData as any).age_rating || 
                                 (storyData.business_insights as any)?.age_rating ||
                                 (storyData.predicted_demographics as any)?.age_rating ||
                                 (storyData as any)['Age Rating US'] ||
                                 (storyData.business_insights as any)?.['Age Rating US'] ||
                                 (storyData as any).ageRatingUs ||
                                 (storyData.business_insights as any)?.ageRatingUs;
                  
                  if (!rating) return null;
                  
                  return (
                    <span className={`px-2 py-1 rounded text-xs md:text-sm font-black uppercase tracking-widest whitespace-nowrap ${
                      (() => {
                        const r = typeof rating === 'string' ? rating.toUpperCase() : String((rating as any).rating || (rating as any).value || rating).toUpperCase();
                        if (r === 'G' || r === 'TV-Y' || r === 'TV-Y7' || r === 'TV-G') return 'bg-[#86F29F] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';
                        if (r === 'PG' || r === 'TV-PG') return 'bg-[#A5DDF8] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';
                        if (r === 'PG-13' || r === 'TV-14') return 'bg-[#FDE073] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';
                        if (r === 'R' || r === 'NC-17' || r === 'TV-MA') return 'bg-[#FFA3C5] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';
                        return 'bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';
                      })()
                    }`}>
                      {typeof rating === 'string' ? rating : (rating as any).rating || (rating as any).value || JSON.stringify(rating)}
                    </span>
                  );
                })()}
                <TrustBadge score={storyData.verification_report?.trust_score} />
              </div>
              <p className="text-sm md:text-base font-black text-black/60 uppercase tracking-widest truncate">By {storyData.author || storyData.Author || "Unknown"}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 relative">
              {storyData.original_text && (
                <button 
                  onClick={() => setShowOriginalText(true)}
                  className="bg-white text-black px-5 py-2.5 border-2 border-black rounded-sm text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" /> View Text
                </button>
              )}
              <div className="relative group">
                <button className="w-full sm:w-auto bg-black text-white px-5 py-2.5 border-2 border-black rounded-sm text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none whitespace-nowrap">
                  Share <ArrowUpRight className="w-4 h-4" />
                </button>
                {/* Share Dropdown Placeholder */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-2 flex flex-col gap-1">
                    <button className="text-left px-3 py-2 text-xs font-black uppercase hover:bg-black hover:text-white transition-colors">Download PDF</button>
                    <button className="text-left px-3 py-2 text-xs font-black uppercase hover:bg-black hover:text-white transition-colors">Copy Link</button>
                    <button className="text-left px-3 py-2 text-xs font-black uppercase hover:bg-black hover:text-white transition-colors">Twitter / X</button>
                    <button className="text-left px-3 py-2 text-xs font-black uppercase hover:bg-black hover:text-white transition-colors">LinkedIn</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full flex-1 flex flex-col">
            <SterlingAgent 
              tsi={{ score: tsiScore }} 
              tei={{ score: teiScore }} 
              verdict={verdict}
              ipStatus={{
                monetization_approved: monetizationApproved,
                frontend_warning_message: ipStatusString
              }}
              globalStories={globalStories}
            />
          </div>
        </div>

        {/* Bottom Dark Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
          <AudienceMapWidget regions={
            globalStories.length > 0 
              ? globalStories.flatMap(s => s.predicted_demographics?.primary_geography || [])
              : (storyData.predicted_demographics?.primary_geography || [])
          } />
          <DemographicsWidget data={storyData.predicted_demographics || {
            primary_geography: [],
            gender_split: "M: 50% / F: 50%",
            core_age_group: "Unknown",
            wtp_proxy: "Unknown",
            cac_proxy: "Unknown"
          }} />
          <BudgetRoiWidget storyData={storyData} tsiScore={tsiScore} teiScore={teiScore} verdict={verdict} />
        </div>
      </div>

      {/* Right Sidebar (Detailed Metrics) */}
      <div className="w-full xl:w-[420px] min-h-0 p-4 md:p-6 flex flex-col gap-4 md:gap-6 xl:overflow-y-auto hide-scrollbar shrink-0 border-t-2 xl:border-t-0 xl:border-l-2 border-black/5 bg-[#F5F5F0]">
        <div className="grid grid-cols-2 xl:grid-cols-1 gap-3">
          <div className="col-span-2 xl:col-span-1">
            <AssistantBlock 
              verdict={verdict} 
              setCurrentView={setCurrentView} 
              monetizationApproved={monetizationApproved}
              onRequestOffers={onRequestOffers}
              hasSignedContract={hasSignedContract}
            />
          </div>

          {storyData.constraint_cloud && (
            <div className="col-span-2 xl:col-span-1 mt-2">
              <button 
                onClick={() => setShowCloudModal(true)}
                className="w-full bg-[#C8BFF4] border-2 border-black rounded-3xl p-4 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all group text-black"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white border-2 border-black rounded-full p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-[#C8BFF4] transition-colors">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="font-black uppercase tracking-widest text-sm">How to Improve Story</span>
                </div>
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="col-span-2 xl:col-span-1 mt-4 mb-2">
            <h3 className="text-black font-black uppercase tracking-widest text-sm border-b-2 border-black/10 pb-2">TSI: Idea Axis</h3>
          </div>

          <CollapsibleMetricCard
            abbreviation="CMA"
            title="Concept Marketability"
            score={storyData.tsi_evaluation?.CMA?.score || 0}
            interpretation={storyData.tsi_evaluation?.CMA?.reasoning || "No data"}
            color="#C8BFF4"
            icon={Target}
            tooltip="Evaluate: Can the premise be sold in one compelling sentence? Is the hook immediately understandable?"
          />
          <CollapsibleMetricCard
            abbreviation="IER"
            title="IP Readiness"
            score={storyData.tsi_evaluation?.IER?.score || 0}
            interpretation={storyData.tsi_evaluation?.IER?.reasoning || "No data"}
            color="#A6D8F8"
            icon={ImageIcon}
            tooltip="Evaluate: Is the world visually distinctive? Are there factions, creatures, artifacts that can be visualized?"
          />
          <CollapsibleMetricCard
            abbreviation="PSP"
            title="Parasocial Potential"
            score={storyData.tsi_evaluation?.PSP?.score || 0}
            interpretation={storyData.tsi_evaluation?.PSP?.reasoning || "No data"}
            color="#FFFFFF"
            icon={Activity}
            tooltip="Look for: unresolved romantic tension, morally grey protagonist, archetypal relationships, secrets."
          />

          <div className="col-span-2 xl:col-span-1 mt-4 mb-2">
            <h3 className="text-black font-black uppercase tracking-widest text-sm border-b-2 border-black/10 pb-2">TEI: Mechanics Axis</h3>
          </div>

          <CollapsibleMetricCard
            abbreviation="VRS"
            title="Viral Resonance Score"
            score={storyData.tei_evaluation?.VRS?.score || 0}
            interpretation={storyData.tei_evaluation?.VRS?.reasoning || "No data"}
            color="#FDF196"
            icon={Share2}
            tooltip="Look for: emotional intensity, quotable dramatic lines, chaotic dynamics, memeable moments."
          />
          <CollapsibleMetricCard
            abbreviation="ACV"
            title="Activation Velocity"
            score={storyData.tei_evaluation?.ACV?.score || 0}
            interpretation={storyData.tei_evaluation?.ACV?.reasoning || "No data"}
            color="#A8F0D5"
            icon={FastForward}
            tooltip="Measure speed to first meaningful conflict."
          />
          <CollapsibleMetricCard
            abbreviation="HTR"
            title="Hook Throughput Rate"
            score={storyData.tei_evaluation?.HTR?.score || 0}
            interpretation={storyData.tei_evaluation?.HTR?.reasoning || "No data"}
            color="#FFD6A5"
            icon={Magnet}
            tooltip="Measure density of micro-hooks: mystery, threats, withheld truths, unstable relationships."
          />
          <CollapsibleMetricCard
            abbreviation="PEL"
            title="Paywall Elasticity"
            score={storyData.tei_evaluation?.PEL?.score || 0}
            interpretation={storyData.tei_evaluation?.PEL?.reasoning || "No data"}
            color="#A6D8F8"
            icon={Zap}
            tooltip="Measure strength of chapter-end cliffhanger."
          />
          <CollapsibleMetricCard
            abbreviation="SMR"
            title="Serial Modularity Rating"
            score={storyData.tei_evaluation?.SMR?.score || 0}
            interpretation={storyData.tei_evaluation?.SMR?.reasoning || "No data"}
            color="#FFC4D9"
            icon={TrendingUp}
            tooltip="Measure whether the story can sustain long serialized expansion (arcs, quests, factions)."
          />
          <CollapsibleMetricCard
            abbreviation="TWS"
            title="Twistability Score"
            score={storyData.tei_evaluation?.TWS?.score || 0}
            interpretation={storyData.tei_evaluation?.TWS?.reasoning || "No data"}
            color="#C8BFF4"
            icon={LayoutGrid}
            tooltip="Measure whether fans could create monetizable branches (alternate POVs, romance routes)."
          />
        </div>
      </div>
      </div>
      
      {/* Original Text Modal */}
      {showOriginalText && storyData.original_text && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8">
          <div className="bg-[#F5F5F0] border-4 border-black rounded-3xl p-6 sm:p-8 w-full max-w-4xl h-[80vh] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 shrink-0 border-b-4 border-black pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter line-clamp-1">{storyData.story_title || storyData.Title || "Untitled"}</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-black/60">Original Manuscript</p>
                </div>
              </div>
              <button onClick={() => setShowOriginalText(false)} className="p-2 hover:bg-black/10 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar bg-white border-4 border-black rounded-2xl p-6">
              <div className="whitespace-pre-wrap font-medium text-base sm:text-lg leading-relaxed">
                {storyData.original_text}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConstraintCloudModal 
        isOpen={showCloudModal} 
        onClose={() => setShowCloudModal(false)} 
        cloudData={storyData.constraint_cloud} 
      />
    </div>
  );
};
