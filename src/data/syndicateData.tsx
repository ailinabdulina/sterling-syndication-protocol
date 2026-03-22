import React from 'react';
import { Zap, Search, Cpu, Smile, Star, Heart, BookOpen, Newspaper, Ghost } from 'lucide-react';
import { Offer } from '../types/syndicate';

export const INVESTOR_PHRASES: Record<string, string[]> = {
  'Agent_X9': [
    'Signal unstable', 'Noise detected', 'Entry unclear', 'Bad spread', 'Thin liquidity',
    'Overfit pattern', 'Weak retention', 'Exit compromised', 'Signal fading', 'Volatility spike',
    'Poor instrument', 'Data insufficient', 'No edge here', 'Risk mispriced', 'Flow collapsing',
    'Dead loop', 'Entry denied', 'Overheated curve', 'Low repeat rate', 'Kill condition armed'
  ],
  'Crypto_Bunny': [
    'Where’s the loop', 'Not memeable', 'Needs chaos', 'Dead on TikTok', 'No fandom',
    'Weak flywheel', 'Clip it harder', 'Zero discourse', 'No ship energy', 'Feels mid',
    'Where’s obsession', 'Not remixable', 'Needs drama', 'No virality layer', 'Boring feed',
    'No heat', 'Too respectable', 'No internet here', 'Who shares this', 'No spark'
  ],
  'Barnaby': [
    'Lacks gravity', 'Mildly vulgar', 'Thin character', 'No weight', 'Quite pedestrian',
    'Distasteful hook', 'Hollow premise', 'No dignity', 'Unrefined', 'Forced tension',
    'Weak spine', 'No consequence', 'Tries too hard', 'Lacks restraint', 'Not serious',
    'No presence', 'Surface only', 'Tiresome device', 'No substance', 'Beneath interest'
  ],
  'Safe_Paws': [
    'Too scary', 'Not safe', 'Feels heavy', 'I’m uneasy', 'Too dark',
    'I’ll pass', 'Sorry… no', 'This hurts', 'Not for me', 'I’m nervous',
    'Too intense', 'I can’t', 'Feels harsh', 'I don’t like this', 'Too much',
    'I’m out', 'Not gentle', 'Too sad', 'Not comforting', 'Please no'
  ],
  'Diamond_Hands': [
    'Needs blood', 'Too soft', 'No bite', 'Weak kill', 'Where’s chaos',
    'Break it harder', 'Not savage', 'Too slow', 'No violence', 'Boring prey',
    'No pressure', 'Hit faster', 'Push harder', 'No fear', 'Weak hook',
    'No fight', 'Starving market', 'Needs damage', 'No teeth', 'I want pain'
  ],
  'Laser_Eyes_99': [
    'Insufficient system', 'Low scalability', 'No architecture', 'Weak model', 'Non-expandable',
    'No structure', 'Human noise', 'Inefficient design', 'Fragmented logic', 'No framework',
    'Closed system', 'Low recursion', 'Poor extensibility', 'No hierarchy', 'Incomplete schema',
    'Non-modular', 'No canon layer', 'Primitive loop', 'No abstraction', 'System rejected'
  ]
};

