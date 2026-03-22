# Installation and Operation Guide

## 1) Requirements

- Node.js 20+
- npm 10+
- OpenClaw running and reachable
- Firebase project credentials
- Sepolia RPC endpoint
- Test funds on Sepolia (ETH + USDT)

## 2) Install

```bash
npm install
```

## 3) Configure environment

```bash
cp .env.example .env
```

Fill all required values in `.env`.

Minimum required keys:

- `OPENCLAW_URL`
- `OPENCLAW_TOKEN`
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `AGENT_EMAIL`
- `AGENT_PASSWORD`
- `WDK_SEED_PHRASE`

Recommended chain keys:

- `SEPOLIA_RPC_URL`
- `SEPOLIA_STORY_CONTRACT`
- `SEPOLIA_USDT_CONTRACT`
- `SEPOLIA_AI_OFFERS_CONTRACT`

## 4) Optional setup scripts

```bash
bash scripts/setup-judge.sh
```

## 5) Start the worker

```bash
npm start
```

The worker starts listening to Firestore collection `agent_tasks` for `status=pending`.

## 6) How OpenClaw is used

`bridge.mjs` sends chat-completion requests to OpenClaw:

- endpoint: `OPENCLAW_URL`
- auth: `OPENCLAW_TOKEN`
- model: `agent:main`

The effective underlying model depends on your OpenClaw runtime configuration.

## 7) How to run in a hackathon demo

1. Start OpenClaw
2. Start this worker (`npm start`)
3. Trigger tasks in this order:
   - `analyze_story`
   - `syndicate_review`
   - `contract_settlement`
   - `marketing_execution`
   - `buy_story`
4. Show logs from:
   - `data/money-audit.jsonl`
   - `data/wdk-tool-log.jsonl`
   - Firestore `agent_tasks` results

## 8) Troubleshooting

### `insufficient funds for intrinsic transaction cost`
Insufficient ETH for gas on the sender wallet or too many pending tx in queue.

### `insufficient USDT balance`
Sender wallet does not have enough USDT for the transfer/purchase amount.

### `Too Many Requests` from RPC
Your RPC provider is rate-limiting. Add retries, reduce burst traffic, or switch to a higher-tier endpoint.

## 9) Publish to GitHub

From inside `hackathon-bundle`:

```bash
git init
git add .
git commit -m "Initial hackathon bundle"
# then add remote and push
```
