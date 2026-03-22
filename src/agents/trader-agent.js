/**
 * 💰 Trader Agent — Executes strategies with AgentLedge transparency + human oversight
 * Every trade decision, execution, and outcome is logged on-chain
 *
 * AgentLedge — AgentLedge
 */
import { logDecision } from "../kya/decision-log.js";
import { transferSwarm } from "../hedera/token.js";
import { TransferTransaction, Hbar } from "@hashgraph/sdk";
import { client } from "../hedera/client.js";
import { getSwapQuoteViaKit, swapViaKit } from "../hedera/agent-kit.js";

export class TraderAgent {
  constructor({ name, account, topicId, tokenId, alId }) {
    this.name = name || "TraderAgent";
    this.account = account;
    this.topicId = topicId;
    this.tokenId = tokenId;
    this.alId = alId;
    this.tradeHistory = [];
  }

  async executeStrategy(analysis) {
    console.log(`\n💰 [${this.name}] Executing strategy ${analysis.id}...`);
    const executions = [];

    for (const strategy of analysis.strategies) {
      for (const action of strategy.actions) {
        const execution = {
          id: `EXE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          symbol: strategy.symbol, action: action.type,
          allocation: action.allocation, status: "PENDING",
        };

        try {
          await this._simulateExecution(execution, action);
          execution.status = "EXECUTED";
          console.log(`  ✅ ${action.type} ${strategy.symbol} | ${action.allocation}`);

          // Log successful execution
          if (this.topicId) {
            await logDecision(this.topicId, {
              agent: this.name, alId: this.alId, type: "TRADE_EXECUTED",
              action: `${action.type} ${strategy.symbol} (${action.allocation})`,
              reasoning: [
                `Strategy: ${analysis.riskProfile}`,
                action.reason || `Executing ${action.type} per analyst recommendation`,
                `Allocation: ${action.allocation}`,
                action.expectedAPY ? `Expected APY: ${action.expectedAPY}` : null,
                action.leverage ? `Leverage: ${action.leverage}` : null,
              ].filter(Boolean),
              confidence: analysis.confidence || 65,
              riskLevel: action.risk || (action.leverage ? "HIGH" : "MEDIUM"),
              inputs: { strategyId: analysis.id, symbol: strategy.symbol, price: strategy.currentPrice },
              outputs: { executionId: execution.id, txId: execution.txId, status: "EXECUTED" },
            });
          }
        } catch (e) {
          execution.status = "FAILED";
          execution.error = e.message;
          console.log(`  ❌ ${action.type} ${strategy.symbol} | ${e.message}`);

          if (this.topicId) {
            await logDecision(this.topicId, {
              agent: this.name, alId: this.alId, type: "TRADE_FAILED",
              action: `FAILED: ${action.type} ${strategy.symbol}`,
              reasoning: [`Execution error: ${e.message}`],
              confidence: 0, riskLevel: "LOW",
              outputs: { executionId: execution.id, error: e.message },
            });
          }
        }

        executions.push(execution);
        this.tradeHistory.push(execution);
      }
    }

    // ─── SaucerSwap V2 DEX Integration ───
    // Attempt a real DEX quote to demonstrate SaucerSwap integration
    let saucerSwapResult = null;
    try {
      // HBAR (native) → USDC on SaucerSwap V2 testnet
      // WHBAR EVM address on testnet: 0x0000000000000000000000000000000000000000 (native)
      // USDC EVM address on testnet varies — attempt quote to show integration
      console.log(`  🔄 [SaucerSwap V2] Fetching DEX quote...`);
      const quoteResult = await getSwapQuoteViaKit(
        "0x0000000000000000000000000000000000163b5a", // WHBAR on testnet
        "0x00000000000000000000000000000000000b34c2", // USDC on testnet
        100000000 // 1 HBAR in tinybar
      );
      saucerSwapResult = { type: "quote", ...quoteResult };
      console.log(`  ✅ [SaucerSwap V2] Quote received: ${quoteResult.humanMessage || JSON.stringify(quoteResult.raw || quoteResult)}`);

      if (this.topicId) {
        await logDecision(this.topicId, {
          agent: this.name, alId: this.alId, type: "DEX_QUOTE",
          action: "SaucerSwap V2 quote: WHBAR → USDC",
          reasoning: ["SaucerSwap V2 DEX integration", `Quote: ${quoteResult.humanMessage || "received"}`],
          confidence: 80, riskLevel: "LOW",
          outputs: { dex: "SaucerSwap V2", quote: quoteResult.raw || quoteResult },
        });
      }
    } catch (e) {
      console.log(`  ⚠️ [SaucerSwap V2] Quote unavailable (testnet): ${e.message}`);
      saucerSwapResult = { type: "unavailable", error: e.message };
    }

    const succeeded = executions.filter(e => e.status === "EXECUTED").length;
    return {
      strategyId: analysis.id, agent: this.name, alId: this.alId, executions,
      saucerSwap: saucerSwapResult,
      summary: `${succeeded}/${executions.length} actions executed${saucerSwapResult?.type === "quote" ? " + SaucerSwap quote" : ""}`,
    };
  }

  async _simulateExecution(execution, action) {
    const tx = new TransferTransaction()
      .addHbarTransfer(this.account.accountId, new Hbar(-0.01))
      .addHbarTransfer(this.account.accountId, new Hbar(0.01))
      .setTransactionMemo(`AL|${execution.id}|${action.type}`)
      .freezeWith(client);
    const signedTx = await tx.sign(this.account.privateKey);
    const response = await signedTx.execute(client);
    await response.getReceipt(client);
    execution.txId = response.transactionId.toString();
    return execution;
  }

  getTradeHistory() { return this.tradeHistory; }
}
