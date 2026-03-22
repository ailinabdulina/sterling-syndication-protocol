import React, { useState } from 'react';
import { Maximize2, X, Plus, Minus } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface AudienceMapWidgetProps {
  regions: string[];
}

const regionToCountries: Record<string, string[]> = {
  "North America": ["United States of America", "Canada", "Mexico"],
  "Europe": ["United Kingdom", "France", "Germany", "Italy", "Spain", "Poland", "Ukraine", "Sweden", "Norway", "Finland", "Romania", "Netherlands", "Belgium", "Greece", "Portugal", "Czechia", "Hungary", "Austria", "Switzerland", "Bulgaria", "Denmark", "Slovakia", "Ireland", "Croatia", "Lithuania", "Slovenia", "Latvia", "Estonia"],
  "Russia": ["Russia"],
  "CIS countries": ["Kazakhstan", "Belarus", "Uzbekistan", "Armenia", "Azerbaijan", "Kyrgyzstan", "Moldova", "Tajikistan"],
  "Asia Pacific": ["China", "Japan", "Australia", "India", "South Korea", "Indonesia", "Philippines", "Vietnam", "Thailand", "Malaysia", "New Zealand"],
  "South America": ["Brazil", "Argentina", "Chile", "Colombia", "Peru", "Venezuela", "Ecuador", "Bolivia", "Paraguay", "Uruguay", "Guyana", "Suriname"],
  "Middle East": ["Saudi Arabia", "United Arab Emirates", "Israel", "Turkey", "Egypt", "Iran", "Iraq", "Syria", "Jordan", "Lebanon", "Oman", "Yemen", "Kuwait", "Qatar", "Bahrain"]
};

const regionViewConfig: Record<string, { center: [number, number], scale: number, expandedScale: number }> = {
  "North America": { center: [-95, 40], scale: 250, expandedScale: 350 },
  "Europe": { center: [15, 50], scale: 400, expandedScale: 600 },
  "Russia": { center: [95, 60], scale: 220, expandedScale: 320 },
  "CIS countries": { center: [70, 48], scale: 350, expandedScale: 500 },
  "Asia Pacific": { center: [110, 0], scale: 250, expandedScale: 350 },
  "South America": { center: [-60, -15], scale: 250, expandedScale: 350 },
  "Middle East": { center: [45, 25], scale: 400, expandedScale: 600 }
};

const palette = ["#86F29F", "#C4A4F9", "#FDE073", "#FFA3C5", "#88F0E5"];

