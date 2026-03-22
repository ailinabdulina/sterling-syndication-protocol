import { z } from 'zod';

export const ConstraintCloudSchema = z.object({
  story_engine: z.any().optional(),
  main_constraint: z.any().optional(),
  creative_tension: z.any().optional(),
  hidden_assumption: z.any().optional(),
  injection: z.any().optional(),
  best_next_move: z.any().optional()
}).catchall(z.any());

// Base Evaluation Metric
export const EvaluationMetricSchema = z.object({
  reasoning: z.string().optional(),
  score: z.number().optional()
}).catchall(z.any());

// TSI Evaluation
export const TsiEvaluationSchema = z.object({
  CMA: EvaluationMetricSchema.optional(),
  IER: EvaluationMetricSchema.optional(),
  PSP: EvaluationMetricSchema.optional()
}).catchall(z.any());

// TEI Evaluation
export const TeiEvaluationSchema = z.object({
  VRS: EvaluationMetricSchema.optional(),
  ACV: EvaluationMetricSchema.optional(),
  HTR: EvaluationMetricSchema.optional(),
  PEL: EvaluationMetricSchema.optional(),
  SMR: EvaluationMetricSchema.optional(),
  TWS: EvaluationMetricSchema.optional()
}).catchall(z.any());

// Demographics
export const PredictedDemographicsSchema = z.object({
  primary_geography: z.array(z.string()).optional(),
  gender_split: z.string().optional(),
  core_age_group: z.string().optional(),
  wtp_proxy: z.string().optional(),
  cac_proxy: z.string().optional()
}).catchall(z.any());

// Business Insights
export const BusinessInsightsSchema = z.object({
  ip_copyright_status: z.any().optional(),
  target_audience_tags: z.array(z.string()).optional(),
  virality_surface: z.string().optional(),
  unit_economics_forecast: z.any().optional(),
  monetization_hook: z.string().optional(),
  pivot_opportunity: z.string().optional(),
  overall_conclusion: z.string().optional(),
  age_rating_us: z.string().optional()
}).catchall(z.any());

// Main Story Data Schema
export const StoryDataSchema = z.object({
  generated_synopsis: z.string().optional(),
  tsi_evaluation: TsiEvaluationSchema.optional(),
  tei_evaluation: TeiEvaluationSchema.optional(),
  predicted_demographics: PredictedDemographicsSchema.optional(),
  business_insights: BusinessInsightsSchema.optional(),
  Title: z.string().optional(),
  Author: z.string().optional(),
  story_title: z.string().optional(),
  author: z.string().optional(),
  age_rating_us: z.string().optional(),
  sterling_verdict: z.string().optional(),
  taskId: z.string().optional(),
  hasRequestedOffers: z.boolean().optional(),
  hasSignedContract: z.boolean().optional(),
  txHash: z.string().optional(),
  tokenId: z.number().optional(),
  original_text: z.string().optional(),
  verification_report: z.any().optional(),
  constraint_cloud: ConstraintCloudSchema.optional()
}).catchall(z.any());

// Marketing Execution Schema
export const MarketingExecutionSchema = z.object({
  budget_execution: z.object({
    total_amount_usd: z.number().optional()
  }).catchall(z.any()).optional(),
  performance_mock: z.object({
    summary: z.object({
      purchases: z.number().optional()
    }).catchall(z.any()).optional()
  }).catchall(z.any()).optional(),
  channel_transfers: z.array(z.any()).optional(),
  marketing_posts: z.array(z.any()).optional(),
  verification_report: z.any().optional()
}).catchall(z.any());

// Syndicate Review Result Schema
export const SyndicateReviewResultSchema = z.object({
  story_title: z.string().optional(),
  feed: z.object({
    feed_messages: z.array(z.any()).optional()
  }).catchall(z.any()).optional(),
  sterling_verdict: z.any().optional(),
  investor_outputs: z.array(z.any()).optional(),
  onchain_offer_meta: z.object({
    accepted_offer_id: z.string().optional()
  }).catchall(z.any()).optional(),
  ui_signals: z.any().optional(),
  verification_report: z.any().optional()
}).catchall(z.any());

export const InvestorVerdictSchema = z.object({
  event: z.literal('INVESTOR_VERDICT'),
  agent_name: z.string().optional(),
  decision: z.string().optional(),
  amount_usd: z.number().optional(),
  equity_pct: z.number().optional(),
  reasoning: z.string().optional(),
  thesis: z.string().optional(),
  ad_spend_pct: z.number().optional(),
  influencer_pct: z.number().optional(),
  quality_improvement_pct: z.number().optional(),
  pricing_terms: z.any().optional(),
  content_plan_terms: z.any().optional(),
  onchain_offer: z.any().optional()
}).catchall(z.any());

export const BestOfferSchema = z.object({
  event: z.literal('BEST_OFFER'),
  agent_name: z.string().optional(),
  amount_usd: z.number().optional(),
  equity_pct: z.number().optional()
}).catchall(z.any());
