/**
 * 🪪 AgentLedge Identity — Agent Identity Registry on Hedera (HTS NFT)
 * Each agent gets a unique on-chain identity with metadata
 * 
 * AgentLedge — AgentLedge
 */
import {
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
  TokenId,
  CustomRoyaltyFee,
  CustomFixedFee,
  Hbar,
} from "@hashgraph/sdk";
import { client, accountId, privateKey } from "../hedera/client.js";

let alTokenId = null;
const agentRegistry = new Map(); // agentName → { serialNumber, metadata, registeredAt }

/**
 * Create the AgentLedge Identity NFT collection (one-time setup)
 */
export async function createALRegistry() {
  if (process.env.AL_TOKEN_ID) {
    alTokenId = TokenId.fromString(process.env.AL_TOKEN_ID);
    console.log(`♻️ Reusing AgentLedge Identity Registry: ${alTokenId}`);
    return alTokenId;
  }

  const tx = new TokenCreateTransaction()
    .setTokenName("AgentLedge Agent Identity")
    .setTokenSymbol("ALID")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(accountId)
    .setSupplyKey(privateKey.publicKey)
    .setAdminKey(privateKey.publicKey)
    .setTokenMemo("AgentLedge — Agent Identity Registry | AgentLedge")
    .freezeWith(client);

  const signedTx = await tx.sign(privateKey);
  const response = await signedTx.execute(client);
  const receipt = await response.getReceipt(client);
  alTokenId = receipt.tokenId;

  console.log(`✅ AgentLedge Identity Registry created: ${alTokenId}`);
  return alTokenId;
}

/**
 * Register an agent — mint a unique NFT identity
 * @param {Object} agentInfo - { name, role, capabilities, model, version }
 * @returns {Object} - { serialNumber, alId, metadata }
 */
export async function registerAgent(agentInfo) {
  if (!alTokenId) throw new Error("AgentLedge Registry not initialized. Call createALRegistry() first.");

  const metadata = {
    standard: "AL-v1",
    type: "agent-identity",
    name: agentInfo.name,
    role: agentInfo.role,
    capabilities: agentInfo.capabilities || [],
    model: agentInfo.model || "anthropic/claude",
    version: agentInfo.version || "1.0.0",
    registeredAt: new Date().toISOString(),
    registeredBy: accountId.toString(),
    trustScore: 100,
    totalDecisions: 0,
    humanApprovals: 0,
    humanRejections: 0,
  };

  // HTS NFT metadata limit is 100 bytes — store compact reference on-chain,
  // full metadata is logged via HCS decision log
  const compactMeta = `AL:${agentInfo.name}:${agentInfo.role}:v${agentInfo.version || "1.0.0"}`;
  const metadataBytes = Buffer.from(compactMeta.slice(0, 100));

  const mintTx = new TokenMintTransaction()
    .setTokenId(alTokenId)
    .addMetadata(metadataBytes)
    .freezeWith(client);

  const signedTx = await mintTx.sign(privateKey);
  const response = await signedTx.execute(client);
  const receipt = await response.getReceipt(client);

  const serialNumber = receipt.serials[0].toNumber();
  const alId = `AL-${alTokenId.toString()}-${serialNumber}`;

  const registration = {
    alId,
    serialNumber,
    tokenId: alTokenId.toString(),
    metadata,
    txId: response.transactionId.toString(),
  };

  agentRegistry.set(agentInfo.name, registration);

  console.log(`🪪 Agent registered: ${agentInfo.name} → ${alId} (serial #${serialNumber})`);
  return registration;
}

/**
 * Get agent identity info
 */
export function getAgentIdentity(agentName) {
  return agentRegistry.get(agentName) || null;
}

/**
 * Get all registered agents
 */
export function getAllAgents() {
  return Object.fromEntries(agentRegistry);
}

/**
 * Get AgentLedge Token ID
 */
export function getALTokenId() {
  return alTokenId;
}