export const AudienceMapWidget: React.FC<AudienceMapWidgetProps> = ({ regions = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine focus based on the primary (first) region
  const primaryRegion = regions[0] || "Europe";
  const viewConfig = regionViewConfig[primaryRegion] || { center: [0, 30], scale: 120, expandedScale: 140 };

  const [position, setPosition] = useState({ coordinates: viewConfig.center, zoom: 1 });

  const handleExpand = () => {
    setPosition({ coordinates: viewConfig.center, zoom: 1 });
    setIsExpanded(true);
  };

  const handleZoomIn = () => {
    if (position.zoom >= 8) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 0.2) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleMoveEnd = (position: any) => {
    setPosition(position);
  };

  // Map regions to colors dynamically based on frequency
  const regionCounts: Record<string, number> = {};
  regions.forEach(r => {
    regionCounts[r] = (regionCounts[r] || 0) + 1;
  });

  const maxCount = Math.max(...Object.values(regionCounts), 1);
  const uniqueRegions = Object.keys(regionCounts);

  const regionColors: Record<string, string> = {};
  const activeCountryColors: Record<string, string> = {};
  const activeCountryOpacities: Record<string, number> = {};

  const normalizeCountryName = (name: string) => {
    if (name === "USA") return "United States of America";
    if (name === "UK") return "United Kingdom";
    return name;
  };

  uniqueRegions.forEach((region, index) => {
    const color = palette[index % palette.length];
    regionColors[region] = color;
    
    const count = regionCounts[region];
    // Normalize opacity between 0.4 and 1.0 for visibility
    const opacity = 0.4 + (0.6 * (count / maxCount));
    
    const countries = regionToCountries[region] || [normalizeCountryName(region)];
    countries.forEach(country => {
      activeCountryColors[country] = color;
      activeCountryOpacities[country] = opacity;
    });
  });

  const renderMapContent = (expanded: boolean) => {
    const mapBody = (
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const countryName = geo.properties.name;
            const highlightColor = activeCountryColors[countryName];
            const opacity = activeCountryOpacities[countryName] || 1;
            
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={highlightColor || "#FFFFFF"}
                fillOpacity={highlightColor ? opacity : 1}
                stroke="#000000"
                strokeWidth={expanded ? 0.5 : 1}
                style={{
                  default: { outline: "none", transition: "all 250ms" },
                  hover: { fill: highlightColor ? highlightColor : "#F5F5F0", fillOpacity: 1, outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            );
          })
        }
      </Geographies>
    );

    return (
      <div className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-[#A5DDF8]`}>
        {/* Dotted background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <ComposableMap 
            projection="geoMercator" 
            projectionConfig={{ 
              scale: expanded ? viewConfig.expandedScale : viewConfig.scale, 
              center: expanded ? [0, 0] : viewConfig.center 
            }}
            width={800}
            height={expanded ? 400 : 300}
            style={{ width: "100%", height: "100%" }}
          >
            {expanded ? (
              <ZoomableGroup 
                zoom={position.zoom} 
                minZoom={0.2}
                maxZoom={8}
                center={position.coordinates as [number, number]} 
                onMoveEnd={handleMoveEnd}
              >
                {mapBody}
              </ZoomableGroup>
            ) : (
              mapBody
            )}
          </ComposableMap>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Minimap Widget */}
      <div 
        className="h-full bg-[#A5DDF8] border-2 border-black rounded-3xl flex flex-col min-h-[130px] cursor-pointer group relative overflow-hidden transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        onClick={handleExpand}
      >
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-10 pointer-events-none">
          <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border-2 border-black">
            Audience Heatmap
          </h3>
          <button className="text-black bg-white border-2 border-black w-8 h-8 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-auto">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="absolute inset-0 w-full h-full">
          {renderMapContent(false)}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#F5F5F0] w-full max-w-6xl h-[85vh] rounded-[2rem] border-2 border-black flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 sm:p-6 z-10 relative border-b-2 border-black bg-white">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tighter">
                  Global Audience Distribution
                </h2>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 relative overflow-hidden z-10">
              {renderMapContent(true)}
              
              {/* Zoom Controls */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-10">
                <button 
                  onClick={handleZoomIn} 
                  className="bg-white hover:bg-gray-100 text-black w-12 h-12 flex items-center justify-center rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  title="Zoom In"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                </button>
                <button 
                  onClick={handleZoomOut} 
                  className="bg-white hover:bg-gray-100 text-black w-12 h-12 flex items-center justify-center rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  title="Zoom Out"
                >
                  <Minus className="w-6 h-6 stroke-[3]" />
                </button>
              </div>
            </div>
            
            {/* Legend */}
            <div className="p-5 sm:p-6 border-t-2 border-black bg-white grid grid-cols-2 sm:grid-cols-4 gap-4 z-10 relative">
              {uniqueRegions.map((region, idx) => (
                <div key={idx} className="bg-[#F5F5F0] p-4 rounded-xl border-2 border-black flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-4 h-4 rounded-full border-2 border-black" style={{ backgroundColor: regionColors[region] || "#FFFFFF", opacity: 0.4 + (0.6 * (regionCounts[region] / maxCount)) }}></div>
                  <div className="text-sm sm:text-base font-black text-black uppercase tracking-widest">{region} <span className="text-black/50 text-xs">({regionCounts[region]})</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
