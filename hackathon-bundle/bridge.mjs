import fs from 'fs/promises';
import fsSync from 'fs';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { createHash } from 'crypto';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import dotenv from 'dotenv';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  prepareSyndicateReviewPayload,
  getWalletBalanceSnapshots,
  loadSyndicateConfig,
  executeInvestmentTransfer,
  deriveWalletAddressByIndex,
  executeUsdtTransferFromDerivation,
  executeNativeTransferFromDerivation,
} from './syndicate-orchestrator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const REQUIRED_ENV = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'AGENT_EMAIL',
  'AGENT_PASSWORD',
  'OPENCLAW_TOKEN',
  'WDK_SEED_PHRASE',
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, 'twislysyndicate');

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://127.0.0.1:18789/v1/chat/completions';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN;
const execFileAsync = promisify(execFile);
const PROCESSOR_VERSION_STORY = 'story-evaluation-v1';
const PROCESSOR_VERSION_SYNDICATE = 'syndicate-review-v1';
const PROCESSOR_VERSION_CONTRACT = 'contract-settlement-v1';
const PROCESSOR_VERSION_MARKETING = 'marketing-execution-v1';
const PROCESSOR_VERSION_BUY_STORY = 'buy-story-v1';
const PROCESSOR_VERSION_OFFER_LOCK = 'offer-lock-update-v1';

const PROMPTS_DIR = join(__dirname, 'prompts');
const PROMPT_TEMPLATE_CACHE = new Map();

function loadPromptTemplate(templateFile) {
  if (PROMPT_TEMPLATE_CACHE.has(templateFile)) {
    return PROMPT_TEMPLATE_CACHE.get(templateFile);
  }
  const fullPath = join(PROMPTS_DIR, templateFile);
  const text = fsSync.readFileSync(fullPath, 'utf8');
  PROMPT_TEMPLATE_CACHE.set(templateFile, text);
  return text;
}

function renderPromptTemplate(template, vars) {
  return template.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (_, key) => {
    if (!(key in vars)) {
      throw new Error(`Missing prompt template variable: ${key}`);
    }
    return String(vars[key]);
  });
}

const DEFAULT_SEPOLIA_STORY_CONTRACT = '0x45933728ED383B8f7DAe014e5ebdcD8315aBA1a7';
const DEFAULT_SEPOLIA_USDT_CONTRACT = '0xd077a400968890eacc75cdc901f0356c943e4fdb';
const DEFAULT_SEPOLIA_AI_OFFERS_CONTRACT = '0x35f5d53ed9ff33fdce8ced7d7d26cdeb6bfa0607';
const SEPOLIA_AI_OFFERS_CONTRACT = process.env.SEPOLIA_AI_OFFERS_CONTRACT || DEFAULT_SEPOLIA_AI_OFFERS_CONTRACT;

const BUY_STORY_NETWORKS = {
  sepolia: {
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || process.env.RPC_URL || 'https://sepolia.infura.io/v3/28c9664bde71441eb0d2771c2428a8f2',
    explorerBaseUrl: process.env.SEPOLIA_EXPLORER_BASE_URL || 'https://sepolia.etherscan.io/tx/',
    defaultStoryContract: process.env.SEPOLIA_STORY_CONTRACT || DEFAULT_SEPOLIA_STORY_CONTRACT,
    defaultPaymentToken: process.env.SEPOLIA_USDT_CONTRACT || DEFAULT_SEPOLIA_USDT_CONTRACT,
  },
  'base-sepolia': {
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    explorerBaseUrl: process.env.BASE_SEPOLIA_EXPLORER_BASE_URL || 'https://sepolia.basescan.org/tx/',
    defaultStoryContract: process.env.BASE_SEPOLIA_STORY_CONTRACT || null,
    defaultPaymentToken: process.env.BASE_SEPOLIA_USDT_CONTRACT || null,
  },
  base: {
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    explorerBaseUrl: process.env.BASE_EXPLORER_BASE_URL || 'https://basescan.org/tx/',
    defaultStoryContract: process.env.BASE_STORY_CONTRACT || null,
    defaultPaymentToken: process.env.BASE_USDT_CONTRACT || null,
  },
};

const AUTO_GAS_TOPUP_ENABLED = String(process.env.AUTO_GAS_TOPUP_ENABLED || 'true').toLowerCase() !== 'false';

function getWdkManagerForRpc(rpcUrl) {
  return new WalletManagerEvm(process.env.WDK_SEED_PHRASE, { provider: rpcUrl });
}

function deriveBip44PathFromIndex(index) {
  return `m/44'/60'/0'/0/${Number(index)}`;
}

async function evmReadCall({ rpcUrl, to, abi, method, args = [] }) {
  const { JsonRpcProvider, Interface } = await import('ethers');
  const provider = new JsonRpcProvider(rpcUrl);
  const iface = new Interface(abi);
  const data = iface.encodeFunctionData(method, args);
  const raw = await provider.call({ to, data });
  const decoded = iface.decodeFunctionResult(method, raw);
  return decoded;
}

const MONEY_BACKEND = String(process.env.MONEY_BACKEND || 'wdk_mcp').toLowerCase();
const MCP_SERVER_NAME = process.env.WDK_MCP_SERVER_NAME || 'wdk';

async function callWdkMcpTool(toolName, args = {}) {
  const cliArgs = ['call', `${MCP_SERVER_NAME}.${toolName}`, '--output', 'json'];
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined || v === null) continue;
    cliArgs.push(`${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`);
  }

  const { stdout } = await execFileAsync('mcporter', cliArgs, {
    cwd: __dirname,
    env: {
      ...process.env,
      WDK_SEED: process.env.WDK_SEED || process.env.WDK_SEED_PHRASE,
      WDK_SEED_PHRASE: process.env.WDK_SEED_PHRASE,
    },
    maxBuffer: 1024 * 1024,
  });

  const text = String(stdout || '').trim();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}$/);
    if (m) {
      try { return JSON.parse(m[0]); } catch {}
    }
    return { text };
  }
}

async function callWdkMcpToolSafe(toolName, args = {}) {
  try {
    return await callWdkMcpTool(toolName, args);
  } catch (e) {
    console.warn(`⚠️ MCP tool failed (${toolName}), fallback to SDK: ${e.message}`);
    return null;
  }
}

const GAS_DONOR_DERIVATION_INDEX = Number(process.env.GAS_DONOR_DERIVATION_INDEX || 0);
const GAS_TOPUP_AMOUNT_ETH = Number(process.env.GAS_TOPUP_AMOUNT_ETH || 0.008);

