import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import 'dotenv/config';

const SEED_PHRASE = process.env.WDK_SEED_PHRASE;
const RPC_URL = 'https://sepolia.infura.io/v3/28c9664bde71441eb0d2771c2428a8f2';
const USDT_CONTRACT = '0xd077a400968890eacc75cdc901f0356c943e4fdb';
const RECIPIENT = '0x58cc4ea61313908d534a216f72c091dc6f0f817a';
const SENDER_EXPECTED = '0xa7c97CAAFe19cf852aE952d9eebD0EF2eA5011b8';
const AMOUNT_USDT = 1;

async function run() {
    console.log('--- WDK Transfer Quote ---');
    console.log(`From: ${SENDER_EXPECTED}`);
    console.log(`To: ${RECIPIENT}`);
    console.log(`Token: USDT (${USDT_CONTRACT}) on Sepolia`);
    console.log(`Amount: ${AMOUNT_USDT} USDT`);

    const walletManager = new WalletManagerEvm(SEED_PHRASE, {
        provider: RPC_URL
    });

    try {
        // Find the account index that matches 0xa7c...1b8
        let account = null;
        let index = -1;
        
        console.log('Searching for the correct account index...');
        for (let i = 0; i < 10; i++) {
            const acc = await walletManager.getAccount(i);
            const addr = await acc.getAddress();
            if (addr.toLowerCase() === SENDER_EXPECTED.toLowerCase()) {
                account = acc;
                index = i;
                break;
            }
        }

        if (!account) {
            throw new Error(`Could not find account ${SENDER_EXPECTED} in the first 10 indices of the seed phrase.`);
        }

        console.log(`Found account at index ${index}: ${await account.getAddress()}`);

        // Convert 1 USDT (6 decimals) to atomic units
        const amountAtomic = BigInt(AMOUNT_USDT * 1_000_000);

        console.log('Requesting quote for transfer...');
        const quote = await account.quoteTransfer({
            token: USDT_CONTRACT,
            recipient: RECIPIENT,
            amount: amountAtomic
        });

        console.log('\n--- QUOTE RESULTS ---');
        console.log(`Estimated Fee (Native): ${quote.fee.toString()} units`);
        console.log('----------------------\n');
        
        console.log('SUCCESS: Quote generated. Please confirm the transaction.');

    } catch (err) {
        console.error('ERROR:', err.message);
        if (err.stack) console.debug(err.stack);
        process.exit(1);
    } finally {
        walletManager.dispose();
    }
}

run();
