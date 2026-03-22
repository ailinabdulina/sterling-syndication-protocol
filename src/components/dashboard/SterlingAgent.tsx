import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { StoryData } from '../../types';

interface SterlingAgentProps {
  tsi: { score: number };
  tei: { score: number };
  verdict?: string;
  ipStatus?: {
    monetization_approved: boolean;
    frontend_warning_message: string;
  };
  globalStories?: StoryData[];
}

const storyNames = [
  "Shadows of the Past", "Fallen Empire", "Neon Gods", "The Last Echo",
  "Crimson Tide", "Whispers in the Dark", "Steel Heart", "Void Walker",
  "The Silent King", "Echoes of Eternity", "Blood and Ash", "The Forgotten Realm",
  "Starfall", "Night's Edge", "The Obsidian Blade", "Crown of Thorns",
  "Shattered Glass", "The Deep End", "Iron Will", "Ghost Protocol",
  "The Lost City", "Dark Matter", "Solar Flare", "Lunar Eclipse",
  "The Abyss", "Fallen Angels", "Rising Sun", "The Catalyst",
  "Paradox", "Enigma", "The Oracle", "Doomsday",
  "Genesis", "Revelation", "The Awakening", "The Reckoning"
];

const backgroundPoints = [
  // Bottom Left (Dead Weight) - Most common
  { x: 12, y: 15 }, { x: 18, y: 25 }, { x: 22, y: 10 }, { x: 28, y: 35 },
  { x: 32, y: 18 }, { x: 38, y: 42 }, { x: 42, y: 22 }, { x: 45, y: 38 },
  { x: 15, y: 45 }, { x: 25, y: 28 }, { x: 35, y: 12 }, { x: 8, y: 32 },
  { x: 48, y: 15 }, { x: 10, y: 8 }, { x: 30, y: 48 }, { x: 20, y: 38 },
  
  // Top Left (Raw Diamond) - Less common
  { x: 15, y: 65 }, { x: 25, y: 82 }, { x: 35, y: 58 }, { x: 42, y: 75 },
  { x: 18, y: 90 }, { x: 28, y: 68 }, { x: 45, y: 88 }, { x: 12, y: 55 },
  
  // Bottom Right (Traffic Recycler) - Less common
  { x: 65, y: 15 }, { x: 82, y: 25 }, { x: 58, y: 35 }, { x: 75, y: 42 },
  { x: 90, y: 18 }, { x: 68, y: 28 }, { x: 88, y: 45 }, { x: 55, y: 12 },
  
  // Top Right (Blockbuster) - Rarest
  { x: 78, y: 85 }, { x: 88, y: 72 }, { x: 65, y: 92 }, { x: 82, y: 62 }
].map((pt, i) => ({ ...pt, name: storyNames[i % storyNames.length] }));

const getScoreColor = (score: number) => {
  if (score >= 85) return '#A8F0D5'; // Mint Green
  if (score >= 70) return '#A6D8F8'; // Light Blue
  if (score >= 55) return '#FFFFFF'; // Neutral (White)
  if (score >= 40) return '#FDF196'; // Yellow
  if (score >= 30) return '#FFD6A5'; // Orange
  return '#FFC4D9';                  // Pink
};

