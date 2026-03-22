/**
 * 🕵️ Intel Agent — Gathers market data with full AgentLedge decision transparency
 * Every data source, reasoning step, and recommendation is logged on-chain
 *
 * AgentLedge — AgentLedge
 */
import { logDecision } from "../kya/decision-log.js";
import { transferSwarm } from "../hedera/token.js";

export class IntelAgent {
  constructor({ name, account, topicId, tokenId, alId }) {
    this.name = name || "IntelAgent";
    this.account = account;
    this.topicId = topicId;
    this.tokenId = tokenId;
    this.alId = alId;
    this.reportPrice = 50; // 0.50 SWARM
  }

  async gatherPolymarketData() {
    try {
      const resp = await fetch("https://gamma-api.polymarket.com/markets?limit=5&active=true&order=volume24hr&ascending=false");
      if (!resp.ok) throw new Error(`Polymarket API returned ${resp.status}`);
      const markets = await resp.json();
      if (!Array.isArray(markets)) return [];
      return markets.slice(0, 3).map(m => ({
        question: m.question,
        volume24h: m.volume24hr,
        bestBid: m.bestBid,
        bestAsk: m.bestAsk,
        outcomes: m.outcomes,
      }));
    } catch (e) {
      console.warn(`⚠️ Polymarket fetch failed: ${e.message}`);
      return [];
    }
  }

  async gatherMarketData(symbols = ["BTCUSDT", "ETHUSDT", "HBARUSDT"]) {
    const results = {};
    const dataSources = [];

    for (const symbol of symbols) {
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`;
        dataSources.push({ source: "Binance API", endpoint: `/klines?symbol=${symbol}`, type: "price-data" });
        
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Binance API returned ${resp.status} for ${symbol}`);
        const data = await resp.json();
        if (!Array.isArray(data)) throw new Error(`Binance API returned non-array for ${symbol}: ${JSON.stringify(data).slice(0, 100)}`);
        const closes = data.map(k => parseFloat(k[4]));
        const volumes = data.map(k => parseFloat(k[5]));
        const price = closes[closes.length - 1];
        const change24h = ((price - closes[0]) / closes[0]) * 100;
        const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;

        const gains = [], losses = [];
        for (let i = 1; i < closes.length; i++) {
          const diff = closes[i] - closes[i - 1];
          gains.push(diff > 0 ? diff : 0);
          losses.push(diff < 0 ? -diff : 0);
        }
        const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
        const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
        const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

        results[symbol] = {
          price, change24h: change24h.toFixed(2), rsi: rsi.toFixed(1),
          avgVolume: avgVol.toFixed(0),
          trend: rsi > 60 ? "bullish" : rsi < 40 ? "bearish" : "neutral",
        };
      } catch (e) {
        results[symbol] = { error: e.message };
      }
    }
    return { results, dataSources };
  }

  analyzeSentiment(marketData) {
    let bullish = 0, bearish = 0, total = 0;
    for (const [, data] of Object.entries(marketData)) {
      if (data.error) continue;
      total++;
      if (data.trend === "bullish") bullish++;
      if (data.trend === "bearish") bearish++;
    }
    const score = total > 0 ? ((bullish - bearish) / total) * 100 : 0;
    return {
      score: score.toFixed(0),
      label: score > 30 ? "BULLISH" : score < -30 ? "BEARISH" : "NEUTRAL",
      bullishCount: bullish, bearishCount: bearish, totalAssets: total,
    };
  }

  async generateReport() {
    console.log(`\n🕵️ [${this.name}] Gathering intelligence...`);
    const { results: marketData, dataSources } = await this.gatherMarketData();
    const polymarketData = await this.gatherPolymarketData();
    if (polymarketData.length) dataSources.push({ source: "Polymarket API", type: "prediction-markets", count: polymarketData.length });
    const sentiment = this.analyzeSentiment(marketData);
    const recommendations = this._generateRecommendations(marketData, sentiment);

    const report = {
      id: `RPT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent: this.name,
      alId: this.alId,
      marketData, polymarketData, sentiment, recommendations, dataSources,
    };

    // AgentLedge Decision Log — full transparency
    if (this.topicId) {
      await logDecision(this.topicId, {
        agent: this.name,
        alId: this.alId,
        type: "INTEL_GATHERED",
        action: `Generated market report ${report.id}`,
        reasoning: [
          `Analyzed ${Object.keys(marketData).length} trading pairs from Binance`,
          `Calculated RSI(14) for each pair`,
          `Overall sentiment: ${sentiment.label} (score: ${sentiment.score})`,
          `${sentiment.bullishCount} bullish, ${sentiment.bearishCount} bearish out of ${sentiment.totalAssets} assets`,
          `Generated ${recommendations.length} recommendations`,
        ],
        dataSources,
        confidence: Math.min(95, 60 + sentiment.totalAssets * 10),
        riskLevel: "LOW",
        inputs: { symbols: ["BTCUSDT", "ETHUSDT", "HBARUSDT"], timeframe: "1h", periods: 24 },
        outputs: { reportId: report.id, sentiment: sentiment.label, score: sentiment.score, recommendations: recommendations.length },
      });
    }

    console.log(`📊 [${this.name}] Report ready: ${report.id} | Sentiment: ${sentiment.label} (${sentiment.score})`);
    return report;
  }

  async sellReport(report, buyerAccount) {
    if (this.tokenId && buyerAccount) {
      await transferSwarm(this.tokenId, buyerAccount.accountId, buyerAccount.privateKey, this.account.accountId, this.reportPrice, `Intel report ${report.id}`);
    }
    return report;
  }

  _generateRecommendations(marketData, sentiment) {
    const recs = [];
    for (const [symbol, data] of Object.entries(marketData)) {
      if (data.error) continue;
      if (parseFloat(data.rsi) < 30) recs.push({ symbol, action: "BUY", reason: `RSI oversold at ${data.rsi}`, confidence: 75 });
      else if (parseFloat(data.rsi) > 70) recs.push({ symbol, action: "SELL", reason: `RSI overbought at ${data.rsi}`, confidence: 70 });
      if (parseFloat(data.change24h) < -5) recs.push({ symbol, action: "WATCH", reason: `Sharp drop ${data.change24h}%, potential bounce`, confidence: 55 });
    }
    if (sentiment.label === "BEARISH") recs.push({ symbol: "ALL", action: "DEFENSIVE", reason: "Overall bearish sentiment, reduce exposure", confidence: 65 });
    return recs;
  }
}
