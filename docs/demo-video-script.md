# AgentLedge — Demo Video Script (5-Minute Version)

**Duration:** ≤5 minutes | **Language:** English
**Goal:** Emotional hook → Problem → Live demo (all 5 Hedera services) → HashScan proof → Traction → Close with stats.

---

## Timeline

| Time | Section | What to show / say | On-screen overlay |
|------|---------|--------------------|-------------------|
| **0:00–0:15** | **Hook (Sarah)** | *"It's 11 PM. Sarah, a Chief Compliance Officer, has six hours before FINRA examiners arrive. Her AI agents made 847 decisions this quarter — she can't prove a single one."* | Split screen: stressed CCO vs. calm dashboard |
| **0:15–0:40** | **Problem** | *"AI agents manage billions in DeFi with zero accountability. In 2026, FINRA issued its first-ever guidance: US firms must prove AI is auditable — who decided what, when, and why. 15,400 RIAs and 3,400 broker-dealers need this. No existing protocol solves it."* | Text: "FINRA 2026: AI Audit Mandate" + market size |
| **0:40–1:10** | **Solution** | *"AgentLedge. The on-chain audit trail for AI agents on Hedera. Every agent gets an on-chain NFT identity. Every decision is logged to HCS. High-risk actions need human approval. Trust is earned through verifiable behavior — not assumptions."* Show architecture diagram. | Flow diagram: Identity → Logs → Approval → Trust |
| **1:10–2:20** | **Live Demo: Initialize** | Click **Initialize Protocol** → show 3 agents created with identity NFTs. Point out: Agent Kit created accounts, minted identity NFTs, set up HCS topic, registered in HOL. *"Three agents initialized: Intel, Analyst, Trader. Each has an NFT identity on Hedera Token Service, registered in the HOL Registry — that's 65,000+ agents in the ecosystem."* | Topic IDs, token IDs visible on dashboard |
| **2:20–3:20** | **Live Demo: Run Cycle** | Click **Run Cycle** → watch WebSocket feed in real-time. *"Watch this pipeline in real-time. IntelAgent gathers market data from Binance. AnalystAgent uses Claude AI to analyze strategy. TraderAgent executes — but this is a HIGH risk decision, so it's paused for human approval."* Point out trust scores updating, x402 payments settling. | Real-time WebSocket feed, trust score chart |
| **3:20–3:40** | **x402 Economy** | Switch to **x402 Economy** tab. *"Every service has a price. AnalystAgent paid 0.50 HBAR to IntelAgent via x402 for the intel report. TraderAgent paid 1.00 HBAR for the strategy. All payments verifiable on-chain."* | Text: "x402: Agent-to-Agent Micropayments" |
| **3:40–3:55** | **HCS-10 Communication** | Switch to **HCS-10** tab. *"Agents communicate via HCS-10, Hedera's decentralized messaging protocol. Connection requests, service negotiation — all tracked."* | Text: "HCS-10: OpenConvAI Protocol" |
| **3:55–4:20** | **HashScan Verification** | Click a decision → click **Verify on HashScan** → zoom into topic message. *"This is the proof. Consensus timestamp, topic ID, immutable data. A FINRA examiner opens HashScan, verifies independently — zero trust required. This is what Sarah needs."* Read the topic ID aloud. | Zoom on HashScan message data |
| **4:20–4:40** | **Human Oversight + Export** | Switch to **Oversight** tab → show approval queue. *"High-risk decisions are paused. Sarah's team approves before execution. The approval itself is logged on-chain."* Click **Export Audit Report**. *"One click: full compliance report with HashScan links for every decision."* | Text: "Configurable Human Oversight" |
| **4:40–5:00** | **Closing** | *"AgentLedge. 4,000 lines of production code. 26 tests passing. Five Hedera services: HCS, HTS, HCS-10, x402, and HOL. 45 tools from Hedera Agent Kit and SaucerSwap V2. The on-chain audit trail for AI agents. Built for FINRA 2026 compliance. Built on Hedera."* | Stats on screen + repo URL + HashScan links |

---

## Key shots (mapped to judging criteria)

| Shot | Judging Criteria | Weight |
|------|-----------------|--------|
| Dashboard + Run Cycle + Export | Execution Quality | 20% |
| FINRA story + Sarah + Market size | Success / Market Fit | 20% |
| HashScan verification links | Hedera Integration | 15% |
| "26/26 tests passing" + testnet data | Validation & Testing | 15% |
| "Behavior-based trust scoring" + HOL | Innovation | 10% |
| Roadmap mention + SaaS model | Feasibility | 10% |
| Confident delivery + visual overlays | Pitch Quality | 10% |

---

## Visual production notes

- **Text overlays**: Show topic IDs, transaction IDs, and trust score numbers on screen as you say them
- **Zoom**: Use browser zoom on HashScan message data field for 3 seconds
- **Subtitles**: Add English subtitles via CapCut or Descript
- **Backup**: If testnet is slow during recording, use a pre-recorded successful cycle and narrate over it
- **Pacing**: 130-140 words per minute. Pause 1 second after each key claim.
- **Resolution**: 1920x1080 minimum

## Checklist

- [ ] Video ≤5 minutes, English
- [ ] Emotional Sarah hook in first 15 seconds
- [ ] All 5 Hedera services explicitly named and shown (HCS, HTS, HCS-10, x402, HOL)
- [ ] Agent Kit + SaucerSwap integration mentioned
- [ ] x402 payment demonstrated (not just mentioned)
- [ ] HCS-10 communication shown
- [ ] HashScan verification with zoom on topic data
- [ ] Human oversight approval queue shown
- [ ] Export audit report demonstrated
- [ ] Code stats: 4,000+ LOC, 26/26 tests, 45 tools
- [ ] Market context: 15,400 RIAs, FINRA 2026
- [ ] Text overlays on all key data points
- [ ] Upload to YouTube; add link to StackUp submission
