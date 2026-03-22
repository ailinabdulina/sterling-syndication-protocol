import { ReactNode } from 'react';

export interface OfferGenre {
  name: string;
  count: string;
  icon: ReactNode;
}

export interface Offer {
  id: number;
  nickname: string;
  treasury: string;
  level: number;
  highlighted: boolean;
  status: 'accept' | 'reject' | 'counter' | 'pending';
  verdictText?: string;
  avatar: string;
  genres: OfferGenre[];
  rarity: 'common' | 'rare' | 'legendary';
  roi: string;
  followers: string;
  short?: string;
  reason?: string;
}

export interface SterlingLog {
  id: number;
  action: 'accept' | 'reject' | 'counter';
  text: string;
}

export interface ChatMessage {
  id: number;
  type?: 'system' | 'deal_event';
  from?: string;
  text: string;
  delay_ms: number;
  verdict?: {
    status: 'ACCEPTED' | 'COUNTER' | 'REJECTED';
    offer: string | null;
    short?: string;
    reason?: string;
    note?: string;
    distribution?: {
      ad_spend_pct: number;
      influencer_pct: number;
      quality_improvement_pct: number;
    } | null;
  };
  tx_hash?: string;
  event_payload?: any;
  action?: {
    label: string;
    view: 'dashboard' | 'new' | 'syndicate' | 'advertising' | 'history';
  };
}

export type FeedItem = ChatMessage;
