import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import 'dotenv/config';

const SEED_PHRASE = process.env.WDK_SEED_PHRASE;
const RPC_URL = 'https://sepolia.infura.io/v3/28c9664bde71441eb0d2771c2428a8f2';
const USDT_CONTRACT = '0xd077a400968890eacc75cdc901f0356c943e4fdb';
const RECIPIENT = '0x58cc4ea61313908d534a216f72c091dc6f0f817a';
const SENDER_EXPECTED = '0xa7c97CAAFe19cf852aE952d9eebD0EF2eA5011b8';
const AMOUNT_USDT = 1;

async function run() {
    console.log('--- WDK Execution ---');
    console.log(`From: ${SENDER_EXPECTED}`);
    console.log(`To: ${RECIPIENT}`);
    console.log(`Token: USDT (${USDT_CONTRACT}) on Sepolia`);
    console.log(`Amount: ${AMOUNT_USDT} USDT`);

    const walletManager = new WalletManagerEvm(SEED_PHRASE, {
        provider: RPC_URL
    });

    try {
        const account = await walletManager.getAccount(0);
        const addr = await account.getAddress();
        if (addr.toLowerCase() !== SENDER_EXPECTED.toLowerCase()) {
            throw new Error(`Unexpected address at index 0: ${addr}`);
        }

        const amountAtomic = BigInt(AMOUNT_USDT * 1_000_000);

        console.log('Broadcasting transfer transaction...');
        const tx = await account.transfer({
            token: USDT_CONTRACT,
            recipient: RECIPIENT,
            amount: amountAtomic
        });

        console.log('\n--- TRANSACTION SENT ---');
        console.log(`Hash: ${tx.hash}`);
        console.log(`Fee: ${tx.fee.toString()}`);
        console.log(`Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);
        console.log('------------------------\n');

    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    } finally {
        walletManager.dispose();
    }
}

run();
