import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as bip39 from 'bip39';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const INVESTORS = [
  { id: 'agent_x9', agent_name: 'Agent_X9' },
  { id: 'crypto_bunny', agent_name: 'Crypto_Bunny' },
  { id: 'barnaby', agent_name: 'Barnaby' },
  { id: 'safe_paws', agent_name: 'Safe_Paws' },
  { id: 'diamond_hands', agent_name: 'Diamond_Hands' },
  { id: 'laser_eyes_99', agent_name: 'Laser_Eyes_99' },
];

async function main() {
  console.log('🔑 Setting up investor wallets via WDK\n');

  // Check if seed phrase exists
  let seedPhrase = process.env.WDK_SEED_PHRASE;
  
  if (!seedPhrase) {
    console.log('📝 Generating a new seed phrase...');
    seedPhrase = bip39.generateMnemonic();
    
    // Append to .env
    const envPath = path.join(__dirname, '.env');
    const envContent = `\n# WDK Master Seed Phrase (KEEP SECURE!)\nWDK_SEED_PHRASE="${seedPhrase}"\n`;
    await fs.appendFile(envPath, envContent);
    console.log('✅ Seed phrase saved to .env');
  } else {
    console.log('✅ Existing seed phrase found in .env');
  }

  console.log(`\n📋 Seed phrase (${seedPhrase.split(' ').length} words):`);
  console.log('   ⚠️  Keep it secret! Never commit it to git!\n');

  // Create WDK instance
  const wdk = new WDK(seedPhrase);

  // Register EVM wallet manager
  wdk.registerWallet('ethereum', WalletManagerEvm, {
    provider: 'https://eth.drpc.org',
    chainId: 1,
  });

  console.log('👛 Creating wallets for investors:\n');

  const wallets = [];
  
  for (let i = 0; i < INVESTORS.length; i++) {
    const investor = INVESTORS[i];
    
    try {
      // Derive account at index i
      const account = await wdk.getAccount('ethereum', i);
      const address = await account.getAddress();
      
      console.log(`   ${investor.agent_name}:`);
      console.log(`      Index: ${i}`);
      console.log(`      Address: ${address}`);
      
      wallets.push({
        wallet_id: `wallet_${investor.id}`,
        agent_id: investor.id,
        agent_name: investor.agent_name,
        mode: 'wdk',
        chain: 'evm',
        derivation_index: i,
        address: address,
        treasury_usd: 0,
        available_usd: 0,
      });
      
      // Dispose to clear private key from memory
      account.dispose();
    } catch (error) {
      console.error(`   ❌ Error for ${investor.agent_name}:`, error.message);
    }
  }

  // Save wallets config
  const walletsPath = path.join(__dirname, 'config', 'wallets.json');
  await fs.writeFile(walletsPath, JSON.stringify(wallets, null, 2));
  console.log(`\n✅ Wallets saved to: ${walletsPath}`);

  // Dispose WDK
  wdk.dispose();

  console.log('\n🎉 Done! Wallets created.');
  console.log('\n⚠️  Next steps:');
  console.log('   1. Fund wallets with ETH (for gas) and/or USDT');
  console.log('   2. Provide payload.authorWallet with the author address in syndicate_review');
  console.log('   3. When decision is "accept", transfer is executed\n');
}

main().catch(console.error);