/**
 * 🧪 AgentLedge — Basic Test Suite
 * Tests core modules without Hedera connection
 */

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✅ ${msg}`);
    passed++;
  } else {
    console.log(`  ❌ ${msg}`);
    failed++;
  }
}

// ─── Test Trust Score ───
console.log("\n📊 Testing Trust Score Module...");
import { initAgentTrust, recordDecisionOutcome, getAgentTrustScore, getAllTrustScores, getTrustTier } from "./kya/trust-score.js";

initAgentTrust("TestAgent", "AL-TEST-1");
const initial = getAgentTrustScore("TestAgent");
assert(initial !== null, "Agent initialized");
assert(initial.trustScore === 100, "Initial trust score is 100");

recordDecisionOutcome("TestAgent", { predictionMade: true, predictionCorrect: true });
const after1 = getAgentTrustScore("TestAgent");
assert(after1.totalDecisions === 1, "Decision counted");
assert(after1.trustScore === 100, "Score stays 100 after correct prediction");

recordDecisionOutcome("TestAgent", { predictionMade: true, predictionCorrect: false });
const after2 = getAgentTrustScore("TestAgent");
assert(after2.trustScore < 100, "Score decreases after wrong prediction");

recordDecisionOutcome("TestAgent", { humanApproval: "REJECTED" });
const after3 = getAgentTrustScore("TestAgent");
assert(after3.trustScore < after2.trustScore, "Score decreases after rejection");

recordDecisionOutcome("TestAgent", { failed: true });
const after4 = getAgentTrustScore("TestAgent");
assert(after4.trustScore < after3.trustScore, "Score decreases after failure");

const allScores = getAllTrustScores();
assert(Object.keys(allScores).length >= 1, "getAllTrustScores returns data");

// ─── Test Trust Tiers ───
console.log("\n🏆 Testing Trust Tiers...");
assert(getTrustTier(95).tier === "PLATINUM", "95 → PLATINUM");
assert(getTrustTier(80).tier === "GOLD", "80 → GOLD");
assert(getTrustTier(65).tier === "SILVER", "65 → SILVER");
assert(getTrustTier(45).tier === "BRONZE", "45 → BRONZE");
assert(getTrustTier(20).tier === "UNTRUSTED", "20 → UNTRUSTED");

// ─── Test Human Oversight ───
console.log("\n🛡️ Testing Human Oversight...");
import { checkApprovalRequired, getConfig, updateConfig } from "./kya/human-oversight.js";

const check1 = checkApprovalRequired({ agent: "Test", tradeAmount: 10, riskLevel: "LOW", confidence: 80 });
assert(!check1.required, "Low risk + low amount = no approval");

const check2 = checkApprovalRequired({ agent: "Test", tradeAmount: 100, riskLevel: "LOW", confidence: 80 });
assert(check2.required, "High amount ($100) = approval required");
assert(check2.reasons.some(r => r.includes("threshold")), "Reason includes threshold");

const check3 = checkApprovalRequired({ agent: "Test", tradeAmount: 10, riskLevel: "HIGH", confidence: 80 });
assert(check3.required, "HIGH risk = approval required");

const check4 = checkApprovalRequired({ agent: "Test", tradeAmount: 10, riskLevel: "LOW", confidence: 50 });
assert(check4.required, "Low confidence (50%) = approval required");

const config = getConfig();
assert(config.tradeAmountThreshold === 50, "Default threshold is $50");

updateConfig({ tradeAmountThreshold: 200 });
const check5 = checkApprovalRequired({ agent: "Test", tradeAmount: 100, riskLevel: "LOW", confidence: 80 });
assert(!check5.required, "After raising threshold to $200, $100 doesn't require approval");
updateConfig({ tradeAmountThreshold: 50 }); // Reset

// ─── Test x402 ───
console.log("\n💳 Testing x402 Module...");
import { registerService, createPaymentRequired, getServiceRegistry, getPaymentStats } from "./hedera/x402.js";

registerService("test-service", { seller: "TestSeller", sellerAccountId: "0.0.1234", price: 2.50, description: "Test" });
const services = getServiceRegistry();
assert(services["test-service"] !== undefined, "Service registered");
assert(services["test-service"].price === 2.50, "Price is 2.50");

const payReq = createPaymentRequired("test-service");
assert(payReq.status === 402, "Returns 402 status");
assert(payReq.body.paymentTerms.amount === 2.50, "Payment terms include price");
assert(payReq.body.paymentTerms.recipient === "0.0.1234", "Correct recipient");

const stats = getPaymentStats();
assert(stats.totalPayments >= 0, "Stats return data");

// ─── Results ───
console.log(`\n${"═".repeat(40)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`${"═".repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
