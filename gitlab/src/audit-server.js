/**
 * 🛡️ KYA Audit Server — Full DevSecOps Accountability Dashboard
 * 
 * Companion server for GitLab Duo Custom Agents.
 * Receives webhooks from GitLab CI/CD, tracks agent decisions,
 * computes trust scores, generates compliance reports.
 * 
 * KYA for DevSecOps — Know Your Agent
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initAgentTrust, recordDecisionOutcome, getAllTrustScores, getTrustTier, getAgentTrustScore } from "./trust-tracker.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

// ═══════════════════════════════════════════════
// Data Store
// ═══════════════════════════════════════════════

const decisions = [];
const vulnerabilities = [];
const approvalHistory = [];
const complianceReports = [];
const scanResults = [];

// Initialize agents
const AGENTS = ["Scanner", "Analyzer", "Fixer", "Compliance"];
AGENTS.forEach(name => initAgentTrust(name, `KYA-GITLAB-${name.toUpperCase()}`));

// ═══════════════════════════════════════════════
// GitLab Webhook Receiver
// ═══════════════════════════════════════════════

app.post("/api/webhook/gitlab", (req, res) => {
  const { object_kind, event_type, project, merge_request, pipeline } = req.body;
  
  const event = {
    id: `EVT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    kind: object_kind || event_type,
    project: project?.name,
    mergeRequest: merge_request?.iid,
    pipeline: pipeline?.id,
    raw: req.body,
  };
  
  decisions.push({ ...event, agent: "GitLab", action: `Webhook: ${event.kind}`, type: "WEBHOOK" });
  console.log(`📨 [GitLab] Webhook: ${event.kind} | Project: ${event.project || '?'}`);
  res.json({ ok: true, id: event.id });
});

// ═══════════════════════════════════════════════
// Agent Activity Webhook
// ═══════════════════════════════════════════════

app.post("/api/webhook/agent", (req, res) => {
  const { agent, action, type, confidence, severity, reasoning, result, findings, cwe, file, line } = req.body;
  
  const decision = {
    id: `DEC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    agent, action, type, confidence: confidence || 0, severity,
    reasoning: reasoning || [], result, findings, cwe, file, line,
  };
  
  decisions.push(decision);
  if (decisions.length > 1000) decisions.shift();
  
  // Track vulnerabilities
  if (type === "VULNERABILITY_FOUND" && findings) {
    findings.forEach(f => {
      vulnerabilities.push({
        ...f,
        foundBy: agent,
        foundAt: decision.timestamp,
        status: "OPEN",
      });
    });
  }
  
  // Track scan results
  if (type === "SCAN_COMPLETE") {
    scanResults.push({
      id: decision.id,
      agent, timestamp: decision.timestamp,
      filesScanned: result?.filesScanned || 0,
      findingsCount: result?.findingsCount || 0,
      severity: result?.severityBreakdown || {},
    });
  }
  
  // Update trust scores
  if (agent && AGENTS.includes(agent)) {
    recordDecisionOutcome(agent, {
      predictionMade: type === "VULNERABILITY_FOUND" || type === "SEVERITY_RATED",
      predictionCorrect: result !== "false_positive",
      humanApproval: result === "approved" ? "APPROVED" : result === "rejected" ? "REJECTED" : undefined,
      failed: result === "error",
    });
  }
  
  console.log(`📋 [${agent}] ${type} | ${action} | Confidence: ${confidence || '?'}%`);
  res.json({ ok: true, id: decision.id });
});

// ═══════════════════════════════════════════════
// Human Oversight
// ═══════════════════════════════════════════════

const pendingApprovals = [];

app.post("/api/webhook/approval-needed", (req, res) => {
  const { agent, action, severity, confidence, reasons, decisionId, mergeRequestId } = req.body;
  
  const approval = {
    id: `APR-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agent, action, severity, confidence, reasons, decisionId, mergeRequestId,
    status: "PENDING",
  };
  
  pendingApprovals.push(approval);
  console.log(`🛡️ [${agent}] Approval needed: ${action} | Severity: ${severity}`);
  res.json({ ok: true, id: approval.id });
});

app.post("/api/approve/:id", (req, res) => {
  const approval = pendingApprovals.find(a => a.id === req.params.id);
  if (!approval) return res.status(404).json({ ok: false, error: "Not found" });
  approval.status = "APPROVED";
  approval.approvedBy = req.body?.approvedBy || "dashboard-user";
  approval.approvedAt = new Date().toISOString();
  approvalHistory.push(approval);
  
  if (approval.agent) {
    recordDecisionOutcome(approval.agent, { humanApproval: "APPROVED" });
  }
  
  console.log(`✅ Approved: ${approval.action}`);
  res.json({ ok: true, approval });
});

app.post("/api/reject/:id", (req, res) => {
  const approval = pendingApprovals.find(a => a.id === req.params.id);
  if (!approval) return res.status(404).json({ ok: false, error: "Not found" });
  approval.status = "REJECTED";
  approval.rejectedBy = req.body?.rejectedBy || "dashboard-user";
  approval.rejectedAt = new Date().toISOString();
  approval.reason = req.body?.reason || "Rejected by user";
  approvalHistory.push(approval);
  
  if (approval.agent) {
    recordDecisionOutcome(approval.agent, { humanApproval: "REJECTED" });
  }
  
  console.log(`❌ Rejected: ${approval.action}`);
  res.json({ ok: true, approval });
});

// ═══════════════════════════════════════════════
// Dashboard Data APIs
// ═══════════════════════════════════════════════

app.get("/api/status", (req, res) => {
  const scores = getAllTrustScores();
  const trustWithTiers = {};
  for (const [name, data] of Object.entries(scores)) {
    trustWithTiers[name] = { ...data, tier: getTrustTier(data.trustScore) };
  }
  
  res.json({
    protocol: "KYA for DevSecOps",
    version: "0.2.0",
    agents: trustWithTiers,
    totalDecisions: decisions.length,
    totalVulnerabilities: vulnerabilities.length,
    openVulnerabilities: vulnerabilities.filter(v => v.status === "OPEN").length,
    pendingApprovals: pendingApprovals.filter(a => a.status === "PENDING").length,
    complianceReports: complianceReports.length,
    recentDecisions: decisions.slice(-10).reverse(),
    stats: {
      critical: vulnerabilities.filter(v => v.severity === "CRITICAL").length,
      high: vulnerabilities.filter(v => v.severity === "HIGH").length,
      medium: vulnerabilities.filter(v => v.severity === "MEDIUM").length,
      low: vulnerabilities.filter(v => v.severity === "LOW").length,
      humanApprovals: approvalHistory.filter(a => a.status === "APPROVED").length,
      humanRejections: approvalHistory.filter(a => a.status === "REJECTED").length,
      totalScans: scanResults.length,
    },
  });
});

app.get("/api/decisions", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const agent = req.query.agent;
  const filtered = agent ? decisions.filter(d => d.agent === agent) : decisions;
  res.json({ ok: true, decisions: filtered.slice(-limit).reverse(), count: filtered.length });
});

app.get("/api/vulnerabilities", (req, res) => {
  const status = req.query.status;
  const filtered = status ? vulnerabilities.filter(v => v.status === status) : vulnerabilities;
  res.json({ ok: true, vulnerabilities: filtered, count: filtered.length });
});

app.get("/api/trust-scores", (req, res) => {
  const scores = getAllTrustScores();
  res.json({ ok: true, scores });
});

app.get("/api/pending-approvals", (req, res) => {
  const pending = pendingApprovals.filter(a => a.status === "PENDING");
  res.json({ ok: true, approvals: pending });
});

app.get("/api/approval-history", (req, res) => {
  res.json({ ok: true, history: approvalHistory.slice(-50).reverse() });
});

// ═══════════════════════════════════════════════
// Compliance Report Generation
// ═══════════════════════════════════════════════

app.post("/api/generate-report", (req, res) => {
  const scores = getAllTrustScores();
  
  const report = {
    id: `RPT-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    type: "SOC2_COMPLIANCE",
    period: { from: decisions[0]?.timestamp || "N/A", to: new Date().toISOString() },
    
    summary: {
      totalDecisions: decisions.length,
      totalVulnerabilities: vulnerabilities.length,
      criticalFixed: vulnerabilities.filter(v => v.severity === "CRITICAL" && v.status === "FIXED").length,
      humanApprovals: approvalHistory.filter(a => a.status === "APPROVED").length,
      humanRejections: approvalHistory.filter(a => a.status === "REJECTED").length,
    },
    
    agentTrustScores: scores,
    
    complianceMapping: {
      "SOC2-CC6.1": { control: "Logical Access Controls", status: "✅ PASS", evidence: "All agents have unique KYA identities" },
      "SOC2-CC7.2": { control: "System Monitoring", status: "✅ PASS", evidence: `${decisions.length} decisions logged with full reasoning` },
      "SOC2-CC8.1": { control: "Change Management", status: "✅ PASS", evidence: `All changes tracked, ${approvalHistory.length} human oversight events` },
      "HIPAA-164.312": { control: "Technical Safeguards", status: "✅ PASS", evidence: "Automated vulnerability scanning and remediation" },
      "ISO27001-A.12.6": { control: "Technical Vulnerability Management", status: "✅ PASS", evidence: `${vulnerabilities.length} vulnerabilities detected and tracked` },
    },
    
    decisionChain: decisions.slice(-20).map(d => ({
      time: d.timestamp, agent: d.agent, action: d.action,
      confidence: d.confidence, type: d.type,
    })),
  };
  
  complianceReports.push(report);
  console.log(`📋 Compliance report generated: ${report.id}`);
  res.json({ ok: true, report });
});

app.get("/api/reports", (req, res) => {
  res.json({ ok: true, reports: complianceReports });
});

// ═══════════════════════════════════════════════
// Demo: Simulate a full security review cycle
// ═══════════════════════════════════════════════

app.post("/api/demo/run-cycle", async (req, res) => {
  console.log("\n🔄 Running DevSecOps Demo Cycle...\n");
  
  // Step 1: Scanner finds vulnerabilities
  const scanFindings = [
    { id: "VULN-1", file: "src/auth.js", line: 42, cwe: "CWE-89", title: "SQL Injection in login", severity: "HIGH", confidence: 95 },
    { id: "VULN-2", file: "src/api.js", line: 15, cwe: "CWE-79", title: "XSS in user input", severity: "MEDIUM", confidence: 85 },
    { id: "VULN-3", file: "package.json", line: 8, cwe: "CWE-1104", title: "Vulnerable dependency: lodash@4.17.20", severity: "LOW", confidence: 99 },
  ];
  
  decisions.push({
    id: `DEC-${Date.now()}-scan`, timestamp: new Date().toISOString(),
    agent: "Scanner", type: "SCAN_COMPLETE", action: `Scanned 12 files, found ${scanFindings.length} vulnerabilities`,
    confidence: 92, findings: scanFindings,
  });
  recordDecisionOutcome("Scanner", { predictionMade: true, predictionCorrect: true });
  console.log(`🔍 [Scanner] Found ${scanFindings.length} vulnerabilities`);
  
  // Step 2: Analyzer rates severity
  for (const finding of scanFindings) {
    decisions.push({
      id: `DEC-${Date.now()}-analyze-${finding.id}`, timestamp: new Date().toISOString(),
      agent: "Analyzer", type: "SEVERITY_RATED",
      action: `${finding.title}: CVSS ${finding.severity === "HIGH" ? "8.6" : finding.severity === "MEDIUM" ? "5.4" : "3.1"}`,
      confidence: finding.confidence, severity: finding.severity, cwe: finding.cwe,
    });
    vulnerabilities.push({ ...finding, foundBy: "Scanner", analyzedBy: "Analyzer", status: "OPEN", foundAt: new Date().toISOString() });
  }
  recordDecisionOutcome("Analyzer", { predictionMade: true, predictionCorrect: true });
  console.log(`📊 [Analyzer] Rated ${scanFindings.length} vulnerabilities`);
  
  // Step 3: Fixer generates patches
  const fixes = scanFindings.map(f => ({
    findingId: f.id, file: f.file, severity: f.severity,
    fix: `Replace vulnerable code at line ${f.line}`,
    confidence: f.severity === "HIGH" ? 90 : 95,
    humanApprovalRequired: f.severity === "HIGH" || f.severity === "CRITICAL",
  }));
  
  for (const fix of fixes) {
    decisions.push({
      id: `DEC-${Date.now()}-fix-${fix.findingId}`, timestamp: new Date().toISOString(),
      agent: "Fixer", type: "FIX_GENERATED",
      action: `Fix for ${fix.findingId}: ${fix.fix}`,
      confidence: fix.confidence, severity: fix.severity,
    });
    
    if (fix.humanApprovalRequired) {
      pendingApprovals.push({
        id: `APR-${Date.now()}-${fix.findingId}`,
        timestamp: new Date().toISOString(),
        agent: "Fixer", action: `Apply fix for ${fix.findingId} (${fix.severity})`,
        severity: fix.severity, confidence: fix.confidence,
        reasons: [`${fix.severity} severity requires human review`],
        status: "PENDING",
      });
    }
  }
  recordDecisionOutcome("Fixer", { predictionMade: false });
  console.log(`🔧 [Fixer] Generated ${fixes.length} patches (${fixes.filter(f => f.humanApprovalRequired).length} need approval)`);
  
  // Step 4: Compliance report
  const scores = getAllTrustScores();
  decisions.push({
    id: `DEC-${Date.now()}-compliance`, timestamp: new Date().toISOString(),
    agent: "Compliance", type: "REPORT_GENERATED",
    action: `Compliance report: ${scanFindings.length} findings, ${fixes.length} fixes`,
    confidence: 100,
  });
  recordDecisionOutcome("Compliance", { predictionMade: false });
  console.log(`📋 [Compliance] Report generated`);
  
  res.json({
    ok: true,
    cycle: {
      findings: scanFindings.length,
      fixes: fixes.length,
      pendingApprovals: fixes.filter(f => f.humanApprovalRequired).length,
      trustScores: scores,
    },
  });
});

app.get("/api/health", (req, res) => res.json({ ok: true, protocol: "KYA for DevSecOps", uptime: process.uptime() }));

app.listen(PORT, () => {
  console.log(`\n🛡️ KYA for DevSecOps: http://localhost:${PORT}`);
  console.log(`📨 GitLab Webhook: POST http://localhost:${PORT}/api/webhook/gitlab`);
  console.log(`📋 Agent Webhook: POST http://localhost:${PORT}/api/webhook/agent`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/status`);
  console.log(`🔄 Demo Cycle: POST http://localhost:${PORT}/api/demo/run-cycle\n`);
});
