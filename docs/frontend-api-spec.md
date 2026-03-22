# KYA Protocol — Frontend API Specification

> Give this document to Gemini AI Studio to generate the frontend dashboard.
> All endpoints return JSON. Base URL: `http://localhost:3000`

---

## 🎯 What We Need

A **professional, single-page dashboard** for KYA Protocol — an AI agent trust & accountability system on Hedera blockchain. Think: **Bloomberg Terminal meets AI Agent Observatory**.

### Tech Stack
- **Single HTML file** (`index.html`) with inline CSS + JS
- **No build tools** — must work by opening in browser
- **Libraries** (CDN): Chart.js, Lucide Icons (or similar)
- **Color scheme**: Dark theme (#0a0f1e background, #00d4aa accent green, #ff6b6b red, #ffd93d yellow, #4ecdc4 teal)
- **All text in English**
- **Responsive** — works on 1440px+ screens, decent on tablet

### Design Reference
- Header: Protocol name + version + network indicator (testnet/mainnet badge)
- Left sidebar: Navigation (Dashboard, Agents, Decisions, Payments, Communication, Settings)
- Main content: Dynamic panels based on selected page

---

## 📐 Page Layout

### Page 1: Dashboard (Home)

**Top row — 6 stat cards:**

| Card | Data Source | Format |
|------|-----------|--------|
| Protocol Status | `GET /api/status` → `.initialized` | Green "ONLINE" / Red "OFFLINE" |
| Total Cycles | `GET /api/status` → `.cycleCount` | Number |
| Agent Count | `GET /api/status` → `.setup.agents` | Count of keys |
| Total Decisions | `GET /api/kya/decisions?limit=1` → `.count` | Number |
| x402 Volume | `GET /api/x402/stats` → `.stats.totalVolume` | "X.XX HBAR" |
| HCS-10 Messages | `GET /api/status` → `.infrastructure.hcs10.messages` | Number |

**Middle row — 2 charts:**

1. **Trust Score Chart** (Bar chart)
   - Source: `GET /api/kya/trust-scores`
   - X axis: Agent names
   - Y axis: 0-100
   - Colors: PLATINUM(#E5E4E2) ≥90, GOLD(#FFD700) ≥75, SILVER(#C0C0C0) ≥60, BRONZE(#CD7F32) ≥40, UNTRUSTED(#FF0000) <40
   - Show tier label on each bar

2. **Cycle Performance Chart** (Line chart)
   - Source: `GET /api/status` → `.history[]`
   - X axis: Cycle numbers
   - Y axis: Duration (ms)
   - Secondary line: confidence from `.history[].analysis.confidence`

**Bottom row — 2 panels:**

1. **Recent Decisions** (scrollable table, last 10)
   - Source: `GET /api/kya/decisions?limit=10`
   - Columns: Time | Agent | Type | Action | Confidence | Risk | On-Chain Seq#
   - Color-code risk: LOW=green, MEDIUM=yellow, HIGH=red

2. **Live Activity Feed** (WebSocket events)
   - Connect to `ws://localhost:3000/ws`
   - Events: `initialized`, `cycle_start`, `cycle_complete`, `cycle_error`, `approval`
   - Show as scrolling log with timestamps

### Page 2: Agents

**Agent cards (3 cards, one per agent):**

Source: `GET /api/kya/trust-scores` + `GET /api/hcs10/agents` + `GET /api/hol/agents`

Each card shows:
- Agent name + KYA ID
- Trust Score (big number) + Tier badge
- Trust dimensions radar chart:
  - `dimensions.accuracy`
  - `dimensions.consistency`
  - `dimensions.humanApproval`
  - `dimensions.riskManagement`
- Account ID (link to HashScan: `https://hashscan.io/testnet/account/{accountId}`)
- HCS-10 Topics: Inbound / Outbound / Profile
- Capabilities list (badges)
- Total decisions count
- HOL Registry status (✅ registered / ⚠️ pending)

### Page 3: Decision Explorer

**Filter bar:**
- Agent dropdown (All / IntelAgent / AnalystAgent / TraderAgent)
- Type filter (All / INTEL_REPORT / ANALYSIS_COMPLETE / TRADE_EXECUTED / HUMAN_APPROVAL_*)
- Limit slider (10-100)

**Decision table:**

Source: `GET /api/kya/decisions?agent={agent}&limit={limit}`

Columns:
| Column | Field | Notes |
|--------|-------|-------|
| # | index | Row number |
| Time | `.timestamp` | Relative (e.g., "2m ago") |
| Agent | `.agent` | Colored badge |
| Type | `.type` | Icon + text |
| Action | `.action` | Full text |
| Confidence | `.confidence` | Progress bar (0-100%) |
| Risk | `.riskLevel` | Color badge |
| Reasoning | `.reasoning[]` | Expandable (click to show) |
| On-Chain | `.sequenceNumber` | Link to HashScan topic message |

**Decision detail modal (click any row):**
- Full reasoning list
- Data sources (`.dataSources[]`)
- Inputs (`.inputs`)
- Outputs (`.outputs`)
- Human approval status (if applicable)
- "Verify On-Chain" button → opens HashScan link

### Page 4: Payments (x402 Economy)

**Top stats:**

Source: `GET /api/x402/stats`

| Stat | Field |
|------|-------|
| Total Payments | `.stats.totalPayments` |
| Total Volume | `.stats.totalVolume` HBAR |
| Unique Services | count of `.stats.byService` keys |
| On-Chain TXs | `.stats.onChainTxIds.length` |

**Service Registry table:**

Source: `GET /api/x402/services`

| Column | Field |
|--------|-------|
| Service ID | key |
| Seller | `.seller` |
| Price | `.price` HBAR |
| Total Payments | `.totalPayments` |
| Total Revenue | `.totalRevenue` HBAR |

**Payment flow visualization:**

Show a horizontal flow diagram:
```
[IntelAgent] --0.50 HBAR--> [AnalystAgent] --1.00 HBAR--> [TraderAgent]
     ↑ intel-report              ↑ strategy-analysis
```

**Payment history table:**

Source: `GET /api/x402/payments`

| Column | Field |
|--------|-------|
| Time | `.timestamp` |
| From | `.from` |
| To | `.to` |
| Amount | `.amount` HBAR |
| Service | `.serviceId` |
| TX ID | `.transactionId` (link to HashScan) |
| Status | `.status` |

### Page 5: Communication (HCS-10)

**Connection map:**

Source: `GET /api/hcs10/connections`

Visual: 3 nodes (circles) with lines between connected agents. Show connection topic ID on each line.

```
    [IntelAgent]
      /        \
     /          \
[AnalystAgent]--[TraderAgent]
```

**Agent directory table:**

Source: `GET /api/hcs10/agents`

| Column | Field |
|--------|-------|
| Name | key |
| Account | `.accountId` |
| Inbound Topic | `.inboundTopicId` (link to HashScan) |
| Outbound Topic | `.outboundTopicId` (link to HashScan) |
| Connections | `.connections.length` |
| SDK | `.sdk` (✅/❌) |

**Message log:**

Source: `GET /api/hcs10/messages`

| Column | Field |
|--------|-------|
| Time | `.timestamp` |
| From | `.from` |
| To | `.to` |
| Type | `.type` |
| Service | `.service` |
| Request ID | `.request_id` |
| Topic | `.connectionTopicId` (link to HashScan) |

### Page 6: Settings / Human Oversight

**Oversight config form:**

Source: `GET /api/kya/config` → edit → `POST /api/kya/config`

| Field | Type | Description |
|-------|------|-------------|
| Trade Amount Threshold | Number input ($) | Trades above this require approval |
| Risk Level Threshold | Select (LOW/MEDIUM/HIGH) | This risk level and above require approval |
| Min Confidence for Auto | Slider (0-100%) | Below this confidence, require approval |
| Require All Approvals | Toggle | If ON, all actions need approval |

**Pending approvals:**

Source: `GET /api/kya/pending-approvals`

Each approval card:
- Agent name, action, risk level, confidence
- "Approve" button → `POST /api/kya/approve/{id}`
- "Reject" button → `POST /api/kya/reject/{id}` (with reason input)

---

## 🔌 API Reference

### Core

```
GET  /api/health              → { ok, protocol, version, uptime, wsClients }
GET  /api/status              → { protocol, version, initialized, isRunning, autoMode, setup, cycleCount, history[], trustScores, infrastructure }
POST /api/initialize          → { ok, setup }  (no body needed)
POST /api/run-cycle           → { ok, result }  (optional body: { query: "analyze HBAR" })
POST /api/auto-mode           → { ok, msg }     (body: { enabled: true/false, intervalMs: 30000 })
GET  /api/full-status         → { ok, protocol, version, agents, trustScores, hcs10, x402, hol, decisions, agentKit }
```

### KYA Identity
```
GET  /api/kya/agents          → { ok, agents: { name: { kyaId, serial, role, capabilities, model } } }
```

### KYA Decisions
```
GET  /api/kya/decisions?limit=50&agent=IntelAgent → { ok, count, decisions[] }
GET  /api/kya/decisions/stats/:agent              → { ok, stats }
```

Decision object:
```json
{
  "agent": "AnalystAgent",
  "kyaId": "KYA-0.0.xxx-1",
  "type": "ANALYSIS_COMPLETE",
  "action": "Produced balanced strategy STR-123",
  "reasoning": ["Based on intel report...", "RSI indicates..."],
  "confidence": 75,
  "riskLevel": "MEDIUM",
  "dataSources": [{"source": "Intel Report", "id": "RPT-123"}],
  "inputs": { "reportId": "RPT-123" },
  "outputs": { "strategyId": "STR-123" },
  "humanApprovalRequired": false,
  "timestamp": "2026-02-24T12:00:00Z",
  "sequenceNumber": 42,
  "txId": "0.0.7992175@1234567890.123456789",
  "topicId": "0.0.8014050"
}
```

### KYA Trust Scores
```
GET  /api/kya/trust-scores           → { ok, trustScores: { AgentName: { trustScore, totalDecisions, dimensions, tier } } }
GET  /api/kya/trust-scores/:agent    → { ok, trustScore, totalDecisions, dimensions, tier }
GET  /api/kya/trust-scores/:agent/history → { ok, history[] }
```

Trust score object:
```json
{
  "trustScore": 92,
  "kyaId": "KYA-0.0.xxx-1",
  "totalDecisions": 15,
  "dimensions": {
    "accuracy": 95,
    "consistency": 88,
    "humanApproval": 100,
    "riskManagement": 85
  },
  "tier": {
    "tier": "PLATINUM",
    "label": "Platinum Trust",
    "emoji": "💎",
    "minScore": 90,
    "benefits": "Full autonomous operation"
  }
}
```

### KYA Human Oversight
```
GET  /api/kya/pending-approvals      → { ok, approvals[] }
POST /api/kya/approve/:id            → { ok, ... }   (body: { approvedBy: "human" })
POST /api/kya/reject/:id             → { ok, ... }   (body: { rejectedBy: "human", reason: "too risky" })
GET  /api/kya/config                 → { ok, config }
POST /api/kya/config                 → { ok, config } (body: partial config update)
```

Config object:
```json
{
  "tradeAmountThreshold": 50,
  "riskLevelThreshold": "HIGH",
  "minConfidenceForAuto": 70,
  "agentOverrides": {},
  "requireAllApprovals": false,
  "approvalTimeoutMs": 300000
}
```

### HCS-10 Communication
```
GET  /api/hcs10/agents        → { ok, agents: { Name: { accountId, inboundTopicId, outboundTopicId, profileTopicId, connections[], sdk } } }
GET  /api/hcs10/connections   → { ok, connections: [{ id, from, to, connectionTopicId, status, createdAt }] }
GET  /api/hcs10/messages      → { ok, messages: [{ type, request_id, from, to, service, payload, timestamp, connectionTopicId }] }
```

### x402 Payments
```
GET  /api/x402/payments       → { ok, payments: [{ from, to, amount, currency, serviceId, transactionId, timestamp }] }
GET  /api/x402/stats          → { ok, stats: { totalPayments, totalVolume, byService: { serviceId: { count, volume } }, onChainTxIds[] } }
GET  /api/x402/services       → { ok, services: { serviceId: { seller, sellerAccountId, price, description, totalPayments, totalRevenue } } }
```

### HOL Registry
```
GET  /api/hol/agents          → { ok, agents: { Name: { accountId, kyaId, inboundTopicId, registryTopicId, guardedRegistrySuccess } }, registryTopicId }
```

### Mirror Node (On-Chain Verification)
```
GET  /api/mirror/decisions?limit=25     → { ok, topicId, count, messages[] }
GET  /api/mirror/verify/:sequenceNumber → { ok, verified, message, ... }
GET  /api/mirror/agents                 → { ok, kyaTokenId, count, agents[] }
GET  /api/mirror/account/:accountId     → { ok, account }
GET  /api/mirror/transactions/:accountId?limit=10 → { ok, transactions[] }
```

### Hedera Agent Kit
```
GET  /api/agent-kit/status    → { ok, initialized, toolCount, tools[], network, operatorAccountId }
GET  /api/agent-kit/tools     → { ok, count, tools: ["tool_name_1", ...] }
POST /api/agent-kit/execute   → result   (body: { tool: "tool_name", params: {} })
GET  /api/agent-kit/exchange-rate → { ... }
```

### NL Chat
```
POST /api/chat                → { ok, type, message, ...extra }
     body: { message: "Analyze the market" }
     
     Supported intents:
     - "analyze/market/run/trade" → runs a cycle
     - "trust/score/reputation" → shows trust scores
     - "payment/x402/economy" → shows payment stats
     - "hcs/message/communication" → shows HCS-10 info
     - "decision/log/history" → shows decisions
     - "status/help" → shows help
     - "what is kya/about" → about info
```

### WebSocket
```
ws://localhost:3000/ws

Events (JSON messages):
{ "event": "initialized", "data": { setup object }, "timestamp": "..." }
{ "event": "cycle_start", "data": { "cycle": 1 }, "timestamp": "..." }
{ "event": "cycle_complete", "data": { cycle result object }, "timestamp": "..." }
{ "event": "cycle_error", "data": { "error": "..." }, "timestamp": "..." }
{ "event": "approval", "data": { "id": "...", "status": "APPROVED" }, "timestamp": "..." }
```

---

## 🔗 HashScan Links

For any on-chain ID, link to HashScan:
- Topic: `https://hashscan.io/testnet/topic/{topicId}`
- Account: `https://hashscan.io/testnet/account/{accountId}`
- Token: `https://hashscan.io/testnet/token/{tokenId}`
- Transaction: `https://hashscan.io/testnet/transaction/{txId}`

(Replace `testnet` with `mainnet` for production)

---

## 🎨 UI Components Guide

### Action Buttons
- **Initialize Protocol** → `POST /api/initialize` (show loading spinner, disable during init)
- **Run Cycle** → `POST /api/run-cycle` (disable when `isRunning=true`)
- **Auto Mode Toggle** → `POST /api/auto-mode` with `{ enabled: true/false }`

### Refresh Strategy
- Dashboard stats: Poll `GET /api/status` every 5 seconds
- Or better: use WebSocket events to update in real-time
- Decision log: Refresh after each cycle_complete event
- Trust scores: Refresh after each cycle_complete event

### Toast Notifications
- On `cycle_complete`: "✅ Cycle #X complete — {sentiment} / {riskProfile}"
- On `cycle_error`: "❌ Cycle failed: {error}"
- On `approval`: "🛡️ Approval {status} for {id}"

---

## 📝 Important Notes

1. **Server must be initialized first** — Most endpoints return 400 "Not initialized" before `POST /api/initialize`
2. **Initialize takes 30-60 seconds** — It creates on-chain accounts, topics, tokens, and registers with HCS-10/HOL
3. **Each cycle takes 10-30 seconds** — Real Hedera transactions + Claude API calls
4. **All on-chain data is verifiable** — Every topicId, tokenId, accountId, txId can be verified on HashScan
5. **WebSocket** is optional but recommended for real-time UX
