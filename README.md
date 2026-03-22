<div align="center">
<h1>🌪️ Sterling Syndication Protocol</h1>
<p><b>Autonomous AI Syndicate & Interactive Fiction Engine</b></p>

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![WDK](https://img.shields.io/badge/Powered_by-WDK_(Tether)-00A68C?logo=tether)](https://tether.to/)
[![OpenClaw](https://img.shields.io/badge/AI_Agent-OpenClaw-FF4F00)](#)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react)](https://react.dev/)
[![Solidity](https://img.shields.io/badge/Smart_Contracts-Solidity-363636?logo=solidity)](https://soliditylang.org/)
[![Firebase](https://img.shields.io/badge/State_Sync-Firestore-FFCA28?logo=firebase)](https://firebase.google.com/)
</div>

<br/>

## 🏆 Hackathon Track
**Agent Wallets (WDK / Openclaw and Agents Integration)**

---

## 💔 The Problem

In the generative AI era, content creation is cheap, but distribution and monetization are not. Independent creators write incredible stories but lack the producer-grade capital allocation, marketing budgets, and growth execution needed to turn their IP into profitable franchises. Traditional publishers act as gatekeepers, taking up to 90% of the revenue and rights.

## 💡 The Solution: Sterling Syndication Protocol

**Twisly** introduces the **Sterling Syndication Protocol**: an autonomous AI investor room that evaluates IP without human bias and executes funding and distribution flows entirely on-chain. 

Sterling uses a proprietary evaluation model to score commercial potential, simulates investor personas to negotiate terms, and instantly allocates USDT capital via smart contracts to fund marketing and distribution.

---

## 🚀 End-to-End Flow

1. **Creator submits story** (web app).
2. `analyze_story` scores commercial potential and monetization signals.
3. `syndicate_review` simulates 6 investor personas with wallet-aware constraints.
4. Investor agents lock USDT on escrow via `makeOffer(...)`.
5. Creator accepts an offer -> settlement executes via `acceptOffer(...)`.
6. Sterling allocates marketing budget across channel wallets.
7. Reader purchases story routes; revenue loop closes on-chain.

---

## 🌟 Deep WDK Integration (Hackathon Core)

This project is built to demonstrate **Tether WDK** as the financial runtime for autonomous agents.

### 1) HD Wallet Orchestration for AI Personas

Using `WalletManagerEvm`, Twisly derives deterministic wallets from one seed:

- **0–5**: AI Investor personas
- **6**: Sterling treasury/ops wallet
- **1000+**: author wallets
- **2000+**: channel wallets
- **3000+**: buyer wallets (or forced single buyer wallet mode for demo stability)

### 2) WDK in Both SDK and MCP Modes

Twisly supports two execution paths:

- **WDK SDK** (`@tetherto/wdk-wallet-evm`) in-process execution
- **WDK MCP server** (`scripts/wdk-mcp-server.mjs`) for agent-tool style invocation

Exposed wallet operations include:

- token transfers
- ERC20 approvals
- contract transactions by derivation index
- balance / allowance / receipt reads

### 3) Autonomous Smart Contract Interaction

The bridge ABI-encodes calls via `ethers.Interface` and executes with WDK:

- escrow: `makeOffer(...)`, `acceptOffer(...)`, `offers(...)`
- story purchase: `approve(...)` + `purchaseStory(...)`

All money actions are logged for auditability.

---

## 🧠 OpenClaw Integration

The bridge calls OpenClaw chat-completions endpoint:

- endpoint: `OPENCLAW_URL`
- auth: `OPENCLAW_TOKEN`
- model: `agent:main`

> Underlying LLM depends on OpenClaw runtime configuration for `agent:main`.

---

## 📊 Narrative Asset Valuation Model (NAVM)

To evaluate IP without subjective human bias, Twisly uses a proprietary 9-factor algorithmic framework. The AI Scout agent reads the manuscript and scores it across two dimensions using a strict anti-inflationary scale (10 to 95):

**TSI (Theoretical Success Indicators) - Concept Level:**
- **CMA (Concept Marketability):** Can the premise be sold in one compelling sentence?
- **IER (IP Readiness):** Does it have a distinctive visual identity, lore, and franchise potential?
- **PSP (Parasocial Potential):** Does it fuel emotional attachment, shipping, or character obsession?

**TEI (Textual Execution Indicators) - Manuscript Level:**
- **VRS (Viral Resonance Score):** Density of quotable moments, edit-worthy spikes, and fandom-reactive scenes.
- **ACV (Activation Velocity):** Speed to the first meaningful conflict.
- **HTR (Hook Throughput Rate):** Density of mysteries, withheld truths, and scene-end tension.
- **PEL (Paywall Elasticity):** Chapter-end next-click pressure (crucial for monetization).
- **SMR (Serial Modularity Rating):** Capacity to expand through side-quests, new arcs, and lore ladders.
- **TWS (Twistability Score):** Natural support for monetizable narrative branches (alternate POVs, "what if" routes).

These metrics form the quantitative foundation that the Syndicate AI agents use to price their investment offers.

---

## 🏗️ Architecture

```mermaid
sequenceDiagram
participant U as User (Frontend)
participant F as Firestore (agent_tasks)
participant B as Bridge Worker (Node.js)
participant O as OpenClaw (LLM)
participant W as WDK
participant S as Sepolia Contracts

U->>F: Create task (pending)
F-->>B: onSnapshot task event
B->>F: status=processing

B->>O: analyze/syndicate prompt
O-->>B: strict JSON response

B->>W: execute wallet action
W->>S: send tx (escrow/marketing/buy)
S-->>W: tx receipt
W-->>B: hash + receipt

B->>F: status=completed + result + tx hashes
F-->>U: real-time UI update
```

---

## 🔄 Task Pipeline

`bridge.mjs` processes:

1. **`analyze_story`**
Narrative scoring, audience profile, monetization signals.

2. **`syndicate_review`**
Multi-investor decision emulation with wallet-aware constraints.
Offers include amount/equity/split and on-chain metadata.

3. **`contract_settlement`**
Escrow acceptance path using on-chain offer IDs from source syndicate data.

4. **`marketing_execution`**
Programmatic budget routing to channel wallets + generated campaign artifacts.

5. **`buy_story`**
Buyer wallet approval + contract purchase flow.

---

## ⛓️ Smart Contract Layer

**Deployed Contracts (Sepolia Testnet):**
- **Story Contract:** [0x45933728ED383B8f7DAe014e5ebdcD8315aBA1a7](https://sepolia.etherscan.io/address/0x45933728ED383B8f7DAe014e5ebdcD8315aBA1a7)
- **Escrow Contract:** [0x35F5d53Ed9Ff33FdCe8CeD7D7d26CDEB6bFA0607](https://sepolia.etherscan.io/address/0x35F5d53Ed9Ff33FdCe8CeD7D7d26CDEB6bFA0607)

Escrow integration uses:

- `makeOffer(bytes32 offerId, bytes32 campaignId, address author, address token, uint256 amount, uint64 expiry, bytes32 termsHash)`
- `acceptOffer(bytes32 offerId, address promoWallet)`
- `offers(bytes32 offerId) -> (campaignId, agent, author, token, amount, expiry, state, termsHash)`

Story purchase path uses:

- `purchaseStory(uint256 tokenId)` (with ERC20 `approve` before call)

---

## 🔍 Observability for Judges

- `data/money-audit.jsonl` — high-level money movement ledger
- `data/wdk-tool-log.jsonl` — low-level wallet operation traces
- `debug/` — raw model outputs and parser/debug artifacts
- Firestore `agent_tasks` — live status/result state machine

---

## 🛠️ Tech Stack

- **AI Orchestration**: OpenClaw
- **Wallet Runtime**: Tether WDK (`@tetherto/wdk`, `@tetherto/wdk-wallet-evm`)
- **Web3**: Ethers v6
- **Backend Worker**: Node.js (ESM)
- **State/Auth**: Firebase Firestore + Firebase Auth
- **Frontend**: React 19 + Vite

---

## 🛣️ Future Roadmap: The Twisly Engine

The Sterling Syndication Protocol is the financial and evaluation layer of **Twisly**—our proprietary interactive fiction engine that transforms written stories into visual novels with monetizable narrative branches (Twists).

Our roadmap focuses on bridging the gap between AI evaluation and real-world execution:

- **Phase 1 (Current):** Proxy-metric evaluation (NAVM) and autonomous capital allocation via WDK.
- **Phase 2:** Gradual integration of the Twisly Engine, allowing creators to automatically generate playable, monetizable visual novel routes from their funded manuscripts.
- **Phase 3:** Transitioning from proxy metrics to real-world data. We will feed actual player engagement statistics, conversion rates, and revenue cases back into the OpenClaw models to continuously train and refine the Syndicate's investment logic.
- **Phase 4:** Decentralized IP ownership and revenue sharing, where readers can co-invest alongside the AI Syndicate in emerging narrative franchises.

---

## 💻 Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase project credentials
- OpenClaw instance
- Sepolia RPC
- Sepolia ETH + Sepolia USDT (test funds)

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Fill in the required frontend variables in `.env`:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_PIMLICO_API_KEY` (for ERC-4337 gas sponsorship)
- *(and other VITE_ variables listed in .env.example)*

```bash
# Start the frontend dev server
npm run dev
```

### 2. AI Bridge Setup (Hackathon Bundle)

Navigate to the worker directory:
```bash
cd hackathon-bundle
npm install
cp .env.example .env
```

Fill required backend vars in `hackathon-bundle/.env`:

- `OPENCLAW_URL`
- `OPENCLAW_TOKEN`
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `AGENT_EMAIL` & `AGENT_PASSWORD`
- `WDK_SEED_PHRASE` (Master seed for HD wallets)
- `SEPOLIA_RPC_URL`

### Start the Autonomous Bridge

```bash
npm start
```

---

## ⚠️ Hackathon Notes

- This is a **testnet-first** autonomous finance prototype.
- Keep all secrets in runtime env only.
- Do not commit `.env`, seed phrases, or private keys.
- Use funded wallets and RPC plans that can handle burst load.

---

## 📄 License

Apache-2.0