import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const SEED_PHRASE = process.env.WDK_SEED_PHRASE;
const RPC_URL = 'https://sepolia.infura.io/v3/28c9664bde71441eb0d2771c2428a8f2';
const USDT_CONTRACT = '0xd077a400968890eacc75cdc901f0356c943e4fdb';
const DEFAULT_STERLING_WALLET = '0xC48CCF69cb4D4fb7F12535eB73f40210C5CCB086';
const USDT_DECIMALS = 6;

const investorProfilesPath = path.join(__dirname, 'config', 'investor-profiles.json');
const walletsPath = path.join(__dirname, 'config', 'wallets.json');
const investorPromptPath = path.join(__dirname, 'prompts', 'syndicate-room.md');
const sterlingPromptPath = path.join(__dirname, 'prompts', 'sterling-review.md');
const feedPromptPath = path.join(__dirname, 'prompts', 'feed-generator.md');

export async function loadSyndicateConfig() {
  const [profilesRaw, walletsRaw, investorPrompt, sterlingPrompt, feedPrompt] = await Promise.all([
    fs.readFile(investorProfilesPath, 'utf8'),
    fs.readFile(walletsPath, 'utf8'),
    fs.readFile(investorPromptPath, 'utf8'),
    fs.readFile(sterlingPromptPath, 'utf8'),
    fs.readFile(feedPromptPath, 'utf8'),
  ]);

  return {
    investorProfiles: JSON.parse(profilesRaw),
    wallets: JSON.parse(walletsRaw),
    investorPrompt,
    sterlingPrompt,
    feedPrompt,
  };
}

export function buildInvestorSubagentPrompt({ investorProfile, dossier, storyText, wallet }) {
  const walletContext = wallet ? {
    wallet_id: wallet.wallet_id,
    address: wallet.address,
    treasury_usd: wallet.treasury_usd,
    available_usd: wallet.available_usd
  } : null;

  return `${investorProfile.profile_prompt}

${dossier?.prompt_base || ''}

Base investor instructions:
${dossier?.investor_prompt || ''}

Your wallet context:
${JSON.stringify(walletContext, null, 2)}

Story text:
${storyText}

Sterling dossier:
${JSON.stringify(dossier, null, 2)}

Return only valid JSON.`.trim();
}

export function buildSterlingReviewPrompt({ sterlingPrompt, dossier, investorOutputs }) {
  return `${sterlingPrompt}

Story dossier:\n${JSON.stringify(dossier, null, 2)}

Investor outputs:\n${JSON.stringify(investorOutputs, null, 2)}

Return only valid JSON.`.trim();
}

export function buildFeedPrompt({ feedPrompt, dossier, investorOutputs, sterlingVerdict }) {
  return `${feedPrompt}

Story dossier:\n${JSON.stringify(dossier, null, 2)}

Investor outputs:\n${JSON.stringify(investorOutputs, null, 2)}

Sterling verdict:\n${JSON.stringify(sterlingVerdict, null, 2)}

Return only valid JSON.`.trim();
}

export async function prepareSyndicateReviewPayload({ dossier, storyText }) {
  const config = await loadSyndicateConfig();

  const investors = config.investorProfiles.map((profile) => {
    const wallet = config.wallets.find((w) => w.agent_id === profile.id) || null;
    return {
      profile,
      wallet,
      subagentPrompt: buildInvestorSubagentPrompt({
        investorProfile: profile,
        dossier,
        storyText,
        wallet,
      }),
    };
  });

  return {
    investors,
    sterlingPrompt: config.sterlingPrompt,
    feedPrompt: config.feedPrompt,
  };
}

export async function getWalletBalanceSnapshots(config) {
  const walletManager = new WalletManagerEvm(SEED_PHRASE, { provider: RPC_URL });
  try {
    const snapshots = [];
    for (const wallet of config.wallets) {
      const account = await walletManager.getAccount(wallet.derivation_index);
      const address = await account.getAddress();
      const usdtAtomic = await account.getTokenBalance(USDT_CONTRACT);
      const usdtBalance = Number(usdtAtomic) / 10 ** USDT_DECIMALS;
      const maxOfferUsd = Math.min(3000, Math.floor(usdtBalance * 0.2));

      snapshots.push({
        wallet_id: wallet.wallet_id,
        agent_id: wallet.agent_id,
        agent_name: wallet.agent_name,
        address,
        usdt_balance: usdtBalance,
        usdt_balance_atomic: usdtAtomic.toString(),
        max_offer_usd_by_rule: maxOfferUsd,
      });
    }
    return snapshots;
  } finally {
    walletManager.dispose();
  }
}

/**
 * Execute USDT transfer from investor wallet to Sterling escrow wallet
 * @param {Object} params
 * @param {string} params.investorWalletId - wallet_id from wallets.json (e.g., "wallet_crypto_bunny")
 * @param {number} params.amountUsd - amount to transfer in USD
 * @param {Object} params.config - loaded syndicate config (from loadSyndicateConfig)
 * @returns {Promise<{success: boolean, hash?: string, error?: string}>}
 */
