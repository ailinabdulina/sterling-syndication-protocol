import { WdkMcpServer, WALLET_READ_TOOLS } from '@tetherto/wdk-mcp-toolkit';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { z } from 'zod';
import { Interface, JsonRpcProvider } from 'ethers';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/jaina/Documents/sterling-bridge/.env' });

const SEED = process.env.WDK_SEED || process.env.WDK_SEED_PHRASE;
const RPC_URL = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL || 'https://sepolia.infura.io/v3/28c9664bde71441eb0d2771c2428a8f2';
const USDT = process.env.SEPOLIA_USDT_CONTRACT || '0xd077a400968890eacc75cdc901f0356c943e4fdb';

if (!SEED) throw new Error('Missing WDK_SEED or WDK_SEED_PHRASE');

const server = new WdkMcpServer('wdk-local', '1.0.0')
  .useWdk({ seed: SEED })
  .registerWallet('sepolia', WalletManagerEvm, { provider: RPC_URL })
  .registerToken('sepolia', 'USDT', { address: USDT, decimals: 6 })
  .registerTools(WALLET_READ_TOOLS);

server.registerTool(
  'transferUsdtByIndex',
  {
    title: 'Transfer USDT by derivation index',
    description: 'Transfer USDT from selected derivation index to recipient',
    inputSchema: z.object({
      derivationIndex: z.number().int().nonnegative(),
      recipient: z.string(),
      amountUsd: z.number().positive(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async ({ derivationIndex, recipient, amountUsd }) => {
    const account = await server.wdk.getAccount('sepolia', derivationIndex);
    const amountAtomic = BigInt(Math.round(Number(amountUsd) * 1_000_000));
    const quote = await account.quoteTransfer({ token: USDT, recipient, amount: amountAtomic });
    const tx = await account.transfer({ token: USDT, recipient, amount: amountAtomic });
    return {
      content: [{ type: 'text', text: JSON.stringify({ hash: tx.hash, fee: String(tx.fee), quoteFee: String(quote.fee) }) }],
      structuredContent: { hash: tx.hash, fee: String(tx.fee), quoteFee: String(quote.fee) },
    };
  }
);

server.registerTool(
  'approveErc20ByIndex',
  {
    title: 'Approve ERC20 spender by derivation index',
    description: 'Approve ERC20 token allowance from derivation index wallet',
    inputSchema: z.object({ derivationIndex: z.number().int().nonnegative(), token: z.string(), spender: z.string(), amountAtomic: z.string() }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async ({ derivationIndex, token, spender, amountAtomic }) => {
    const account = await server.wdk.getAccount('sepolia', derivationIndex);
    const tx = await account.approve({ token, spender, amount: BigInt(amountAtomic) });
    return { content: [{ type: 'text', text: JSON.stringify({ hash: tx.hash, fee: String(tx.fee) }) }], structuredContent: { hash: tx.hash, fee: String(tx.fee) } };
  }
);

server.registerTool(
  'sendContractTxByIndex',
  {
    title: 'Send EVM contract tx by derivation index',
    description: 'Send calldata to contract from selected derivation index wallet',
    inputSchema: z.object({ derivationIndex: z.number().int().nonnegative(), to: z.string(), data: z.string(), valueWei: z.string().optional() }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async ({ derivationIndex, to, data, valueWei }) => {
    const account = await server.wdk.getAccount('sepolia', derivationIndex);
    const value = BigInt(valueWei || '0');
    const quote = await account.quoteSendTransaction({ to, value, data });
    const tx = await account.sendTransaction({ to, value, data });
    return {
      content: [{ type: 'text', text: JSON.stringify({ hash: tx.hash, fee: String(tx.fee), quoteFee: String(quote.fee) }) }],
      structuredContent: { hash: tx.hash, fee: String(tx.fee), quoteFee: String(quote.fee) },
    };
  }
);

server.registerTool(
  'getTokenBalanceByIndex',
  {
    title: 'Get token balance by index',
    description: 'Read token balance for derivation index wallet',
    inputSchema: z.object({ derivationIndex: z.number().int().nonnegative(), token: z.string() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ derivationIndex, token }) => {
    const account = await server.wdk.getAccount('sepolia', derivationIndex);
    const balance = await account.getTokenBalance(token);
    const address = await account.getAddress();
    return { content: [{ type: 'text', text: JSON.stringify({ balance: balance.toString(), address }) }], structuredContent: { balance: balance.toString(), address } };
  }
);

server.registerTool(
  'getAllowanceByIndex',
  {
    title: 'Get allowance by index',
    description: 'Read ERC20 allowance for derivation index wallet',
    inputSchema: z.object({ derivationIndex: z.number().int().nonnegative(), token: z.string(), spender: z.string() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ derivationIndex, token, spender }) => {
    const account = await server.wdk.getAccount('sepolia', derivationIndex);
    const allowance = await account.getAllowance(token, spender);
    return { content: [{ type: 'text', text: JSON.stringify({ allowance: allowance.toString() }) }], structuredContent: { allowance: allowance.toString() } };
  }
);

server.registerTool(
  'getTransactionReceipt',
  {
    title: 'Get tx receipt',
    description: 'Read transaction receipt by hash',
    inputSchema: z.object({ hash: z.string() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ hash }) => {
    const provider = new JsonRpcProvider(RPC_URL);
    const rec = await provider.getTransactionReceipt(hash);
    return { content: [{ type: 'text', text: JSON.stringify(rec || null) }], structuredContent: rec || null };
  }
);

server.registerTool(
  'ethCall',
  {
    title: 'Read contract call',
    description: 'Read contract state using ABI + method + args',
    inputSchema: z.object({ to: z.string(), abi: z.array(z.string()), method: z.string(), argsJson: z.string().default('[]') }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ to, abi, method, argsJson }) => {
    const args = JSON.parse(argsJson || '[]');
    const provider = new JsonRpcProvider(RPC_URL);
    const iface = new Interface(abi);
    const data = iface.encodeFunctionData(method, args);
    const raw = await provider.call({ to, data });
    const decoded = iface.decodeFunctionResult(method, raw);
    const out = decoded?.[0] ?? decoded;
    return { content: [{ type: 'text', text: JSON.stringify(out, (_, v) => typeof v === 'bigint' ? v.toString() : v) }], structuredContent: out };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
