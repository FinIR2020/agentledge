# AgentSwarm Dashboard UI 需求文档

> 给 Gemini AI Studio 的 Prompt：请根据以下需求，生成一个完整的单页 HTML Dashboard（含内联CSS和JS）。

## 项目简介
AgentSwarm 是一个自治AI Agent经济系统，3个Agent（Intel、Analyst、Trader）在Hedera区块链上协作，用SWARM代币互相支付服务费，所有决策记录在链上。

## 设计风格
- **暗色科技感**：深色背景（#0a0e17），霓虹蓝/绿/紫高亮
- **参考风格**：类似 Dune Analytics / Trading Terminal / Hedera官网
- **字体**：Inter + JetBrains Mono（代码/数据部分）
- **响应式**：支持桌面和平板

## 页面布局

### 顶部导航栏
- Logo: 🐝 AgentSwarm
- 标签: "Hedera Testnet" (蓝色) + "Live Demo" (绿色闪烁)
- 右侧: 连接状态指示灯（绿色=在线，红色=离线）

### 区域1: 控制面板
- 两个按钮：
  - 🚀 "Initialize Swarm" (绿色按钮) — POST /api/initialize
  - 🔄 "Run Cycle" (黄色按钮，初始化前disabled) — POST /api/run-cycle
  - ⚡ "Auto Mode" (切换按钮) — 自动每30秒运行一个cycle
- 状态文字: "Ready" / "Initializing..." / "Running Cycle #3..."

### 区域2: Agent经济流程图（重要！视觉亮点）
- 横向流程图，3个Agent节点 + 箭头连接：
  ```
  🕵️ Intel Agent  →📊→  📈 Analyst Agent  →💰→  ⚡ Trader Agent
  (Market Data)        (Yield Strategy)        (Execution)
  ```
- 每个节点显示：
  - Agent名称 + emoji
  - SWARM余额（实时更新）
  - 状态（空闲/工作中）
- 箭头上显示：支付金额（如 "0.50 SWARM"）
- **动画效果**：运行cycle时，数据流从左到右流动（粒子动画或脉冲光效）

### 区域3: 统计卡片（4列网格）
| 卡片 | 数据 | 颜色 |
|------|------|------|
| Cycles Completed | 数字 | 蓝色 |
| Market Sentiment | BULLISH/BEARISH/NEUTRAL + 分数 | 绿/红/黄 |
| SWARM Transferred | 总代币流转量 | 紫色 |
| Strategies Executed | 成功/失败计数 | 绿色 |

### 区域4: 实时活动日志（左侧60%宽度）
- 类似终端的黑色背景日志
- 每条日志格式：`[时间] [Agent名称] 事件类型 — 详情`
- 颜色编码：
  - Intel事件 = 蓝色
  - Analyst事件 = 紫色
  - Trader事件 = 绿色
  - 支付事件 = 金色
  - 链上日志 = 灰色带链接图标
- 自动滚动到底部
- 最多显示50条

### 区域5: Token经济图表（右侧40%宽度）
- 简单的柱状图或折线图（纯CSS/JS，不需要chart库）
- 显示3个Agent的SWARM余额变化
- 每个cycle后更新
- 或者用简单的进度条表示余额占比

### 区域6: 最新交易详情
- 可展开/折叠的卡片列表
- 每个cycle一张卡片，包含：
  - Cycle编号 + 时间
  - Sentiment结果
  - 策略摘要
  - 执行结果（成功✅/失败❌）
  - Hedera交易链接（链接到 hashscan.io）

### 区域7: 底部链接栏
- Hedera Token链接: `https://hashscan.io/testnet/token/{tokenId}`
- Hedera Topic链接: `https://hashscan.io/testnet/topic/{topicId}`
- GitHub Repo链接
- "Built for Hedera Hello Future Apex Hackathon 2026"

## API 接口

Dashboard需要调用以下API：

```javascript
// 获取状态
GET /api/status
Response: {
  initialized: boolean,
  isRunning: boolean,
  setup: {
    tokenId: "0.0.xxx",
    topicId: "0.0.xxx",
    agents: {
      intel: { accountId: "0.0.xxx", balance: 100.00 },
      analyst: { accountId: "0.0.xxx", balance: 100.00 },
      trader: { accountId: "0.0.xxx", balance: 200.00 }
    }
  },
  cycleCount: number,
  history: [
    {
      cycle: 1,
      timestamp: "2026-...",
      intel: { reportId: "RPT-xxx", sentiment: "BEARISH", score: "-66" },
      analysis: { strategyId: "STR-xxx", riskProfile: "conservative", strategiesCount: 3 },
      execution: { totalActions: 6, succeeded: 6, failed: 0 },
      payments: [
        { from: "Analyst", to: "Intel", amount: 0.50, memo: "Intel report" },
        { from: "Trader", to: "Analyst", amount: 1.00, memo: "Strategy" }
      ]
    }
  ]
}

// 初始化
POST /api/initialize
Response: { ok: true, setup: {...} }

// 运行一个cycle
POST /api/run-cycle
Response: { ok: true, result: { cycle: {...} } }
```

## 重要注意事项

1. **单文件HTML**：所有CSS和JS内联，不依赖外部库（除了Google Fonts可以用CDN）
2. **轮询机制**：每2秒GET /api/status更新界面（或者用简单的setInterval）
3. **错误处理**：API失败时显示错误toast，不要crash
4. **加载状态**：按钮点击后显示spinner/loading
5. **空状态**：未初始化时显示引导提示"Click Initialize to start the swarm"
6. **动画**：cycle运行时流程图有数据流动效果（CSS animation）
7. **Hedera链接**：所有交易ID都链接到 hashscan.io/testnet/

## 配色参考
```css
--bg: #0a0e17
--card: #131a2b
--border: #1e2d45
--accent: #00d4ff (蓝)
--green: #00e676
--red: #ff5252
--yellow: #ffd740
--purple: #bb86fc
--text: #e0e6ed
--dim: #6b7d99
```

## 一句话总结
做一个**暗色科技风的AI Agent经济仪表盘**，核心亮点是3个Agent之间的**代币流转可视化**和**实时活动日志**，让评委一眼看到"这不是普通chatbot，这是一个有链上经济系统的Agent生态"。