export async function executeInvestmentTransfer({ investorWalletId, amountUsd, config, recipientWallet }) {
  const wallet = config.wallets.find(w => w.wallet_id === investorWalletId);
  
  if (!wallet) {
    return { success: false, error: `Wallet not found: ${investorWalletId}` };
  }

  if (wallet.treasury_usd < amountUsd) {
    return { success: false, error: `Insufficient treasury: ${wallet.treasury_usd} USD available, ${amountUsd} USD requested` };
  }

  const derivationIndex = wallet.derivation_index;
  const amountAtomic = BigInt(amountUsd * 1_000_000); // USDT has 6 decimals
  const targetWallet = recipientWallet || DEFAULT_STERLING_WALLET;

  let walletManager;
  try {
    walletManager = new WalletManagerEvm(SEED_PHRASE, { provider: RPC_URL });
    const account = await walletManager.getAccount(derivationIndex);
    
    const address = await account.getAddress();
    console.log(`[Transfer] From: ${address} (index ${derivationIndex})`);
    console.log(`[Transfer] To: ${targetWallet}`);
    console.log(`[Transfer] Amount: ${amountUsd} USDT`);

    // Execute transfer
    const tx = await account.transfer({
      token: USDT_CONTRACT,
      recipient: targetWallet,
      amount: amountAtomic
    });

    console.log(`[Transfer] Success! Hash: ${tx.hash}`);
    
    return {
      success: true,
      hash: tx.hash,
      fromWallet: address,
      toWallet: targetWallet,
      amountUsd,
      explorerUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`
    };

  } catch (err) {
    console.error('[Transfer] Error:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (walletManager) walletManager.dispose();
  }
}

/**
 * Validate offer parameters before transfer
 */
export async function deriveWalletAddressByIndex(derivationIndex) {
  let walletManager;
  try {
    walletManager = new WalletManagerEvm(SEED_PHRASE, { provider: RPC_URL });
    const account = await walletManager.getAccount(derivationIndex);
    return await account.getAddress();
  } finally {
    if (walletManager) walletManager.dispose();
  }
}

export async function executeUsdtTransferFromDerivation({ fromDerivationIndex, amountUsd, recipientWallet }) {
  const amountAtomic = BigInt(Math.round(amountUsd * 1_000_000));
  let walletManager;
  try {
    walletManager = new WalletManagerEvm(SEED_PHRASE, { provider: RPC_URL });
    const account = await walletManager.getAccount(fromDerivationIndex);
    const fromWallet = await account.getAddress();

    const tx = await account.transfer({
      token: USDT_CONTRACT,
      recipient: recipientWallet,
      amount: amountAtomic,
    });

    return {
      success: true,
      hash: tx.hash,
      fromWallet,
      toWallet: recipientWallet,
      amountUsd,
      explorerUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
    };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    if (walletManager) walletManager.dispose();
  }
}

export async function executeNativeTransferFromDerivation({ fromDerivationIndex, amountEth, recipientWallet }) {
  try {
    const { HDNodeWallet, JsonRpcProvider, parseEther } = await import('ethers');
    const provider = new JsonRpcProvider(RPC_URL);
    const derivationPath = `m/44'/60'/0'/0/${Number(fromDerivationIndex)}`;
    const wallet = HDNodeWallet.fromPhrase(SEED_PHRASE, undefined, derivationPath).connect(provider);

    const tx = await wallet.sendTransaction({
      to: recipientWallet,
      value: parseEther(String(amountEth)),
    });

    return {
      success: true,
      hash: tx.hash,
      fromWallet: wallet.address,
      toWallet: recipientWallet,
      amountEth: Number(amountEth),
      explorerUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function validateOffer(offer, investorProfile) {
  const errors = [];
  
  // Equity bounds
  if (offer.equity_pct < 5 || offer.equity_pct > 30) {
    errors.push(`Equity ${offer.equity_pct}% outside valid range (5-30%)`);
  }
  
  // Investment bounds
  if (offer.amount_usd < 100 || offer.amount_usd > 3000) {
    errors.push(`Investment $${offer.amount_usd} outside valid range ($100-$3,000)`);
  }
  
  // Treasury check
  if (investorProfile.treasury_usd < offer.amount_usd) {
    errors.push(`Insufficient treasury: ${investorProfile.treasury_usd} < ${offer.amount_usd}`);
  }
  
  // Budget allocation sum
  const budgetSum = (offer.ad_spend_pct || 0) + (offer.influencer_pct || 0) + (offer.quality_improvement_pct || 0);
  if (budgetSum !== 100) {
    errors.push(`Budget allocation must sum to 100% (got ${budgetSum}%)`);
  }
  
  return { valid: errors.length === 0, errors };
}
