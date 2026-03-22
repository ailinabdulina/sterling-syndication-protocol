import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { JsonRpcProvider, Network } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const USDT_CONTRACT = '0xd077a400968890eacc75cdc901f0356c943e4fdb';
const RECIPIENT = '0x58cc4ea61313908d534a216f72c091dc6f0f817a';
const SENDER_INDEX = 0; // Agent_X9
const AMOUNT_USDT = 1;

// Ethereum mainnet static network config
const ETH_MAINNET = Network.from({
  name: 'homestead',
  chainId: 1,
  ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
});

async function main() {
  console.log('💸 Test USDT transfer via WDK\n');

  const seedPhrase = process.env.WDK_SEED_PHRASE;
  if (!seedPhrase) {
    throw new Error('WDK_SEED_PHRASE not found in .env');
  }

  // RPC endpoints to try
  const RPC_ENDPOINTS = [
    'https://eth.drpc.org',
    'https://ethereum.publicnode.com',
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://eth-pokt.nodies.app',
  ];

  for (const rpcUrl of RPC_ENDPOINTS) {
    console.log(`\n🔌 Trying RPC: ${rpcUrl}`);
    
    try {
      // Create provider with static network
      const provider = new JsonRpcProvider(rpcUrl, ETH_MAINNET, {
        staticNetwork: ETH_MAINNET,
      });

      // Test connection
      console.log('   Checking connection...');
      const blockNumber = await provider.getBlockNumber();
      console.log(`   ✅ Connected! Block: ${blockNumber}`);

      // Create WDK instance
      const wdk = new WDK(seedPhrase);
      
      wdk.registerWallet('ethereum', WalletManagerEvm, {
        provider: provider,
        chainId: 1,
      });

      console.log('🔑 Getting sender account...');
      const account = await wdk.getAccount('ethereum', SENDER_INDEX);
      const senderAddress = await account.getAddress();
      console.log(`   Sender: ${senderAddress}`);

      console.log('\n💰 Checking balances...');
      const ethBalance = await account.getBalance();
      const ethBalanceEther = Number(ethBalance) / 1e18;
      console.log(`   ETH: ${ethBalanceEther.toFixed(6)} ETH`);

      const usdtBalance = await account.getTokenBalance(USDT_CONTRACT);
      const usdtBalanceDecimal = Number(usdtBalance) / 1e6;
      console.log(`   USDT: ${usdtBalanceDecimal.toFixed(2)} USDT`);

      if (ethBalance < 10000000000000000n) {
        console.log('\n⚠️  Low ETH for gas (< 0.01 ETH)');
        account.dispose();
        wdk.dispose();
        continue;
      }

      if (usdtBalance < BigInt(AMOUNT_USDT * 1e6)) {
        console.log(`\n❌ Insufficient USDT. Need: ${AMOUNT_USDT}, have: ${usdtBalanceDecimal}`);
        account.dispose();
        wdk.dispose();
        return;
      }

      console.log(`\n📤 Transferring ${AMOUNT_USDT} USDT...`);
      console.log(`   To: ${RECIPIENT}`);

      const amountWei = BigInt(AMOUNT_USDT * 1e6);

      console.log('\n⏳ Estimating fee...');
      const quote = await account.quoteTransfer({
        token: USDT_CONTRACT,
        recipient: RECIPIENT,
        amount: amountWei,
      });
      console.log(`   Estimated fee: ${Number(quote.fee) / 1e18} ETH`);

      console.log('\n⏳ Executing transfer...');
      const result = await account.transfer({
        token: USDT_CONTRACT,
        recipient: RECIPIENT,
        amount: amountWei,
      });

      console.log('\n✅ Transfer completed!');
      console.log(`   TX Hash: ${result.hash}`);
      console.log(`   Fee: ${Number(result.fee) / 1e18} ETH`);
      console.log(`\n🔗 https://etherscan.io/tx/${result.hash}`);

      account.dispose();
      wdk.dispose();
      console.log('\n🎉 Done!');
      return;

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n❌ All RPC providers failed');
}

main().catch(console.error);