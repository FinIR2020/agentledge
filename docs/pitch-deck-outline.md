# AgentLedge — Pitch Deck (10 slides)

Use this outline in Google Slides, PowerPoint, or similar. Each slide targets specific judging criteria.

---

## Slide 1: Title

**Title:** AgentLedge — The On-Chain Audit Trail for AI Agents
**Subtitle:** Every agent has an identity. Every decision is logged. Trust is earned, not assumed.
**Footer:** Hedera Hello Future Apex Hackathon 2026

**Notes:** Open with the tagline. Clean design, no bullets.

---

## Slide 2: Sarah's Story (The Human Hook)

**Title:** 11 PM. Six Hours Until FINRA Arrives.

**Visual:** Split screen — stressed CCO vs. calm AgentLedge dashboard

**Story (3 sentences):**
- Sarah is a CCO at a US investment adviser. Her AI agents made 847 decisions this quarter.
- **Without AgentLedge:** All-nighter assembling spreadsheets. Can't prove records weren't altered.
- **With AgentLedge:** She opens the dashboard, filters by agent and risk, exports with HashScan links. Exam result: COMPLIANT.

**One-liner:** *"Compliance evidence in minutes, not assembled in days."*

**Notes:** Lead with the human. Get judges emotionally invested before explaining the tech.

---

## Slide 3: The Problem

**Title:** AI Agents: Billions Managed, Zero Accountability

**Bullets:**
- **Giza Protocol**: $35M+ AUA — no decision transparency
- **2 out of 3 trading bots are scams** (Reddit surveys) — users can't verify behavior
- **96:1**: Non-human identities outnumber employees, but can't prove who they are (a16z, 2025)
- **FINRA 2026**: First-ever US mandate — AI agents must be auditable: supervision, testing, recordkeeping

**Notes:** "The regulation is real, the deadline is now, and nobody has built the infrastructure."

---

## Slide 4: The Market

**Title:** $24B Compliance Market, Zero AI Audit Solutions

| Segment | Count | Need |
|---------|-------|------|
| SEC-Registered RIAs | 15,400+ | AI supervision under FINRA 2026 |
| FINRA Broker-Dealers | 3,400+ | Recordkeeping for AI decisions |
| Digital Asset Firms | 5,000+ | Audit trails for DeFi agents |

**Key stat:** US financial compliance technology spend: ~$24B annually (Grand View Research). AI agent auditability is a new, unserved segment within this market.

**Notes:** "These aren't hypothetical customers. Every one of these firms faces regulatory action without AI audit trails."

**Target: Market Fit (20% weight)**

---

## Slide 5: The Solution

**Title:** AgentLedge — Identity, Logs, Oversight, Trust

**Flow (visual):**
```
IDENTITY (HTS NFT) → DECISION LOGS (HCS) → HUMAN APPROVAL → TRUST SCORE
```

**Key capabilities:**
- Immutable decision logs with who/what/why/when (FINRA recordkeeping)
- Configurable approval thresholds (FINRA supervision)
- 6-dimension behavior-based trust scoring (FINRA testing)
- Independent verification via HashScan

**Innovation:** *Behavior-based trust scoring validated against on-chain outcomes + configurable human oversight — a new infrastructure primitive.*

**Notes:** Map each capability to the FINRA requirement it satisfies.

---

## Slide 6: Why Hedera (5 Services Deep)

**Title:** Built on Hedera — Five Services Integrated

| Service | How We Use It |
|---------|---------------|
| **HCS** | Immutable decision logs with consensus timestamps |
| **HTS** | Agent identity NFTs + SWARM economy token |
| **HCS-10** | Decentralized agent-to-agent messaging |
| **x402** | Micropayments: Intel 0.50, Analysis 1.00, Execution 0.25 HBAR |
| **HOL** | Agent discovery in 65K+ registry |

**Plus:** 43 Agent Kit tools via official `hedera-agent-kit`

**Notes:** "We didn't just build on Hedera. We went all-in on every available service."

**Target: Hedera Integration (15% weight)**

---

## Slide 7: Live Demo

**Title:** Live: Dashboard → Cycle → HashScan Verification

**Content:** Screenshot or embedded clip showing:
1. Dashboard with 6 stat cards, trust chart, live WebSocket feed
2. Run Cycle → agents report → decisions appear
3. Click decision → Verify on HashScan → immutable proof
4. x402 Economy tab → payment settlement
5. Oversight tab → human approval queue

**Notes:** "Every action you see creates an on-chain record. Let me show you the proof."

---

## Slide 8: Differentiation

**Title:** The Full Stack vs. Point Solutions

| Capability | Giza ($35M AUA) | Almanak ($27M TVL) | AgentLedge |
|-----------|:---:|:---:|:---:|
| Production AUM | $35M+ | $27M TVL | Testnet (pre-launch) |
| On-chain Decisions | Off-chain | Off-chain | HCS immutable |
| Agent Identity | No | No | HTS NFT |
| Human Oversight | No | No | Configurable |
| Trust Scoring | No | No | 6-dimension |
| FINRA Compliance | Not designed | Not designed | Core goal |

*Giza and Almanak have traction. AgentLedge is the compliance layer they'll need.*

**Notes:** Acknowledge competitors' strengths, then frame your advantage.

---

## Slide 9: Business Model & Roadmap

**Title:** Path to Market

**Business Model:**
- **Free tier**: Indie developers, testnet usage
- **Pro**: $49/agent/month — full audit trail + compliance exports
- **Enterprise**: Custom pricing — SSO, role-based approvals, dedicated support

**Roadmap:**
- **Q2 2026**: Mainnet deployment + SaucerSwap integration
- **Q3 2026**: Enterprise pilot with 2-3 RIAs
- **Q4 2026**: Compliance export templates (FINRA format) + ZK proofs for privacy
- **2027**: Cross-chain agent identity + SDK for third-party agents

**Notes:** "The revenue model is simple: per-agent subscription for compliance teams."

**Target: Feasibility (10% weight)**

---

## Slide 10: Technical Highlights + Close

**Title:** AgentLedge — Production-Ready

**Stats:**
- 3,700+ lines | 26/26 tests passing | 19 source files
- 5 Hedera services | 43 Agent Kit tools | Real testnet transactions
- Claude AI-powered analysis with on-chain reasoning logs
- E2E pipeline: 3/3 cycles pass, avg 61.4s/cycle

**Closing:** *"Every AI agent decision, auditable and verifiable on Hedera. Thank you."*

**Links:** GitHub | Demo Video | Devpost

---

## Slide-to-Criteria Mapping

| Slide | Primary Criteria | Weight |
|-------|-----------------|--------|
| 2 (Sarah) + 4 (Market) | Market Fit | 20% |
| 7 (Demo) + 10 (Stats) | Execution Quality | 20% |
| 10 (Tests) | Validation & Testing | 15% |
| 6 (5 Services) | Hedera Integration | 15% |
| 5 (Innovation callout) | Innovation | 10% |
| 9 (Business + Roadmap) | Feasibility | 10% |
| 2 (Sarah hook) + delivery | Pitch Quality | 10% |
