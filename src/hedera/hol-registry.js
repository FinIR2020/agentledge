/**
 * 🏛️ HOL Registry Broker — Register agents via official SDK + API
 * 
 * Uses @hashgraphonline/standards-sdk for:
 * - Guarded registry registration (moonscape.tech)
 * - On-chain registry topic management
 * - Registry Broker Client for discovery
 * 
 * HOL Registry: https://hol.org — 65K+ agents registered
 * 
 * AgentLedge — AgentLedge
 */
import { createRequire } from "module";
import { hcs10Client } from "./hcs10.js";
import { client, accountId, privateKey } from "./client.js";
import dotenv from "dotenv";
dotenv.config();

const require = createRequire(import.meta.url);
const { buildHcs10RegistryRegisterTx } = require("@hashgraphonline/standards-sdk");

let registryTopicId = null;
const registeredAgents = new Map();

/**
 * Initialize the HOL Registry
 * Uses the SDK to create a registry topic or reuse existing one
 */
export async function initializeRegistry() {
  if (process.env.HOL_REGISTRY_TOPIC) {
    registryTopicId = process.env.HOL_REGISTRY_TOPIC;
    console.log(`♻️ [HOL/SDK] Reusing registry topic: ${registryTopicId}`);
    return registryTopicId;
  }

  // Create registry topic via SDK
  try {
    const topicResult = await hcs10Client.createRegistryTopic();
    registryTopicId = topicResult?.topicId?.toString() || topicResult?.toString();
    console.log(`✅ [HOL/SDK] Registry topic created: ${registryTopicId}`);
  } catch (e) {
    // Fallback: create manually
    console.log(`⚠️ [HOL] SDK createRegistryTopic failed: ${e.message}. Creating manually...`);
    const { TopicCreateTransaction } = await import("@hashgraph/sdk");
    const tx = await new TopicCreateTransaction()
      .setTopicMemo("hcs-10:registry:agentledge")
      .setSubmitKey(privateKey.publicKey)
      .setAdminKey(privateKey.publicKey)
      .freezeWith(client)
      .sign(privateKey);
    const response = await tx.execute(client);
    const receipt = await response.getReceipt(client);
    registryTopicId = receipt.topicId.toString();
    console.log(`✅ [HOL] Registry topic created (manual): ${registryTopicId}`);
  }

  return registryTopicId;
}

/**
 * Register an agent in the HOL Registry
 * 1. Try SDK guarded registry (registerAgentWithGuardedRegistry)
 * 2. Also submit on-chain registration to registry topic
 */
export async function registerInHOL(agentConfig) {
  if (!registryTopicId) await initializeRegistry();

  const agentAccountId = agentConfig.accountId || accountId.toString();
  let guardedResult = null;

  // ─── Step 1: Try SDK guarded registry ───
  try {
    console.log(`🏛️ [HOL/SDK] Registering ${agentConfig.name} via guarded registry...`);
    guardedResult = await hcs10Client.registerAgentWithGuardedRegistry(
      agentAccountId,
      "testnet",
      {
        progressCallback: (progress) => {
          console.log(`   [HOL] ${progress.stage}: ${progress.progressPercent}%`);
        },
        maxAttempts: 10,
        delayMs: 2000,
      }
    );
    if (guardedResult.success) {
      console.log(`✅ [HOL/SDK] Guarded registry accepted: ${agentConfig.name}`);
    } else {
      console.log(`⚠️ [HOL/SDK] Guarded registry: ${guardedResult.error || "failed"}`);
    }
  } catch (e) {
    console.log(`⚠️ [HOL/SDK] Guarded registry error: ${e.message}`);
    console.log(`   Falling back to on-chain registry...`);
  }

  // ─── Step 2: On-chain registration (always) ───
  try {
    await hcs10Client.registerAgent(
      registryTopicId,
      agentAccountId,
      agentConfig.inboundTopicId,
      `AL Agent: ${agentConfig.name} | ${agentConfig.alId || "pending"}`
    );
    console.log(`📝 [HOL/SDK] On-chain registry: ${agentConfig.name} → ${registryTopicId}`);
  } catch (e) {
    console.warn(`⚠️ [HOL] On-chain registration error: ${e.message}`);
    // Non-fatal — the guarded registry may have succeeded
  }

  const result = {
    name: agentConfig.name,
    accountId: agentAccountId,
    alId: agentConfig.alId,
    inboundTopicId: agentConfig.inboundTopicId,
    registryTopicId,
    guardedRegistrySuccess: guardedResult?.success || false,
    registeredAt: new Date().toISOString(),
    sdk: true,
  };

  registeredAgents.set(agentConfig.name, result);

  console.log(`🏛️ [HOL] Agent registered: ${agentConfig.name} | Guarded: ${result.guardedRegistrySuccess ? "✅" : "⚠️ fallback"}`);
  return result;
}

// ═══════════════════════════════════════════════
// Query APIs
// ═══════════════════════════════════════════════

export function getRegisteredHOLAgents() {
  return Object.fromEntries(registeredAgents);
}

export function getRegistryTopicId() {
  return registryTopicId || null;
}

export function getAgentRegistration(agentName) {
  return registeredAgents.get(agentName) || null;
}
