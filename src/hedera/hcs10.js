/**
 * 📡 HCS-10 OpenConvAI Protocol — Using REAL @hashgraphonline/standards-sdk
 * 
 * Uses the official HCS10Client for:
 * - Agent creation with inbound/outbound/profile topics
 * - Connection handshake (request → confirm)
 * - Message exchange on connection topics
 * - Guarded registry registration
 * 
 * Reference: https://hol.org/docs/libraries/standards-sdk/hcs-10/server/
 * 
 * AgentLedge — AgentLedge
 */
import { createRequire } from "module";
import dotenv from "dotenv";
dotenv.config();

const require = createRequire(import.meta.url);
const {
  HCS10Client,
  AgentBuilder,
  AIAgentCapability,
} = require("@hashgraphonline/standards-sdk");

// ═══════════════════════════════════════════════
// Initialize the official HCS-10 client
// ═══════════════════════════════════════════════
const hcs10Client = new HCS10Client({
  network: "testnet",
  operatorId: process.env.HEDERA_ACCOUNT_ID,
  operatorPrivateKey: process.env.HEDERA_PRIVATE_KEY,
  logLevel: "warn",
  guardedRegistryBaseUrl: "https://moonscape.tech",
});

// Agent registry — maps agentName → full HCS-10 metadata
const agents = new Map();
// Connection registry
const connections = [];
// Message log
const messageLog = [];

/**
 * Create and register an HCS-10 agent using the official SDK
 * This creates: account, inbound topic, outbound topic, profile topic
 * And registers with the HOL guarded registry
 */
export async function registerHCS10Agent(agentName, config = {}) {
  console.log(`📡 [HCS-10/SDK] Creating agent: ${agentName}...`);

  // Build agent with official AgentBuilder
  const agentBuilder = new AgentBuilder()
    .setName(agentName)
    .setDescription(config.description || `AgentLedge ${agentName} — AgentLedge`)
    .setAgentType(config.agentType || "autonomous")
    .setModel(config.model || "anthropic/claude")
    .setNetwork("testnet")
    .setCapabilities(
      (config.capabilities || []).map(c => {
        // Map our capability strings to SDK enums where possible
        const capMap = {
          "market-data": AIAgentCapability.KNOWLEDGE_RETRIEVAL,
          "sentiment-analysis": AIAgentCapability.TEXT_GENERATION,
          "risk-assessment": AIAgentCapability.TEXT_GENERATION,
          "portfolio-optimization": AIAgentCapability.TEXT_GENERATION,
          "trade-execution": AIAgentCapability.TEXT_GENERATION,
          "position-management": AIAgentCapability.TEXT_GENERATION,
          "yield-optimization": AIAgentCapability.TEXT_GENERATION,
        };
        return capMap[c] || AIAgentCapability.TEXT_GENERATION;
      })
    )
    .setMetadata({
      creator: "AgentLedge",
      version: "1.0.0",
      properties: {
        al_enabled: true,
        trust_score_tracking: true,
        decision_log_enabled: true,
        human_oversight: config.humanOversight !== false,
        ...(config.properties || {}),
      },
    });

  // Create and register agent via official SDK
  // This does: create account → create topics → create profile → register in guarded registry
  const result = await hcs10Client.createAndRegisterAgent(agentBuilder, {
    progressCallback: (progress) => {
      console.log(`   [${agentName}] ${progress.stage}: ${progress.progressPercent}%`);
    },
  });

  if (!result.success) {
    console.error(`❌ [HCS-10/SDK] Failed to create ${agentName}: ${result.error}`);
    throw new Error(`HCS-10 agent creation failed: ${result.error}`);
  }

  const metadata = result.metadata;
  const agentData = {
    name: agentName,
    accountId: metadata.accountId,
    privateKey: metadata.privateKey, // Store securely — needed to operate agent
    inboundTopicId: metadata.inboundTopicId,
    outboundTopicId: metadata.outboundTopicId,
    profileTopicId: metadata.profileTopicId,
    operatorId: metadata.operatorId,
    capabilities: config.capabilities || [],
    description: config.description || "",
    registeredAt: new Date().toISOString(),
    connections: [],
    sdk: true, // Flag: created via official SDK
  };

  agents.set(agentName, agentData);

  console.log(`✅ [HCS-10/SDK] Agent registered: ${agentName}`);
  console.log(`   Account:  ${metadata.accountId}`);
  console.log(`   Inbound:  ${metadata.inboundTopicId}`);
  console.log(`   Outbound: ${metadata.outboundTopicId}`);
  console.log(`   Profile:  ${metadata.profileTopicId}`);

  return agentData;
}

/**
 * Create an HCS-10 client for a specific agent (using agent's own credentials)
 */
function getAgentClient(agentName) {
  const agent = agents.get(agentName);
  if (!agent || !agent.privateKey) {
    throw new Error(`Agent ${agentName} not found or missing credentials`);
  }

  return new HCS10Client({
    network: "testnet",
    operatorId: agent.accountId,
    operatorPrivateKey: agent.privateKey,
    logLevel: "error",
  });
}

