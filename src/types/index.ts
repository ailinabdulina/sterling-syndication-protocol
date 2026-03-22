export interface EvaluationMetric {
  reasoning: string;
  score: number;
}

export interface TsiEvaluation {
  CMA: EvaluationMetric;
  IER: EvaluationMetric;
  PSP: EvaluationMetric;
}

export interface TeiEvaluation {
  VRS: EvaluationMetric;
  ACV: EvaluationMetric;
  HTR: EvaluationMetric;
  PEL: EvaluationMetric;
  SMR: EvaluationMetric;
  TWS: EvaluationMetric;
}

export interface PredictedDemographics {
  primary_geography: string[];
  gender_split: string;
  core_age_group: string;
  wtp_proxy: string;
  cac_proxy: string;
}

export interface UnitEconomicsForecast {
  estimated_cac_usd: string;
  estimated_ltv_potential: string;
  retention_driver: string;
}

export interface BusinessInsights {
  ip_copyright_status: string | {
    is_original_ip?: boolean;
    monetization_approved?: boolean;
    detected_fandom?: string | null;
    frontend_warning_message?: string;
  };
  target_audience_tags: string[];
  virality_surface: string;
  unit_economics_forecast: UnitEconomicsForecast;
  monetization_hook: string;
  pivot_opportunity: string;
  age_rating_us?: string;
  sterling_verdict?: string;
  overall_conclusion?: string;
}

export interface ConstraintCloud {
  story_engine?: string;
  main_constraint?: string;
  creative_tension?: string;
  hidden_assumption?: string;
  injection?: string;
  best_next_move?: string;
}

export interface StoryData {
  generated_synopsis: string;
  tsi_evaluation: TsiEvaluation;
  tei_evaluation: TeiEvaluation;
  predicted_demographics: PredictedDemographics;
  business_insights: BusinessInsights;
  Title?: string;
  Author?: string;
  story_title?: string;
  author?: string;
  age_rating_us?: string;
  sterling_verdict?: string;
  taskId?: string; // Added to track the source task for syndicate review
  hasRequestedOffers?: boolean;
  hasSignedContract?: boolean;
  txHash?: string;
  tokenId?: number;
  original_text?: string;
  verification_report?: {
    trust_score?: number;
    [key: string]: any;
  };
  constraint_cloud?: ConstraintCloud;
}

export interface FeedMessage {
  type: string;
  speaker: string;
  content: string;
  event_payload?: {
    event: string;
    agent_name?: string;
    decision?: string;
    amount_usd?: number;
    equity_pct?: number;
    ratio_usd_per_equity?: number;
    [key: string]: any;
  };
}

export interface InvestorOffer {
  amount_usd: number;
  equity_pct: number;
  ad_spend_pct: number;
  influencer_pct: number;
  quality_improvement_pct: number;
  rights_requests?: string[];
  special_terms?: string[];
  pricing_terms?: any;
  content_plan_terms?: any;
  contract_terms?: {
    pricing_terms?: any;
    content_plan_terms?: any;
  };
  revenue_mock?: any;
}

export interface OnchainOffer {
  offer_id: string;
  campaign_id: string;
  terms_hash: string;
  escrow_contract: string;
  lock_expected_token: string;
  lock_expected_amount_usdt_6: number;
  lock_tx_hash: string;
  lock_tx_status: 'confirmed' | 'failed' | 'already_locked' | string;
  proof: string | string[];
}

export interface ContractSettlementResult {
  settlement_mode: string;
  escrow_accept_tx_hash?: string;
  escrow_offer_proof?: string | string[];
  escrow_contract?: string;
  author_wallet_address?: string;
  to_wallet?: string;
  from_wallet?: string;
  tx_hash?: string;
  explorer_url?: string;
  tokenId?: number;
}

export interface InvestorOutput {
  agent_name: string;
  wallet_address: string;
  wallet_balance_usdt: number;
  fit_assessment: string;
  decision: 'accept' | 'reject' | 'counter' | 'pending';
  investment_conviction: number;
  thesis: string;
  metric_interpretation?: {
    most_important_signals: string[];
    sterling_got_right: string[];
    sterling_underweighted: string[];
    sterling_overweighted: string[];
  };
  main_risk: string;
  offer?: InvestorOffer;
  onchain_offer?: OnchainOffer;
  contract_terms?: {
    pricing_terms?: any;
    content_plan_terms?: any;
  };
  revenue_mock?: any;
  room_attack?: {
    target_agent: string;
    attack_logic: string;
  };
  in_character_line: string;
  // UI specific fields mapped later
  followers?: string;
  roi?: string;
  level?: number;
  genres?: any[];
}

export interface SterlingVerdict {
  speaker?: string;
  recommended_action: 'accept' | 'reject' | 'renegotiate' | 'wait';
  recommended_partner: string;
  recommended_offer_summary?: {
    amount_usd: number;
    equity_pct: number;
    ad_spend_pct: number;
    influencer_pct: number;
    quality_improvement_pct: number;
  };
  final_statement: string;
}

export interface SyndicateReviewResult {
  story_title?: string;
  feed: {
    feed_messages: FeedMessage[];
  };
  sterling_verdict: SterlingVerdict;
  investor_outputs: InvestorOutput[];
  onchain_offer_meta?: {
    accepted_offer_id?: string;
  };
  ui_signals?: {
    best_offer?: {
      agent_name: string;
      decision: string;
      amount_usd: number;
      equity_pct: number;
      ratio_usd_per_equity: number;
    };
    investor_verdicts?: any[];
  };
  verification_report?: {
    trust_score?: number;
    [key: string]: any;
  };
}

export interface BarData {
  name: string;
  value: number;
  color: string;
}
