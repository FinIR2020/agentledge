/**
 * 🌐 AgentLedge API Server v0.2.0
 * Full REST API + WebSocket for the AgentLedge Dashboard
 *
 * Integrations: HCS-10, x402, HOL Registry, AgentLedge Trust
 * AgentLedge — AgentLedge
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import WS from "ws";
const WebSocketServer = WS.Server;
import { SwarmCoordinator } from "./agents/coordinator.js";
import { getAllAgents } from "./kya/identity.js";
import { getDecisionHistory, getDecisionsByAgent, getAgentDecisionStats } from "./kya/decision-log.js";
import { getPendingApprovals, approveDecision, rejectDecision, getConfig, updateConfig } from "./kya/human-oversight.js";
import { getAllTrustScores, getAgentTrustScore, getTrustScoreHistory, getTrustTier } from "./kya/trust-score.js";
import { getAllHCS10Agents, getConnections, getMessageLog } from "./hedera/hcs10.js";
import { getPaymentHistory, getPaymentStats, getServiceRegistry } from "./hedera/x402.js";
import { getRegisteredHOLAgents, getRegistryTopicId } from "./hedera/hol-registry.js";
import { getTopicMessages, getNFTInfo, getAllNFTs, verifyDecision, getAccountInfo, getAccountTransactions } from "./hedera/mirror.js";
import { getToolkitStatus, getAvailableTools, runTool } from "./hedera/agent-kit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

let coordinator = null;
let setupData = null;
let isRunning = false;
let isInitializing = false;
let autoCycleInterval = null;

// ═══════════════════════════════════════════════
// WebSocket for real-time updates (using ws library)
// ═══════════════════════════════════════════════
const wss = new WebSocketServer({ server, path: "/ws" });
const wsClients = new Set();

wss.on("connection", (ws) => {
  wsClients.add(ws);
  ws.on("close", () => wsClients.delete(ws));
  ws.on("error", () => wsClients.delete(ws));
});

function broadcast(event, data) {
  const msg = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  for (const ws of wsClients) {
    try {
      if (ws.readyState === 1) ws.send(msg); // 1 = OPEN
    } catch (e) {
      wsClients.delete(ws);
    }
  }
}

app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

// ═══════════════════════════════════════════════
// Core API
// ═══════════════════════════════════════════════

app.get("/api/status", (req, res) => {
  try {
    res.json({
      protocol: "AgentLedge",
      version: "0.2.0",
      initialized: !!coordinator,
      isRunning,
      autoMode: !!autoCycleInterval,
      setup: setupData,
      cycleCount: coordinator?.cycleCount || 0,
      history: coordinator?.getHistory() || [],
      trustScores: getAllTrustScores(),
      infrastructure: {
        hcs10: { connections: getConnections().length, messages: getMessageLog().length },
        x402: getPaymentStats(),
        hol: { registryTopicId: getRegistryTopicId(), agents: Object.keys(getRegisteredHOLAgents()).length },
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/initialize", async (req, res) => {
  if (coordinator) return res.json({ ok: true, setup: setupData, msg: "Already initialized" });
  if (isInitializing) return res.status(409).json({ ok: false, error: "Initialization already in progress" });
  try {
    isInitializing = true;
    coordinator = new SwarmCoordinator();
    setupData = await coordinator.initialize();
    broadcast("initialized", setupData);
    res.json({ ok: true, setup: setupData });
  } catch (e) {
    coordinator = null;
    console.error("❌ Initialize failed:", e);
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    isInitializing = false;
  }
});

app.post("/api/run-cycle", async (req, res) => {
  if (!coordinator) return res.status(400).json({ ok: false, error: "Not initialized" });
  if (isRunning) return res.status(409).json({ ok: false, error: "Cycle already running" });
  try {
    isRunning = true;
    broadcast("cycle_start", { cycle: coordinator.cycleCount + 1 });
    const result = await coordinator.runCycle(req.body?.query);
    isRunning = false;
    if (result.humanOversight?.required) {
      broadcast("approval_required", {
        agent: "TraderAgent",
        action: result.humanOversight.reasons?.join(", ") || "High-risk decision",
        status: result.humanOversight.status,
      });
    }
    broadcast("cycle_complete", result);
    res.json({ ok: true, result });
  } catch (e) {
    isRunning = false;
    broadcast("cycle_error", { error: e.message });
    console.error("❌ Cycle failed:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/auto-mode", (req, res) => {
  if (!coordinator) return res.status(400).json({ ok: false, error: "Not initialized" });
  const { enabled, intervalMs } = req.body;
  const interval = intervalMs || 30000;
  if (enabled && !autoCycleInterval) {
    autoCycleInterval = setInterval(async () => {
      if (isRunning || !coordinator) return;
      try { isRunning = true; const r = await coordinator.runCycle(); isRunning = false; broadcast("cycle_complete", r); }
      catch (e) { isRunning = false; broadcast("cycle_error", { error: e.message }); }
    }, interval);
    res.json({ ok: true, msg: `Auto mode ON (every ${interval / 1000}s)` });
  } else if (!enabled && autoCycleInterval) {
    clearInterval(autoCycleInterval); autoCycleInterval = null;
    res.json({ ok: true, msg: "Auto mode OFF" });
  } else {
    res.json({ ok: true, msg: `Auto mode already ${enabled ? "ON" : "OFF"}` });
  }
});

app.get("/api/full-status", (req, res) => {
  if (!coordinator) return res.status(400).json({ ok: false, error: "Not initialized" });
  res.json({ ok: true, ...coordinator.getFullStatus() });
});

// ═══════════════════════════════════════════════
// AgentLedge Identity API
// ═══════════════════════════════════════════════

app.get("/api/al/agents", (req, res) => {
  try { res.json({ ok: true, agents: getAllAgents() }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// AgentLedge Decision Log API
// ═══════════════════════════════════════════════

app.get("/api/al/decisions", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const agent = req.query.agent;
    const decisions = agent ? getDecisionsByAgent(agent, limit) : getDecisionHistory(limit);
    res.json({ ok: true, count: decisions.length, decisions });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/al/decisions/stats/:agent", (req, res) => {
  try { res.json({ ok: true, stats: getAgentDecisionStats(req.params.agent) }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// AgentLedge Trust Score API
// ═══════════════════════════════════════════════

app.get("/api/al/trust-scores", (req, res) => {
  try {
    const scores = getAllTrustScores();
    const result = {};
    for (const [name, data] of Object.entries(scores)) {
      result[name] = { ...data, tier: getTrustTier(data.trustScore) };
    }
    res.json({ ok: true, trustScores: result });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/al/trust-scores/:agent", (req, res) => {
  try {
    const score = getAgentTrustScore(req.params.agent);
    if (!score) return res.status(404).json({ ok: false, error: "Agent not found" });
    res.json({ ok: true, ...score, tier: getTrustTier(score.trustScore) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/al/trust-scores/:agent/history", (req, res) => {
  try { res.json({ ok: true, history: getTrustScoreHistory(req.params.agent) }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// AgentLedge Human Oversight API
// ═══════════════════════════════════════════════

app.get("/api/al/pending-approvals", (req, res) => {
  try { res.json({ ok: true, approvals: getPendingApprovals() }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post("/api/al/approve/:id", (req, res) => {
  try {
    const result = approveDecision(req.params.id, req.body?.approvedBy || "human");
    broadcast("approval", { id: req.params.id, status: "APPROVED" });
    res.json(result);
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post("/api/al/reject/:id", (req, res) => {
  try {
    const result = rejectDecision(req.params.id, req.body?.rejectedBy || "human", req.body?.reason || "");
    broadcast("approval", { id: req.params.id, status: "REJECTED" });
    res.json(result);
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/al/config", (req, res) => {
  res.json({ ok: true, config: getConfig() });
});

app.post("/api/al/config", (req, res) => {
  try { res.json({ ok: true, config: updateConfig(req.body) }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// HCS-10 Communication API
// ═══════════════════════════════════════════════

app.get("/api/hcs10/agents", (req, res) => {
  try { res.json({ ok: true, agents: getAllHCS10Agents() }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/hcs10/connections", (req, res) => {
  try { res.json({ ok: true, connections: getConnections() }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/hcs10/messages", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    res.json({ ok: true, messages: getMessageLog(limit) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// x402 Payment API
// ═══════════════════════════════════════════════

app.get("/api/x402/payments", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    res.json({ ok: true, payments: getPaymentHistory(limit) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/x402/stats", (req, res) => {
  try { res.json({ ok: true, stats: getPaymentStats() }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/x402/services", (req, res) => {
  try { res.json({ ok: true, services: getServiceRegistry() }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// HOL Registry API
// ═══════════════════════════════════════════════

app.get("/api/hol/agents", (req, res) => {
  try { res.json({ ok: true, agents: getRegisteredHOLAgents(), registryTopicId: getRegistryTopicId() }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// Mirror Node API (On-chain Verification)
// ═══════════════════════════════════════════════

app.get("/api/mirror/decisions", async (req, res) => {
  if (!coordinator) return res.status(400).json({ ok: false, error: "Not initialized" });
  try {
    const topicId = setupData?.topicId;
    if (!topicId) return res.json({ ok: true, messages: [] });
    const limit = parseInt(req.query.limit) || 25;
    const messages = await getTopicMessages(topicId, limit);
    res.json({ ok: true, topicId, count: messages.length, messages });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/mirror/verify/:sequenceNumber", async (req, res) => {
  if (!coordinator) return res.status(400).json({ ok: false, error: "Not initialized" });
  try {
    const topicId = setupData?.topicId;
    const result = await verifyDecision(topicId, parseInt(req.params.sequenceNumber));
    res.json({ ok: true, ...result });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/mirror/agents", async (req, res) => {
  if (!coordinator) return res.status(400).json({ ok: false, error: "Not initialized" });
  try {
    const alTokenId = setupData?.alTokenId;
    if (!alTokenId) return res.json({ ok: true, nfts: [] });
    const nfts = await getAllNFTs(alTokenId);
    res.json({ ok: true, alTokenId, count: nfts.length, agents: nfts });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/mirror/account/:accountId", async (req, res) => {
  try {
    const info = await getAccountInfo(req.params.accountId);
    res.json({ ok: true, account: info });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/mirror/transactions/:accountId", async (req, res) => {
  try {
    const txs = await getAccountTransactions(req.params.accountId, parseInt(req.query.limit) || 10);
    res.json({ ok: true, transactions: txs });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// Hedera Agent Kit API
// ═══════════════════════════════════════════════

app.get("/api/agent-kit/status", (req, res) => {
  try {
    const status = getToolkitStatus();
    res.json({ ok: true, ...status });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/agent-kit/tools", (req, res) => {
  try {
    const tools = getAvailableTools();
    res.json({ ok: true, count: tools.length, tools });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Allowlist of safe read-only tools for the public API
const ALLOWED_TOOLS = new Set([
  "get_hbar_balance", "get_token_balance", "get_account_info",
  "get_topic_messages", "get_topic_info", "get_token_info",
  "get_nft_info", "get_exchange_rate_tool", "get_all_nfts",
  "get_transaction_receipt",
]);

app.post("/api/agent-kit/execute", async (req, res) => {
  try {
    const { tool, params } = req.body;
    if (!tool) return res.status(400).json({ ok: false, error: "tool name required" });
    if (!ALLOWED_TOOLS.has(tool)) {
      return res.status(403).json({ ok: false, error: `Tool '${tool}' is not allowed via public API` });
    }
    const result = await runTool(tool, params || {});
    res.json(result);
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/agent-kit/exchange-rate", async (req, res) => {
  try {
    const result = await runTool("get_exchange_rate_tool", {});
    res.json(result);
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// NL Chat API
// ═══════════════════════════════════════════════

app.post("/api/chat", async (req, res) => {
  if (!coordinator) return res.status(400).json({ ok: false, error: "Not initialized. Click Initialize first." });
  const { message } = req.body;
  if (!message) return res.status(400).json({ ok: false, error: "Message required" });

  try {
    const lower = message.toLowerCase();
    let response;

    if (lower.includes("analyz") || lower.includes("market") || lower.includes("run") || lower.includes("cycle") || lower.includes("trade")) {
      if (isRunning) {
        response = { type: "info", message: "A cycle is already running. Please wait for it to complete." };
      } else {
        isRunning = true;
        broadcast("cycle_start", { cycle: coordinator.cycleCount + 1 });
        const result = await coordinator.runCycle(message);
        isRunning = false;
        broadcast("cycle_complete", result);
        response = {
          type: "cycle_result",
          message: `Cycle #${result.cycle} complete! Sentiment: ${result.intel?.sentiment || "N/A"}, Strategy: ${result.analysis?.riskProfile || "N/A"}, Execution: ${result.execution?.succeeded || 0}/${result.execution?.totalActions || 0} succeeded. x402 Payments: ${result.payments?.length || 0}`,
          result,
        };
      }
    } else if (lower.includes("trust") || lower.includes("score") || lower.includes("reputation")) {
      const scores = getAllTrustScores();
      const summary = Object.entries(scores).map(([name, data]) => {
        const tier = getTrustTier(data.trustScore);
        return `${tier.emoji} ${name}: ${data.trustScore}/100 (${tier.label})`;
      }).join("\n");
      response = { type: "trust_scores", message: `Agent Trust Scores:\n${summary}`, scores };
    } else if (lower.includes("payment") || lower.includes("x402") || lower.includes("economy")) {
      const stats = getPaymentStats();
      response = {
        type: "x402_stats",
        message: `x402 Agent Economy:\n• Total payments: ${stats.totalPayments}\n• Total volume: ${stats.totalVolume.toFixed(2)} HBAR\n• Services: ${Object.keys(stats.byService || {}).length}`,
        stats,
      };
    } else if (lower.includes("hcs") || lower.includes("message") || lower.includes("communication")) {
      const conns = getConnections();
      const msgs = getMessageLog();
      response = {
        type: "hcs10_info",
        message: `HCS-10 Communication:\n• Connections: ${conns.length}\n• Messages exchanged: ${msgs.length}\n• Active agents: ${Object.keys(getAllHCS10Agents()).length}`,
      };
    } else if (lower.includes("decision") || lower.includes("log") || lower.includes("history")) {
      const decisions = getDecisionHistory(10);
      const summary = decisions.map(d => `[${d.agent}] ${d.type}: ${d.action} (Confidence: ${d.confidence}%)`).join("\n");
      response = { type: "decisions", message: `Recent Decisions:\n${summary}`, decisions };
    } else if (lower.includes("status") || lower.includes("help")) {
      response = {
        type: "help",
        message: `AgentLedge v0.2.0 Commands:\n• "Analyze the market" — Run a full cycle\n• "Show trust scores" — Agent reputation\n• "Show payments" — x402 economy stats\n• "Show messages" — HCS-10 communication log\n• "Show decision log" — On-chain decisions\n• "What is AgentLedge?" — About this protocol`,
      };
    } else if (lower.includes("what is agentledge") || lower.includes("about")) {
      response = {
        type: "info",
        message: "AgentLedge (AgentLedge) is the trust & accountability layer for autonomous DeFi agents on Hedera.\n\n🪪 Identity: Each agent has an on-chain NFT identity (HTS)\n📜 Decisions: Every decision is logged to HCS with full reasoning\n🛡️ Oversight: High-risk actions require human approval\n📊 Trust: Scores calculated from verifiable behavior\n📡 Comms: Agent-to-agent via HCS-10 (OpenConvAI)\n💳 Payments: x402 micropayments for services\n🏛️ Registry: Discoverable via HOL Registry",
      };
    } else {
      response = { type: "info", message: `I understand natural language commands. Try: "Analyze the market", "Show trust scores", "Show payments", or "Show decision log".` };
    }

    res.json({ ok: true, ...response });
  } catch (e) {
    isRunning = false;
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ═══════════════════════════════════════════════
// Export Audit Report API
// ═══════════════════════════════════════════════

app.get("/api/al/export", (req, res) => {
  try {
    const decisions = getDecisionHistory(500);
    const scores = getAllTrustScores();
    const payments = getPaymentHistory(500);
    const topicId = setupData?.topicId || "N/A";

    const report = {
      title: "AgentLedge Audit Report",
      generatedAt: new Date().toISOString(),
      protocol: "AgentLedge v0.2.0",
      network: "Hedera Testnet",
      topicId,
      hashScanUrl: `https://hashscan.io/testnet/topic/${topicId}`,
      summary: {
        totalDecisions: decisions.length,
        agents: Object.keys(scores).length,
        totalPayments: payments.length,
      },
      trustScores: Object.fromEntries(
        Object.entries(scores).map(([name, data]) => [
          name,
          { score: data.trustScore, tier: getTrustTier(data.trustScore).label, dimensions: data.dimensions },
        ])
      ),
      decisions: decisions.map(d => ({
        sequenceNumber: d.sequenceNumber,
        timestamp: d.timestamp,
        agent: d.agent,
        type: d.type,
        action: d.action,
        reasoning: d.reasoning,
        confidence: d.confidence,
        riskLevel: d.riskLevel,
        hashScanLink: `https://hashscan.io/testnet/topic/${topicId}#${d.sequenceNumber}`,
      })),
      payments: payments.map(p => ({
        timestamp: p.timestamp,
        from: p.from,
        to: p.to,
        amount: p.amount,
        service: p.service,
        transactionId: p.transactionId,
      })),
    };

    const format = req.query.format || "json";
    if (format === "csv") {
      const csvRows = [
        ["Seq#", "Timestamp", "Agent", "Type", "Action", "Confidence", "Risk", "HashScan Link"].join(","),
        ...report.decisions.map(d =>
          [d.sequenceNumber, d.timestamp, d.agent, d.type, `"${(d.action || '').replace(/"/g, '""')}"`, d.confidence, d.riskLevel, d.hashScanLink].join(",")
        ),
      ];
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=agentledge-audit-${Date.now()}.csv`);
      return res.send(csvRows.join("\n"));
    }

    res.setHeader("Content-Disposition", `attachment; filename=agentledge-audit-${Date.now()}.json`);
    res.json(report);
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// Health & Info
// ═══════════════════════════════════════════════

app.get("/api/health", (req, res) => {
  res.json({
    ok: true, protocol: "AgentLedge", version: "0.2.0",
    uptime: process.uptime(), timestamp: new Date().toISOString(),
    wsClients: wsClients.size,
  });
});

server.listen(PORT, () => {
  console.log(`\n🌐 AgentLedge Dashboard: http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/status`);
  console.log(`🪪 AL: http://localhost:${PORT}/api/al/agents`);
  console.log(`📡 HCS-10: http://localhost:${PORT}/api/hcs10/agents`);
  console.log(`💳 x402: http://localhost:${PORT}/api/x402/services`);
  console.log(`🏛️ HOL: http://localhost:${PORT}/api/hol/agents`);
  console.log(`💬 Chat: POST http://localhost:${PORT}/api/chat`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws\n`);
});
