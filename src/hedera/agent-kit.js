/**
 * 🤖 Hedera Agent Kit — Real integration with all 43 official tools
 * Uses toolkit._hedera.run() to execute actual Hedera operations
 * 
 * AgentLedge — AgentLedge
 */
import { Client, AccountId, PrivateKey, Hbar } from "@hashgraph/sdk";
import { createRequire } from "module";
import { saucerSwapPlugin } from "saucer-swap-plugin";
import dotenv from "dotenv";
dotenv.config();

const require = createRequire(import.meta.url);
const { HederaAIToolkit } = require("hedera-agent-kit");

const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY); // auto-detects ECDSA or ED25519

const client = Client.forTestnet();
client.setOperator(accountId, privateKey);
client.setDefaultMaxTransactionFee(new Hbar(10));
client.setDefaultMaxQueryPayment(new Hbar(5));

// Initialize toolkit WITHOUT plugins first so core tools load,
// then create a separate SaucerSwap toolkit for DEX operations.
// NOTE: hedera-agent-kit v3.8.0 PluginRegistry.getTools() skips core tools
// when any plugins are registered (loadCorePlugins vs loadPlugins branch).
const toolkit = new HederaAIToolkit({
  client,
  configuration: {
    context: { operatorAccountId: accountId, operatorPrivateKey: privateKey },
    ledgerId: "testnet",
    // Do NOT pass plugins here — it causes core tools to be skipped
  },
});

// Load SaucerSwap plugin tools separately and merge them in
const saucerSwapToolkit = new HederaAIToolkit({
  client,
  configuration: {
    context: { operatorAccountId: accountId, operatorPrivateKey: privateKey },
    ledgerId: "testnet",
    plugins: [saucerSwapPlugin],
  },
});

// Merge SaucerSwap tools into main toolkit
Object.assign(toolkit.tools, saucerSwapToolkit.tools);
// Also add SaucerSwap tools to the underlying HederaAgentAPI so runTool() works
const saucerSwapApiTools = saucerSwapToolkit._hedera.tools || [];
if (Array.isArray(toolkit._hedera.tools)) {
  toolkit._hedera.tools.push(...saucerSwapApiTools);
}

const hederaAPI = toolkit._hedera;

/**
 * Convert Hedera SDK entity ID objects ({shard:{low}, realm:{low}, num:{low}}) to "0.0.xxx" strings.
 * v3.8.0 returns Long objects instead of plain strings for tokenId, topicId, accountId, scheduleId.
 */
function normalizeEntityId(obj) {
  if (obj && typeof obj === 'object' && 'shard' in obj && 'realm' in obj && 'num' in obj) {
    const s = typeof obj.shard === 'object' ? obj.shard.low : obj.shard;
    const r = typeof obj.realm === 'object' ? obj.realm.low : obj.realm;
    const n = typeof obj.num === 'object' ? obj.num.low : obj.num;
    return `${s || 0}.${r || 0}.${n}`;
  }
  return obj;
}

function normalizeResult(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of ['tokenId', 'topicId', 'accountId', 'scheduleId']) {
    if (obj[key]) obj[key] = normalizeEntityId(obj[key]);
    if (obj.raw && obj.raw[key]) obj.raw[key] = normalizeEntityId(obj.raw[key]);
    if (obj.status && obj.status[key]) obj.status[key] = normalizeEntityId(obj.status[key]);
  }
  return obj;
}

/**
 * Execute any Agent Kit tool by name
 * @param {string} toolName - e.g. "create_topic_tool"
 * @param {Object} params - tool-specific parameters
 * @returns {Object} parsed result
 */
export async function runTool(toolName, params) {
  const resultStr = await hederaAPI.run(toolName, params);
  try {
    return normalizeResult(JSON.parse(resultStr));
  } catch (e) {
    console.error(`[AgentKit] Failed to parse result from ${toolName}:`, resultStr);
    return { ok: false, error: `Invalid JSON from ${toolName}: ${String(resultStr).slice(0, 200)}` };
  }
}

// ═══════════════════════════════════════════════
// High-level wrappers using real Agent Kit tools
// ═══════════════════════════════════════════════

/** Create an HBAR-funded account using Agent Kit */
export async function createAccountViaKit(initialBalance = 10) {
  return runTool("create_account_tool", {
    initialBalance,
  });
}

/** Create a fungible token using Agent Kit */
export async function createFungibleTokenViaKit(name, symbol, decimals = 2, initialSupply = 1000000) {
  return runTool("create_fungible_token_tool", {
    tokenName: name,
    tokenSymbol: symbol,
    decimals,
    initialSupply,
    isSupplyKey: true,
  });
}

