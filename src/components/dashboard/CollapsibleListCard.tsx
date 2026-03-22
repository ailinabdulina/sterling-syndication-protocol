import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleListCardProps {
  title: string;
  items: string[];
  color: string;
  icon: any;
  itemIcon: any;
}

export const CollapsibleListCard: React.FC<CollapsibleListCardProps> = ({ 
  title, 
  items = [], 
  color, 
  icon: Icon,
  itemIcon: ItemIcon
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className="rounded-3xl p-6 text-black relative cursor-pointer transition-all duration-300 overflow-hidden border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      style={{ backgroundColor: color }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Icon className="w-6 h-6" />
          <div className="flex flex-col">
            <span className="text-lg font-black uppercase tracking-tighter leading-none mb-1">{title}</span>
            <span className="text-xs font-black uppercase tracking-widest opacity-60 leading-none">{items.length} Items</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-sm bg-black text-white flex items-center justify-center text-xl font-black border-2 border-white/20">
            {items.length}
          </div>
          <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t-2 border-black/20' : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0 border-transparent'}`}>
        <div className="overflow-hidden flex flex-col gap-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 bg-black/10 border-2 border-black/10 rounded-sm p-4">
              <div className="w-8 h-8 rounded-sm bg-black/20 flex items-center justify-center shrink-0 mt-0.5 border-2 border-black/10">
                <ItemIcon className="w-4 h-4 text-black" />
              </div>
              <p className="text-base text-black font-medium leading-tight pt-1">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
