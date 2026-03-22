/**
 * 🎬 AgentLedge Demo Script
 * Runs a complete demonstration: initialize → 5 cycles → show results
 * Perfect for video recording and hackathon demos
 * 
 * Usage: node src/demo.js
 */
import { SwarmCoordinator } from "./agents/coordinator.js";
import { getAllTrustScores, getTrustTier } from "./kya/trust-score.js";
import { getDecisionHistory } from "./kya/decision-log.js";
import { getPaymentStats } from "./hedera/x402.js";
import { getConnections, getMessageLog } from "./hedera/hcs10.js";
import { getRegisteredHOLAgents } from "./hedera/hol-registry.js";

const CYCLES = 3;
const DELAY = 3000; // ms between cycles

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function divider(title) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}\n`);
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🪪  AgentLedge — AgentLedge                    ║
║                                                          ║
║   The Trust & Accountability Layer for                   ║
║   Autonomous DeFi Agents on Hedera                       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);

  // ─── Phase 1: Initialize ───
  divider("Phase 1: Initialize Protocol");
  
  const coordinator = new SwarmCoordinator();
  const setup = await coordinator.initialize();
  
  console.log("\n📋 Initialization Summary:");
  console.log(`   🪪 AgentLedge Registry:  ${setup.alTokenId}`);
  console.log(`   🪙 SWARM Token:   ${setup.tokenId}`);
  console.log(`   📜 Decision Log:  ${setup.topicId}`);
  console.log(`   🏛️ HOL Registry:  ${setup.holRegistryTopicId}`);
  console.log(`   📡 HCS-10 Connections: ${setup.infrastructure.hcs10Connections}`);
  console.log(`   💳 x402 Services: ${setup.infrastructure.x402Services}`);
  console.log(`   🤖 Agents: ${Object.keys(setup.agents).length}`);
  
  for (const [name, agent] of Object.entries(setup.agents)) {
    console.log(`      • ${name}: ${agent.accountId} [${agent.alId}]`);
  }

  await sleep(2000);

  // ─── Phase 2: Run Cycles ───
  divider(`Phase 2: Running ${CYCLES} Analysis Cycles`);
  
  const results = [];
  for (let i = 0; i < CYCLES; i++) {
    console.log(`\n🔄 Starting cycle ${i + 1}/${CYCLES}...`);
    await sleep(DELAY);
    
    const result = await coordinator.runCycle(
      i === 0 ? "Analyze HBAR/USDC market conditions" :
      i === 1 ? "Evaluate DeFi yield opportunities" :
      i === 2 ? "Check BTC and ETH momentum" :
      i === 3 ? "Assess portfolio risk exposure" :
      "Generate final market summary"
    );
    
    results.push(result);
    
    if (result.status === "SUCCESS") {
      console.log(`   ✅ Cycle #${result.cycle}: ${result.intel.sentiment} | ${result.analysis.riskProfile} | ${result.execution.succeeded}/${result.execution.totalActions} executed`);
      console.log(`   💳 x402: ${result.payments.length} payments | 📡 HCS-10: ${result.hcs10Messages} messages`);
      if (result.humanOversight.required) {
        console.log(`   🛡️ Human oversight: ${result.humanOversight.status} (${result.humanOversight.reasons.join(", ")})`);
      }
    } else {
      console.log(`   ❌ Cycle #${result.cycle} failed: ${result.error}`);
    }
  }

  await sleep(2000);

  // ─── Phase 3: Results ───
  divider("Phase 3: Final Results");
  
  // Trust Scores
  console.log("📊 Agent Trust Scores:");
  const scores = getAllTrustScores();
  for (const [name, data] of Object.entries(scores)) {
    const tier = getTrustTier(data.trustScore);
    console.log(`   ${tier.emoji} ${name}: ${data.trustScore}/100 (${tier.label}) — ${data.totalDecisions} decisions`);
    const dims = data.dimensions;
    console.log(`      Accuracy: ${dims.accuracy.toFixed(0)}% | Consistency: ${dims.consistency.toFixed(0)}% | Human Approval: ${dims.humanApproval.toFixed(0)}% | Risk Mgmt: ${dims.riskManagement.toFixed(0)}%`);
  }
  
  // Economy
  console.log("\n💳 Agent Economy (x402):");
  const payStats = getPaymentStats();
  console.log(`   Total payments: ${payStats.totalPayments}`);
  console.log(`   Total volume: ${payStats.totalVolume.toFixed(2)} HBAR`);
  for (const [service, stats] of Object.entries(payStats.byService || {})) {
    console.log(`   • ${service}: ${stats.count} payments, ${stats.volume.toFixed(2)} HBAR`);
  }
  
  // Communication
  console.log("\n📡 HCS-10 Communication:");
  console.log(`   Connections: ${getConnections().length}`);
  console.log(`   Messages: ${getMessageLog().length}`);
  
  // HOL Registry
  console.log("\n🏛️ HOL Registry:");
  const holAgents = getRegisteredHOLAgents();
  console.log(`   Registered agents: ${Object.keys(holAgents).length}`);
  
  // Decision Log
  console.log("\n📜 On-Chain Decision Log:");
  const decisions = getDecisionHistory(50);
  console.log(`   Total decisions logged: ${decisions.length}`);
  const types = {};
  decisions.forEach(d => { types[d.type] = (types[d.type] || 0) + 1; });
  for (const [type, count] of Object.entries(types)) {
    console.log(`   • ${type}: ${count}`);
  }
  
  // Cycle Summary
  console.log("\n📈 Cycle Summary:");
  const succeeded = results.filter(r => r.status === "SUCCESS").length;
  const failed = results.filter(r => r.status === "FAILED").length;
  console.log(`   Total: ${results.length} | Success: ${succeeded} | Failed: ${failed}`);
  
  const avgDuration = results.filter(r => r.durationMs).reduce((s, r) => s + r.durationMs, 0) / succeeded;
  console.log(`   Avg cycle time: ${(avgDuration / 1000).toFixed(1)}s`);
  
  // Verification Links
  divider("Verify On-Chain");
  console.log(`🔍 All data is verifiable on Hedera testnet:\n`);
  console.log(`   Decision Log: https://hashscan.io/testnet/topic/${setup.topicId}`);
  console.log(`   AgentLedge Registry: https://hashscan.io/testnet/token/${setup.alTokenId}`);
  console.log(`   SWARM Token:  https://hashscan.io/testnet/token/${setup.tokenId}`);
  console.log(`   HOL Registry: https://hashscan.io/testnet/topic/${setup.holRegistryTopicId}`);
  
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🪪  AgentLedge Demo Complete!                       ║
║                                                          ║
║   "Giza manages $35M but nobody can answer what          ║
║    decisions agents made or why. AgentLedge gives      ║
║    agents identity, logs every decision, and ensures     ║
║    humans stay in control."                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);
  
  process.exit(0);
}

main().catch(e => {
  console.error("❌ Demo failed:", e.message);
  process.exit(1);
});
