# Sterling Bridge Runbook

## Pipeline

The worker processes Firestore tasks by type:

- `analyze_story`: story analysis and monetization signals
- `syndicate_review`: investor simulation and offer generation
- `contract_settlement`: escrow acceptance and settlement handling
- `marketing_execution`: channel budget distribution and transfer execution
- `buy_story`: buyer wallet purchase flow on story contract

## Operational commands

Install:

```bash
npm install
```

Start worker:

```bash
npm start
```

Health check helper:

```bash
node check-firebase.mjs
```

## Critical runtime files

- `bridge.mjs` — full orchestration logic
- `syndicate-orchestrator.mjs` — transfer and wallet helper functions
- `config/wallets.json` — investor wallet metadata
- `data/wallet-registry.json` — generated runtime wallet mappings

## Observability

- `data/money-audit.jsonl`:
  - canonical ledger of major money events
- `data/wdk-tool-log.jsonl`:
  - low-level wallet tool operations
- `debug/`:
  - raw model outputs and parse diagnostics

## Incident handling

### Escrow offer not found
Validate that settlement uses the exact on-chain `offer_id` generated during lock stage.

### Gas-related failures
If queue pressure appears (`queued cost`, `overshot`), reduce concurrency and retry after confirmation.

### Buyer purchase failures
Confirm:

1. buyer wallet address
2. buyer USDT balance
3. buyer ETH gas balance
4. contract and token addresses

## Security controls

- Never commit `.env`
- Never commit seed phrase or private keys
- Use testnet assets only in public demos

## Suggested demo checklist

- Story analysis result persisted
- Syndicate result persisted with offer IDs
- Escrow lock tx confirmed
- Settlement tx confirmed
- Marketing channel transfers confirmed
- Buyer purchase tx confirmed
- Audit logs contain full end-to-end trace
