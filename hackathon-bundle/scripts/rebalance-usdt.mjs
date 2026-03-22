import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { HDNodeWallet, JsonRpcProvider, Contract, formatUnits, parseUnits } from 'ethers';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const seed = process.env.WDK_SEED_PHRASE;
if (!seed) throw new Error('WDK_SEED_PHRASE missing in .env');

const RPC_URL = process.env.RPC_URL || 'https://sepolia.infura.io/v3/28c9664bde71441eb0d2771c2428a8f2';
const USDT = process.env.USDT_CONTRACT || '0xd077a400968890eacc75cdc901f0356c943e4fdb';
const DONOR_INDEX = Number(process.env.GAS_DONOR_DERIVATION_INDEX || 0);

const argv = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const p = `--${name}=`;
  const item = argv.find((a) => a.startsWith(p));
  return item ? item.slice(p.length) : fallback;
};

const keep = Number(getArg('keep', '0'));
const dryRun = argv.includes('--dry-run');
const mode = getArg('mode', 'equal'); // equal | fixed
const fixed = Number(getArg('amount', '0')); // for mode=fixed

const ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
];

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  const donor = HDNodeWallet.fromPhrase(seed, undefined, `m/44'/60'/0'/0/${DONOR_INDEX}`).connect(provider);
  const donorAddr = await donor.getAddress();

  const wallets = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'wallets.json'), 'utf8'));
  const investors = wallets.filter((w) => w.role === 'investor');
  const recipients = investors.filter((w) => w.address.toLowerCase() !== donorAddr.toLowerCase());
  if (recipients.length === 0) throw new Error('No recipient investor wallets found');

  const tokenRead = new Contract(USDT, ABI, provider);
  const tokenWrite = new Contract(USDT, ABI, donor);

  const donorBal = await tokenRead.balanceOf(donorAddr);
  const donorBalNum = Number(formatUnits(donorBal, 6));

  if (donorBalNum <= keep) throw new Error(`Donor balance ${donorBalNum} <= keep ${keep}`);

  let sendPerRecipientNum = 0;
  if (mode === 'fixed') {
    if (!(fixed > 0)) throw new Error('--amount must be > 0 for --mode=fixed');
    sendPerRecipientNum = fixed;
  } else {
    const distributable = donorBalNum - keep;
    sendPerRecipientNum = Math.floor((distributable / recipients.length) * 1e6) / 1e6;
  }

  if (!(sendPerRecipientNum > 0)) throw new Error('Computed transfer amount is 0');

  const sendAtomic = parseUnits(sendPerRecipientNum.toFixed(6), 6);

  console.log('--- Rebalance USDT ---');
  console.log('donor:', donorAddr);
  console.log('mode:', mode);
  console.log('donor balance:', donorBalNum);
  console.log('keep on donor:', keep);
  console.log('recipients:', recipients.length);
  console.log('amount per recipient:', sendPerRecipientNum);
  console.log('dry-run:', dryRun);
  console.log('----------------------');

  const results = [];
  for (const r of recipients) {
    if (dryRun) {
      results.push({ agent_name: r.agent_name, address: r.address, amount_usdt: sendPerRecipientNum, dry_run: true });
      continue;
    }

    try {
      const tx = await tokenWrite.transfer(r.address, sendAtomic);
      await tx.wait();
      results.push({ agent_name: r.agent_name, address: r.address, amount_usdt: sendPerRecipientNum, tx_hash: tx.hash });
      console.log(`sent ${sendPerRecipientNum} USDT -> ${r.agent_name} (${r.address}) | ${tx.hash}`);
    } catch (e) {
      results.push({ agent_name: r.agent_name, address: r.address, error: e.message });
      console.log(`FAILED ${r.agent_name}: ${e.message}`);
    }
  }

  const donorAfter = await tokenRead.balanceOf(donorAddr);
  console.log('donor_usdt_after:', formatUnits(donorAfter, 6));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error('rebalance-usdt failed:', e.message);
  process.exit(1);
});
