# Escrow + WDK flow (MVP)

## 1) Author opens deal

- Call `openDeal(dealId, investor, token, amount, expiry, termsHash)` from author wallet.
- `dealId` recommended: `keccak256(authorUid + sourceTaskId + investor + amount + nonce)`.
- `termsHash`: hash of exact JSON terms from `syndicate_review`.

## 2) Investor locks funds

WDK EVM account:

1. `quote` checks (optional app logic)
2. `approve(token, spender=escrow, amount)`
3. `fundDeal(dealId)` on escrow contract

## 3) Release / Refund

- Investor calls `releaseToAuthor(dealId)` when author delivered required conditions.
- Anyone can call `refundInvestor(dealId)` if expired and still funded.

---

## Minimal call data from WDK (`wallet-evm`)

- `account.approve({ token, spender: ESCROW_ADDRESS, amount })`
- `account.sendTransaction({ to: ESCROW_ADDRESS, value: 0n, data: iface.encodeFunctionData("fundDeal", [dealId]) })`
- `account.sendTransaction({ to: ESCROW_ADDRESS, value: 0n, data: iface.encodeFunctionData("releaseToAuthor", [dealId]) })`

Where `iface` is ethers `Interface` for `TwislyDealEscrow` ABI.

## Safety checks in watcher before auto-fund

- Exact `escrowAddress` match
- Expected `chainId` match
- `deal.state == OPEN`
- `deal.investor == thisInvestorWallet`
- `deal.token == expectedUSDT`
- `deal.amount == agreedOfferAmount`
- `deal.expiry > now + safetyBuffer`
- `deal.termsHash == localTermsHash`

If any mismatch -> DO NOT SEND tx.