/** Create an NFT collection using Agent Kit */
export async function createNFTCollectionViaKit(name, symbol) {
  return runTool("create_non_fungible_token_tool", {
    tokenName: name,
    tokenSymbol: symbol,
    isSupplyKey: true,
  });
}

/** Mint NFT using Agent Kit */
export async function mintNFTViaKit(tokenId, metadata) {
  // Agent Kit requires "uris" field (array of strings)
  const metadataStr = typeof metadata === "string" ? metadata : JSON.stringify(metadata);
  return runTool("mint_non_fungible_token_tool", {
    tokenId: tokenId.toString(),
    uris: [Buffer.from(metadataStr).toString("base64")],
  });
}

/** Associate token using Agent Kit */
export async function associateTokenViaKit(accountId, tokenId) {
  return runTool("associate_token_tool", {
    accountId: accountId.toString(),
    tokenId: tokenId.toString(),
  });
}

/** Transfer fungible token using Agent Kit */
export async function transferTokenViaKit(tokenId, toAccountId, amount) {
  return runTool("transfer_fungible_token_with_allowance_tool", {
    tokenId: tokenId.toString(),
    toAccountId: toAccountId.toString(),
    amount,
  });
}

/** Create HCS topic using Agent Kit */
export async function createTopicViaKit(memo, isSubmitKey = true) {
  return runTool("create_topic_tool", {
    memo,
    isSubmitKey,
  });
}

/** Submit message to HCS topic using Agent Kit */
export async function submitMessageViaKit(topicId, message) {
  return runTool("submit_topic_message_tool", {
    topicId: topicId.toString(),
    message: typeof message === "string" ? message : JSON.stringify(message),
  });
}

/** Get topic info using Agent Kit */
export async function getTopicInfoViaKit(topicId) {
  return runTool("get_topic_info_query_tool", {
    topicId: topicId.toString(),
  });
}

/** Get topic messages using Agent Kit */
export async function getTopicMessagesViaKit(topicId) {
  return runTool("get_topic_messages_query_tool", {
    topicId: topicId.toString(),
  });
}

/** Get HBAR balance using Agent Kit */
export async function getBalanceViaKit(accountId) {
  return runTool("get_hbar_balance_query_tool", {
    accountId: accountId.toString(),
  });
}

/** Get account info using Agent Kit */
export async function getAccountInfoViaKit(accountId) {
  return runTool("get_account_query_tool", {
    accountId: accountId.toString(),
  });
}

/** Get token balances using Agent Kit */
export async function getTokenBalancesViaKit(accountId) {
  return runTool("get_account_token_balances_query_tool", {
    accountId: accountId.toString(),
  });
}

/** Transfer HBAR using Agent Kit */
export async function transferHbarViaKit(toAccountId, amount) {
  return runTool("transfer_hbar_tool", {
    transfers: [{ accountId: toAccountId.toString(), amount }],
  });
}

/** Get token info using Agent Kit */
export async function getTokenInfoViaKit(tokenId) {
  return runTool("get_token_info_query_tool", {
    tokenId: tokenId.toString(),
  });
}

/** Airdrop fungible token using Agent Kit */
export async function airdropTokenViaKit(tokenId, recipients) {
  return runTool("airdrop_fungible_token_tool", {
    tokenId: tokenId.toString(),
    recipients,
  });
}

/** Get exchange rate using Agent Kit */
export async function getExchangeRateViaKit() {
  return runTool("get_exchange_rate_tool", {});
}

/** Get transaction record using Agent Kit */
export async function getTransactionRecordViaKit(transactionId) {
  return runTool("get_transaction_record_query_tool", {
    transactionId,
  });
}

// ═══════════════════════════════════════════════
// SaucerSwap V2 DEX Operations
// ═══════════════════════════════════════════════

/** Get a swap quote from SaucerSwap V2 */
export async function getSwapQuoteViaKit(tokenIn, tokenOut, amountIn) {
  return runTool("get_swap_quote_v2_tool", { tokenIn, tokenOut, amountIn });
}

/** Execute a token swap on SaucerSwap V2 */
export async function swapViaKit(tokenIn, tokenOut, amountIn, recipientAddress) {
  return runTool("swap_v2_tool", {
    tokenIn,
    tokenOut,
    amountIn,
    recipientAddress: recipientAddress || accountId.toString(),
  });
}

// ═══════════════════════════════════════════════
// Status & Discovery
// ═══════════════════════════════════════════════

export function getToolkitStatus() {
  const toolNames = Object.keys(toolkit.tools);
  return {
    initialized: true,
    toolCount: toolNames.length,
    tools: toolNames,
    network: "testnet",
    operatorAccountId: accountId.toString(),
  };
}

export function getAvailableTools() {
  return Object.keys(toolkit.tools);
}

export { toolkit, hederaAPI, client as agentKitClient, accountId as operatorAccountId };
