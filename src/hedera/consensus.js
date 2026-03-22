/**
 * Hedera Consensus Service (HCS) — Agent communication & attestation log
 * [P0] Added retry logic, error handling, and topic reuse
 */
import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
} from "@hashgraph/sdk";
import { client, privateKey } from "./client.js";

/** Retry helper */
async function retry(fn, label, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      const wait = Math.pow(2, i) * 1000;
      console.warn(`⚠️ [${label}] Attempt ${i + 1}/${maxRetries} failed: ${e.message}. Retrying in ${wait}ms...`);
      if (i === maxRetries - 1) throw e;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

/**
 * Create a topic for agent communication logs, or reuse from env
 */
export async function createTopic(memo) {
  if (process.env.DECISION_LOG_TOPIC || process.env.HCS_TOPIC_ID) {
    const topicId = TopicId.fromString(process.env.DECISION_LOG_TOPIC || process.env.HCS_TOPIC_ID);
    console.log(`♻️ Reusing HCS Topic: ${topicId}`);
    return topicId;
  }

  return retry(async () => {
    const tx = new TopicCreateTransaction()
      .setTopicMemo(memo || "AgentLedge Communication Channel")
      .setAdminKey(privateKey.publicKey)
      .setSubmitKey(privateKey.publicKey)
      .freezeWith(client);

    const signedTx = await tx.sign(privateKey);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`✅ Topic created: ${receipt.topicId} | ${memo}`);
    return receipt.topicId;
  }, "createTopic");
}

/**
 * Log an agent action/decision on-chain
 */
export async function logAgentAction(topicId, action) {
  return retry(async () => {
    const message = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...action,
    });

    const tx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message)
      .freezeWith(client);

    const signedTx = await tx.sign(privateKey);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`📝 Logged: [${action.agent}] ${action.type} — seq#${receipt.topicSequenceNumber}`);
    return receipt.topicSequenceNumber;
  }, `logAgentAction(${action.agent}:${action.type})`);
}
