# AgentLedge — Recording Guide (Shot-by-Shot)

Record each segment separately. Do 2-3 takes of each. Pick the best. Stitch in iMovie.

---

## Pre-flight

```
[ ] Backend running (node server.js or deployed URL)
[ ] Frontend accessible at http://localhost:3000 (or deployed URL)
[ ] Dashboard loads with 6 stat cards visible
[ ] At least 1 previous cycle run (so decisions table has data)
[ ] Chrome zoomed to 110%
[ ] Only these tabs open:
    - Tab 1: AgentLedge Dashboard
    - Tab 2: HashScan testnet (hashscan.io/testnet)
[ ] Mic tested
[ ] Do Not Disturb ON
[ ] Script on phone or second monitor
```

---

## Segment A: Title Card (5 seconds)

**Create in Canva or Keynote:**
- Line 1: **AgentLedge**
- Line 2: *The On-Chain Audit Trail for AI Agents*
- Line 3: Hedera Hello Future Apex Hackathon 2026
- Background: Dark (#0f172a) with green (#10b981) accents

**Say:** Nothing

**File name:** `segment-A-title.mov`

---

## Segment B: Problem + Sarah (25 seconds)

**Screen:** Dashboard overview (blurred or just loading)

**Say:**
> AI agents manage billions in DeFi — with zero accountability. Under FINRA twenty-twenty-six, US licensed firms must prove their AI is auditable. Who decided what, when, and why.
>
> Meet Sarah, a Chief Compliance Officer. FINRA examiners arrive next week. Without AgentLedge, her team pulls an all-nighter assembling logs from scattered systems. With AgentLedge, every AI decision is already on Hedera. She opens the dashboard, filters by agent and risk level, and exports the audit trail — with one-click HashScan links.

**Action:** Slow pan across dashboard as you speak. Move cursor over the stat cards.

**File name:** `segment-B-problem.mov`

---

## Segment C: Dashboard Overview (15 seconds)

**Screen:** Dashboard fully loaded — 6 stat cards visible

**Say:**
> Let's see this in action. The protocol is initialized — three agents are ready: IntelAgent gathers market data, AnalystAgent evaluates risk, and TraderAgent makes decisions.

**Action:** Point cursor at each stat card as you name it. Show the agent count, decision count, cycle count.

**File name:** `segment-C-dashboard.mov`

---

## Segment D: Run Cycle (40 seconds)

**This is the live demo segment — record 3+ takes.**

**Screen:** Dashboard → click "Run Cycle" → WebSocket feed shows live updates

**Say:**
> I'll start a cycle. [Click Run Cycle] Watch the live feed — you can see each agent reporting in real time. Decisions are scored, risk-tagged, and logged to Hedera's Consensus Service. The trust scores update after every cycle.

**Action:**
1. Click "Initialize Protocol" if not already initialized (2 seconds)
2. Click "Run Cycle" button (1 second)
3. Point cursor at the WebSocket live feed as messages appear
4. Wait for cycle to complete — stats update

**IMPORTANT:** The WebSocket feed is the visual proof of multi-agent activity. Make sure the text is readable.

**File name:** `segment-D-run-cycle.mov`

---

## Segment E: HashScan Verification (30 seconds)

**This is the MOST IMPORTANT segment for Hedera judges.**

**Screen:** Decision table → click a sequence number → HashScan opens in new tab

**Say:**
> Here's the key part. Every decision has an on-chain receipt. I'll click this sequence number. [Click] This is HashScan — Hedera's block explorer. You can see the decision data, the timestamp, and the topic ID. An examiner can verify this independently, without trusting our system at all. That's the point — trust is earned, not assumed.

**Action:**
1. Scroll to a decision row in the table (2 seconds)
2. Click the green sequence number link (1 second)
3. HashScan opens — point cursor at the message data, timestamp, topic ID
4. Pause on HashScan for 5+ seconds so judges can read it

**CRITICAL:** If the HashScan page shows real testnet data, this single shot is worth more than the entire rest of the video for Hedera judges.

**File name:** `segment-E-hashscan.mov`

---

## Segment F: Agent Radar + Oversight (25 seconds)

**Screen:** Agent Radar tab → trust score radar charts

**Say:**
> Each agent has a trust profile. The radar chart shows five dimensions — accuracy, consistency, risk awareness, compliance, and speed. High-risk decisions above the threshold require human approval before execution. Sarah's team sets the policy — the system enforces it.

**Action:**
1. Click "Agent Radar" tab (if separate view)
2. Show the radar charts for each agent
3. Hover over data points

**File name:** `segment-F-radar.mov`

---

## Segment G: Closing Card (20 seconds)

**Screen:** Closing card or dashboard with overlay text

**Say:**
> AgentLedge. The on-chain audit trail for AI agents. Every agent has an identity. Every decision is logged. High-risk actions need approval. Trust is earned, not assumed. Built for the Hedera Hello Future Apex Hackathon twenty-twenty-six. Thanks for watching.

**Action:** Slow, confident delivery. Hold card for 3 seconds of silence.

**File name:** `segment-G-closing.mov`

---

## File Inventory After Recording

```
~/Desktop/agentledge-video/
├── segment-A-title.mov
├── segment-B-problem.mov
├── segment-C-dashboard.mov
├── segment-D-run-cycle.mov       ← record 3+ times, pick best
├── segment-E-hashscan.mov        ← MOST IMPORTANT, record 3+ times
├── segment-F-radar.mov
├── segment-G-closing.mov
└── voiceover/                     ← ElevenLabs audio if using AI voice
    └── ...
```

## Quality Check Before Editing

Play each segment and verify:
- [ ] Audio is clear
- [ ] Dashboard text is readable at 110%+ zoom
- [ ] HashScan page clearly shows testnet data with readable topic ID
- [ ] WebSocket feed messages are visible during run cycle
- [ ] No personal data visible
- [ ] Total raw time ~4-5 minutes (will trim to <3 in editing)