/**
 * Connect two agents via HCS-10 connection handshake (using official SDK)
 * Agent A sends connection_request → Agent B accepts → connection topic created
 */
export async function connectAgents(fromAgentName, toAgentName) {
  const fromAgent = agents.get(fromAgentName);
  const toAgent = agents.get(toAgentName);
  if (!fromAgent || !toAgent) throw new Error(`Agent not found: ${fromAgentName} or ${toAgentName}`);

  console.log(`🔗 [HCS-10/SDK] Connecting: ${fromAgentName} → ${toAgentName}...`);

  // Use fromAgent's client to send connection request
  const fromClient = getAgentClient(fromAgentName);

  // Step 1: Submit connection request to target's inbound topic
  const requestResult = await fromClient.submitConnectionRequest(
    toAgent.inboundTopicId,
    `AgentLedge: ${fromAgentName} requesting connection to ${toAgentName}`
  );
  const requestId = requestResult.topicSequenceNumber.toNumber();
  console.log(`   Request sent: seq#${requestId}`);

  // Step 2: Target agent handles the connection request
  const toClient = getAgentClient(toAgentName);
  const response = await toClient.handleConnectionRequest(
    toAgent.inboundTopicId,
    fromAgent.accountId,
    requestId,
    undefined, // No custom fee config
    120 // TTL in seconds
  );

  const connectionTopicId = response.connectionTopicId;
  console.log(`   Connection topic created: ${connectionTopicId}`);

  // Step 3: Requesting agent confirms connection
  const confirmation = await fromClient.waitForConnectionConfirmation(
    toAgent.inboundTopicId,
    requestId,
    30, // Max wait seconds
    2000 // Poll interval ms
  );

  const connection = {
    id: `CONN-${connections.length + 1}`,
    from: fromAgentName,
    to: toAgentName,
    connectionTopicId: confirmation.connectionTopicId || connectionTopicId,
    fromAccountId: fromAgent.accountId,
    toAccountId: toAgent.accountId,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    sdk: true,
  };

  connections.push(connection);
  fromAgent.connections.push(connection);
  toAgent.connections.push(connection);

  console.log(`✅ [HCS-10/SDK] Connection established: ${fromAgentName} ↔ ${toAgentName} | Topic: ${connection.connectionTopicId}`);
  return connection;
}

/**
 * Send a message between connected agents (using official SDK)
 */
export async function sendServiceRequest(fromAgentName, toAgentName, serviceType, payload) {
  const connection = connections.find(
    c => (c.from === fromAgentName && c.to === toAgentName) || (c.from === toAgentName && c.to === fromAgentName)
  );
  if (!connection) throw new Error(`No connection between ${fromAgentName} and ${toAgentName}`);

  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const message = {
    type: "service_request",
    request_id: requestId,
    from: fromAgentName,
    to: toAgentName,
    service: serviceType,
    payload,
    timestamp: new Date().toISOString(),
  };

  // Use the sender's client to send via SDK
  const senderClient = getAgentClient(fromAgentName);
  await senderClient.sendMessage(
    connection.connectionTopicId,
    JSON.stringify(message),
    `AL|${serviceType}|${requestId}`
  );

  messageLog.push({ ...message, connectionTopicId: connection.connectionTopicId });
  console.log(`📨 [HCS-10/SDK] Service request: ${fromAgentName} → ${toAgentName} | ${serviceType} | ${requestId}`);
  return { requestId, connectionTopicId: connection.connectionTopicId };
}

/**
 * Send a service response message (using official SDK)
 */
export async function sendServiceResponse(fromAgentName, toAgentName, requestId, payload) {
  const connection = connections.find(
    c => (c.from === fromAgentName && c.to === toAgentName) || (c.from === toAgentName && c.to === fromAgentName)
  );
  if (!connection) throw new Error(`No connection between ${fromAgentName} and ${toAgentName}`);

  const message = {
    type: "service_response",
    request_id: requestId,
    from: fromAgentName,
    to: toAgentName,
    payload,
    timestamp: new Date().toISOString(),
  };

  const senderClient = getAgentClient(fromAgentName);
  await senderClient.sendMessage(
    connection.connectionTopicId,
    JSON.stringify(message),
    `AL|response|${requestId}`
  );

  messageLog.push({ ...message, connectionTopicId: connection.connectionTopicId });
  console.log(`📬 [HCS-10/SDK] Service response: ${fromAgentName} → ${toAgentName} | ${requestId}`);
  return { requestId };
}

/**
 * Read messages from a connection topic (using official SDK)
 */
export async function getConnectionMessages(connectionTopicId) {
  const { messages } = await hcs10Client.getMessages(connectionTopicId);
  return messages;
}

// ═══════════════════════════════════════════════
// Query APIs
// ═══════════════════════════════════════════════

export function getConnections() { return connections; }
export function getMessageLog() { return messageLog; }
export function getAgent(name) { return agents.get(name) || null; }
export function setAgent(name, data) { agents.set(name, data); }
export function getAllHCS10Agents() {
  // Return without privateKeys for safety
  const result = {};
  for (const [name, data] of agents) {
    const { privateKey, ...safe } = data;
    result[name] = safe;
  }
  return result;
}

export { hcs10Client };
