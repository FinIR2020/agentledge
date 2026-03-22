/**
 * 📊 KYA Trust Score — Multi-dimensional agent reputation system
 * Calculates trust based on verifiable on-chain behavior, not subjective reviews
 * 
 * Solves: ERC-8004 Sybil attack problem (all scores 98-99/100)
 * Our approach: scores based on BEHAVIOR, not REVIEWS
 * 
 * KYA Protocol — Know Your Agent
 */

// Trust score weights
const WEIGHTS = {
  accuracy: 0.25,        // Were predictions/analyses correct?
  consistency: 0.20,     // Does the agent behave consistently?
  humanApproval: 0.20,   // What % of human reviews were approved?
  riskManagement: 0.15,  // Does the agent respect risk boundaries?
  transparency: 0.10,    // Does the agent log decisions properly?
  uptime: 0.10,          // Reliability — how often is the agent available?
};

// Per-agent score tracking
const agentScores = new Map();

/**
 * Initialize trust tracking for an agent
 */
export function initAgentTrust(agentName, kyaId) {
  agentScores.set(agentName, {
    kyaId,
    name: agentName,
    
    // Raw metrics
    totalDecisions: 0,
    correctPredictions: 0,
    totalPredictions: 0,
    humanApprovals: 0,
    humanRejections: 0,
    riskViolations: 0,
    decisionsLogged: 0,
    totalCycles: 0,
    failedCycles: 0,
    
    // Calculated scores (0-100)
    scores: {
      accuracy: 100,
      consistency: 100,
      humanApproval: 100,
      riskManagement: 100,
      transparency: 100,
      uptime: 100,
    },
    
    // Overall trust score
    trustScore: 100,
    
    // History for trend analysis
    scoreHistory: [],
    lastUpdated: new Date().toISOString(),
  });
  
  return agentScores.get(agentName);
}

/**
 * Record a decision outcome and recalculate trust
 */
export function recordDecisionOutcome(agentName, outcome) {
  const agent = agentScores.get(agentName);
  if (!agent) return null;

  agent.totalDecisions++;
  agent.decisionsLogged++;

  // Track prediction accuracy
  if (outcome.predictionMade) {
    agent.totalPredictions++;
    if (outcome.predictionCorrect) {
      agent.correctPredictions++;
    }
  }

  // Track human approval
  if (outcome.humanApproval === "APPROVED") {
    agent.humanApprovals++;
  } else if (outcome.humanApproval === "REJECTED") {
    agent.humanRejections++;
  }

  // Track risk violations
  if (outcome.riskViolation) {
    agent.riskViolations++;
  }

  // Track uptime
  agent.totalCycles++;
  if (outcome.failed) {
    agent.failedCycles++;
  }

  // Recalculate scores
  recalculateScores(agent);
  
  return agent;
}

/**
 * Recalculate all dimension scores
 */
function recalculateScores(agent) {
  const s = agent.scores;

  // Accuracy: correct predictions / total predictions
  if (agent.totalPredictions > 0) {
    s.accuracy = (agent.correctPredictions / agent.totalPredictions) * 100;
  }

  // Consistency: based on score variance over time (simplified)
  // Start at 100, decrease with erratic behavior
  s.consistency = Math.max(0, 100 - (agent.riskViolations * 10));

  // Human approval rate
  const totalHumanReviews = agent.humanApprovals + agent.humanRejections;
  if (totalHumanReviews > 0) {
    s.humanApproval = (agent.humanApprovals / totalHumanReviews) * 100;
  }

  // Risk management: penalize for violations
  if (agent.totalDecisions > 0) {
    s.riskManagement = Math.max(0, 100 - (agent.riskViolations / agent.totalDecisions) * 200);
  }

  // Transparency: all decisions logged?
  if (agent.totalDecisions > 0) {
    s.transparency = Math.min(100, (agent.decisionsLogged / agent.totalDecisions) * 100);
  }

  // Uptime
  if (agent.totalCycles > 0) {
    s.uptime = ((agent.totalCycles - agent.failedCycles) / agent.totalCycles) * 100;
  }

  // Calculate weighted overall trust score
  agent.trustScore = Math.round(
    s.accuracy * WEIGHTS.accuracy +
    s.consistency * WEIGHTS.consistency +
    s.humanApproval * WEIGHTS.humanApproval +
    s.riskManagement * WEIGHTS.riskManagement +
    s.transparency * WEIGHTS.transparency +
    s.uptime * WEIGHTS.uptime
  );

  // Clamp to 0-100
  agent.trustScore = Math.max(0, Math.min(100, agent.trustScore));

  // Record in history
  agent.scoreHistory.push({
    timestamp: new Date().toISOString(),
    trustScore: agent.trustScore,
    dimensions: { ...s },
  });

  // Keep last 100 data points
  if (agent.scoreHistory.length > 100) agent.scoreHistory.shift();

  agent.lastUpdated = new Date().toISOString();
}

/**
 * Get trust score for an agent
 */
export function getAgentTrustScore(agentName) {
  const agent = agentScores.get(agentName);
  if (!agent) return null;
  
  return {
    name: agent.name,
    kyaId: agent.kyaId,
    trustScore: agent.trustScore,
    dimensions: { ...agent.scores },
    totalDecisions: agent.totalDecisions,
    lastUpdated: agent.lastUpdated,
  };
}

/**
 * Get trust scores for all agents
 */
export function getAllTrustScores() {
  const result = {};
  for (const [name, agent] of agentScores) {
    result[name] = {
      kyaId: agent.kyaId,
      trustScore: agent.trustScore,
      dimensions: { ...agent.scores },
      totalDecisions: agent.totalDecisions,
    };
  }
  return result;
}

/**
 * Get trust score history (for charts)
 */
export function getTrustScoreHistory(agentName) {
  const agent = agentScores.get(agentName);
  if (!agent) return [];
  return agent.scoreHistory;
}

/**
 * Get trust tier label
 */
export function getTrustTier(score) {
  if (score >= 90) return { tier: "PLATINUM", emoji: "🏆", label: "Highly Trusted" };
  if (score >= 75) return { tier: "GOLD", emoji: "🥇", label: "Trusted" };
  if (score >= 60) return { tier: "SILVER", emoji: "🥈", label: "Moderate Trust" };
  if (score >= 40) return { tier: "BRONZE", emoji: "🥉", label: "Low Trust" };
  return { tier: "UNTRUSTED", emoji: "⚠️", label: "Untrusted" };
}
