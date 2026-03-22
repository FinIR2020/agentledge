/**
 * 📜 AgentLedge Decision Log — Structured, verifiable decision records on HCS
 * Every agent decision is logged with reasoning, confidence, and outcome
 * 
 * AgentLedge — AgentLedge
 */
import { TopicMessageSubmitTransaction, TopicId } from "@hashgraph/sdk";
import { client, privateKey } from "../hedera/client.js";

const decisionHistory = []; // In-memory cache for dashboard

/**
 * Log a structured decision to HCS
 * @param {string|TopicId} topicId 
 * @param {Object} decision - Structured decision record
 * @returns {Object} - { sequenceNumber, txId, decision }
 */
export async function logDecision(topicId, decision) {
  const record = {
    standard: "AL-DECISION-v1",
    timestamp: new Date().toISOString(),
    id: `DEC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    
    // WHO made the decision
    agent: decision.agent,
    alId: decision.alId || null,
    
    // WHAT was decided
    type: decision.type, // INTEL_GATHERED, ANALYSIS_COMPLETE, TRADE_PROPOSED, TRADE_EXECUTED, HUMAN_OVERRIDE
    action: decision.action,
    
    // WHY (reasoning chain)
    reasoning: decision.reasoning || [],
    dataSources: decision.dataSources || [],
    confidence: decision.confidence || 0, // 0-100
    
    // CONTEXT
    inputs: decision.inputs || {},
    outputs: decision.outputs || {},
    
    // RISK & OVERSIGHT
    riskLevel: decision.riskLevel || "LOW", // LOW, MEDIUM, HIGH, CRITICAL
    humanApprovalRequired: decision.humanApprovalRequired || false,
    humanApprovalStatus: decision.humanApprovalStatus || null, // PENDING, APPROVED, REJECTED
    humanApprovalBy: decision.humanApprovalBy || null,
    
    // OUTCOME (filled after execution)
    outcome: decision.outcome || null,
  };

  // Submit to HCS — with size management
  // HCS max message size is ~1024 bytes. Truncate large payloads.
  const fullRecord = { ...record };
  let message = JSON.stringify(record);
  
  if (Buffer.from(message).length > 1000) {
    // Truncate reasoning and outputs to fit HCS limits
    record.reasoning = record.reasoning.map(r => r.slice(0, 100));
    if (record.outputs) {
      record.outputs = { summary: JSON.stringify(record.outputs).slice(0, 200) + "..." };
    }
    if (record.inputs) {
      record.inputs = { summary: JSON.stringify(record.inputs).slice(0, 100) + "..." };
    }
    record.truncated = true;
    record.fullSizeBytes = Buffer.from(JSON.stringify(fullRecord)).length;
    message = JSON.stringify(record);
  }
  
  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(typeof topicId === "string" ? TopicId.fromString(topicId) : topicId)
    .setMessage(message)
    .freezeWith(client);

  const signedTx = await tx.sign(privateKey);
  const response = await signedTx.execute(client);
  const receipt = await response.getReceipt(client);

  const result = {
    ...record,
    sequenceNumber: receipt.topicSequenceNumber.toNumber(),
    txId: response.transactionId.toString(),
  };

  // Cache for dashboard
  decisionHistory.push(result);
  
  // Keep last 200 decisions in memory
  if (decisionHistory.length > 200) decisionHistory.shift();

  console.log(`📜 Decision logged: [${record.agent}] ${record.type} | Confidence: ${record.confidence}% | Risk: ${record.riskLevel} | seq#${result.sequenceNumber}`);
  
  return result;
}

/**
 * Get decision history (from memory cache)
 */
export function getDecisionHistory(limit = 50) {
  return decisionHistory.slice(-limit);
}

/**
 * Get decisions by agent
 */
export function getDecisionsByAgent(agentName, limit = 20) {
  return decisionHistory
    .filter(d => d.agent === agentName)
    .slice(-limit);
}

/**
 * Get decisions requiring human approval
 */
export function getPendingApprovals() {
  return decisionHistory.filter(
    d => d.humanApprovalRequired && d.humanApprovalStatus === "PENDING"
  );
}

/**
 * Calculate decision statistics for an agent
 */
export function getAgentDecisionStats(agentName) {
  const decisions = decisionHistory.filter(d => d.agent === agentName);
  if (decisions.length === 0) return null;

  const totalConfidence = decisions.reduce((sum, d) => sum + (d.confidence || 0), 0);
  const humanApprovals = decisions.filter(d => d.humanApprovalStatus === "APPROVED").length;
  const humanRejections = decisions.filter(d => d.humanApprovalStatus === "REJECTED").length;
  
  return {
    agent: agentName,
    totalDecisions: decisions.length,
    avgConfidence: (totalConfidence / decisions.length).toFixed(1),
    humanApprovals,
    humanRejections,
    approvalRate: decisions.filter(d => d.humanApprovalRequired).length > 0
      ? ((humanApprovals / (humanApprovals + humanRejections)) * 100).toFixed(1)
      : "N/A",
    riskDistribution: {
      LOW: decisions.filter(d => d.riskLevel === "LOW").length,
      MEDIUM: decisions.filter(d => d.riskLevel === "MEDIUM").length,
      HIGH: decisions.filter(d => d.riskLevel === "HIGH").length,
      CRITICAL: decisions.filter(d => d.riskLevel === "CRITICAL").length,
    },
  };
}
