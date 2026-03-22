# Sterling Bridge Hackathon Bundle

Production-ready OpenClaw worker for the full story-to-monetization pipeline on Sepolia.

## What this bundle does

The worker listens to Firestore `agent_tasks` and processes:

1. `analyze_story`
2. `syndicate_review`
3. `contract_settlement`
4. `marketing_execution`
5. `buy_story`

It integrates OpenClaw (model execution), WDK wallets, escrow smart-contract calls, and full transaction/audit logging.

## Stack

- Node.js (ESM)
- OpenClaw Gateway API (`/v1/chat/completions`)
- Firebase (Auth + Firestore)
- WDK wallet engine (`@tetherto/wdk-wallet-evm`)
- Ethers v6

## OpenClaw model behavior

This project sends requests to:

- `OPENCLAW_URL` (default `http://127.0.0.1:18789/v1/chat/completions`)
- model: `agent:main`

So the actual underlying model is whatever is configured in your OpenClaw `agent:main` runtime.

## Quick start

```bash
npm install
cp .env.example .env
# fill .env values
npm start
```

## Core files

- `bridge.mjs` — main worker and all business logic
- `syndicate-orchestrator.mjs` — wallet and transfer helpers
- `config/` — investor profiles and wallet metadata templates
- `contracts/` — escrow contract source
- `docs/` — contract flow docs for frontend/backend alignment
- `scripts/` — setup and operational scripts

## Logs and observability

- `data/money-audit.jsonl` — money movement events
- `data/wdk-tool-log.jsonl` — wallet operation traces
- `debug/` — raw model/debug outputs

## Security and privacy

This bundle is sanitized for publication:

- no `.env`
- no private keys or seed phrases
- no personal user records

Keep all secrets only in your runtime environment.

## Full setup guide

See `INSTRUCTIONS.md` and `RUNBOOK.md`.
