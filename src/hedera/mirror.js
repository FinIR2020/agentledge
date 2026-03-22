/**
 * 🔍 Hedera Mirror Node — Query on-chain data for verification
 * 
 * Reads decision logs, transaction history, and token info from Mirror Node
 * This proves AgentLedge decisions are truly on-chain and verifiable
 * 
 * AgentLedge — AgentLedge
 */

const MIRROR_BASE = "https://testnet.mirrornode.hedera.com";

/**
 * Fetch topic messages from Mirror Node (verify decision logs)
 */
export async function getTopicMessages(topicId, limit = 25) {
  try {
    const url = `${MIRROR_BASE}/api/v1/topics/${topicId}/messages?limit=${limit}&order=desc`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Mirror API ${resp.status}`);
    const data = await resp.json();
    
    return (data.messages || []).map(msg => {
      let decoded = null;
      try {
        decoded = JSON.parse(Buffer.from(msg.message, "base64").toString("utf-8"));
      } catch (e) {
        decoded = { raw: Buffer.from(msg.message, "base64").toString("utf-8") };
      }
      
      return {
        sequenceNumber: msg.sequence_number,
        consensusTimestamp: msg.consensus_timestamp,
        topicId: msg.topic_id,
        message: decoded,
        runningHash: msg.running_hash,
        payerAccountId: msg.payer_account_id,
      };
    });
  } catch (e) {
    console.error(`❌ [Mirror] Failed to fetch topic ${topicId}: ${e.message}`);
    return [];
  }
}

/**
 * Get token info from Mirror Node
 */
export async function getTokenInfo(tokenId) {
  try {
    const url = `${MIRROR_BASE}/api/v1/tokens/${tokenId}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Mirror API ${resp.status}`);
    return await resp.json();
  } catch (e) {
    console.error(`❌ [Mirror] Failed to fetch token ${tokenId}: ${e.message}`);
    return null;
  }
}

/**
 * Get NFT info (AgentLedge Identity NFTs)
 */
export async function getNFTInfo(tokenId, serialNumber) {
  try {
    const url = `${MIRROR_BASE}/api/v1/tokens/${tokenId}/nfts/${serialNumber}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Mirror API ${resp.status}`);
    const data = await resp.json();
    
    let metadata = null;
    try {
      metadata = JSON.parse(Buffer.from(data.metadata, "base64").toString("utf-8"));
    } catch (e) {}
    
    return { ...data, decodedMetadata: metadata };
  } catch (e) {
    console.error(`❌ [Mirror] Failed to fetch NFT: ${e.message}`);
    return null;
  }
}

/**
 * Get all NFTs for a token (all registered agents)
 */
export async function getAllNFTs(tokenId) {
  try {
    const url = `${MIRROR_BASE}/api/v1/tokens/${tokenId}/nfts?limit=25&order=asc`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Mirror API ${resp.status}`);
    const data = await resp.json();
    
    return (data.nfts || []).map(nft => {
      let metadata = null;
      try {
        metadata = JSON.parse(Buffer.from(nft.metadata, "base64").toString("utf-8"));
      } catch (e) {}
      return { ...nft, decodedMetadata: metadata };
    });
  } catch (e) {
    console.error(`❌ [Mirror] Failed to fetch NFTs: ${e.message}`);
    return [];
  }
}

/**
 * Get account info
 */
export async function getAccountInfo(accountId) {
  try {
    const url = `${MIRROR_BASE}/api/v1/accounts/${accountId}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Mirror API ${resp.status}`);
    return await resp.json();
  } catch (e) {
    console.error(`❌ [Mirror] Failed to fetch account ${accountId}: ${e.message}`);
    return null;
  }
}

/**
 * Get account token balances
 */
export async function getAccountTokens(accountId) {
  try {
    const url = `${MIRROR_BASE}/api/v1/accounts/${accountId}/tokens`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Mirror API ${resp.status}`);
    return await resp.json();
  } catch (e) {
    console.error(`❌ [Mirror] Failed to fetch tokens for ${accountId}: ${e.message}`);
    return null;
  }
}

/**
 * Get recent transactions for an account
 */
export async function getAccountTransactions(accountId, limit = 10) {
  try {
    const url = `${MIRROR_BASE}/api/v1/transactions?account.id=${accountId}&limit=${limit}&order=desc`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Mirror API ${resp.status}`);
    return await resp.json();
  } catch (e) {
    console.error(`❌ [Mirror] Failed to fetch transactions: ${e.message}`);
    return null;
  }
}

/**
 * Verify a decision log entry against Mirror Node
 * This is the KEY differentiator — proves decisions are real on-chain data
 */
export async function verifyDecision(topicId, sequenceNumber) {
  const messages = await getTopicMessages(topicId, 100);
  const found = messages.find(m => m.sequenceNumber === sequenceNumber);
  
  if (!found) {
    return { verified: false, reason: "Message not found on Mirror Node" };
  }
  
  return {
    verified: true,
    onChain: true,
    consensusTimestamp: found.consensusTimestamp,
    message: found.message,
    runningHash: found.runningHash,
    explorerUrl: `https://hashscan.io/testnet/topic/${topicId}`,
  };
}