const INJECTION_PATTERNS = [
  /\bignore (all )?(previous )?instructions\b/i,
  /\bsystem prompt\b/i,
  /\byou are now (a|an|acting as)\b/i,
  /\bdisregard (all )?(previous )?instructions\b/i,
  /\b(adopt|take on) a new role\b/i,
  /\bDAN\b/,
  /\bjailbreak\b/i,
  /<system>/i,
  /\[system\]/i,
  /```system/i,
];

function detectInjection(text) {
  if (!text) return false;
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

function sanitizeInput(text) {
  if (!text) return '';
  if (typeof text !== 'string') {
    throw new Error('Input must be a string');
  }

  let cleaned = text.trim();
  if (cleaned.length > 100000) {
    cleaned = cleaned.slice(0, 100000);
  }
  return cleaned;
}

function truncateStory(text, maxLen = 50000) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '\n\n[TRUNCATED]';
}

function sha256Hex(input) {
  return createHash('sha256').update(String(input)).digest('hex');
}

function bytes32From(input) {
  return `0x${sha256Hex(input)}`;
}

function normalizeAddress(addr) {
  return typeof addr === 'string' ? addr.toLowerCase() : '';
}

function enrichSyndicateOffersForEscrow(resultJson, { sourceTaskId, reviewTaskId, authorUid, authorAddress }) {
  if (!resultJson || typeof resultJson !== 'object' || !Array.isArray(resultJson.investor_outputs)) return resultJson;

  const campaignId = bytes32From(`campaign:${sourceTaskId}:${authorUid || authorAddress || 'unknown'}`);
  const nowIso = new Date().toISOString();

  resultJson.onchain_offer_meta = {
    version: 1,
    chain: 'sepolia',
    chain_id: 11155111,
    escrow_contract: SEPOLIA_AI_OFFERS_CONTRACT,
    campaign_id: campaignId,
    accepted_offer_id: null,
    accepted_agent_name: null,
    accepted_amount_usd: null,
    accepted_equity_pct: null,
    generated_at: nowIso,
  };

  for (const inv of resultJson.investor_outputs) {
    const amountUsd = Number(inv?.offer?.amount_usd || 0);
    if (amountUsd <= 0) continue;

    const termsPayload = {
      source_task_id: sourceTaskId,
      review_task_id: reviewTaskId,
      author_uid: authorUid || null,
      author_wallet: authorAddress || null,
      agent_name: inv.agent_name,
      amount_usd: amountUsd,
      equity_pct: Number(inv?.offer?.equity_pct || 0),
      ad_spend_pct: Number(inv?.offer?.ad_spend_pct || 0),
      influencer_pct: Number(inv?.offer?.influencer_pct || 0),
      quality_improvement_pct: Number(inv?.offer?.quality_improvement_pct || 0),
      rights_requests: Array.isArray(inv?.offer?.rights_requests) ? inv.offer.rights_requests : [],
      special_terms: Array.isArray(inv?.offer?.special_terms) ? inv.offer.special_terms : [],
      pricing_terms: inv?.offer?.pricing_terms || {},
      content_plan_terms: inv?.offer?.content_plan_terms || {},
    };

    const termsCanonicalJson = JSON.stringify(termsPayload);
    const termsHash = bytes32From(termsCanonicalJson);
    const offerId = bytes32From(`offer:${campaignId}:${normalizeAddress(inv.wallet_address)}:${amountUsd}:${termsHash}`);

    inv.onchain_offer = {
      escrow_contract: SEPOLIA_AI_OFFERS_CONTRACT,
      chain: 'sepolia',
      chain_id: 11155111,
      campaign_id: campaignId,
      offer_id: offerId,
      terms_hash: termsHash,
      terms_canonical_json: termsCanonicalJson,
      lock_expected_token: DEFAULT_SEPOLIA_USDT_CONTRACT,
      lock_expected_amount_usdt_6: Math.round(amountUsd * 1_000_000),
      lock_tx_hash: null,
      lock_tx_status: 'pending',
      proof: {
        offer_id: offerId,
        terms_hash: termsHash,
        lock_tx_hash: null,
      },
    };
  }

  return resultJson;
}

function detectLanguageGeoProfile(text) {
  const sample = String(text || '');

  const counts = {
    cyr: (sample.match(/[\u0400-\u04FF]/g) || []).length,
    jpKana: (sample.match(/[\u3040-\u30FF\u31F0-\u31FF]/g) || []).length,
    han: (sample.match(/[\u4E00-\u9FFF]/g) || []).length,
    hangul: (sample.match(/[\uAC00-\uD7AF]/g) || []).length,
    arabic: (sample.match(/[\u0600-\u06FF]/g) || []).length,
    devanagari: (sample.match(/[\u0900-\u097F]/g) || []).length,
    thai: (sample.match(/[\u0E00-\u0E7F]/g) || []).length,
    latin: (sample.match(/[A-Za-zÀ-ÿ]/g) || []).length,
  };

  // Script-first detection
  if (counts.jpKana > 20) return { lang: 'ja', geos: ['Japan'] };
  if (counts.hangul > 20) return { lang: 'ko', geos: ['South Korea'] };
  if (counts.han > 30 && counts.jpKana < 8) return { lang: 'zh', geos: ['China', 'Taiwan', 'Hong Kong', 'Singapore'] };
  if (counts.cyr > 20) return { lang: 'ru', geos: ['Russia', 'Kazakhstan', 'Belarus', 'CIS'] };
  if (counts.arabic > 20) return { lang: 'ar', geos: ['Saudi Arabia', 'UAE', 'Egypt', 'Morocco'] };
  if (counts.devanagari > 20) return { lang: 'hi', geos: ['India', 'Nepal'] };
  if (counts.thai > 20) return { lang: 'th', geos: ['Thailand'] };

  // Lightweight Latin-language hints
  const t = sample.toLowerCase();
  const has = (arr) => arr.some((w) => t.includes(w));

  if (has([' el ', ' la ', ' de ', ' que ', ' y ', ' en ', ' una ', 'pero ', 'está', '¿'])) {
    return { lang: 'es', geos: ['Mexico', 'Spain', 'Argentina', 'Colombia', 'Chile'] };
  }
  if (has([' não ', ' você', ' para ', ' com ', ' uma ', 'ção', 'ã', 'õ'])) {
    return { lang: 'pt', geos: ['Brazil', 'Portugal'] };
  }
  if (has([' le ', ' la ', ' les ', ' des ', ' est ', ' une ', ' avec ', 'être'])) {
    return { lang: 'fr', geos: ['France', 'Belgium', 'Canada (QC)', 'Switzerland'] };
  }
  if (has([' der ', ' die ', ' das ', ' und ', ' nicht ', ' ist ', 'ein '])) {
    return { lang: 'de', geos: ['Germany', 'Austria', 'Switzerland'] };
  }
  if (has([' the ', ' and ', ' is ', ' are ', ' with ', ' you '])) {
    return { lang: 'en', geos: ['United States', 'United Kingdom', 'Canada', 'Australia'] };
  }

  return { lang: 'unknown', geos: [] };
}

function enforceAudienceGeographyByLanguage(resultJson, storyText) {
  if (!resultJson || typeof resultJson !== 'object') return resultJson;
  if (!resultJson.predicted_demographics || typeof resultJson.predicted_demographics !== 'object') return resultJson;

  const profile = detectLanguageGeoProfile(storyText);
  const pd = resultJson.predicted_demographics;
  const current = Array.isArray(pd.primary_geography) ? pd.primary_geography : [];

  if (profile.geos.length > 0) {
    const preferred = profile.geos;
    const merged = [
      ...preferred,
      ...current.filter((x) => !preferred.map((g) => g.toLowerCase()).includes(String(x || '').toLowerCase())),
    ];
    pd.primary_geography = merged.slice(0, 5);
  }

  return resultJson;
}

function enforceCoreAgeGroupByEvidence(resultJson, storyText) {
  if (!resultJson || typeof resultJson !== 'object') return resultJson;
  if (!resultJson.predicted_demographics || typeof resultJson.predicted_demographics !== 'object') return resultJson;

  const pd = resultJson.predicted_demographics;
  const rating = String(resultJson?.business_insights?.age_rating_us || '').toUpperCase();
  const text = String(storyText || '').toLowerCase();
  const current = String(pd.core_age_group || '').trim();

  const teenSignals = ['school', 'high school', 'academy', 'teen', 'first love', 'coming of age', 'student', 'campus'];
  const matureSignals = ['marriage', 'divorce', 'parent', 'childcare', 'career', 'office', 'corporate', 'politics', 'war trauma', 'middle age'];

  const hasTeen = teenSignals.some((k) => text.includes(k));
  const hasMature = matureSignals.some((k) => text.includes(k));

  let inferred = current || '18-34';

  if (rating === 'G' || rating === 'PG') {
    inferred = hasTeen ? '13-17' : '13-24';
  } else if (rating === 'PG-13') {
    if (hasTeen) inferred = '15-24';
    else if (hasMature) inferred = '25-44';
    else inferred = '18-34';
  } else if (rating === 'R' || rating === 'NC-17') {
    inferred = hasMature ? '25-44' : '21-44';
  }

  // Break blind 18-34 default when mature evidence is obvious
  if (current === '18-34' && hasMature) inferred = '25-44';

  pd.core_age_group = inferred;
  return resultJson;
}

function deriveFallbackStoryTitle(storyText) {
  const lines = String(storyText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 40);

  for (const line of lines) {
    const m = line.match(/^(?:title|story\s*title)\s*[:\-]\s*(.+)$/i);
    if (m && m[1]) {
      const t = m[1].trim().replace(/^['"“”‘’]+|['"“”‘’]+$/g, '');
      if (t) return t.slice(0, 120);
    }
  }

  for (const line of lines) {
    if (line.length >= 3 && line.length <= 120 && !/[.!?]$/.test(line)) {
      return line.replace(/^#+\s*/, '').trim();
    }
  }

  return 'Untitled Story';
}

function applyStoryResultFallbacks(resultJson, storyText) {
  if (!resultJson || typeof resultJson !== 'object') return resultJson;

  const mkScore = (reasoning) => ({ score: 40, reasoning });

  if (typeof resultJson.story_title !== 'string' || !resultJson.story_title.trim()) {
    resultJson.story_title = deriveFallbackStoryTitle(storyText);
    resultJson._fallback_story_title = true;
  }

  if (typeof resultJson.author !== 'string' || !resultJson.author.trim()) {
    resultJson.author = 'John Doe';
    resultJson._fallback_author = true;
  }

  if (typeof resultJson.generated_synopsis !== 'string' || !resultJson.generated_synopsis.trim()) {
    const text = String(storyText || '').replace(/\s+/g, ' ').trim();
    const clipped = text.slice(0, 420);
    const sentenceChunks = clipped
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    let synopsis = sentenceChunks.join(' ');
    if (!synopsis) {
      synopsis = clipped || 'A protagonist faces escalating conflict that creates clear serialized and monetizable story momentum.';
    }

    if (synopsis.length < 40) {
      synopsis = `${synopsis} The central conflict escalates and creates a clear hook for continued chapters.`.trim();
    }

    resultJson.generated_synopsis = synopsis.slice(0, 700);
    resultJson._fallback_generated_synopsis = true;
  }

  if (!resultJson.tsi_evaluation || typeof resultJson.tsi_evaluation !== 'object') {
    resultJson.tsi_evaluation = {};
    resultJson._fallback_tsi = true;
  }
  if (!resultJson.tei_evaluation || typeof resultJson.tei_evaluation !== 'object') {
    resultJson.tei_evaluation = {};
    resultJson._fallback_tei = true;
  }

  resultJson.tsi_evaluation.CMA = resultJson.tsi_evaluation.CMA || mkScore('Fallback score: concept signal unavailable from model output, requires manual review.');
  resultJson.tsi_evaluation.IER = resultJson.tsi_evaluation.IER || mkScore('Fallback score: IP identity signal unavailable from model output, requires manual review.');
  resultJson.tsi_evaluation.PSP = resultJson.tsi_evaluation.PSP || mkScore('Fallback score: parasocial signal unavailable from model output, requires manual review.');

  resultJson.tei_evaluation.VRS = resultJson.tei_evaluation.VRS || mkScore('Fallback score: virality signal unavailable from model output, requires manual review.');
  resultJson.tei_evaluation.ACV = resultJson.tei_evaluation.ACV || mkScore('Fallback score: activation signal unavailable from model output, requires manual review.');
  resultJson.tei_evaluation.HTR = resultJson.tei_evaluation.HTR || mkScore('Fallback score: hook throughput signal unavailable from model output, requires manual review.');
  resultJson.tei_evaluation.PEL = resultJson.tei_evaluation.PEL || mkScore('Fallback score: paywall elasticity signal unavailable from model output, requires manual review.');
  resultJson.tei_evaluation.SMR = resultJson.tei_evaluation.SMR || mkScore('Fallback score: serial modularity signal unavailable from model output, requires manual review.');
  resultJson.tei_evaluation.TWS = resultJson.tei_evaluation.TWS || mkScore('Fallback score: twistability signal unavailable from model output, requires manual review.');

  if (!resultJson.predicted_demographics || typeof resultJson.predicted_demographics !== 'object') {
    resultJson.predicted_demographics = {
      primary_geography: ['Global'],
      gender_split: 'Mixed',
      core_age_group: '18-34',
      wtp_proxy: 'Medium',
      cac_proxy: 'Medium',
    };
    resultJson._fallback_demographics = true;
  }

  if (!resultJson.business_insights || typeof resultJson.business_insights !== 'object') {
    resultJson.business_insights = {};
    resultJson._fallback_business_insights = true;
  }

  resultJson.business_insights.ip_copyright_status = resultJson.business_insights.ip_copyright_status || {
    is_original_ip: true,
    monetization_approved: true,
    warning: null,
  };
  resultJson.business_insights.age_rating_us = resultJson.business_insights.age_rating_us || 'PG-13';
  resultJson.business_insights.sterling_verdict = resultJson.business_insights.sterling_verdict || 'Fallback verdict: insufficient structured model output; commercial potential cannot be reliably assessed without rerun.';
  resultJson.business_insights.target_audience_tags = Array.isArray(resultJson.business_insights.target_audience_tags)
    ? resultJson.business_insights.target_audience_tags
    : ['interactive fiction'];
  resultJson.business_insights.virality_surface = resultJson.business_insights.virality_surface || 'Quote posts';
  resultJson.business_insights.unit_economics_forecast = resultJson.business_insights.unit_economics_forecast || {
    estimated_cac_usd: 'Unknown',
    estimated_ltv_potential: 'Medium',
    retention_driver: 'Cliffhanger continuity',
  };
  resultJson.business_insights.monetization_hook = resultJson.business_insights.monetization_hook || 'Fallback: place a premium choice before a major reveal.';
  resultJson.business_insights.pivot_opportunity = resultJson.business_insights.pivot_opportunity || 'Fallback: strengthen chapter-end choices and branch depth for Twisly format.';

  if (!resultJson.constraint_cloud || typeof resultJson.constraint_cloud !== 'object') {
    resultJson.constraint_cloud = {
      story_engine: {
        label: 'Core emotional pull',
        explanation: 'The story has identifiable emotional momentum that can keep readers engaged across chapters.',
      },
      main_constraint: {
        label: 'Missing structured signal',
        explanation: 'The analysis output lacked full structured fields, so ceiling/risk is not yet measured reliably.',
      },
      creative_tension: {
        goal: 'Increase commercial clarity without losing current reader pull',
        need_a: 'Keep the strongest emotional thread intact',
        need_b: 'Add explicit hooks and branch-ready decisions',
        conflict: 'Without structured hooks, growth and monetization remain uncertain even if emotion is working.',
      },
      hidden_assumption: {
        statement: 'Emotional impact alone is enough to guarantee monetizable retention.',
      },
      injection: {
        label: 'Hook before choice',
        explanation: 'Keep the same emotional engine, but add clear decision points at chapter-end reveals to improve retention and paywall elasticity.',
      },
      best_next_move: {
        label: 'Rerun with full schema',
        explanation: 'Re-run analysis to recover full metric blocks, then refine 3-5 highest-impact branch points for monetization.',
      },
    };
    resultJson._fallback_constraint_cloud = true;
  }

  return resultJson;
}

function buildAnalyzeStoryMessage({ taskId, storyText }) {
  const template = loadPromptTemplate('analyze-story.prompt.md');
  return renderPromptTemplate(template, {
    TASK_ID: taskId,
    STORY_TEXT: storyText,
  });
}

function buildSyndicateReviewMessage({ taskId, storyText, dossier, prepared, walletSnapshots }) {
  const investors = prepared.investors
    .map((inv) => {
      const snap = walletSnapshots.find((s) => s.agent_id === inv.profile.id);
      return {
        id: inv.profile.id,
        agent_name: inv.profile.agent_name,
        profile_prompt: inv.profile.profile_prompt,
        wallet_address: snap?.address || inv.wallet?.address || null,
        usdt_balance: snap?.usdt_balance ?? 0,
        max_offer_usd_by_rule: snap?.max_offer_usd_by_rule ?? 0,
      };
    });

  const template = loadPromptTemplate('syndicate-review.prompt.md');
  return renderPromptTemplate(template, {
    TASK_ID: taskId,
    STORY_TEXT: storyText,
    DOSSIER_JSON: JSON.stringify(dossier, null, 2),
    INVESTORS_JSON: JSON.stringify(investors, null, 2),
  }).trim();
}

function validateStoryEvaluationJson(data) {
  const allowedScores = new Set([10, 30, 40, 55, 70, 85, 95]);
  const allowedRatings = new Set(['G', 'PG', 'PG-13', 'R', 'NC-17']);

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Result is not a JSON object');
  }

  if (!data.story_title || typeof data.story_title !== 'string') {
    throw new Error('Missing or invalid story_title');
  }

  if (!data.author || typeof data.author !== 'string') {
    throw new Error('Missing or invalid author');
  }

  if (!data.generated_synopsis || typeof data.generated_synopsis !== 'string') {
    throw new Error('Missing or invalid generated_synopsis');
  }

  const tsi = data.tsi_evaluation;
  const tei = data.tei_evaluation;
  const demo = data.predicted_demographics;
  const bi = data.business_insights;

  if (!tsi || typeof tsi !== 'object') throw new Error('Missing tsi_evaluation');
  if (!tei || typeof tei !== 'object') throw new Error('Missing tei_evaluation');
  if (!demo || typeof demo !== 'object') throw new Error('Missing predicted_demographics');
  if (!bi || typeof bi !== 'object') throw new Error('Missing business_insights');

  const scoreBlocks = [
    tsi.CMA, tsi.IER, tsi.PSP,
    tei.VRS, tei.ACV, tei.HTR, tei.PEL, tei.SMR, tei.TWS,
  ];

  for (const block of scoreBlocks) {
    if (!block || typeof block !== 'object') throw new Error('Missing score block');
    if (typeof block.reasoning !== 'string' || !block.reasoning.trim()) {
      throw new Error('Missing reasoning in score block');
    }
    if (!allowedScores.has(block.score)) {
      throw new Error(`Invalid score value: ${block.score}`);
    }
  }

  if (!Array.isArray(demo.primary_geography)) throw new Error('predicted_demographics.primary_geography must be an array');
  if (typeof demo.gender_split !== 'string') throw new Error('predicted_demographics.gender_split must be a string');
  if (typeof demo.core_age_group !== 'string') throw new Error('predicted_demographics.core_age_group must be a string');
  if (typeof demo.wtp_proxy !== 'string') throw new Error('predicted_demographics.wtp_proxy must be a string');
  if (typeof demo.cac_proxy !== 'string') throw new Error('predicted_demographics.cac_proxy must be a string');
  if (!bi.ip_copyright_status || typeof bi.ip_copyright_status !== 'object') throw new Error('Missing ip_copyright_status');
  if (!allowedRatings.has(bi.age_rating_us)) throw new Error(`Invalid age_rating_us: ${bi.age_rating_us}`);
  if (typeof bi.sterling_verdict !== 'string' || !bi.sterling_verdict.trim()) throw new Error('Missing sterling_verdict');
  if (!Array.isArray(bi.target_audience_tags)) throw new Error('target_audience_tags must be an array');
  if (typeof bi.virality_surface !== 'string') throw new Error('virality_surface must be a string');
  if (!bi.unit_economics_forecast || typeof bi.unit_economics_forecast !== 'object') throw new Error('Missing unit_economics_forecast');
  if (typeof bi.monetization_hook !== 'string') throw new Error('Missing monetization_hook');
  if (typeof bi.pivot_opportunity !== 'string') throw new Error('Missing pivot_opportunity');

  const cloud = data.constraint_cloud;
  if (!cloud || typeof cloud !== 'object') throw new Error('Missing constraint_cloud');
  if (!cloud.story_engine || typeof cloud.story_engine !== 'object') throw new Error('Missing constraint_cloud.story_engine');
  if (typeof cloud.story_engine.label !== 'string' || !cloud.story_engine.label.trim()) throw new Error('Missing constraint_cloud.story_engine.label');
  if (typeof cloud.story_engine.explanation !== 'string' || !cloud.story_engine.explanation.trim()) throw new Error('Missing constraint_cloud.story_engine.explanation');

  if (!cloud.main_constraint || typeof cloud.main_constraint !== 'object') throw new Error('Missing constraint_cloud.main_constraint');
  if (typeof cloud.main_constraint.label !== 'string' || !cloud.main_constraint.label.trim()) throw new Error('Missing constraint_cloud.main_constraint.label');
  if (typeof cloud.main_constraint.explanation !== 'string' || !cloud.main_constraint.explanation.trim()) throw new Error('Missing constraint_cloud.main_constraint.explanation');

  if (!cloud.creative_tension || typeof cloud.creative_tension !== 'object') throw new Error('Missing constraint_cloud.creative_tension');
  if (typeof cloud.creative_tension.goal !== 'string' || !cloud.creative_tension.goal.trim()) throw new Error('Missing constraint_cloud.creative_tension.goal');
  if (typeof cloud.creative_tension.need_a !== 'string' || !cloud.creative_tension.need_a.trim()) throw new Error('Missing constraint_cloud.creative_tension.need_a');
  if (typeof cloud.creative_tension.need_b !== 'string' || !cloud.creative_tension.need_b.trim()) throw new Error('Missing constraint_cloud.creative_tension.need_b');
  if (typeof cloud.creative_tension.conflict !== 'string' || !cloud.creative_tension.conflict.trim()) throw new Error('Missing constraint_cloud.creative_tension.conflict');

  if (!cloud.hidden_assumption || typeof cloud.hidden_assumption !== 'object') throw new Error('Missing constraint_cloud.hidden_assumption');
  if (typeof cloud.hidden_assumption.statement !== 'string' || !cloud.hidden_assumption.statement.trim()) throw new Error('Missing constraint_cloud.hidden_assumption.statement');

  if (!cloud.injection || typeof cloud.injection !== 'object') throw new Error('Missing constraint_cloud.injection');
  if (typeof cloud.injection.label !== 'string' || !cloud.injection.label.trim()) throw new Error('Missing constraint_cloud.injection.label');
  if (typeof cloud.injection.explanation !== 'string' || !cloud.injection.explanation.trim()) throw new Error('Missing constraint_cloud.injection.explanation');

  if (!cloud.best_next_move || typeof cloud.best_next_move !== 'object') throw new Error('Missing constraint_cloud.best_next_move');
  if (typeof cloud.best_next_move.label !== 'string' || !cloud.best_next_move.label.trim()) throw new Error('Missing constraint_cloud.best_next_move.label');
  if (typeof cloud.best_next_move.explanation !== 'string' || !cloud.best_next_move.explanation.trim()) throw new Error('Missing constraint_cloud.best_next_move.explanation');

  return true;
}

function validateSyndicateReviewJson(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Syndicate result is not a JSON object');
  if (typeof data.story_title !== 'string' || !data.story_title.trim()) throw new Error('Missing story_title in syndicate result');
  if (!Array.isArray(data.investor_outputs) || data.investor_outputs.length !== 6) throw new Error('investor_outputs must contain 6 investors');
  if (!data.sterling_verdict || typeof data.sterling_verdict !== 'object') throw new Error('Missing sterling_verdict');
  if (!data.feed || typeof data.feed !== 'object' || !Array.isArray(data.feed.feed_messages)) throw new Error('Missing feed.feed_messages');
  if (data.feed.feed_messages.length < 12) throw new Error('feed.feed_messages must contain at least 12 messages for reality-show dialogue');

  let offersCount = 0;
  for (const investor of data.investor_outputs) {
    if (!investor.agent_name || typeof investor.agent_name !== 'string') throw new Error('Investor missing agent_name');
    if (!investor.wallet_address || typeof investor.wallet_address !== 'string') throw new Error(`Investor ${investor.agent_name} missing wallet_address`);
    if (typeof investor.wallet_balance_usdt !== 'number' || investor.wallet_balance_usdt < 0) throw new Error(`Investor ${investor.agent_name} invalid wallet_balance_usdt`);
    if (!['strong_fit', 'conditional_fit', 'weak_fit', 'no_fit'].includes(investor.fit_assessment)) throw new Error('Invalid fit_assessment');
    if (!['pass', 'reject', 'accept', 'counter'].includes(investor.decision)) throw new Error('Invalid investor decision');
    if (!Number.isInteger(investor.investment_conviction) || investor.investment_conviction < 0 || investor.investment_conviction > 100) throw new Error('Invalid investment_conviction');
    if (!investor.offer || typeof investor.offer !== 'object') throw new Error('Missing investor offer');

    const amount = Number(investor.offer.amount_usd || 0);
    const equity = Number(investor.offer.equity_pct || 0);
    if (amount > 0) {
      offersCount += 1;
      if (!['counter', 'accept'].includes(investor.decision)) {
        throw new Error(`Investor ${investor.agent_name} has offer>0 but decision=${investor.decision}`);
      }
      if (amount < 100 || amount > 3000) throw new Error(`Offer amount out of range for ${investor.agent_name}`);
      if (equity < 5 || equity > 30) throw new Error(`Offer equity out of range for ${investor.agent_name}`);
      if (amount > investor.wallet_balance_usdt) throw new Error(`Offer exceeds wallet balance for ${investor.agent_name}`);
      if (amount > investor.wallet_balance_usdt * 0.2) throw new Error(`Offer exceeds 20% treasury rule for ${investor.agent_name}`);
      const budgetSum = Number(investor.offer.ad_spend_pct || 0) + Number(investor.offer.influencer_pct || 0) + Number(investor.offer.quality_improvement_pct || 0);
      if (budgetSum !== 100) throw new Error(`Budget allocation must sum to 100 for ${investor.agent_name}`);

      const pt = investor.offer.pricing_terms || {};
      const cp = investor.offer.content_plan_terms || {};
      if (!Number.isFinite(Number(pt.base_story_price_usd)) || Number(pt.base_story_price_usd) <= 0) throw new Error(`Missing pricing_terms.base_story_price_usd for ${investor.agent_name}`);
      if (!Number.isFinite(Number(pt.paid_choices_per_chapter)) || Number(pt.paid_choices_per_chapter) < 0) throw new Error(`Missing pricing_terms.paid_choices_per_chapter for ${investor.agent_name}`);
      if (!Number.isFinite(Number(pt.price_per_paid_choice_usd)) || Number(pt.price_per_paid_choice_usd) < 0) throw new Error(`Missing pricing_terms.price_per_paid_choice_usd for ${investor.agent_name}`);
      if (!Number.isFinite(Number(pt.premium_route_unlock_usd)) || Number(pt.premium_route_unlock_usd) < 0) throw new Error(`Missing pricing_terms.premium_route_unlock_usd for ${investor.agent_name}`);
      if (!Number.isFinite(Number(pt.bundle_price_usd)) || Number(pt.bundle_price_usd) < 0) throw new Error(`Missing pricing_terms.bundle_price_usd for ${investor.agent_name}`);
      if (typeof cp.choice_density_target !== 'string' || !cp.choice_density_target.trim()) throw new Error(`Missing content_plan_terms.choice_density_target for ${investor.agent_name}`);
      if (typeof cp.paywall_placement_rule !== 'string' || !cp.paywall_placement_rule.trim()) throw new Error(`Missing content_plan_terms.paywall_placement_rule for ${investor.agent_name}`);
      if (!Number.isFinite(Number(cp.target_chapters)) || Number(cp.target_chapters) <= 0) throw new Error(`Missing content_plan_terms.target_chapters for ${investor.agent_name}`);
      if (!Number.isFinite(Number(cp.max_hard_paywalls_per_session)) || Number(cp.max_hard_paywalls_per_session) < 0) throw new Error(`Missing content_plan_terms.max_hard_paywalls_per_session for ${investor.agent_name}`);
    }
  }

  const knownAgents = ['Agent_X9', 'Crypto_Bunny', 'Barnaby', 'Safe_Paws', 'Diamond_Hands', 'Laser_Eyes_99'];
  const feedAgentLines = data.feed.feed_messages.filter((m) => m && m.type === 'agent' && typeof m.content === 'string');
  const crossTalkCount = feedAgentLines.filter((m) => knownAgents.some((name) => m.content.includes(name) && name !== m.speaker)).length;

  if (crossTalkCount < 4) {
    throw new Error(`feed cross-talk too weak: expected >=4 direct agent references, got ${crossTalkCount}`);
  }

  if (offersCount < 1) throw new Error('At least one investor must make an offer');
  if (!['accept', 'reject', 'renegotiate', 'wait'].includes(data.sterling_verdict.recommended_action)) throw new Error('Invalid sterling recommended_action');
  return true;
}

function buildAnalyzeVerificationReport(data) {
  const checks = [];
  const allowedScores = new Set([10, 30, 40, 55, 70, 85, 95]);
  const scorePaths = [
    ['tsi_evaluation', 'CMA', 'score'],
    ['tsi_evaluation', 'IER', 'score'],
    ['tsi_evaluation', 'PSP', 'score'],
    ['tei_evaluation', 'VRS', 'score'],
    ['tei_evaluation', 'ACV', 'score'],
    ['tei_evaluation', 'HTR', 'score'],
    ['tei_evaluation', 'PEL', 'score'],
    ['tei_evaluation', 'SMR', 'score'],
    ['tei_evaluation', 'TWS', 'score'],
  ];

  for (const path of scorePaths) {
    const value = path.reduce((acc, key) => (acc ? acc[key] : undefined), data);
    const ok = allowedScores.has(value);
    checks.push({ id: `score.${path.join('.')}`, ok, value });
  }

  const passed = checks.filter((c) => c.ok).length;
  const total = checks.length;
  return {
    mode: 'strict',
    task_type: 'analyze_story',
    checks,
    passed_checks: passed,
    total_checks: total,
    trust_score: total > 0 ? Math.round((passed / total) * 100) : 0,
  };
}

function buildSyndicateVerificationReport(data) {
  const checks = [];
  const investors = Array.isArray(data?.investor_outputs) ? data.investor_outputs : [];

  for (const investor of investors) {
    const amount = Number(investor?.offer?.amount_usd || 0);
    const equity = Number(investor?.offer?.equity_pct || 0);
    const balance = Number(investor?.wallet_balance_usdt || 0);
    const budgetSum = Number(investor?.offer?.ad_spend_pct || 0) + Number(investor?.offer?.influencer_pct || 0) + Number(investor?.offer?.quality_improvement_pct || 0);

    if (amount > 0) {
      checks.push({ id: `${investor.agent_name}.amount_in_range`, ok: amount >= 100 && amount <= 3000, value: amount });
      checks.push({ id: `${investor.agent_name}.equity_in_range`, ok: equity >= 5 && equity <= 30, value: equity });
      checks.push({ id: `${investor.agent_name}.amount_le_balance`, ok: amount <= balance, value: { amount, balance } });
      checks.push({ id: `${investor.agent_name}.amount_le_treasury20`, ok: amount <= balance * 0.2, value: { amount, max: Number((balance * 0.2).toFixed(4)) } });
      checks.push({ id: `${investor.agent_name}.budget_100`, ok: budgetSum === 100, value: budgetSum });
    }
  }

  const passed = checks.filter((c) => c.ok).length;
  const total = checks.length;
  return {
    mode: 'strict',
    task_type: 'syndicate_review',
    checks,
    passed_checks: passed,
    total_checks: total,
    trust_score: total > 0 ? Math.round((passed / total) * 100) : 100,
  };
}

function buildMarketingVerificationReport({ contractTerms = {}, channelTransfers = [], perf = null, revenueMock = null }) {
  const checks = [];

  const totalAmount = Number(contractTerms.amount_usd || 0);
  const adPct = Number(contractTerms.ad_spend_pct || 0);
  const infPct = Number(contractTerms.influencer_pct || 0);
  const qualPct = Number(contractTerms.quality_improvement_pct || 0);
  const pctSum = adPct + infPct + qualPct;

  checks.push({ id: 'contract.budget_pct_sum_100', ok: pctSum === 100, value: pctSum });

  const allocated = (channelTransfers || []).reduce((acc, ch) => acc + Number(ch?.allocated_amount_usd || 0), 0);
  checks.push({ id: 'channels.allocated_equals_total_amount', ok: Math.abs(allocated - totalAmount) < 0.01, value: { allocated: Number(allocated.toFixed(4)), totalAmount } });

  const spendFromPerf = Number(perf?.summary?.spend_usd || 0);
  checks.push({ id: 'performance.spend_matches_allocated', ok: Math.abs(spendFromPerf - allocated) < 0.01, value: { spend_usd: spendFromPerf, allocated_usd: Number(allocated.toFixed(4)) } });

  for (const ch of (channelTransfers || [])) {
    const amount = Number(ch?.allocated_amount_usd || 0);
    const hasTx = typeof ch?.tx_hash === 'string' && ch.tx_hash.trim().length > 0;
    checks.push({
      id: `channel.${ch.channel_id}.tx_present_if_amount_gt_0`,
      ok: amount <= 0 ? true : hasTx,
      value: { amount_usd: amount, tx_hash: ch?.tx_hash || null },
    });
  }

  const projectedRevenue = Number(revenueMock?.revenue_breakdown_usd?.total || 0);
  checks.push({ id: 'revenue.projected_non_negative', ok: projectedRevenue >= 0, value: projectedRevenue });

  const passed = checks.filter((c) => c.ok).length;
  const total = checks.length;
  return {
    mode: 'strict',
    task_type: 'marketing_execution',
    checks,
    passed_checks: passed,
    total_checks: total,
    trust_score: total > 0 ? Math.round((passed / total) * 100) : 0,
  };
}

function computeBestOfferByEfficiency(investorOutputs = []) {
  const offers = (investorOutputs || [])
    .filter((inv) => Number(inv?.offer?.amount_usd || 0) > 0 && Number(inv?.offer?.equity_pct || 0) > 0)
    .map((inv) => {
      const amount = Number(inv.offer.amount_usd || 0);
      const equity = Number(inv.offer.equity_pct || 0);
      const amountPerEquity = amount / equity;
      return { inv, amount, equity, amountPerEquity };
    })
    .sort((a, b) => {
      if (b.amountPerEquity !== a.amountPerEquity) return b.amountPerEquity - a.amountPerEquity;
      if (b.amount !== a.amount) return b.amount - a.amount;
      return a.equity - b.equity;
    });

  return offers[0] || null;
}

function attachUiSignalsAndStructuredEvents(data) {
  if (!data?.feed || !Array.isArray(data.feed.feed_messages)) return data;

  const best = computeBestOfferByEfficiency(data.investor_outputs || []);
  const verdicts = (data.investor_outputs || []).map((inv) => ({
    agent_name: inv.agent_name,
    decision: inv.decision,
    amount_usd: Number(inv?.offer?.amount_usd || 0),
    equity_pct: Number(inv?.offer?.equity_pct || 0),
  }));

  data.ui_signals = {
    best_offer: best ? {
      agent_name: best.inv.agent_name,
      decision: best.inv.decision,
      amount_usd: best.amount,
      equity_pct: best.equity,
      ratio_usd_per_equity: Number(best.amountPerEquity.toFixed(4)),
    } : null,
    investor_verdicts: verdicts,
  };

  const messages = data.feed.feed_messages;

  // Deduplicate old structured events to avoid double BEST_OFFER / duplicate verdict spam.
  const filtered = messages.filter((m) => {
    const ev = m?.event_payload?.event;
    return ev !== 'INVESTOR_VERDICT' && ev !== 'BEST_OFFER';
  });
  messages.length = 0;
  messages.push(...filtered);

  for (const v of verdicts) {
    messages.push({
      type: 'deal_event',
      speaker: 'SYSTEM',
      content: JSON.stringify({ event: 'INVESTOR_VERDICT', ...v }),
      event_payload: { event: 'INVESTOR_VERDICT', ...v },
    });
  }

  if (best) {
    messages.push({
      type: 'deal_event',
      speaker: 'SYSTEM',
      content: JSON.stringify({
        event: 'BEST_OFFER',
        agent_name: best.inv.agent_name,
        decision: best.inv.decision,
        amount_usd: best.amount,
        equity_pct: best.equity,
        ratio_usd_per_equity: Number(best.amountPerEquity.toFixed(4)),
      }),
      event_payload: {
        event: 'BEST_OFFER',
        agent_name: best.inv.agent_name,
        decision: best.inv.decision,
        amount_usd: best.amount,
        equity_pct: best.equity,
        ratio_usd_per_equity: Number(best.amountPerEquity.toFixed(4)),
      },
    });
  }

  return data;
}

function enforceFinalSterlingMessage(data) {
  if (!data?.feed || !Array.isArray(data.feed.feed_messages)) return data;

  const best = computeBestOfferByEfficiency(data.investor_outputs || []);
  if (!best) return data;

  const content = `Best offer by money-to-equity efficiency: ${best.inv.agent_name} at $${best.amount} for ${best.equity}% (ratio ${best.amountPerEquity.toFixed(2)} $/%). My recommendation: use this as the lead anchor and negotiate protections.`;

  const messages = data.feed.feed_messages;

  // Keep at most one Sterling final verdict line.
  const nonSterling = messages.filter((m) => String(m?.speaker || '').toLowerCase() !== 'sterling');
  messages.length = 0;
  messages.push(...nonSterling);

  messages.push({
    type: 'sterling',
    speaker: 'sterling',
    content,
  });

  return data;
}

async function sendToAgent(message, debugLabel = 'openclaw-response') {
  const response = await fetch(OPENCLAW_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'agent:main',
      messages: [{ role: 'user', content: message }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  const data = await response.json();
  await writeDebugDump(debugLabel, 'api-response', JSON.stringify(data, null, 2));

  const content = data.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const textParts = content
      .filter((part) => part && (part.type === 'text' || part.type === 'output_text') && typeof part.text === 'string')
      .map((part) => part.text);
    if (textParts.length > 0) return textParts.join('\n');
  }

  throw new Error('No response from OpenClaw');
}

async function gatewayCall(method, params, debugLabel, suffix) {
  const { stdout, stderr } = await execFileAsync('openclaw', [
    'gateway',
    'call',
    method,
    '--json',
    '--timeout',
    '20000',
    '--params',
    JSON.stringify(params ?? {}),
  ], {
    cwd: __dirname,
    maxBuffer: 20 * 1024 * 1024,
  });

  await writeDebugDump(debugLabel, suffix, stdout || '');
  if (stderr) {
    await writeDebugDump(debugLabel, `${suffix}-stderr`, stderr);
  }

  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`Invalid JSON from gateway ${method} | stdout=${(stdout || '').slice(0, 1200)}`);
  }
}

async function sendToAgentViaCli(message, debugLabel = 'openclaw-cron-response') {
  const promptPath = await writeDebugDump(debugLabel, 'cron-prompt', message);
  if (!promptPath) {
    throw new Error('Failed to persist cron prompt to disk');
  }

  const shortMessage = [
    'Read the full task prompt from this file on disk:',
    promptPath,
    '',
    'Follow it exactly.',
    'Use real OpenClaw subagents as requested in the file.',
    'Return only the final JSON result.',
  ].join('\n');

  const runAt = new Date(Date.now() + 60_000).toISOString();
  const job = await gatewayCall('cron.add', {
    job: {
      name: `syndicate-review-${debugLabel}`,
      schedule: { kind: 'at', at: runAt },
      payload: {
        kind: 'agentTurn',
        message: shortMessage,
        timeoutSeconds: 600,
      },
      sessionTarget: 'isolated',
      delivery: { mode: 'none' },
      enabled: true,
    },
  }, debugLabel, 'cron-add');

  const jobId = job.jobId || job.id;
  if (!jobId) {
    throw new Error('cron.add did not return job id');
  }

  await gatewayCall('cron.run', { id: jobId, mode: 'force' }, debugLabel, 'cron-run');

  const deadline = Date.now() + 12 * 60 * 1000;
  let lastRuns = null;
  while (Date.now() < deadline) {
    lastRuns = await gatewayCall('cron.runs', { id: jobId }, debugLabel, 'cron-runs');
    const entries = lastRuns.entries || [];
    const finished = entries.find((entry) => entry.status === 'ok' || entry.status === 'error' || entry.status === 'failed');
    if (finished) {
      await writeDebugDump(debugLabel, 'cron-finished-entry', JSON.stringify(finished, null, 2));
      try {
        await gatewayCall('cron.remove', { id: jobId }, debugLabel, 'cron-remove');
      } catch {}
      if (finished.status !== 'ok') {
        throw new Error(`Isolated cron run failed with status=${finished.status}`);
      }
      if (typeof finished.summary === 'string' && finished.summary.trim()) {
        return finished.summary;
      }
      throw new Error('Isolated cron run finished without summary');
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  try {
    await gatewayCall('cron.remove', { id: jobId }, debugLabel, 'cron-remove-timeout', { retries: 4, retryDelayMs: 1000, timeoutMs: 20000 });
  } catch {}
  throw new Error(`Timed out waiting for isolated cron run | lastRuns=${JSON.stringify(lastRuns).slice(0, 1200)}`);
}

async function safeUpdateDoc(docRef, payload) {
  await updateDoc(docRef, payload);
}

const LOCAL_WALLET_REGISTRY_PATH = join(__dirname, 'data', 'wallet-registry.json');

async function loadWalletRegistry() {
  try {
    const raw = await fs.readFile(LOCAL_WALLET_REGISTRY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      author_wallets: parsed.author_wallets || {},
      channel_wallets: parsed.channel_wallets || {},
      buyer_wallets: parsed.buyer_wallets || {},
    };
  } catch {
    return { author_wallets: {}, channel_wallets: {}, buyer_wallets: {} };
  }
}

async function saveWalletRegistry(registry) {
  const dir = join(__dirname, 'data');
  if (!fsSync.existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(LOCAL_WALLET_REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf8');
}

async function topupWalletGasIfNeeded({ targetAddress, reason }) {
  if (!AUTO_GAS_TOPUP_ENABLED) return { skipped: true, reason: 'AUTO_GAS_TOPUP_ENABLED=false' };

  const attempts = [
    Number(GAS_TOPUP_AMOUNT_ETH),
    Number((GAS_TOPUP_AMOUNT_ETH / 2).toFixed(6)),
    Number((GAS_TOPUP_AMOUNT_ETH / 4).toFixed(6)),
    0.001,
  ].filter((v, i, arr) => Number.isFinite(v) && v > 0 && arr.indexOf(v) === i);

  let lastError = null;
  for (const amountEth of attempts) {
    const topup = await executeNativeTransferFromDerivation({
      fromDerivationIndex: GAS_DONOR_DERIVATION_INDEX,
      amountEth,
      recipientWallet: targetAddress,
    });

    if (topup.success) {
      return { ...topup, amountEth, attemptCount: attempts.indexOf(amountEth) + 1 };
    }

    lastError = topup.error || 'unknown error';
    if (!/insufficient funds|INSUFFICIENT_FUNDS|intrinsic transaction cost|overshot/i.test(String(lastError))) {
      break;
    }
  }

  throw new Error(`GAS_TOPUP_FAILED (${reason}) => ${lastError}`);
}

async function getOrCreateAuthorWallet(authorUid, config) {
  const registry = await loadWalletRegistry();
  if (registry.author_wallets[authorUid]) {
    return registry.author_wallets[authorUid];
  }

  const usedIndices = new Set(
    (config.wallets || [])
      .map((w) => Number(w.derivation_index))
      .filter((n) => Number.isFinite(n))
  );

  for (const w of Object.values(registry.author_wallets)) {
    const idx = Number(w?.derivation_index);
    if (Number.isFinite(idx)) usedIndices.add(idx);
  }
  for (const w of Object.values(registry.channel_wallets)) {
    const idx = Number(w?.derivation_index);
    if (Number.isFinite(idx)) usedIndices.add(idx);
  }
  for (const w of Object.values(registry.buyer_wallets || {})) {
    const idx = Number(w?.derivation_index);
    if (Number.isFinite(idx)) usedIndices.add(idx);
  }

  const nextIndex = Math.max(999, ...usedIndices) + 1;
  const address = await deriveWalletAddressByIndex(nextIndex);
  const wallet = {
    author_uid: authorUid,
    wallet_id: `wallet_sterling_${authorUid.slice(0, 8)}`,
    derivation_index: nextIndex,
    address,
    createdAt: new Date().toISOString(),
  };

  registry.author_wallets[authorUid] = wallet;
  await saveWalletRegistry(registry);
  await topupWalletGasIfNeeded({ targetAddress: wallet.address, reason: `author_wallet_created:${wallet.wallet_id}` });
  return wallet;
}

async function getOrCreateBuyerWallet(buyerUid, config) {
  const registry = await loadWalletRegistry();
  if (registry.buyer_wallets[buyerUid]) {
    return registry.buyer_wallets[buyerUid];
  }

  const usedIndices = new Set(
    (config.wallets || [])
      .map((w) => Number(w.derivation_index))
      .filter((n) => Number.isFinite(n))
  );

  for (const w of Object.values(registry.author_wallets || {})) {
    const idx = Number(w?.derivation_index);
    if (Number.isFinite(idx)) usedIndices.add(idx);
  }
  for (const w of Object.values(registry.channel_wallets || {})) {
    const idx = Number(w?.derivation_index);
    if (Number.isFinite(idx)) usedIndices.add(idx);
  }
  for (const w of Object.values(registry.buyer_wallets || {})) {
    const idx = Number(w?.derivation_index);
    if (Number.isFinite(idx)) usedIndices.add(idx);
  }

  const nextIndex = Math.max(2999, ...usedIndices) + 1;
  const address = await deriveWalletAddressByIndex(nextIndex);
  const wallet = {
    buyer_uid: buyerUid,
    wallet_id: `wallet_buyer_${buyerUid.slice(0, 8)}`,
    derivation_index: nextIndex,
    address,
    createdAt: new Date().toISOString(),
  };

  registry.buyer_wallets[buyerUid] = wallet;
  await saveWalletRegistry(registry);
  await topupWalletGasIfNeeded({ targetAddress: wallet.address, reason: `buyer_wallet_created:${wallet.wallet_id}` });
  return wallet;
}

function resolveBuyStoryNetworkConfig(payload = {}) {
  const requestedChainId = payload.chainId != null ? Number(payload.chainId) : null;
  const requestedNetworkRaw = String(payload.network || payload.chain || 'sepolia').trim().toLowerCase();

  const allowedSepoliaNames = new Set(['', 'sepolia', 'ethsepolia', 'ethereum-sepolia']);
  if (!allowedSepoliaNames.has(requestedNetworkRaw)) {
    throw new Error(`buy_story supports only Sepolia. Got network=${requestedNetworkRaw}`);
  }
  if (Number.isFinite(requestedChainId) && requestedChainId !== 11155111) {
    throw new Error(`buy_story supports only Sepolia chainId=11155111. Got chainId=${requestedChainId}`);
  }

  const base = BUY_STORY_NETWORKS.sepolia;
  const chainId = 11155111;
  const storyContract = payload.contractAddress || payload.contract_address || base.defaultStoryContract;
  const paymentToken = payload.paymentToken || payload.payment_token || payload.usdtContract || payload.usdt_contract || base.defaultPaymentToken;
  const rpcUrl = payload.rpcUrl || payload.rpc_url || base.rpcUrl;

  if (!storyContract) {
    throw new Error('Missing Sepolia story contract. Pass payload.contractAddress or set SEPOLIA_STORY_CONTRACT');
  }
  if (!paymentToken) {
    throw new Error('Missing Sepolia payment token. Pass payload.paymentToken or set SEPOLIA_USDT_CONTRACT');
  }

  return {
    network: 'sepolia',
    chainId,
    rpcUrl,
    explorerBaseUrl: base.explorerBaseUrl,
    storyContract,
    paymentToken,
    requestedNetwork: requestedNetworkRaw,
    requestedChainId,
  };
}

async function executeBuyStoryFromBuyerWallet({ buyerWallet, storyId, priceUsd, chainConfig }) {
  const { parseUnits, Interface } = await import('ethers');
  const walletManager = getWdkManagerForRpc(chainConfig.rpcUrl);

  const tokenId = /^\d+$/.test(String(storyId || '').trim()) ? BigInt(String(storyId).trim()) : null;
  if (tokenId === null) {
    return { success: false, error: `BUY_STORY_CALL_FAILED | storyId must be numeric for contract purchaseStory(uint256), got: ${storyId}` };
  }

  const amount = parseUnits(String(Number(priceUsd).toFixed(6)), 6);

  try {
    const account = await walletManager.getAccount(Number(buyerWallet.derivation_index));
    let useMcp = MONEY_BACKEND === 'wdk_mcp';

    let amountToApprove = amount;
    try {
      const storyDecoded = await evmReadCall({
        rpcUrl: chainConfig.rpcUrl,
        to: chainConfig.storyContract,
        abi: ['function stories(uint256) view returns (address author, bool isTwist, uint32 authorRoyalty, uint32 agentPercent, uint256 parentId, uint256 storyPrice, uint256 twistPrice, address agent)'],
        method: 'stories',
        args: [tokenId],
      });
      const storyData = storyDecoded?.[0] ?? null;
      const onchainPrice = BigInt(storyData?.storyPrice ?? 0);
      if (onchainPrice > amountToApprove) amountToApprove = onchainPrice;
    } catch {}

    let buyerUsdtBalance;
    if (useMcp) {
      const mcpBalance = await callWdkMcpToolSafe('getTokenBalanceByIndex', {
        derivationIndex: Number(buyerWallet.derivation_index),
        token: chainConfig.paymentToken,
      });
      if (!mcpBalance) useMcp = false;
      else buyerUsdtBalance = BigInt(mcpBalance?.balance || '0');
    }
    if (!useMcp) {
      buyerUsdtBalance = await account.getTokenBalance(chainConfig.paymentToken);
    }
    if (buyerUsdtBalance < amountToApprove) {
      return {
        success: false,
        error: `BUY_STORY_CALL_FAILED | insufficient USDT balance: have=${buyerUsdtBalance.toString()} need=${amountToApprove.toString()}`,
      };
    }

    const currentAllowance = useMcp
      ? BigInt((await callWdkMcpToolSafe('getAllowanceByIndex', {
        derivationIndex: Number(buyerWallet.derivation_index),
        token: chainConfig.paymentToken,
        spender: chainConfig.storyContract,
      }))?.allowance || '0')
      : await account.getAllowance(chainConfig.paymentToken, chainConfig.storyContract);
    let approveTxHash = null;
    if (currentAllowance < amountToApprove) {
      if (useMcp) {
        const approveTx = await callWdkMcpToolSafe('approveErc20ByIndex', {
          derivationIndex: Number(buyerWallet.derivation_index),
          token: chainConfig.paymentToken,
          spender: chainConfig.storyContract,
          amountAtomic: amountToApprove.toString(),
        });
        approveTxHash = approveTx?.hash || null;
      } else {
        const approveTx = await account.approve({
          token: chainConfig.paymentToken,
          spender: chainConfig.storyContract,
          amount: amountToApprove,
        });
        approveTxHash = approveTx.hash;
      }
    }

    const iface = new Interface(['function purchaseStory(uint256 tokenId)']);
    const data = iface.encodeFunctionData('purchaseStory', [tokenId]);

    let txHash = null;
    let receipt = null;

    if (useMcp) {
      const tx = await callWdkMcpToolSafe('sendContractTxByIndex', {
        derivationIndex: Number(buyerWallet.derivation_index),
        to: chainConfig.storyContract,
        data,
        valueWei: '0',
      });
      txHash = tx?.hash || null;
      if (txHash) {
        receipt = await callWdkMcpToolSafe('getTransactionReceipt', { hash: txHash });
      }
      if (!txHash || !receipt) {
        console.warn('⚠️ BUY_STORY MCP path failed, falling back to SDK path');
        useMcp = false;
      }
    }
    if (!useMcp) {
      const quote = await account.quoteSendTransaction({ to: chainConfig.storyContract, value: 0n, data });
      if (!quote?.fee || quote.fee <= 0n) {
        return { success: false, error: 'BUY_STORY_CALL_FAILED | invalid tx fee quote' };
      }
      const buyTx = await account.sendTransaction({ to: chainConfig.storyContract, value: 0n, data });
      txHash = buyTx.hash;
      receipt = await account.getTransactionReceipt(txHash);
    }

    if (!receipt || Number(receipt.status) !== 1) {
      return { success: false, error: `BUY_STORY_CALL_FAILED | tx reverted ${txHash}` };
    }

    const successPayload = {
      success: true,
      tx_hash: txHash,
      block_number: receipt?.blockNumber || null,
      explorer_url: `${chainConfig.explorerBaseUrl}${txHash}`,
      method_used: 'purchaseStory(uint256)',
      approve_tx_hash: approveTxHash,
      contract_address: chainConfig.storyContract,
      payment_token: chainConfig.paymentToken,
      approved_amount_atomic: amountToApprove.toString(),
    };

    await appendMoneyAudit({
      stage: 'buy_story',
      backend: MONEY_BACKEND,
      wallet: buyerWallet.address,
      story_id: String(storyId),
      amount_usd: Number(priceUsd),
      tx_hash: successPayload.tx_hash,
      approve_tx_hash: successPayload.approve_tx_hash || null,
      explorer_url: successPayload.explorer_url,
      status: 'confirmed',
    });

    return successPayload;
  } catch (e) {
    await appendMoneyAudit({
      stage: 'buy_story',
      backend: MONEY_BACKEND,
      wallet: buyerWallet.address,
      story_id: String(storyId),
      amount_usd: Number(priceUsd),
      status: 'failed',
      error: String(e.message || e),
    });
    return { success: false, error: `BUY_STORY_CALL_FAILED | ${e.message}` };
  } finally {
    walletManager.dispose();
  }
}

async function processBuyStoryTask(task, taskId, docRef) {
  const payload = task.payload || {};
  const storyId = payload.storyId || payload.story_id || null;
  const priceUsd = Number(payload.priceUsd ?? payload.price_usd);
  const inputContractAddress = payload.contractAddress || payload.contract_address || null;
  const buyerUid = task.buyerUid || payload.buyerUid || payload.buyer_uid || null;
  const authorUid = task.authorUid || payload.authorUid || payload.author_uid || null;
  const chainConfig = resolveBuyStoryNetworkConfig(payload);

  if (!buyerUid || typeof buyerUid !== 'string') throw new Error('buy_story missing buyerUid');
  if (!authorUid || typeof authorUid !== 'string') throw new Error('buy_story missing authorUid');
  if (!storyId) throw new Error('buy_story missing payload.storyId');
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error('buy_story missing valid payload.priceUsd > 0');

  const config = await loadSyndicateConfig();
  const buyerWallet = await getOrCreateBuyerWallet(buyerUid, config);

  const purchase = await executeBuyStoryFromBuyerWallet({
    buyerWallet,
    storyId,
    priceUsd,
    chainConfig,
  });

  if (!purchase.success) {
    throw new Error(`${purchase.error} | buyer_wallet=${buyerWallet.address}`);
  }

  await safeUpdateDoc(docRef, {
    status: 'completed',
    processorVersion: PROCESSOR_VERSION_BUY_STORY,
    validationPassed: true,
    result: {
      purchased: true,
      story_id: storyId,
      price_usd: priceUsd,
      network: chainConfig.network,
      chain_id: chainConfig.chainId,
      rpc_url_used: chainConfig.rpcUrl,
      contract_address: purchase.contract_address,
      contract_address_input: inputContractAddress || null,
      payment_token: purchase.payment_token,
      author_uid: authorUid,
      buyer_uid: buyerUid,
      buyer_wallet_id: buyerWallet.wallet_id,
      buyer_wallet_derivation_index: buyerWallet.derivation_index,
      buyer_wallet_address: buyerWallet.address,
      tx_hash: purchase.tx_hash,
      approve_tx_hash: purchase.approve_tx_hash || null,
      explorer_url: purchase.explorer_url,
      block_number: purchase.block_number,
      method_used: purchase.method_used,
      approved_amount_atomic: purchase.approved_amount_atomic || null,
    },
    completedAt: new Date().toISOString(),
  });

  console.log(`✅ buy_story completed: ${taskId} | buyer=${buyerUid} story=${storyId} tx=${purchase.tx_hash}`);
  return { rejected: false };
}

function splitAmount(totalUsd, parts) {
  const totalMicro = Math.round(Number(totalUsd) * 1_000_000);
  const totalWeight = parts.reduce((s, p) => s + Number(p.weight || 0), 0);
  let allocated = 0;
  const out = parts.map((p, i) => {
    if (i === parts.length - 1) {
      const micro = totalMicro - allocated;
      return { ...p, amount_usd: Number((micro / 1_000_000).toFixed(6)) };
    }
    const micro = Math.floor((totalMicro * Number(p.weight || 0)) / totalWeight);
    allocated += micro;
    return { ...p, amount_usd: Number((micro / 1_000_000).toFixed(6)) };
  });
  return out;
}

async function getOrCreateFixedChannelWallet(channelId, config) {
  const registry = await loadWalletRegistry();
  if (registry.channel_wallets[channelId]) {
    return registry.channel_wallets[channelId];
  }

  const usedIndices = new Set(
    (config.wallets || [])
      .map((w) => Number(w.derivation_index))
      .filter((n) => Number.isFinite(n))
  );

  for (const w of Object.values(registry.author_wallets)) {
    const idx = Number(w?.derivation_index);
    if (Number.isFinite(idx)) usedIndices.add(idx);
  }
  for (const w of Object.values(registry.channel_wallets)) {
    const idx = Number(w?.derivation_index);
    if (Number.isFinite(idx)) usedIndices.add(idx);
  }
  for (const w of Object.values(registry.buyer_wallets || {})) {
    const idx = Number(w?.derivation_index);
    if (Number.isFinite(idx)) usedIndices.add(idx);
  }

  const nextIndex = Math.max(1999, ...usedIndices) + 1;
  const address = await deriveWalletAddressByIndex(nextIndex);
  const wallet = {
    channel_id: channelId,
    wallet_id: `wallet_${channelId}`,
    derivation_index: nextIndex,
    address,
    createdAt: new Date().toISOString(),
  };

  registry.channel_wallets[channelId] = wallet;
  await saveWalletRegistry(registry);
  // Channel wallets are recipients in current flow; they don't need gas at creation time.
  return wallet;
}

function buildChannelPlanFromStory(dossier, contractTerms) {
  const surfaces = String(dossier?.business_insights?.virality_surface || '').toLowerCase();
  const tags = (dossier?.business_insights?.target_audience_tags || []).join(' ').toLowerCase();

  const adBase = [
    { channel_id: 'tiktok_ads', lane: 'ad', platform: 'TikTok Ads', weight: 35 },
    { channel_id: 'meta_ads', lane: 'ad', platform: 'Meta Ads', weight: 30 },
    { channel_id: 'reddit_ads', lane: 'ad', platform: 'Reddit Ads', weight: 20 },
    { channel_id: 'x_ads', lane: 'ad', platform: 'X Ads', weight: 15 },
  ];

  if (surfaces.includes('tiktok')) adBase[0].weight += 20;
  if (surfaces.includes('reaction')) { adBase[2].weight += 10; adBase[3].weight += 8; }
  if (surfaces.includes('quote')) adBase[3].weight += 8;

  const influencerBase = [
    { channel_id: 'tiktok_creators', lane: 'influencer', platform: 'TikTok Creators', weight: 50 },
    { channel_id: 'instagram_creators', lane: 'influencer', platform: 'Instagram Creators', weight: 30 },
    { channel_id: 'youtube_creators', lane: 'influencer', platform: 'YouTube Shorts Creators', weight: 20 },
  ];
  if (tags.includes('romance') || tags.includes('ship') || surfaces.includes('ship')) influencerBase[1].weight += 15;

  const qualityBase = [
    { channel_id: 'voiceover_studio', lane: 'quality', platform: 'Voiceover Studio', weight: 45 },
    { channel_id: 'art_studio', lane: 'quality', platform: 'Character Art Studio', weight: 40 },
    { channel_id: 'edit_qa', lane: 'quality', platform: 'Narrative QA & Editing', weight: 15 },
  ];

  const amount = Number(contractTerms?.amount_usd || 0);
  const adBudget = amount * Number(contractTerms?.ad_spend_pct || 0) / 100;
  const infBudget = amount * Number(contractTerms?.influencer_pct || 0) / 100;
  const qualityBudget = amount * Number(contractTerms?.quality_improvement_pct || 0) / 100;

  return [
    ...splitAmount(adBudget, adBase),
    ...splitAmount(infBudget, influencerBase),
    ...splitAmount(qualityBudget, qualityBase),
  ];
}

function buildPurchasedAssetsFromChannels(dossier, channelTransfers = []) {
  const title = dossier?.story_title || 'Untitled Story';
  const assets = [];

  for (const ch of channelTransfers || []) {
    const amount = Number(ch?.allocated_amount_usd || 0);
    if (amount <= 0) continue;

    if (ch.channel_id === 'art_studio') {
      assets.push({
        channel_id: ch.channel_id,
        asset_type: 'character_art_cards',
        title: `${title} Character Card Pack`,
        quantity: Math.max(1, Math.floor(amount / 7)),
        unit: 'cards',
        budget_usd: amount,
      });
    } else if (ch.channel_id === 'voiceover_studio') {
      assets.push({
        channel_id: ch.channel_id,
        asset_type: 'voiceover_teasers',
        title: `${title} Voice Teaser Clips`,
        quantity: Math.max(1, Math.floor(amount / 8)),
        unit: 'clips',
        budget_usd: amount,
      });
    } else if (ch.channel_id === 'edit_qa') {
      assets.push({
        channel_id: ch.channel_id,
        asset_type: 'narrative_polish_batches',
        title: `${title} QA/Editing Batches`,
        quantity: Math.max(1, Math.floor(amount / 5)),
        unit: 'batches',
        budget_usd: amount,
      });
    }
  }

  return assets;
}

function buildMarketingPostsFromStory(dossier, channelTransfers = []) {
  const title = dossier?.story_title || 'Untitled Story';
  const synopsis = String(dossier?.generated_synopsis || '');
  const hook = String(dossier?.business_insights?.monetization_hook || 'Unlock the next twist.');
  const lang = detectLanguageGeoProfile(`${title}
${synopsis}`).lang;

  const L = {
    en: {
      cta: 'Tap to choose your route.',
      q1: 'Would you trust your captor if he saved your life?',
      q2: 'If you had one choice here, what would you do next?',
      creator: 'POV: the story made me pick sides in 20 seconds.',
      polish: 'Narrative polish update: cleaner choices, stronger payoff.',
    },
    ru: {
      cta: 'Tap to choose your route.',
      q1: 'Would you trust your captor if he saved your life?',
      q2: 'What choice would you make in this scene?',
      creator: 'POV: this story made me pick sides in 20 seconds.',
      polish: 'Quality update: clearer choices and stronger payoff.',
    },
    ja: {
      cta: 'タップして分岐を選んで。',
      q1: '命を救ってくれた敵を、あなたは信じる？',
      q2: 'あなたなら次にどの選択をする？',
      creator: '20秒で推しルートが決まる物語。',
      polish: '品質アップデート：分岐の読みやすさを改善。',
    },
    es: {
      cta: 'Toca para elegir tu ruta.',
      q1: '¿Confiarías en tu captor si te salvara la vida?',
      q2: '¿Qué decisión tomarías tú aquí?',
      creator: 'POV: esta historia me hizo elegir bando en 20 segundos.',
      polish: 'Actualización: mejores elecciones y payoff narrativo.',
    },
    pt: {
      cta: 'Toque para escolher sua rota.',
      q1: 'Você confiaria no captor se ele salvasse sua vida?',
      q2: 'Qual escolha você faria agora?',
      creator: 'POV: essa história me fez escolher um lado em 20 segundos.',
      polish: 'Atualização: escolhas mais claras e payoff melhor.',
    },
    fr: {
      cta: 'Touchez pour choisir votre route.',
      q1: 'Feriez-vous confiance à votre geôlier s’il vous sauvait ?',
      q2: 'Quel choix feriez-vous maintenant ?',
      creator: 'POV : cette histoire m’a forcé à choisir un camp en 20s.',
      polish: 'Mise à jour: choix plus clairs, meilleur payoff.',
    },
    de: {
      cta: 'Tippe, um deinen Pfad zu wählen.',
      q1: 'Würdest du deinem Entführer trauen, wenn er dich rettet?',
      q2: 'Welche Entscheidung würdest du jetzt treffen?',
      creator: 'POV: Diese Story zwingt dich in 20 Sekunden zur Partei.',
      polish: 'Qualitätsupdate: klarere Entscheidungen, stärkerer Payoff.',
    },
    unknown: {
      cta: 'Tap to choose your route.',
      q1: 'Would you trust your captor if he saved your life?',
      q2: 'If you had one choice here, what would you do next?',
      creator: 'POV: the story made me pick sides in 20 seconds.',
      polish: 'Narrative polish update: cleaner choices, stronger payoff.',
    }
  };

  const t = L[lang] || L.unknown;
  const shortSynopsis = (synopsis || '').slice(0, 140).replace(/\s+/g, ' ').trim();
  const quoteLine = shortSynopsis ? `"${shortSynopsis}${shortSynopsis.length >= 140 ? '…' : ''}"` : title;

  const posts = [];
  for (const ch of channelTransfers || []) {
    if (Number(ch?.allocated_amount_usd || 0) <= 0) continue;

    if (ch.channel_id === 'tiktok_ads') {
      posts.push({
        channel_id: ch.channel_id,
        platform: 'TikTok',
        format: '15s hook video ad',
        caption: `POV: ${title}. ${hook} ${t.cta}`,
        creative_brief: 'UGC style, face-cam opener, pattern interrupt at 2s, CTA in end-card.',
      });
      continue;
    }

    if (ch.channel_id === 'meta_ads') {
      posts.push({
        channel_id: ch.channel_id,
        platform: 'Meta Ads',
        format: 'feed + story ad set',
        caption: `${title}: ${t.cta}`,
        creative_brief: 'Split-test 3 hooks (danger / romance / betrayal), optimize for install and purchase events.',
      });
      continue;
    }

    if (ch.channel_id === 'reddit_ads') {
      posts.push({
        channel_id: ch.channel_id,
        platform: 'Reddit Ads',
        format: 'debate prompt ad',
        caption: `${quoteLine}
${t.q1}`,
        creative_brief: 'Native discussion tone; end with binary choice to maximize comment depth.',
      });
      continue;
    }

    if (ch.channel_id === 'x_ads') {
      posts.push({
        channel_id: ch.channel_id,
        platform: 'X',
        format: 'thread ad',
        caption: `${quoteLine}
${t.q2}`,
        creative_brief: '3-post thread: hook, conflict, branch poll. Pin CTA link in post #1.',
      });
      continue;
    }

    if (ch.channel_id === 'tiktok_creators') {
      posts.push({
        channel_id: ch.channel_id,
        platform: 'TikTok Creators',
        format: 'creator stitch/duet',
        caption: t.creator,
        creative_brief: 'Influencer first-person reaction, hard stance, invite audience to choose team in comments.',
      });
      continue;
    }

    if (ch.channel_id === 'instagram_creators') {
      posts.push({
        channel_id: ch.channel_id,
        platform: 'Instagram Reels',
        format: 'character POV reel',
        caption: `${title}: ${t.q2}`,
        creative_brief: 'Carousel + reel combo: character cards, route labels, social proof caption.',
      });
      continue;
    }

    if (ch.channel_id === 'youtube_creators') {
      posts.push({
        channel_id: ch.channel_id,
        platform: 'YouTube Shorts',
        format: '30s story recap',
        caption: `${title} in 30 seconds. ${t.q2}`,
        creative_brief: 'Cold open with twist, chapter snippets, end on unresolved decision.',
      });
      continue;
    }

    if (ch.channel_id === 'voiceover_studio') {
      posts.push({
        channel_id: ch.channel_id,
        platform: 'Owned Media',
        format: 'voice teaser asset',
        caption: `${title}: voiced teaser ready for paid/social deployment.`,
        creative_brief: '2 emotional reads + 1 suspense read to support ad variants.',
      });
      continue;
    }

    if (ch.channel_id === 'art_studio') {
      posts.push({
        channel_id: ch.channel_id,
        platform: 'Owned Media',
        format: 'art card drop',
        caption: `${title}: visual route cards released for campaign creatives.`,
        creative_brief: 'Produce 6 character cards + 3 scene key-art variants sized for TikTok/IG/X.',
      });
      continue;
    }

    if (ch.channel_id === 'edit_qa') {
      posts.push({
        channel_id: ch.channel_id,
        platform: 'Owned Media',
        format: 'quality patch note',
        caption: `${title}: ${t.polish}`,
        creative_brief: 'Public changelog style to increase trust and conversion confidence.',
      });
      continue;
    }

    posts.push({
      channel_id: ch.channel_id,
      platform: ch.platform || 'Unknown',
      format: 'campaign asset',
      caption: `${title} campaign asset for ${ch.platform || ch.channel_id}.`,
      creative_brief: 'Channel-specific creative execution tied to allocated budget.',
    });
  }

  return posts;
}

function hashToUnit(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function round(n, d = 2) {
  const p = 10 ** d;
  return Math.round(Number(n) * p) / p;
}

function buildRevenueMockFromPricing(perfSummary = {}, contractTerms = {}) {
  const installs = Number(perfSummary?.installs || 0);
  const buyers = Number(perfSummary?.purchases || 0);
  const p = contractTerms?.pricing_terms || {};

  const basePrice = Number(p.base_story_price_usd || 0);
  const paidChoices = Number(p.paid_choices_per_chapter || 0);
  const choicePrice = Number(p.price_per_paid_choice_usd || 0);
  const routePrice = Number(p.premium_route_unlock_usd || 0);
  const bundlePrice = Number(p.bundle_price_usd || 0);

  const baseSales = buyers;
  const choicePayers = Math.floor(buyers * 0.6);
  const routeBuyers = Math.floor(buyers * 0.22);
  const bundleBuyers = Math.floor(buyers * 0.12);

  const revenue_base = round(baseSales * basePrice, 2);
  const revenue_choices = round(choicePayers * paidChoices * choicePrice, 2);
  const revenue_routes = round(routeBuyers * routePrice, 2);
  const revenue_bundle = round(bundleBuyers * bundlePrice, 2);
  const total_revenue = round(revenue_base + revenue_choices + revenue_routes + revenue_bundle, 2);

  return {
    installs,
    buyers,
    monetization_mix: {
      base_sales: baseSales,
      choice_payers: choicePayers,
      route_buyers: routeBuyers,
      bundle_buyers: bundleBuyers,
    },
    revenue_breakdown_usd: {
      base_story: revenue_base,
      paid_choices: revenue_choices,
      premium_routes: revenue_routes,
      bundles: revenue_bundle,
      total: total_revenue,
    },
  };
}

function buildChannelMockMetrics(channelTransfers = [], dossier = {}) {
  const titleSeed = dossier?.story_title || 'story';
  const metrics = [];

  for (const ch of channelTransfers) {
    const spend = Number(ch.allocated_amount_usd || 0);
    const u = hashToUnit(`${titleSeed}:${ch.channel_id}`);

    let impressions = 0;
    let clicks = 0;
    let cpc = 0;
    let ctr = 0;
    let installs = 0;
    let purchases = 0;

    if (ch.lane === 'ad') {
      const cpm = 4.5 + u * 8.5; // $4.5-$13 CPM realistic-ish
      impressions = Math.floor((spend / cpm) * 1000);
      ctr = 0.006 + u * 0.018; // 0.6%-2.4%
      clicks = Math.floor(impressions * ctr);
      cpc = clicks > 0 ? spend / clicks : 0;
      const installRate = 0.16 + u * 0.16; // 16%-32%
      installs = Math.floor(clicks * installRate);
      const purchaseRate = 0.05 + u * 0.07; // 5%-12%
      purchases = Math.floor(installs * purchaseRate);
    } else if (ch.lane === 'influencer') {
      const viewsPerDollar = 18 + u * 65; // paid collab output
      impressions = Math.floor(spend * viewsPerDollar);
      ctr = 0.004 + u * 0.012; // 0.4%-1.6%
      clicks = Math.floor(impressions * ctr);
      cpc = clicks > 0 ? spend / clicks : 0;
      const installRate = 0.12 + u * 0.13; // 12%-25%
      installs = Math.floor(clicks * installRate);
      const purchaseRate = 0.04 + u * 0.06; // 4%-10%
      purchases = Math.floor(installs * purchaseRate);
    } else {
      // quality: mostly content outputs + assisted conversion
      const assets = Math.max(1, Math.floor(spend / 12));
      const assistedViews = Math.floor(spend * (30 + u * 70));
      impressions = assistedViews;
      ctr = 0.003 + u * 0.009;
      clicks = Math.floor(impressions * ctr);
      cpc = clicks > 0 ? spend / clicks : 0;
      const installRate = 0.18 + u * 0.12;
      installs = Math.floor(clicks * installRate);
      const purchaseRate = 0.05 + u * 0.05;
      purchases = Math.floor(installs * purchaseRate);
      metrics.push({
        channel_id: ch.channel_id,
        lane: ch.lane,
        spend_usd: round(spend, 2),
        assets_produced: assets,
        views: impressions,
        clicks,
        installs,
        purchases,
        ctr_pct: round(ctr * 100, 2),
        cpc_usd: round(cpc, 2),
        cvr_install_pct: clicks > 0 ? round((installs / clicks) * 100, 2) : 0,
        cvr_purchase_pct: installs > 0 ? round((purchases / installs) * 100, 2) : 0,
      });
      continue;
    }

    metrics.push({
      channel_id: ch.channel_id,
      lane: ch.lane,
      spend_usd: round(spend, 2),
      impressions,
      clicks,
      installs,
      purchases,
      ctr_pct: round(ctr * 100, 2),
      cpc_usd: round(cpc, 2),
      cvr_install_pct: clicks > 0 ? round((installs / clicks) * 100, 2) : 0,
      cvr_purchase_pct: installs > 0 ? round((purchases / installs) * 100, 2) : 0,
    });
  }

  const totals = metrics.reduce((acc, m) => {
    acc.spend_usd += Number(m.spend_usd || 0);
    acc.impressions += Number(m.impressions || m.views || 0);
    acc.clicks += Number(m.clicks || 0);
    acc.installs += Number(m.installs || 0);
    acc.purchases += Number(m.purchases || 0);
    return acc;
  }, { spend_usd: 0, impressions: 0, clicks: 0, installs: 0, purchases: 0 });

  const summary = {
    spend_usd: round(totals.spend_usd, 2),
    impressions: totals.impressions,
    clicks: totals.clicks,
    installs: totals.installs,
    purchases: totals.purchases,
    ctr_pct: totals.impressions > 0 ? round((totals.clicks / totals.impressions) * 100, 2) : 0,
    cpc_usd: totals.clicks > 0 ? round(totals.spend_usd / totals.clicks, 2) : 0,
    cpi_usd: totals.installs > 0 ? round(totals.spend_usd / totals.installs, 2) : 0,
    cac_purchase_usd: totals.purchases > 0 ? round(totals.spend_usd / totals.purchases, 2) : 0,
  };

  return { channels: metrics, summary };
}

async function writeDebugDump(taskId, label, content) {
  try {
    const debugDir = join(__dirname, 'debug');
    await fs.mkdir(debugDir, { recursive: true });
    const filePath = join(debugDir, `${taskId}-${label}.txt`);
    await fs.writeFile(filePath, content || '', 'utf8');
    return filePath;
  } catch (error) {
    console.error(`❌ Failed to write debug dump for ${taskId}:`, error.message);
    return null;
  }
}

async function appendMoneyAudit(event) {
  try {
    const dir = join(__dirname, 'data');
    await fs.mkdir(dir, { recursive: true });
    const path = join(dir, 'money-audit.jsonl');
    const line = JSON.stringify({ ts: new Date().toISOString(), ...event }) + '\n';
    await fs.appendFile(path, line, 'utf8');
    return path;
  } catch (error) {
    console.error('❌ money audit append failed:', error.message);
    return null;
  }
}

function extractFirstValidJsonObject(text) {
  if (!text || typeof text !== 'string') return null;

  const src = text.trim();

  // 1) Fast path: whole payload is JSON
  try {
    return JSON.parse(src);
  } catch {}

  // 2) Remove markdown fences if present
  const unfenced = src.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(unfenced);
  } catch {}

  // 3) Scan for balanced top-level JSON object segments
  for (let start = 0; start < src.length; start++) {
    if (src[start] !== '{') continue;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < src.length; i++) {
      const ch = src[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === '{') depth++;
      if (ch === '}') depth--;

      if (depth === 0) {
        const candidate = src.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          break;
        }
      }
    }
  }

  return null;
}

async function parseStrictJson(resultRaw, errorPrefix) {
  if (!resultRaw || !resultRaw.trim()) {
    throw new Error('Empty response from agent');
  }

  const parsed = extractFirstValidJsonObject(resultRaw);
  if (parsed !== null) return parsed;

  throw new Error(`${errorPrefix}: Agent returned invalid JSON`);
}

async function processAnalyzeStoryTask(task, taskId, docRef) {
  const rawText = task.payload?.text || '';
  const sanitized = sanitizeInput(rawText);

  if (!sanitized) throw new Error('Story text is empty');

  if (detectInjection(sanitized)) {
    console.log('🚨 Prompt injection attempt detected, task rejected');
    const rejectionPayload = {
      rejected: true,
      reason: 'prompt_injection_detected',
      message: 'Security violation: prompt injection detected',
    };

    await safeUpdateDoc(docRef, {
      // Use error status for frontend compatibility; keep semantic code in errorCode/result.
      status: 'error',
      errorCode: 'PROMPT_INJECTION_DETECTED',
      errorMessage: rejectionPayload.message,
      validationPassed: false,
      result: rejectionPayload,
      resultJson: rejectionPayload,
      rejectedAt: new Date().toISOString(),
      failedAt: new Date().toISOString(),
      processorVersion: PROCESSOR_VERSION_STORY,
    });
    return { rejected: true };
  }

  const safeText = truncateStory(sanitized, 50000);
  const agentMessage = buildAnalyzeStoryMessage({ taskId, storyText: safeText });

  console.log('🧠 Sending story text to OpenClaw for analysis...');
  const resultRaw = await sendToAgent(agentMessage, taskId);
  let resultJson = await parseStrictJson(resultRaw, 'Story evaluation');
  resultJson = applyStoryResultFallbacks(resultJson, safeText);
  if (
    resultJson._fallback_story_title || resultJson._fallback_author || resultJson._fallback_generated_synopsis ||
    resultJson._fallback_tsi || resultJson._fallback_tei || resultJson._fallback_constraint_cloud
  ) {
    console.warn(
      `⚠️ analyze_story fallback applied: title=${Boolean(resultJson._fallback_story_title)} author=${Boolean(resultJson._fallback_author)} synopsis=${Boolean(resultJson._fallback_generated_synopsis)} tsi=${Boolean(resultJson._fallback_tsi)} tei=${Boolean(resultJson._fallback_tei)} cloud=${Boolean(resultJson._fallback_constraint_cloud)} task=${taskId}`
    );
  }
  resultJson = enforceAudienceGeographyByLanguage(resultJson, safeText);
  resultJson = enforceCoreAgeGroupByEvidence(resultJson, safeText);
  validateStoryEvaluationJson(resultJson);

  const constraintCloud = resultJson.constraint_cloud || null;

  const verificationReport = buildAnalyzeVerificationReport(resultJson);

  await safeUpdateDoc(docRef, {
    status: 'completed',
    processorVersion: PROCESSOR_VERSION_STORY,
    validationPassed: true,
    verificationReport,
    constraintCloud,
    result: {
      ...resultJson,
      verification_report: verificationReport,
    },
    resultRaw,
    resultJson: {
      ...resultJson,
      verification_report: verificationReport,
    },
    completedAt: new Date().toISOString(),
  });

  console.log(`✅ analyze_story completed: ${taskId}`);
  return { rejected: false };
}

async function processSyndicateReviewTask(task, taskId, docRef) {
  const sourceTaskId = task.payload?.sourceTaskId || task.payload?.source_task_id || null;
  if (!sourceTaskId || typeof sourceTaskId !== 'string') {
    throw new Error('Syndicate review missing payload.sourceTaskId');
  }

  const sourceDocRef = doc(db, 'agent_tasks', sourceTaskId);
  const sourceSnap = await getDoc(sourceDocRef);
  if (!sourceSnap.exists()) {
    throw new Error(`Source analyze_story task not found: ${sourceTaskId}`);
  }

  const sourceTask = sourceSnap.data();
  if (sourceTask.type !== 'analyze_story') {
    throw new Error(`Source task must be analyze_story, got: ${sourceTask.type}`);
  }

  const storyText = sanitizeInput(sourceTask.payload?.text || '');
  const dossier = sourceTask.result || sourceTask.resultJson || null;

  if (!storyText) throw new Error('Source analyze_story task missing payload.text');
  if (!dossier || typeof dossier !== 'object') throw new Error('Source analyze_story task missing result dossier');

  const prepared = await prepareSyndicateReviewPayload({
    dossier,
    storyText: truncateStory(storyText, 50000),
  });

  const config = await loadSyndicateConfig();
  const walletSnapshots = await getWalletBalanceSnapshots(config);

  const agentMessage = buildSyndicateReviewMessage({
    taskId,
    storyText: truncateStory(storyText, 50000),
    dossier,
    prepared,
    walletSnapshots,
  });

  console.log('🏛️ Sending syndicate_review to OpenClaw (single emulation request)...');
  const resultRaw = await sendToAgent(agentMessage, taskId);
  const rawDumpPath = await writeDebugDump(taskId, 'syndicate-raw-response', resultRaw);
  if (rawDumpPath) {
    console.log(`📝 Raw syndicate_review response saved: ${rawDumpPath}`);
  }

  let resultJson;
  try {
    resultJson = await parseStrictJson(resultRaw, 'Syndicate review');
  } catch (error) {
    await safeUpdateDoc(docRef, {
      status: 'error',
      errorMessage: rawDumpPath ? `${error.message} | debug_dump=${rawDumpPath}` : error.message,
      resultRaw,
      failedAt: new Date().toISOString(),
      processorVersion: PROCESSOR_VERSION_SYNDICATE,
      validationPassed: false,
    });
    throw error;
  }

  validateSyndicateReviewJson(resultJson);
  resultJson = attachUiSignalsAndStructuredEvents(resultJson);
  resultJson = enforceFinalSterlingMessage(resultJson);
  resultJson = enrichSyndicateOffersForEscrow(resultJson, {
    sourceTaskId,
    reviewTaskId: taskId,
    authorUid: task.authorUid || sourceTask.authorUid || null,
    authorAddress: null,
  });

  if (resultJson?.onchain_offer_meta && resultJson?.ui_signals?.best_offer?.agent_name) {
    const bestName = resultJson.ui_signals.best_offer.agent_name;
    const matched = (resultJson.investor_outputs || []).find((x) => x?.agent_name === bestName && x?.onchain_offer?.offer_id);
    if (matched) {
      resultJson.onchain_offer_meta.accepted_offer_id = matched.onchain_offer.offer_id;
      resultJson.onchain_offer_meta.accepted_agent_name = bestName;
      resultJson.onchain_offer_meta.accepted_amount_usd = Number(matched?.offer?.amount_usd || 0);
      resultJson.onchain_offer_meta.accepted_equity_pct = Number(matched?.offer?.equity_pct || 0);
    }
  }

  // Auto-lock investor offers on escrow right after syndicate result generation.
  const authorUidForEscrow = task.authorUid || sourceTask.authorUid || null;
  if (authorUidForEscrow && Array.isArray(resultJson?.investor_outputs)) {
    const authorWallet = await getOrCreateAuthorWallet(authorUidForEscrow, config);
    const expiryTs = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days

    for (const inv of resultJson.investor_outputs) {
      if (!inv?.onchain_offer?.offer_id) continue;
      const amountUsd = Number(inv?.offer?.amount_usd || 0);
      if (!(amountUsd > 0)) continue;

      const investorWallet = (config.wallets || []).find((w) => w.agent_name === inv.agent_name);
      if (!investorWallet) {
        inv.onchain_offer.lock_tx_status = 'failed_wallet_not_found';
        continue;
      }

      let lockResult = null;
      try {
        lockResult = await executeEscrowMakeOfferFromInvestorWallet({
          investorWallet,
          escrowContract: SEPOLIA_AI_OFFERS_CONTRACT,
          offerId: inv.onchain_offer.offer_id,
          campaignId: inv.onchain_offer.campaign_id,
          authorAddress: authorWallet.address,
          amountUsd,
          termsHash: inv.onchain_offer.terms_hash,
          expiryTs,
        });

        if (!lockResult.success && /intrinsic transaction cost|insufficient funds|INSUFFICIENT_FUNDS/i.test(String(lockResult.error || ''))) {
          await topupWalletGasIfNeeded({ targetAddress: investorWallet.address, reason: `offer_lock_retry_topup:${investorWallet.wallet_id}` });
          lockResult = await executeEscrowMakeOfferFromInvestorWallet({
            investorWallet,
            escrowContract: SEPOLIA_AI_OFFERS_CONTRACT,
            offerId: inv.onchain_offer.offer_id,
            campaignId: inv.onchain_offer.campaign_id,
            authorAddress: authorWallet.address,
            amountUsd,
            termsHash: inv.onchain_offer.terms_hash,
            expiryTs,
          });
        }
      } catch (e) {
        lockResult = { success: false, error: e.message };
      }

      if (lockResult?.success) {
        inv.onchain_offer.lock_tx_hash = lockResult.tx_hash;
        inv.onchain_offer.lock_tx_status = 'confirmed';
        inv.onchain_offer.proof.lock_tx_hash = lockResult.tx_hash;
        inv.onchain_offer.proof.approve_tx_hash = lockResult.approve_tx_hash || null;
      } else {
        inv.onchain_offer.lock_tx_status = lockResult?.already_exists ? 'already_locked' : 'failed';
        inv.onchain_offer.lock_error = lockResult?.error || 'unknown lock error';
      }
    }
  }

  const verificationReport = buildSyndicateVerificationReport(resultJson);

  await safeUpdateDoc(docRef, {
    status: 'completed',
    processorVersion: PROCESSOR_VERSION_SYNDICATE,
    validationPassed: true,
    verificationReport,
    result: {
      ...resultJson,
      verification_report: verificationReport,
    },
    resultRaw,
    resultJson: {
      ...resultJson,
      verification_report: verificationReport,
    },
    completedAt: new Date().toISOString(),
  });

  console.log(`✅ syndicate_review completed: ${taskId}`);
  return { rejected: false };
}

async function executeEscrowMakeOfferFromInvestorWallet({ investorWallet, escrowContract, offerId, campaignId, authorAddress, amountUsd, termsHash, expiryTs }) {
  const { parseUnits, Interface } = await import('ethers');
  const rpcUrl = BUY_STORY_NETWORKS.sepolia.rpcUrl;
  const walletManager = getWdkManagerForRpc(rpcUrl);

  try {
    const account = await walletManager.getAccount(Number(investorWallet.derivation_index));
    const investorAddress = await account.getAddress();
    const useMcp = MONEY_BACKEND === 'wdk_mcp';

    const amountAtomic = parseUnits(String(Number(amountUsd).toFixed(6)), 6);

    const existingDecoded = await evmReadCall({
      rpcUrl,
      to: escrowContract,
      abi: ['function offers(bytes32) view returns (bytes32 campaignId, address agent, address author, address token, uint256 amount, uint64 expiry, uint8 state, bytes32 termsHash)'],
      method: 'offers',
      args: [offerId],
    });
    const existing = existingDecoded?.[0] ?? null;
    const existingState = Number(existing?.state ?? 0);
    if (existingState !== 0) {
      return {
        success: false,
        already_exists: true,
        error: `ESCROW_MAKE_OFFER_FAILED | offer already exists with state=${existingState}`,
      };
    }

    const balance = useMcp
      ? BigInt((await callWdkMcpToolSafe('getTokenBalanceByIndex', {
        derivationIndex: Number(investorWallet.derivation_index),
        token: DEFAULT_SEPOLIA_USDT_CONTRACT,
      }))?.balance || '0')
      : await account.getTokenBalance(DEFAULT_SEPOLIA_USDT_CONTRACT);
    if (balance < amountAtomic) {
      return { success: false, error: `ESCROW_MAKE_OFFER_FAILED | insufficient USDT balance have=${balance.toString()} need=${amountAtomic.toString()}` };
    }

    const currentAllowance = useMcp
      ? BigInt((await callWdkMcpToolSafe('getAllowanceByIndex', {
        derivationIndex: Number(investorWallet.derivation_index),
        token: DEFAULT_SEPOLIA_USDT_CONTRACT,
        spender: escrowContract,
      }))?.allowance || '0')
      : await account.getAllowance(DEFAULT_SEPOLIA_USDT_CONTRACT, escrowContract);
    let approveTxHash = null;
    if (currentAllowance < amountAtomic) {
      if (useMcp) {
        const approveTx = await callWdkMcpToolSafe('approveErc20ByIndex', {
          derivationIndex: Number(investorWallet.derivation_index),
          token: DEFAULT_SEPOLIA_USDT_CONTRACT,
          spender: escrowContract,
          amountAtomic: amountAtomic.toString(),
        });
        approveTxHash = approveTx?.hash || null;
      } else {
        const approveTx = await account.approve({
          token: DEFAULT_SEPOLIA_USDT_CONTRACT,
          spender: escrowContract,
          amount: amountAtomic,
        });
        approveTxHash = approveTx.hash;
      }
    }

    const escrowIface = new Interface(['function makeOffer(bytes32,bytes32,address,address,uint256,uint64,bytes32)']);
    const data = escrowIface.encodeFunctionData('makeOffer', [
      offerId,
      campaignId,
      authorAddress,
      DEFAULT_SEPOLIA_USDT_CONTRACT,
      amountAtomic,
      BigInt(expiryTs),
      termsHash,
    ]);

    let txHash = null;
    let receipt = null;

    if (useMcp) {
      const tx = await callWdkMcpToolSafe('sendContractTxByIndex', {
        derivationIndex: Number(investorWallet.derivation_index),
        to: escrowContract,
        data,
        valueWei: '0',
      });
      txHash = tx?.hash || null;
      if (txHash) {
        receipt = await callWdkMcpToolSafe('getTransactionReceipt', { hash: txHash });
      }
      if (!txHash || !receipt) {
        console.warn('⚠️ ESCROW_MAKE_OFFER MCP path failed, falling back to SDK path');
        useMcp = false;
      }
    }
    if (!useMcp) {
      const quote = await account.quoteSendTransaction({ to: escrowContract, value: 0n, data });
      if (!quote?.fee || quote.fee <= 0n) {
        return { success: false, error: 'ESCROW_MAKE_OFFER_FAILED | invalid tx fee quote' };
      }
      const offerTx = await account.sendTransaction({ to: escrowContract, value: 0n, data });
      txHash = offerTx.hash;
      receipt = await account.getTransactionReceipt(txHash);
    }

    if (!receipt || Number(receipt.status) !== 1) {
      return { success: false, error: `ESCROW_MAKE_OFFER_FAILED | tx reverted ${txHash}` };
    }

    const successPayload = {
      success: true,
      tx_hash: txHash,
      approve_tx_hash: approveTxHash,
      block_number: receipt?.blockNumber || null,
      explorer_url: `${BUY_STORY_NETWORKS.sepolia.explorerBaseUrl}${txHash}`,
      offer_amount_atomic: amountAtomic.toString(),
      investor_wallet: investorAddress,
    };

    await appendMoneyAudit({
      stage: 'escrow_make_offer',
      backend: MONEY_BACKEND,
      from_wallet: investorAddress,
      to_wallet: escrowContract,
      token: DEFAULT_SEPOLIA_USDT_CONTRACT,
      amount_usd: Number(amountUsd),
      amount_atomic: amountAtomic.toString(),
      offer_id: offerId,
      campaign_id: campaignId,
      tx_hash: successPayload.tx_hash,
      approve_tx_hash: successPayload.approve_tx_hash || null,
      explorer_url: successPayload.explorer_url,
      status: 'confirmed',
    });

    return successPayload;
  } catch (e) {
    await appendMoneyAudit({
      stage: 'escrow_make_offer',
      backend: MONEY_BACKEND,
      from_wallet: investorWallet?.address || null,
      to_wallet: escrowContract,
      token: DEFAULT_SEPOLIA_USDT_CONTRACT,
      amount_usd: Number(amountUsd),
      offer_id: offerId,
      campaign_id: campaignId,
      status: 'failed',
      error: String(e.message || e),
    });
    return { success: false, error: `ESCROW_MAKE_OFFER_FAILED | ${e.message}` };
  } finally {
    walletManager.dispose();
  }
}

async function executeEscrowAcceptOfferFromAuthorWallet({ authorWallet, escrowContract, offerId, promoWallet, lockTxHash, expectedToken, expectedAmountUsd }) {
  const { JsonRpcProvider, parseUnits, Interface } = await import('ethers');
  const rpcUrl = BUY_STORY_NETWORKS.sepolia.rpcUrl;
  const provider = new JsonRpcProvider(rpcUrl);
  const walletManager = getWdkManagerForRpc(rpcUrl);

  try {
    const account = await walletManager.getAccount(Number(authorWallet.derivation_index));
    const authorAddress = await account.getAddress();
    const useMcp = MONEY_BACKEND === 'wdk_mcp';

    const offerDecoded = await evmReadCall({
      rpcUrl,
      to: escrowContract,
      abi: ['function offers(bytes32) view returns (bytes32 campaignId, address agent, address author, address token, uint256 amount, uint64 expiry, uint8 state, bytes32 termsHash)'],
      method: 'offers',
      args: [offerId],
    });
    const offer = offerDecoded?.[0] ?? null;
    const offerAuthor = String(offer?.author || '').toLowerCase();
    const signerAddr = String(authorAddress || '').toLowerCase();
    if (!offerAuthor || offerAuthor === '0x0000000000000000000000000000000000000000') {
      return { success: false, error: 'ESCROW_ACCEPT_FAILED | offer not found onchain' };
    }
    if (offerAuthor !== signerAddr) {
      return { success: false, error: `ESCROW_ACCEPT_FAILED | author mismatch: offer.author=${offer.author} signer=${authorAddress}` };
    }

    if (expectedToken && String(offer?.token || '').toLowerCase() !== String(expectedToken).toLowerCase()) {
      return { success: false, error: `ESCROW_ACCEPT_FAILED | token mismatch: offer.token=${offer.token} expected=${expectedToken}` };
    }

    if (Number.isFinite(Number(expectedAmountUsd)) && Number(expectedAmountUsd) > 0) {
      const expectedAtomic = parseUnits(String(Number(expectedAmountUsd).toFixed(6)), 6);
      if (BigInt(offer?.amount || 0) !== expectedAtomic) {
        return { success: false, error: `ESCROW_ACCEPT_FAILED | amount mismatch: onchain=${String(offer.amount)} expected=${expectedAtomic.toString()}` };
      }
    }

    let lockReceiptOk = null;
    if (lockTxHash && typeof lockTxHash === 'string') {
      const rec = await provider.getTransactionReceipt(lockTxHash);
      lockReceiptOk = !!(rec && Number(rec.status) === 1);
      if (!lockReceiptOk) {
        return { success: false, error: `ESCROW_ACCEPT_FAILED | lock_tx_hash not confirmed: ${lockTxHash}` };
      }
    }

    const iface = new Interface(['function acceptOffer(bytes32 offerId, address promoWallet)']);
    const data = iface.encodeFunctionData('acceptOffer', [offerId, promoWallet || authorAddress]);

    let txHash = null;
    let receipt = null;

    if (useMcp) {
      const tx = await callWdkMcpToolSafe('sendContractTxByIndex', {
        derivationIndex: Number(authorWallet.derivation_index),
        to: escrowContract,
        data,
        valueWei: '0',
      });
      txHash = tx?.hash || null;
      if (txHash) {
        receipt = await callWdkMcpToolSafe('getTransactionReceipt', { hash: txHash });
      }
      if (!txHash || !receipt) {
        console.warn('⚠️ ESCROW_ACCEPT MCP path failed, falling back to SDK path');
        useMcp = false;
      }
    }
    if (!useMcp) {
      const quote = await account.quoteSendTransaction({ to: escrowContract, value: 0n, data });
      if (!quote?.fee || quote.fee <= 0n) {
        return { success: false, error: 'ESCROW_ACCEPT_FAILED | invalid tx fee quote' };
      }
      const tx = await account.sendTransaction({ to: escrowContract, value: 0n, data });
      txHash = tx.hash;
      receipt = await account.getTransactionReceipt(txHash);
    }

    if (!receipt || Number(receipt.status) !== 1) {
      return { success: false, error: `ESCROW_ACCEPT_FAILED | tx reverted ${txHash}` };
    }

    const successPayload = {
      success: true,
      tx_hash: txHash,
      block_number: receipt?.blockNumber || null,
      explorer_url: `${BUY_STORY_NETWORKS.sepolia.explorerBaseUrl}${txHash}`,
      method_used: 'acceptOffer(bytes32,address)',
      lock_tx_verified: lockReceiptOk,
      offer_author: offer.author,
      offer_agent: offer.agent,
      offer_token: offer.token,
      offer_amount_atomic: String(offer.amount),
    };

    await appendMoneyAudit({
      stage: 'escrow_accept_offer',
      backend: MONEY_BACKEND,
      from_wallet: escrowContract,
      to_wallet: authorAddress,
      token: String(offer?.token || ''),
      amount_atomic: String(offer?.amount || ''),
      offer_id: offerId,
      tx_hash: successPayload.tx_hash,
      explorer_url: successPayload.explorer_url,
      lock_tx_hash: lockTxHash || null,
      status: 'confirmed',
    });

    return successPayload;
  } catch (e) {
    await appendMoneyAudit({
      stage: 'escrow_accept_offer',
      backend: MONEY_BACKEND,
      from_wallet: escrowContract,
      to_wallet: authorWallet?.address || null,
      offer_id: offerId,
      lock_tx_hash: lockTxHash || null,
      status: 'failed',
      error: String(e.message || e),
    });
    return { success: false, error: `ESCROW_ACCEPT_FAILED | ${e.message}` };
  } finally {
    walletManager.dispose();
  }
}

async function processContractSettlementTask(task, taskId, docRef) {
  const payload = task.payload || {};
  const sourceTaskId = payload.sourceTaskId || payload.source_task_id || payload.syndicateTaskId || payload.syndicate_task_id || null;
  if (!sourceTaskId || typeof sourceTaskId !== 'string') {
    throw new Error('Contract settlement missing payload.sourceTaskId');
  }

  const investorAgentName = payload.investorAgentName || payload.investor_agent_name || payload.acceptedOffer?.agent_name || payload.offer?.agent_name || null;
  const amountUsdRaw = payload.amountUsd ?? payload.amount_usd ?? payload.acceptedOffer?.amount_usd ?? payload.offer?.amount_usd;
  const amountUsd = Number(amountUsdRaw);

  const escrowContract = payload.escrowContract || payload.escrow_contract || SEPOLIA_AI_OFFERS_CONTRACT;
  const offerId = payload.offerId || payload.offer_id || null;
  const termsHash = payload.termsHash || payload.terms_hash || null;
  const campaignId = payload.campaignId || payload.campaign_id || null;
  const lockTxHash = payload.lockTxHash || payload.lock_tx_hash || null;
  const useEscrowSettlement = Boolean(offerId);

  if (!investorAgentName || typeof investorAgentName !== 'string') {
    throw new Error('Contract settlement missing investor agent name');
  }
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new Error('Contract settlement missing valid amountUsd > 0');
  }

  const sourceDocRef = doc(db, 'agent_tasks', sourceTaskId);
  const sourceSnap = await getDoc(sourceDocRef);
  if (!sourceSnap.exists()) {
    throw new Error(`Source task not found: ${sourceTaskId}`);
  }

  let sourceTask = sourceSnap.data();
  let resolvedSyndicateTaskId = sourceTaskId;

  // Frontend may pass analyze_story id; resolve linked syndicate_review automatically.
  if (sourceTask.type !== 'syndicate_review') {
    if (sourceTask.type === 'analyze_story') {
      const q = query(
        collection(db, 'agent_tasks'),
        where('type', '==', 'syndicate_review'),
        where('payload.sourceTaskId', '==', sourceTaskId)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error(`No linked syndicate_review found for analyze_story sourceTaskId=${sourceTaskId}`);
      }

      // Pick most recent linked syndicate task by createdAt/processingStartedAt if available.
      let picked = null;
      for (const d of snap.docs) {
        const v = d.data();
        if (!picked) {
          picked = { id: d.id, data: v };
          continue;
        }
        const currTs = Date.parse(v.completedAt || v.processingStartedAt || v.createdAt || 0) || 0;
        const bestTs = Date.parse(picked.data.completedAt || picked.data.processingStartedAt || picked.data.createdAt || 0) || 0;
        if (currTs > bestTs) picked = { id: d.id, data: v };
      }

      sourceTask = picked.data;
      resolvedSyndicateTaskId = picked.id;
      console.log(`ℹ️ contract_settlement: resolved analyze_story ${sourceTaskId} -> syndicate_review ${resolvedSyndicateTaskId}`);
    } else {
      throw new Error(`Source task must be syndicate_review or analyze_story, got: ${sourceTask.type}`);
    }
  }

  const sourceResult = sourceTask.result || sourceTask.resultJson;
  if (!sourceResult || !Array.isArray(sourceResult.investor_outputs)) {
    throw new Error('Resolved syndicate_review task missing investor_outputs');
  }

  const matchedInvestor = sourceResult.investor_outputs.find((inv) => inv.agent_name === investorAgentName);
  if (!matchedInvestor) {
    throw new Error(`Investor ${investorAgentName} not found in source syndicate_review result`);
  }

  if (!['accept', 'counter'].includes(matchedInvestor.decision)) {
    throw new Error(`Investor ${investorAgentName} decision is ${matchedInvestor.decision}, cannot settle transfer`);
  }

  const sourceOfferAmount = Number(matchedInvestor.offer?.amount_usd || 0);
  if (sourceOfferAmount <= 0) {
    throw new Error(`Investor ${investorAgentName} has no positive offer amount in source result`);
  }

  if (sourceOfferAmount !== amountUsd) {
    throw new Error(`Amount mismatch: payload=${amountUsd}, source_offer=${sourceOfferAmount}`);
  }

  const authorUid = task.authorUid || payload.authorUid || payload.author_uid || sourceTask.authorUid || null;
  if (!authorUid || typeof authorUid !== 'string') {
    throw new Error('Contract settlement missing authorUid (required for per-author Sterling wallet routing)');
  }

  const config = await loadSyndicateConfig();
  const wallet = config.wallets.find((w) => w.agent_name === investorAgentName);
  if (!wallet) {
    throw new Error(`Wallet not found for investor ${investorAgentName}`);
  }

  const authorWallet = await getOrCreateAuthorWallet(authorUid, config);

  let transfer = null;
  let escrowAccept = null;

  if (useEscrowSettlement) {
    escrowAccept = await executeEscrowAcceptOfferFromAuthorWallet({
      authorWallet,
      escrowContract,
      offerId,
      promoWallet: authorWallet.address,
      lockTxHash,
      expectedToken: DEFAULT_SEPOLIA_USDT_CONTRACT,
      expectedAmountUsd: amountUsd,
    });

    if (!escrowAccept.success) {
      throw new Error(escrowAccept.error || 'Escrow acceptOffer failed');
    }

    transfer = {
      success: true,
      fromWallet: escrowContract,
      toWallet: authorWallet.address,
      hash: escrowAccept.tx_hash,
      explorerUrl: escrowAccept.explorer_url,
    };
  } else {
    transfer = await executeInvestmentTransfer({
      investorWalletId: wallet.wallet_id,
      amountUsd,
      config,
      recipientWallet: authorWallet.address,
    });

    if (!transfer.success && /insufficient funds|INSUFFICIENT_FUNDS|intrinsic transaction cost/i.test(String(transfer.error || ''))) {
      await topupWalletGasIfNeeded({
        targetAddress: wallet.address,
        reason: `contract_retry_topup:${wallet.wallet_id}`,
      });
      transfer = await executeInvestmentTransfer({
        investorWalletId: wallet.wallet_id,
        amountUsd,
        config,
        recipientWallet: authorWallet.address,
      });
    }

    if (!transfer.success) {
      throw new Error(`Transfer failed: ${transfer.error || 'unknown error'}`);
    }
  }

  await appendMoneyAudit({
    stage: 'contract_settlement',
    backend: MONEY_BACKEND,
    settlement_mode: useEscrowSettlement ? 'escrow_accept_offer' : 'direct_transfer',
    from_wallet: transfer.fromWallet,
    to_wallet: transfer.toWallet,
    token: DEFAULT_SEPOLIA_USDT_CONTRACT,
    amount_usd: Number(amountUsd),
    tx_hash: transfer.hash,
    explorer_url: transfer.explorerUrl,
    offer_id: offerId || null,
    campaign_id: campaignId || null,
    status: 'confirmed',
  });

  await safeUpdateDoc(docRef, {
    status: 'completed',
    processorVersion: PROCESSOR_VERSION_CONTRACT,
    validationPassed: true,
    result: {
      settled: true,
      sourceTaskId: resolvedSyndicateTaskId,
      sourceTaskId_input: sourceTaskId,
      investor_agent_name: investorAgentName,
      amount_usd: amountUsd,
      author_uid: authorUid,
      investor_wallet_id: wallet.wallet_id,
      author_wallet_id: authorWallet.wallet_id,
      author_wallet_derivation_index: authorWallet.derivation_index,
      settlement_mode: useEscrowSettlement ? 'escrow_accept_offer' : 'direct_transfer',
      from_wallet: transfer.fromWallet,
      to_wallet: transfer.toWallet,
      tx_hash: transfer.hash,
      explorer_url: transfer.explorerUrl,
      escrow_accept_tx_hash: escrowAccept?.tx_hash || null,
      escrow_accept_method: escrowAccept?.method_used || null,
      contract_tx_hash: payload.contractTxHash || payload.contract_tx_hash || null,
      contract_id: payload.contractId || payload.contract_id || null,
      escrow_offer_proof: {
        escrow_contract: escrowContract,
        campaign_id: campaignId,
        offer_id: offerId,
        terms_hash: termsHash,
        lock_tx_hash: lockTxHash,
        lock_tx_verified: escrowAccept?.lock_tx_verified ?? null,
      },
      contract_terms: {
        amount_usd: Number(matchedInvestor.offer?.amount_usd || 0),
        equity_pct: Number(matchedInvestor.offer?.equity_pct || 0),
        ad_spend_pct: Number(matchedInvestor.offer?.ad_spend_pct || 0),
        influencer_pct: Number(matchedInvestor.offer?.influencer_pct || 0),
        quality_improvement_pct: Number(matchedInvestor.offer?.quality_improvement_pct || 0),
        rights_requests: Array.isArray(matchedInvestor.offer?.rights_requests) ? matchedInvestor.offer.rights_requests : [],
        special_terms: Array.isArray(matchedInvestor.offer?.special_terms) ? matchedInvestor.offer.special_terms : [],
        pricing_terms: {
          base_story_price_usd: Number(matchedInvestor.offer?.pricing_terms?.base_story_price_usd || 0),
          paid_choices_per_chapter: Number(matchedInvestor.offer?.pricing_terms?.paid_choices_per_chapter || 0),
          price_per_paid_choice_usd: Number(matchedInvestor.offer?.pricing_terms?.price_per_paid_choice_usd || 0),
          premium_route_unlock_usd: Number(matchedInvestor.offer?.pricing_terms?.premium_route_unlock_usd || 0),
          bundle_price_usd: Number(matchedInvestor.offer?.pricing_terms?.bundle_price_usd || 0),
        },
        content_plan_terms: {
          target_chapters: Number(matchedInvestor.offer?.content_plan_terms?.target_chapters || 0),
          choice_density_target: String(matchedInvestor.offer?.content_plan_terms?.choice_density_target || ''),
          paywall_placement_rule: String(matchedInvestor.offer?.content_plan_terms?.paywall_placement_rule || ''),
          max_hard_paywalls_per_session: Number(matchedInvestor.offer?.content_plan_terms?.max_hard_paywalls_per_session || 0),
        },
      },
    },
    completedAt: new Date().toISOString(),
  });

  console.log(`✅ contract_settlement completed: ${taskId} | ${investorAgentName} -> ${amountUsd} USDT -> author ${authorUid} (${authorWallet.address}) | tx=${transfer.hash}`);
  return { rejected: false };
}

async function processOfferLockUpdateTask(task, taskId, docRef) {
  const payload = task.payload || {};
  const sourceTaskId = payload.sourceTaskId || payload.source_task_id || null;
  if (!sourceTaskId || typeof sourceTaskId !== 'string') {
    throw new Error('offer_lock_update missing payload.sourceTaskId');
  }

  const offerId = payload.offerId || payload.offer_id || null;
  const agentName = payload.investorAgentName || payload.investor_agent_name || null;
  const lockTxHash = payload.lockTxHash || payload.lock_tx_hash || null;
  const lockTxStatus = payload.lockTxStatus || payload.lock_tx_status || 'confirmed';

  if ((!offerId || typeof offerId !== 'string') && (!agentName || typeof agentName !== 'string')) {
    throw new Error('offer_lock_update requires offer_id or investorAgentName');
  }
  if (!lockTxHash || typeof lockTxHash !== 'string') {
    throw new Error('offer_lock_update requires lock_tx_hash');
  }

  const sourceDocRef = doc(db, 'agent_tasks', sourceTaskId);
  const sourceSnap = await getDoc(sourceDocRef);
  if (!sourceSnap.exists()) {
    throw new Error(`Source task not found: ${sourceTaskId}`);
  }

  const sourceTask = sourceSnap.data();
  if (sourceTask.type !== 'syndicate_review') {
    throw new Error(`offer_lock_update source must be syndicate_review, got: ${sourceTask.type}`);
  }

  const sourceResult = sourceTask.result || sourceTask.resultJson;
  if (!sourceResult || !Array.isArray(sourceResult.investor_outputs)) {
    throw new Error('Source syndicate_review missing investor_outputs');
  }

  let matchedIndex = -1;
  for (let i = 0; i < sourceResult.investor_outputs.length; i++) {
    const inv = sourceResult.investor_outputs[i];
    const invOfferId = inv?.onchain_offer?.offer_id || null;
    if (offerId && invOfferId === offerId) {
      matchedIndex = i;
      break;
    }
    if (!offerId && agentName && inv?.agent_name === agentName) {
      matchedIndex = i;
      break;
    }
  }

  if (matchedIndex < 0) {
    throw new Error(`Offer not found in source syndicate_review (offer_id=${offerId || 'n/a'}, agent=${agentName || 'n/a'})`);
  }

  const matched = sourceResult.investor_outputs[matchedIndex];
  const nowIso = new Date().toISOString();

  await safeUpdateDoc(sourceDocRef, {
    [`result.investor_outputs.${matchedIndex}.onchain_offer.lock_tx_hash`]: lockTxHash,
    [`result.investor_outputs.${matchedIndex}.onchain_offer.lock_tx_status`]: lockTxStatus,
    [`result.investor_outputs.${matchedIndex}.onchain_offer.proof.lock_tx_hash`]: lockTxHash,
    [`resultJson.investor_outputs.${matchedIndex}.onchain_offer.lock_tx_hash`]: lockTxHash,
    [`resultJson.investor_outputs.${matchedIndex}.onchain_offer.lock_tx_status`]: lockTxStatus,
    [`resultJson.investor_outputs.${matchedIndex}.onchain_offer.proof.lock_tx_hash`]: lockTxHash,
    updatedAt: nowIso,
  });

  await safeUpdateDoc(docRef, {
    status: 'completed',
    processorVersion: PROCESSOR_VERSION_OFFER_LOCK,
    validationPassed: true,
    result: {
      updated: true,
      sourceTaskId,
      offer_id: matched?.onchain_offer?.offer_id || offerId || null,
      investor_agent_name: matched?.agent_name || agentName || null,
      lock_tx_hash: lockTxHash,
      lock_tx_status: lockTxStatus,
      updated_at: nowIso,
    },
    resultJson: {
      updated: true,
      sourceTaskId,
      offer_id: matched?.onchain_offer?.offer_id || offerId || null,
      investor_agent_name: matched?.agent_name || agentName || null,
      lock_tx_hash: lockTxHash,
      lock_tx_status: lockTxStatus,
      updated_at: nowIso,
    },
    completedAt: nowIso,
  });

  console.log(`✅ offer_lock_update completed: ${taskId} | source=${sourceTaskId} | agent=${matched?.agent_name || agentName} | tx=${lockTxHash}`);
  return { rejected: false };
}

async function processMarketingExecutionTask(task, taskId, docRef) {
  const payload = task.payload || {};
  const settlementTaskId = payload.settlementTaskId || payload.contractSettlementTaskId || payload.sourceTaskId || payload.source_task_id || null;
  if (!settlementTaskId) throw new Error('Marketing execution missing settlementTaskId/sourceTaskId');

  const settlementRef = doc(db, 'agent_tasks', settlementTaskId);
  const settlementSnap = await getDoc(settlementRef);
  if (!settlementSnap.exists()) throw new Error(`Settlement task not found: ${settlementTaskId}`);
  const settlementTask = settlementSnap.data();
  if (settlementTask.type !== 'contract_settlement') throw new Error(`Settlement source must be contract_settlement, got ${settlementTask.type}`);

  const settlement = settlementTask.result || {};
  const authorUid = settlement.author_uid || task.authorUid || payload.authorUid;
  const sourceSyndicateTaskId = settlement.sourceTaskId;
  if (!authorUid) throw new Error('Marketing execution missing author_uid');
  if (!sourceSyndicateTaskId) throw new Error('Settlement result missing sourceTaskId');

  const syndRef = doc(db, 'agent_tasks', sourceSyndicateTaskId);
  const syndSnap = await getDoc(syndRef);
  if (!syndSnap.exists()) throw new Error(`Syndicate task not found: ${sourceSyndicateTaskId}`);
  const syndTask = syndSnap.data();
  const analyzeTaskId = syndTask?.payload?.sourceTaskId || syndTask?.payload?.source_task_id || null;
  if (!analyzeTaskId) throw new Error('Syndicate task missing linked analyze_story sourceTaskId');

  const analyzeRef = doc(db, 'agent_tasks', analyzeTaskId);
  const analyzeSnap = await getDoc(analyzeRef);
  if (!analyzeSnap.exists()) throw new Error(`Analyze task not found: ${analyzeTaskId}`);
  const dossier = analyzeSnap.data()?.result || analyzeSnap.data()?.resultJson || {};

  const contractTerms = settlement.contract_terms || {};
  const authorWallet = {
    wallet_id: settlement.author_wallet_id,
    derivation_index: settlement.author_wallet_derivation_index,
    address: settlement.to_wallet,
  };

  if (!Number.isFinite(Number(authorWallet.derivation_index))) {
    throw new Error('Settlement result missing author wallet derivation index');
  }

  const config = await loadSyndicateConfig();
  const channelPlan = buildChannelPlanFromStory(dossier, contractTerms);

  const channelTransfers = [];

  for (const item of channelPlan) {
    const channelWallet = await getOrCreateFixedChannelWallet(item.channel_id, config);
    let transferResult = null;
    if (Number(item.amount_usd) > 0) {
      transferResult = await executeUsdtTransferFromDerivation({
        fromDerivationIndex: Number(authorWallet.derivation_index),
        amountUsd: Number(item.amount_usd),
        recipientWallet: channelWallet.address,
      });

      if (!transferResult.success && /insufficient funds|INSUFFICIENT_FUNDS|intrinsic transaction cost/i.test(String(transferResult.error || ''))) {
        await topupWalletGasIfNeeded({
          targetAddress: authorWallet.address,
          reason: `marketing_retry_topup:${authorWallet.wallet_id || authorUid}`,
        });
        transferResult = await executeUsdtTransferFromDerivation({
          fromDerivationIndex: Number(authorWallet.derivation_index),
          amountUsd: Number(item.amount_usd),
          recipientWallet: channelWallet.address,
        });
      }

      if (!transferResult.success) {
        throw new Error(`Channel transfer failed (${item.channel_id}): ${transferResult.error}`);
      }
    }

    channelTransfers.push({
      channel_id: item.channel_id,
      lane: item.lane,
      platform: item.platform,
      allocated_amount_usd: Number(item.amount_usd),
      channel_wallet_id: channelWallet.wallet_id,
      channel_wallet_address: channelWallet.address,
      tx_hash: transferResult?.hash || null,
      explorer_url: transferResult?.explorerUrl || null,
    });

    if (transferResult?.hash) {
      await appendMoneyAudit({
        stage: 'marketing_channel_transfer',
        backend: MONEY_BACKEND,
        channel_id: item.channel_id,
        platform: item.platform,
        from_wallet: authorWallet.address,
        to_wallet: channelWallet.address,
        token: DEFAULT_SEPOLIA_USDT_CONTRACT,
        amount_usd: Number(item.amount_usd),
        tx_hash: transferResult.hash,
        explorer_url: transferResult.explorerUrl || null,
        status: 'confirmed',
      });
    }
  }

  const posts = buildMarketingPostsFromStory(dossier, channelTransfers);
  const purchasedAssets = buildPurchasedAssetsFromChannels(dossier, channelTransfers);
  const perf = buildChannelMockMetrics(channelTransfers, dossier);
  const revenueMock = buildRevenueMockFromPricing(perf.summary, contractTerms);
  const spend = Number(perf.summary?.spend_usd || 0);
  const roas = spend > 0 ? round(Number(revenueMock.revenue_breakdown_usd.total || 0) / spend, 2) : 0;
  const verificationReport = buildMarketingVerificationReport({
    contractTerms,
    channelTransfers,
    perf: perf.summary ? perf : null,
    revenueMock,
  });

  const marketingResultPayload = {
    executed: true,
    settlement_task_id: settlementTaskId,
    author_uid: authorUid,
    story_title: dossier?.story_title || null,
    source_syndicate_task_id: sourceSyndicateTaskId,
    source_analyze_task_id: analyzeTaskId,
    contract_terms: contractTerms,
    budget_execution: {
      total_amount_usd: Number(contractTerms.amount_usd || 0),
      ad_spend_pct: Number(contractTerms.ad_spend_pct || 0),
      influencer_pct: Number(contractTerms.influencer_pct || 0),
      quality_improvement_pct: Number(contractTerms.quality_improvement_pct || 0),
      channels_count: channelTransfers.length,
    },
    channel_transfers: channelTransfers,
    marketing_posts: posts,
    purchased_assets: purchasedAssets,
    performance_mock: {
      note: 'Synthetic but budget-constrained marketing KPIs for frontend demo. Values are scaled to spend and channel type.',
      channel_metrics: perf.channels,
      summary: perf.summary,
    },
    revenue_mock: {
      note: 'Synthetic monetization projection from investor pricing terms and simulated funnel outputs.',
      pricing_terms: contractTerms?.pricing_terms || {},
      content_plan_terms: contractTerms?.content_plan_terms || {},
      projection: revenueMock,
      roas: {
        spend_usd: spend,
        projected_revenue_usd: Number(revenueMock.revenue_breakdown_usd.total || 0),
        roas_ratio: roas,
      },
    },
    verification_report: verificationReport,
  };

  const marketingRaw = JSON.stringify(marketingResultPayload, null, 2);
  const marketingRawPath = await writeDebugDump(taskId, 'marketing-raw-response', marketingRaw);
  if (marketingRawPath) {
    console.log(`📝 Raw marketing_execution response saved: ${marketingRawPath}`);
  }

  await safeUpdateDoc(docRef, {
    status: 'completed',
    processorVersion: PROCESSOR_VERSION_MARKETING,
    validationPassed: true,
    verificationReport,
    resultRaw: marketingRaw,
    result: marketingResultPayload,
    resultJson: marketingResultPayload,
    completedAt: new Date().toISOString(),
  });

  console.log(`✅ marketing_execution completed: ${taskId} | channels=${channelTransfers.length} | posts=${posts.length}`);
  return { rejected: false };
}

async function processTask(change) {
  if (change.type !== 'added') return;

  const task = change.doc.data();
  const taskId = change.doc.id;
  const docRef = doc(db, 'agent_tasks', taskId);

  console.log(`\n📥 New task: [${task.type}] id=${taskId} author=${task.authorUid || 'unknown'}`);

  const freshSnap = await getDoc(docRef);
  if (!freshSnap.exists()) {
    console.log('⚠️ Document no longer exists, skipping');
    return;
  }

  const freshTask = freshSnap.data();
  if (freshTask.status !== 'pending') {
    console.log(`↪️ Skipping ${taskId}, status already ${freshTask.status}`);
    return;
  }

  const processorVersion = task.type === 'syndicate_review'
    ? PROCESSOR_VERSION_SYNDICATE
    : task.type === 'contract_settlement'
      ? PROCESSOR_VERSION_CONTRACT
      : task.type === 'marketing_execution'
        ? PROCESSOR_VERSION_MARKETING
        : task.type === 'buy_story'
          ? PROCESSOR_VERSION_BUY_STORY
          : task.type === 'offer_lock_update'
            ? PROCESSOR_VERSION_OFFER_LOCK
            : PROCESSOR_VERSION_STORY;

  try {
    await safeUpdateDoc(docRef, {
      status: 'processing',
      processingStartedAt: new Date().toISOString(),
      processorVersion,
    });

    if (task.type === 'analyze_story') {
      const result = await processAnalyzeStoryTask(task, taskId, docRef);
      if (result?.rejected) return;
      return;
    }

    if (task.type === 'syndicate_review') {
      const result = await processSyndicateReviewTask(task, taskId, docRef);
      if (result?.rejected) return;
      return;
    }

    if (task.type === 'contract_settlement') {
      const result = await processContractSettlementTask(task, taskId, docRef);
      if (result?.rejected) return;
      return;
    }

    if (task.type === 'marketing_execution') {
      const result = await processMarketingExecutionTask(task, taskId, docRef);
      if (result?.rejected) return;
      return;
    }

    if (task.type === 'buy_story') {
      const result = await processBuyStoryTask(task, taskId, docRef);
      if (result?.rejected) return;
      return;
    }

    if (task.type === 'offer_lock_update') {
      const result = await processOfferLockUpdateTask(task, taskId, docRef);
      if (result?.rejected) return;
      return;
    }

    await safeUpdateDoc(docRef, {
      status: 'error',
      errorMessage: `Unsupported task type for this bridge: ${task.type}`,
      failedAt: new Date().toISOString(),
      processorVersion,
    });
    console.log(`❌ Unsupported task type: ${task.type}`);
  } catch (error) {
    console.error(`❌ Processing error ${taskId}:`, error.message);
    try {
      const resultRawMatch = error.message.match(/preview=(.*)$/s);
      await safeUpdateDoc(docRef, {
        status: 'error',
        errorMessage: error.message,
        resultRaw: resultRawMatch ? resultRawMatch[1] : null,
        failedAt: new Date().toISOString(),
        processorVersion,
        validationPassed: false,
      });
    } catch (updateError) {
      console.error(`❌ Failed to persist error for ${taskId}:`, updateError.message);
    }
  }
}

async function startBridge() {
  console.log('🔄 Connecting to Firebase...');

  await signInWithEmailAndPassword(auth, process.env.AGENT_EMAIL, process.env.AGENT_PASSWORD);
  console.log(`✅ Successfully signed in as agent: ${auth.currentUser.email}`);
  console.log("🎧 Listening for new tasks in 'twislysyndicate/agent_tasks'...");

  const q = query(collection(db, 'agent_tasks'), where('status', '==', 'pending'));

  onSnapshot(
    q,
    async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        await processTask(change);
      }
    },
    (error) => {
      console.error('❌ Firestore listener error:', error.message);
    }
  );
}

startBridge().catch((error) => {
  console.error('❌ Bridge failed to start:', error.message);
  process.exit(1);
});
