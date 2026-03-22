# Frontend contract: AI offer lock proof (TwislyAIOffers)

## Added in `syndicate_review` result

For each investor with `offer.amount_usd > 0`, bridge now adds:

- `investor_outputs[i].onchain_offer.offer_id` (bytes32)
- `investor_outputs[i].onchain_offer.campaign_id` (bytes32)
- `investor_outputs[i].onchain_offer.terms_hash` (bytes32)
- `investor_outputs[i].onchain_offer.escrow_contract`
- `investor_outputs[i].onchain_offer.lock_expected_token`
- `investor_outputs[i].onchain_offer.lock_expected_amount_usdt_6`
- `investor_outputs[i].onchain_offer.lock_tx_hash` (initially `null`, set by frontend/backend after makeOffer tx)
- `investor_outputs[i].onchain_offer.proof` object for UI display

Top-level summary:

- `onchain_offer_meta.campaign_id`
- `onchain_offer_meta.accepted_offer_id` (best offer by current bridge logic)
- `onchain_offer_meta.accepted_agent_name`

## Auto-lock behavior (new default)

Bridge now auto-calls `makeOffer(...)` from each investor wallet right after `syndicate_review` is produced (for offers with `amount_usd > 0`).
So in normal flow frontend **does not need** to send lock tx hashes manually.

Each investor card should read:
- `onchain_offer.lock_tx_hash`
- `onchain_offer.lock_tx_status`
- `onchain_offer.proof`

## Optional manual task: `offer_lock_update` (fallback)

If you lock offers outside bridge and need to patch tx hash, frontend can still create:

```json
{
  "type": "offer_lock_update",
  "status": "pending",
  "payload": {
    "sourceTaskId": "<syndicate_review_task_id>",
    "offer_id": "0x...", 
    "investor_agent_name": "Laser_Eyes_99",
    "lock_tx_hash": "0x...",
    "lock_tx_status": "confirmed"
  }
}
```

Bridge will write lock proof into both:

- `syndicate_review.result.investor_outputs[i].onchain_offer.lock_tx_hash`
- `syndicate_review.resultJson.investor_outputs[i].onchain_offer.lock_tx_hash`

(and corresponding `proof.lock_tx_hash` fields).

## What frontend should send on accepted offer settlement

When creating `contract_settlement` task, include these payload fields:

```json
{
  "type": "contract_settlement",
  "payload": {
    "sourceTaskId": "<syndicate_review_task_id>",
    "investorAgentName": "Laser_Eyes_99",
    "amountUsd": 1200,

    "escrow_contract": "0x35f5d53ed9ff33fdce8ced7d7d26cdeb6bfa0607",
    "campaign_id": "0x...",
    "offer_id": "0x...",
    "terms_hash": "0x...",
    "lock_tx_hash": "0x..."
  }
}
```

Bridge now mirrors this into settlement `result.escrow_offer_proof` for UI.

## Settlement mode behavior (important)

- If `offer_id` is provided in `contract_settlement.payload`, bridge uses **escrow mode**:
  - verifies `lock_tx_hash` receipt (status=1)
  - calls `TwislyAIOffers.acceptOffer(offer_id, promoWallet)`
  - `promoWallet` = generated Sterling author wallet address
- If `offer_id` is absent, bridge falls back to old direct transfer mode.

Frontend should always include `offer_id` + `lock_tx_hash` for escrow flow.

## UI display recommendations

- Offer card: `agent_name`, `amount_usd`, `equity_pct`, `offer_id`, `terms_hash`, `lock_tx_hash`
- Accepted badge: compare card `offer_id` with `onchain_offer_meta.accepted_offer_id`
- Proof link: `https://sepolia.etherscan.io/tx/${lock_tx_hash}`
