/**
 * 🛡️ AgentLedge Human Oversight — Configurable approval thresholds
 * High-risk agent actions require human approval before execution
 * 
 * AgentLedge — AgentLedge
 */

// Default thresholds (configurable via API)
let config = {
  // Dollar thresholds
  tradeAmountThreshold: 50, // USD — trades above this need approval
  
  // Risk thresholds
  riskLevelThreshold: "HIGH", // HIGH or CRITICAL triggers approval
  
  // Confidence thresholds
  minConfidenceForAuto: 70, // Below this confidence → needs approval
  
  // Agent-specific overrides
  agentOverrides: {}, // { agentName: { tradeAmountThreshold, ... } }
  
  // Global kill switch
  requireAllApprovals: false, // If true, ALL actions need approval
  
  // Auto-approve timeout (ms) — 0 means wait forever
  approvalTimeoutMs: 300000, // 5 minutes
};

// Pending approvals queue
const pendingApprovals = new Map(); // id → { decision, resolve, reject, timestamp }

/**
 * Check if a decision requires human approval
 * @param {Object} decision - The proposed decision
 * @returns {Object} - { required: boolean, reasons: string[] }
 */
export function checkApprovalRequired(decision) {
  if (config.requireAllApprovals) {
    return { required: true, reasons: ["Global approval mode enabled"] };
  }

  const reasons = [];
  const agentConfig = config.agentOverrides[decision.agent] || config;

  // Check trade amount
  if (decision.tradeAmount && decision.tradeAmount > (agentConfig.tradeAmountThreshold || config.tradeAmountThreshold)) {
    reasons.push(`Trade amount $${decision.tradeAmount} exceeds threshold $${agentConfig.tradeAmountThreshold || config.tradeAmountThreshold}`);
  }

  // Check risk level
  const riskOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
  const thresholdLevel = riskOrder[agentConfig.riskLevelThreshold || config.riskLevelThreshold] || 2;
  const decisionLevel = riskOrder[decision.riskLevel] || 0;
  if (decisionLevel >= thresholdLevel) {
    reasons.push(`Risk level ${decision.riskLevel} meets/exceeds threshold ${agentConfig.riskLevelThreshold || config.riskLevelThreshold}`);
  }

  // Check confidence
  const minConfidence = agentConfig.minConfidenceForAuto || config.minConfidenceForAuto;
  if (decision.confidence && decision.confidence < minConfidence) {
    reasons.push(`Confidence ${decision.confidence}% below minimum ${minConfidence}%`);
  }

  return {
    required: reasons.length > 0,
    reasons,
  };
}

/**
 * Request human approval for a decision
 * Returns a promise that resolves when approved/rejected/timed out
 */
export function requestApproval(decision) {
  const approvalId = `APR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  
  return new Promise((resolve, reject) => {
    const entry = {
      id: approvalId,
      decision,
      timestamp: new Date().toISOString(),
      status: "PENDING",
      resolve,
      reject,
    };

    pendingApprovals.set(approvalId, entry);

    console.log(`🛡️ HUMAN APPROVAL REQUIRED: ${approvalId}`);
    console.log(`   Agent: ${decision.agent}`);
    console.log(`   Action: ${decision.action}`);
    console.log(`   Risk: ${decision.riskLevel}`);
    if (decision.reasons) {
      decision.reasons.forEach(r => console.log(`   Reason: ${r}`));
    }

    // Auto-timeout — always enforce a maximum timeout to prevent hanging promises
    const timeoutMs = config.approvalTimeoutMs > 0 ? config.approvalTimeoutMs : 600000; // default max 10 minutes
    setTimeout(() => {
      if (pendingApprovals.has(approvalId)) {
        entry.status = "TIMEOUT";
        pendingApprovals.delete(approvalId);
        resolve({ approved: false, reason: "Approval timed out", approvalId });
      }
    }, timeoutMs);
  });
}

/**
 * Approve a pending decision
 */
export function approveDecision(approvalId, approvedBy = "human") {
  const entry = pendingApprovals.get(approvalId);
  if (!entry) return { ok: false, error: "Approval not found or expired" };

  entry.status = "APPROVED";
  entry.approvedBy = approvedBy;
  entry.approvedAt = new Date().toISOString();
  pendingApprovals.delete(approvalId);
  
  entry.resolve({ approved: true, approvedBy, approvalId });
  console.log(`✅ Decision APPROVED by ${approvedBy}: ${approvalId}`);
  return { ok: true, status: "APPROVED" };
}

/**
 * Reject a pending decision
 */
export function rejectDecision(approvalId, rejectedBy = "human", reason = "") {
  const entry = pendingApprovals.get(approvalId);
  if (!entry) return { ok: false, error: "Approval not found or expired" };

  entry.status = "REJECTED";
  entry.rejectedBy = rejectedBy;
  entry.rejectedAt = new Date().toISOString();
  entry.rejectionReason = reason;
  pendingApprovals.delete(approvalId);
  
  entry.resolve({ approved: false, rejectedBy, reason, approvalId });
  console.log(`❌ Decision REJECTED by ${rejectedBy}: ${approvalId} — ${reason}`);
  return { ok: true, status: "REJECTED" };
}

/**
 * Get all pending approvals (for dashboard)
 */
export function getPendingApprovals() {
  const pending = [];
  for (const [id, entry] of pendingApprovals) {
    pending.push({
      id,
      agent: entry.decision.agent,
      action: entry.decision.action,
      riskLevel: entry.decision.riskLevel,
      confidence: entry.decision.confidence,
      tradeAmount: entry.decision.tradeAmount,
      reasons: entry.decision.reasons,
      timestamp: entry.timestamp,
      status: entry.status,
    });
  }
  return pending;
}

/**
 * Update oversight configuration
 */
export function updateConfig(newConfig) {
  config = { ...config, ...newConfig };
  console.log(`🛡️ Oversight config updated:`, JSON.stringify(config, null, 2));
  return config;
}

/**
 * Get current configuration
 */
export function getConfig() {
  return { ...config };
}
