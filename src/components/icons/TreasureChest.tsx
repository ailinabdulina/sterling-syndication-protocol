import React from 'react';

export const TreasureChest = ({ className = "w-6 h-6", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Rounded lid */}
    <path d="M3 12c0-4.418 4.03-8 9-8s9 3.582 9 8" />
    {/* Base of the chest */}
    <path d="M3 12v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />
    {/* Horizontal line separating lid and base */}
    <path d="M2 12h20" />
    {/* Lock */}
    <rect x="10" y="10" width="4" height="4" rx="1" />
    <path d="M12 14v2" />
    {/* Straps */}
    <path d="M7 4v16" />
    <path d="M17 4v16" />
  </svg>
);
