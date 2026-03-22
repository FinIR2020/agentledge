/**
 * HTS Token Management — Create & manage SWARM token for agent-to-agent payments
 * [P0] Added retry logic, error handling, and reuse support
 */
import {
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TransferTransaction,
  TokenAssociateTransaction,
  AccountCreateTransaction,
  Hbar,
  PrivateKey,
  TokenId,
} from "@hashgraph/sdk";
import { client, accountId, privateKey } from "./client.js";

/** Retry helper — exponential backoff, max 3 attempts */
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
 * Create the SWARM utility token, or reuse from env
 */
export async function createSwarmToken() {
  // Reuse existing token if configured
  if (process.env.SWARM_TOKEN_ID) {
    const tokenId = TokenId.fromString(process.env.SWARM_TOKEN_ID);
    console.log(`♻️ Reusing SWARM Token: ${tokenId}`);
    return tokenId;
  }

  return retry(async () => {
    const tx = new TokenCreateTransaction()
      .setTokenName("AgentLedge Credits")
      .setTokenSymbol("SWARM")
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(2)
      .setInitialSupply(1_000_000)
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(privateKey.publicKey)
      .setTreasuryAccountId(accountId)
      .setAdminKey(privateKey.publicKey)
      .freezeWith(client);

    const signedTx = await tx.sign(privateKey);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);
    const tokenId = receipt.tokenId;

    console.log(`✅ SWARM Token created: ${tokenId}`);
    return tokenId;
  }, "createSwarmToken");
}

/**
 * Create a new Hedera account for an agent
 */
export async function createAgentAccount(agentName) {
  return retry(async () => {
    const agentKey = PrivateKey.generateECDSA();

    const tx = new AccountCreateTransaction()
      .setKey(agentKey.publicKey)
      .setInitialBalance(new Hbar(10))
      .setAccountMemo(`AgentLedge::${agentName}`)
      .freezeWith(client);

    const signedTx = await tx.sign(privateKey);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`✅ Agent "${agentName}" account: ${receipt.accountId}`);
    return {
      accountId: receipt.accountId,
      privateKey: agentKey,
      name: agentName,
    };
  }, `createAgentAccount(${agentName})`);
}

/**
 * Associate SWARM token with an agent account
 */
export async function associateToken(tokenId, agentAccountId, agentPrivateKey) {
  return retry(async () => {
    const tx = new TokenAssociateTransaction()
      .setAccountId(agentAccountId)
      .setTokenIds([tokenId])
      .freezeWith(client);

    const signedTx = await tx.sign(agentPrivateKey);
    const response = await signedTx.execute(client);
    await response.getReceipt(client);
    console.log(`✅ Token associated with ${agentAccountId}`);
  }, `associateToken(${agentAccountId})`);
}

/**
 * Transfer SWARM tokens (agent-to-agent payment)
 */
export async function transferSwarm(tokenId, fromId, fromKey, toId, amount, memo) {
  return retry(async () => {
    const tx = new TransferTransaction()
      .addTokenTransfer(tokenId, fromId, -amount)
      .addTokenTransfer(tokenId, toId, amount)
      .setTransactionMemo(memo || "AgentLedge service payment")
      .freezeWith(client);

    const signedTx = await tx.sign(fromKey);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`💰 Transferred ${amount / 100} SWARM: ${fromId} → ${toId} | ${memo}`);
    return receipt;
  }, `transferSwarm(${fromId}→${toId})`);
}

/**
 * Fund agent with initial SWARM tokens from treasury
 */
export async function fundAgent(tokenId, agentAccountId, amount) {
  return transferSwarm(tokenId, accountId, privateKey, agentAccountId, amount, "Treasury → Agent funding");
}