export const MOCK_OFFERS: Offer[] = [
  {
    id: 1,
    nickname: 'Agent_X9',
    treasury: '₮1.2M',
    level: 24,
    highlighted: true,
    status: 'reject',
    rarity: 'common',
    roi: '+12%',
    followers: '15K',
    avatar: 'https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2FAgent_X9.jpg?alt=media&token=e3d3b170-9fc0-41e0-929f-44c2ec1def89',
    genres: [
      { name: 'Sci-Fi', count: '12', icon: <Cpu className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> },
      { name: 'Mystery', count: '8', icon: <Search className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" strokeWidth={3} /> },
      { name: 'Action', count: '5', icon: <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> }
    ]
  },
  {
    id: 2,
    nickname: 'Crypto_Bunny',
    treasury: '₮850K',
    level: 42,
    highlighted: true,
    status: 'counter',
    rarity: 'rare',
    roi: '+45%',
    followers: '82K',
    avatar: 'https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2FCrypto_Bunny.jpg?alt=media&token=cbbdd7dd-82b1-4eac-b3f5-fe5ce0e980e9',
    genres: [
      { name: 'Comedy', count: '15', icon: <Smile className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" strokeWidth={3} /> },
      { name: 'Fantasy', count: '9', icon: <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> },
      { name: 'Romance', count: '4', icon: <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> }
    ]
  },
  {
    id: 3,
    nickname: 'Barnaby',
    treasury: '₮4.5M',
    level: 99,
    highlighted: true,
    status: 'accept',
    rarity: 'legendary',
    roi: '+120%',
    followers: '1.2M',
    avatar: 'https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2Fbarbabye.jpg?alt=media&token=c7c09b80-d5e8-4ddb-b750-b69d6b2d74a2',
    genres: [
      { name: 'Drama', count: '22', icon: <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> },
      { name: 'Journalism', count: '14', icon: <Newspaper className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> },
      { name: 'Mystery', count: '11', icon: <Search className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" strokeWidth={3} /> }
    ]
  },
  {
    id: 4,
    nickname: 'Safe_Paws',
    treasury: '₮120K',
    level: 5,
    highlighted: true,
    status: 'reject',
    rarity: 'common',
    roi: '+5%',
    followers: '3K',
    avatar: 'https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2FSafe_Paws.jpg?alt=media&token=31cf9eb6-0622-4afa-9f42-6ec5fa1e5f0c',
    genres: [
      { name: 'Romance', count: '18', icon: <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> },
      { name: 'Comedy', count: '12', icon: <Smile className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" strokeWidth={3} /> },
      { name: 'Drama', count: '7', icon: <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> }
    ]
  },
  {
    id: 5,
    nickname: 'Diamond_Hands',
    treasury: '₮10.5M',
    level: 65,
    highlighted: true,
    status: 'counter',
    rarity: 'rare',
    roi: '+88%',
    followers: '450K',
    avatar: 'https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2FDiamond.jpg?alt=media&token=2700bcfe-2988-41b4-8bd4-285d860cce26',
    genres: [
      { name: 'Action', count: '25', icon: <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> },
      { name: 'Horror', count: '16', icon: <Ghost className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> },
      { name: 'Sci-Fi', count: '10', icon: <Cpu className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> }
    ]
  },
  {
    id: 6,
    nickname: 'Laser_Eyes_99',
    treasury: '₮2.8M',
    level: 88,
    highlighted: true,
    status: 'counter',
    rarity: 'legendary',
    roi: '+210%',
    followers: '2.5M',
    avatar: 'https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/site_animation%2FLaser_Eyes_99.jpg?alt=media&token=a7e4ded5-6350-4876-a2ff-3e0f988a2cae',
    genres: [
      { name: 'Sci-Fi', count: '30', icon: <Cpu className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> },
      { name: 'Action', count: '18', icon: <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> },
      { name: 'Fantasy', count: '5', icon: <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" /> }
    ]
  }
];

export const getQuote = (nickname: string, treasury: string) => {
  switch(nickname) {
    case 'Barnaby': return "A truly delightful narrative, my dear fellow. It possesses that rare, old-world charm that simply demands investment. I should be honored to back such a distinguished endeavor.";
    case 'Agent_X9': return "My charts and compass suggest this path leads to ruin, not riches. I've seen enough dead ends to know when to turn back. I'm passing on this expedition.";
    case 'Crypto_Bunny': return "My research into the underlying narrative theory suggests a fascinating potential, but the tokenomics are... lacking. I propose a counter-offer with a more robust revenue-sharing model based on my latest thesis.";
    case 'Laser_Eyes_99': return "The data stream is corrupted. Your roadmap is legacy tech. I'm countering with a demand for full integration into my neural network—I want total control over the IP expansion.";
    case 'Safe_Paws': return "I've trekked through many a wild story, and this one feels a bit too treacherous for my taste. I prefer a path with a bit more sunshine and safety. I'm afraid I'll have to pass.";
    case 'Diamond_Hands': return "I've fought harder battles for less reward. This deal is weak. I'll counter with a demand for a bigger share of the spoils, or I'm taking my spear elsewhere.";
    default: return `Treasury: ${treasury}`;
  }
};