export const SterlingAgent: React.FC<SterlingAgentProps> = ({ tsi, tei, verdict = "INVEST", ipStatus, globalStories = [] }) => {
  // Current point (only one point on the matrix)
  const currentPoint = { x: tei.score, y: tsi.score };

  const getQuadrant = (tsiScore: number, teiScore: number) => {
    if (tsiScore >= 50 && teiScore >= 50) return 1; // Blockbuster
    if (tsiScore >= 50 && teiScore < 50) return 2;  // Raw Diamond
    if (tsiScore < 50 && teiScore >= 50) return 3;  // Traffic Recycler
    return 4; // Dead Weight
  };

  const activeQ = getQuadrant(tsi.score, tei.score);
  const qColors: Record<number, string> = { 1: '#A8F0D5', 2: '#FDF196', 3: '#C8BFF4', 4: '#FFC4D9' };
  const badgeColor = qColors[activeQ];

  // Generate real points from global stories
  const realPoints = globalStories.map(story => {
    const tsiScore = Math.round(
      ((story.tsi_evaluation?.CMA?.score || 0) * 0.40) + 
      ((story.tsi_evaluation?.PSP?.score || 0) * 0.40) + 
      ((story.tsi_evaluation?.IER?.score || 0) * 0.20)
    );

    const teiScore = Math.round(
      ((story.tei_evaluation?.TWS?.score || 0) * 0.20) + 
      ((story.tei_evaluation?.PEL?.score || 0) * 0.20) + 
      ((story.tei_evaluation?.ACV?.score || 0) * 0.15) + 
      ((story.tei_evaluation?.HTR?.score || 0) * 0.15) + 
      ((story.tei_evaluation?.VRS?.score || 0) * 0.15) + 
      ((story.tei_evaluation?.SMR?.score || 0) * 0.15)
    );
    
    return {
      x: teiScore,
      y: tsiScore,
      name: story.story_title || story.Title || "Untitled",
      isReal: true
    };
  });

  // Replace background points with real points 1-to-1
  const displayBackgroundPoints = backgroundPoints
    .slice(realPoints.length)
    .map(pt => ({ ...pt, isReal: false }));

  const allPoints = [...displayBackgroundPoints, ...realPoints];

  return (
    <div className="w-full flex-1 flex flex-col gap-4 mt-0">
      {/* Top: Info/Legend */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 w-full shrink-0 xl:pt-2">
        {/* Verdict Badge */}
        <div 
          className="border-2 border-black py-2 px-4 rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-center min-w-0"
          style={{ backgroundColor: badgeColor }}
        >
          <span className="font-black text-black/60 uppercase tracking-widest text-[10px] mb-1">Verdict</span>
          <span className="font-black text-black uppercase tracking-widest text-xl xl:text-2xl leading-none truncate w-full">{verdict}</span>
        </div>
        
        {/* IP Status Badge */}
        {ipStatus ? (
          <div className={`border-2 border-black py-2 px-4 rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-center min-w-0 ${ipStatus.monetization_approved ? 'bg-[#86F29F]' : 'bg-[#FFA3C5]'}`}>
            <span className="font-black text-black/60 uppercase tracking-widest text-[10px] mb-1">IP Status</span>
            <div className="flex items-center gap-1.5 w-full justify-center">
              {ipStatus.monetization_approved ? <ShieldCheck className="w-4 h-4 text-black shrink-0" /> : <ShieldAlert className="w-4 h-4 text-black shrink-0" />}
              <span className="font-black text-black uppercase tracking-wider text-base xl:text-lg leading-none truncate">{ipStatus.monetization_approved ? 'Clean' : 'Blocked'}</span>
            </div>
          </div>
        ) : (
          <div className="border-2 border-black py-2 px-4 rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-center min-w-0 bg-gray-200">
            <span className="font-black text-black/60 uppercase tracking-widest text-[10px] mb-1">IP Status</span>
            <span className="font-black text-black uppercase tracking-wider text-base xl:text-lg leading-none truncate">Unknown</span>
          </div>
        )}
        
        {/* Scores */}
        <div 
          className="border-2 border-black py-2 px-4 rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-center min-w-0"
          style={{ backgroundColor: getScoreColor(tsi.score) }}
        >
          <span className="text-[10px] font-black text-black/60 uppercase tracking-widest mb-1">TSI Score (Idea Axis)</span>
          <span className="text-3xl xl:text-4xl font-black text-black leading-none">{tsi.score}</span>
        </div>
        <div 
          className="border-2 border-black py-2 px-4 rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-center min-w-0"
          style={{ backgroundColor: getScoreColor(tei.score) }}
        >
          <span className="text-[10px] font-black text-black/60 uppercase tracking-widest mb-1">TEI Score (Mechanics Axis)</span>
          <span className="text-3xl xl:text-4xl font-black text-black leading-none">{tei.score}</span>
        </div>
      </div>

      {/* Bottom: The Matrix */}
      <div className="w-full flex-1 relative min-h-[200px] md:min-h-[260px] xl:min-h-[340px]">
        {/* Grid Background (overflow-hidden for rounded corners) */}
        <div className="absolute top-0 right-0 bottom-0 left-0 border-2 border-black rounded-3xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {/* Smooth Gradient Wave Background */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top right, #FFC4D9 10%, #FDF196 45%, #A8F0D5 70%)'
            }}
          />

          {/* Corner Labels */}
          <div className="absolute bottom-4 left-4 z-40 pointer-events-none">
            <span className="bg-[#FFA3C5] backdrop-blur-sm border-2 border-black px-2 py-1 rounded-md text-[10px] md:text-xs font-black text-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Dead Weight</span>
          </div>
          <div className="absolute top-4 right-4 z-40 pointer-events-none text-right">
            <span className="bg-[#86F29F] backdrop-blur-sm border-2 border-black px-2 py-1 rounded-md text-[10px] md:text-xs font-black text-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Blockbuster</span>
          </div>
        </div>

        {/* Y Axis Label (Inside but above grid) */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 origin-center z-40 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm border-2 border-black px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] md:text-xs font-black text-black uppercase tracking-widest whitespace-nowrap">
              TSI Score
            </span>
          </div>
        </div>

        {/* X Axis Label (Inside but above grid) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm border-2 border-black px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] md:text-xs font-black text-black uppercase tracking-widest whitespace-nowrap">
              TEI Score
            </span>
          </div>
        </div>

        {/* The Points Container (Inset to prevent overlapping labels) */}
        <div className="absolute inset-5 md:inset-8 pointer-events-none z-20">
          {/* Background Competitor & History Points */}
          {allPoints.map((pt, i) => (
            <div 
              key={i}
              className={`absolute w-3 h-3 md:w-4 md:h-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full pointer-events-auto group cursor-pointer hover:scale-110 transition-transform z-10 hover:z-50 ${pt.isReal ? 'bg-[#A5DDF8]' : 'bg-white'}`}
              style={{
                left: `${pt.x}%`,
                bottom: `${pt.y}%`,
                transform: 'translate(-50%, 50%)'
              }}
            >
              {/* Tooltip */}
              <div 
                className={`absolute text-white text-[10px] md:text-xs font-black px-2 py-1 rounded-md whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 ${pt.isReal ? 'bg-[#1A1A1A] border-2 border-[#A5DDF8]' : 'bg-black'}`}
                style={{
                  bottom: '100%',
                  marginBottom: '8px',
                  left: pt.x > 85 ? 'auto' : '50%',
                  right: pt.x > 85 ? '0' : 'auto',
                  transform: pt.x > 85 ? 'none' : 'translateX(-50%)'
                }}
              >
                {pt.name}
                <div 
                  className={`absolute top-full border-4 border-transparent ${pt.isReal ? 'border-t-[#bffff6]' : 'border-t-black'}`}
                  style={{
                    left: pt.x > 85 ? 'auto' : '50%',
                    right: pt.x > 85 ? '6px' : 'auto',
                    transform: pt.x > 85 ? 'none' : 'translateX(-50%)'
                  }}
                ></div>
              </div>
            </div>
          ))}

          {/* The Single Point */}
          <div
            className="absolute w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all duration-1000 pointer-events-auto z-20"
            style={{
              left: `${currentPoint.x}%`,
              bottom: `${currentPoint.y}%`,
              transform: 'translate(-50%, 50%)'
            }}
          >
            <div className="w-3 h-3 md:w-4 md:h-4 bg-black rounded-full animate-pulse"></div>
            
            {/* Tooltip */}
            <div 
              className="absolute bg-black text-white text-sm md:text-base font-black px-4 py-2 rounded-lg whitespace-nowrap shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
              style={{
                bottom: '100%',
                marginBottom: '12px',
                // Smart positioning: if point is too far right, anchor tooltip to the right edge of the point
                left: currentPoint.x > 85 ? 'auto' : '50%',
                right: currentPoint.x > 85 ? '0' : 'auto',
                transform: currentPoint.x > 85 ? 'none' : 'translateX(-50%)'
              }}
            >
              YOUR STORY IS HERE
              <div 
                className="absolute top-full border-8 border-transparent border-t-black"
                style={{
                  left: currentPoint.x > 85 ? 'auto' : '50%',
                  right: currentPoint.x > 85 ? '12px' : 'auto',
                  transform: currentPoint.x > 85 ? 'none' : 'translateX(-50%)'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
