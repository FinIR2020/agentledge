# KYA Protocol — Hedera Apex Development Plan

## Current State (1,877 lines)
- ✅ Basic agent pipeline: Intel → Analyst → Trader
- ✅ KYA Identity (HTS NFT mint)
- ✅ Decision Logs (HCS messages)
- ✅ Human Oversight (configurable thresholds)
- ✅ Trust Scores (multi-dimensional)
- ✅ SWARM token payments between agents
- ✅ REST API + Frontend dashboard
- ✅ NL Chat (basic intent routing)

## What's Missing for Hedera Apex (MUST HAVE)

### P0 — Critical (days 1-7)
1. **HCS-10 / OpenConvAI Integration** — Agent-to-agent comms via HCS-10 standard
2. **HOL Registry Broker Registration** — Register agents in hol.org registry
3. **x402 Payment Protocol** — Replace manual transfers with x402 micropayments
4. **Hedera Agent Kit V3** — Use official SDK for agent operations
5. **Real HBAR/USDC Demo** — Live testnet trading scenario
6. **Enhanced Frontend** — Professional dashboard with charts, real-time updates

### P1 — Important (days 8-14)
7. **WebSocket Real-time Push** — Replace polling with WS
8. **Decision Log Explorer** — Query HCS messages from mirror node
9. **Trust Score Visualization** — Charts showing score changes over time
10. **Agent Economy Dashboard** — Token flow visualization
11. **Multi-cycle Auto Mode** — Continuous monitoring with configurable intervals

### P2 — Nice to Have (days 15-21)
12. **Polymarket Analysis Module** — Real market data for demo
13. **Video-ready Demo Script** — Automated demo sequence
14. **README + Documentation** — Developer-friendly docs

## Technical Architecture (Target)

```
┌─────────────────────────────────────────────────┐
│                  Frontend (SPA)                   │
│  Dashboard │ Decision Explorer │ Trust Scores     │
│  Agent Economy │ Chat │ Human Oversight Panel     │
└──────────────────────┬──────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────┴──────────────────────────┐
│              API Server (Express)                 │
│  /api/status │ /api/kya/* │ /api/chat │ /ws      │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│           KYA Protocol Core Engine                │
│                                                   │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ Identity │  │ Decision │  │ Human Oversight  │ │
│  │ Registry │  │   Logs   │  │   + Approval     │ │
│  └────┬─────┘  └────┬─────┘  └────────┬────────┘ │
│       │              │                 │          │
│  ┌────┴─────────────┴─────────────────┴────────┐ │
│  │              Trust Score Engine               │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│             Multi-Agent Pipeline                  │
│                                                   │
│  Intel Agent ──x402──► Analyst Agent ──x402──►   │
│                        Trader Agent               │
│       │                    │              │       │
│       └── HCS-10 ──────── └── HCS-10 ────┘       │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│              Hedera Network (Testnet)             │
│                                                   │
│  HTS (SWARM + KYA NFT)  │  HCS (Decision Logs)  │
│  HCS-10 (Agent Comms)   │  x402 (Micropayments) │
│  HOL Registry            │  Mirror Node (Query)  │
└─────────────────────────────────────────────────┘
```

## Day-by-Day Schedule

### Week 1 (Feb 24 — Mar 2): Core Hedera Integration
- Day 1-2: HCS-10 agent communication protocol
- Day 3-4: HOL Registry Broker integration
- Day 5-6: x402 payment protocol
- Day 7: Hedera Agent Kit V3 migration + testing

### Week 2 (Mar 3 — Mar 9): Frontend + Demo
- Day 8-9: Professional frontend redesign
- Day 10-11: WebSocket + real-time updates
- Day 12: Trust score charts + decision explorer
- Day 13-14: End-to-end demo scenario polishing

### Week 3 (Mar 10 — Mar 16): Video + Submit
- Day 15-16: Demo script + video recording guide
- Day 17-18: README, docs, submission materials
- Day 19-20: Bug fixes, edge cases, final testing
- Day 21: Record video + submit Hedera Apex

### Week 4 (Mar 17 — Mar 24): ERC-8004 + GitLab Adaptation
- Day 22-23: ERC-8004 version (Identity Registry rewrite)
- Day 24-25: GitLab Duo version (DevSecOps narrative)
- Day 26-28: Videos + submissions for both

## Scoring Target Mapping

| Criteria (Weight) | Current Score | Target | How |
|-------------------|---------------|--------|-----|
| Innovation (10%) | 7/10 | 9/10 | KYA = a16z thesis |
| Feasibility (10%) | 6/10 | 8/10 | Live testnet demo |
| Execution (20%) | 5/10 | 9/10 | Full working system |
| Integration (15%) | 4/10 | 9/10 | HCS-10 + HOL + x402 + Agent Kit |
| Success (20%) | 5/10 | 8/10 | Real HBAR/USDC scenario |
| Validation (15%) | 8/10 | 9/10 | 180+ sources, market research |
| Pitch (10%) | 0/10 | 8/10 | Video |
