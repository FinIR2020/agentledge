# ERC-8004 AI Trading Agents Hackathon — 深度研究报告

## 一、Hackathon基本信息

| 项目 | 详情 |
|------|------|
| **名称** | Bringing Blockchain to AI — AI Trading Agents with ERC-8004 |
| **平台** | lablab.ai |
| **日期** | March 9-22, 2026 (13天) |
| **奖金** | $50,000 prize pool |
| **主题** | Build trustless AI financial agents with ERC-8004 |
| **合作方** | lablab.ai + NativelyAI + Surge |

---

## 二、获奖条件详细分析

### 2.1 评判标准（4项）

| 标准 | 说明 | KYA适配度 |
|------|------|----------|
| **Application of Technology** | 选定模型/技术的集成有效性 | ⭐⭐⭐⭐⭐ ERC-8004原生适配 |
| **Presentation** | 项目展示的清晰度和有效性 | ⭐⭐⭐⭐ 需要好视频 |
| **Business Value** | 商业价值和实际应用性 | ⭐⭐⭐⭐⭐ FINRA合规刚需 |
| **Originality** | 创意和独特性 | ⭐⭐⭐⭐ KYA+ERC-8004组合独特 |

### 2.2 必须提交的内容

- ✅ Project Title
- ✅ Short + Long Description (100+字)
- ✅ Technology & Category Tags
- ✅ Cover Image
- ✅ **Video Presentation** ← 关键
- ✅ **Slide Presentation** ← lablab.ai特有要求（Devpost不需要）
- ✅ **Public GitHub Repository**
- ✅ **Demo Application URL** ← 必须有可交互的在线原型
- ✅ 需要在 lablab.ai 和 Discord 上注册

### 2.3 是否需要特定平台？

| 要求 | 答案 |
|------|------|
| 必须用ERC-8004？ | **是** — 核心要求 |
| 必须部署到特定链？ | **不确定** — ERC-8004在Ethereum/Base/Avalanche/BNB Chain都有 |
| 必须在lablab.ai平台提交？ | **是** |
| 需要lablab.ai Discord？ | **是** — 需要加入 |
| 需要组队？ | **是** — 需要在lablab.ai上创建或加入team |
| 社交媒体互动？ | **非硬性要求，但有社区频道** |

### 2.4 奖金结构

⚠️ **重要发现：奖金分配方式特殊**

> "$50,000 prize pool, **allocated to trading accounts** with profits shared via Surge"

这意味着：
- 奖金**不是直接给现金**，而是分配到交易账户
- 通过Surge平台共享利润
- 1st: 部分现金 + Man-Hour credits
- 这和普通hackathon不同！

**具体奖金（从页面看到的）：**
- 🥈 2nd place: $2,000 Cash + 500 Man-Hour credits ($750)
- 🥉 3rd place: $1,000 Cash + 300 Man-Hour credits ($450)
- 🥇 1st place: 未明确列出但应该更高

**⚠️ 需要确认：$50K是否大部分是"交易资金"而非现金奖？如果是，实际可提取金额可能远低于$50K。**

---

## 三、ERC-8004项目方深度分析

### 3.1 核心团队

| 人物 | 角色 | 关键主张 |
|------|------|---------|
| **Davide Crapis** (@DavideCrapis) | EF dAI Team Leader, ERC-8004联合作者 | "Make Ethereum the settlement layer for AI" |
| **Marco De Rossi** (@marco_derossi) | MetaMask AI Head, ERC-8004联合作者 | "Equal data and visibility for agent economy" |
| **Jordan Ellis** | Google, ERC-8004联合作者 | — |
| **Erik Reppel** (@programmer) | Coinbase, x402创建者 | x402+ERC-8004集成 |
| **VittoStack** (@VittoStack) | EF AI Engineer | 发布生态地图和工具 |

### 3.2 项目方核心愿景（来自Davide Crapis）

**来源：Unchained Podcast, LinkedIn, Twitter**

1. **"Ethereum makes AI more trustworthy, and AI makes Ethereum more useful"**
2. **"Trust, proof of origin, and verifiability are the bottlenecks for secure AI adoption"**
3. **"If Ethereum does not lead, closed platforms will control the emerging AI economy"**
4. **"ERC-8004 + x402 are becoming neutral specifications for agentic commerce"**
5. **1,000+ builders in community, 150+ projects, most followed EIP on Ethereum Magicians**

### 3.3 ERC-8004三大Registry

| Registry | 功能 | 类比 |
|----------|------|------|
| **Identity Registry** | ERC-721 NFT = Agent的链上护照 | → KYA Identity |
| **Reputation Registry** | 结构化反馈系统 | → KYA Trust Score |
| **Validation Registry** | 密码学验证机制 | → KYA Decision Logs |

### 3.4 当前生态状态（2026年2月）

- 主网上线：2026年1月29日
- 24,000+ agents已注册（2周内）
- 部署链：Ethereum, Base, Avalanche C-Chain, BNB Chain
- 趋势Agent评分：98.5-99.4/100 ← **全部接近满分（Sybil攻击问题！）**

---

## 四、🔥 ERC-8004的真实痛点（社交媒体+深度分析）

### 4.1 RNWY Blog揭露的核心问题

**来源：https://rnwy.com/blog/ai-agent-watchtower**
**标题："Why AI Agents Need Watchtowers"**

> "ERC-8004 launched on mainnet. Within days, tens of thousands of agents registered."
> "Average feedback scores sit between **98.5 and 99.4 out of 100**. Nearly perfect, across the board."
> "**If that sounds suspicious, it should.**"

**核心问题：**
1. **Sybil攻击** — `giveFeedback()`是permissionless的，任何人都可以给任何Agent刷好评
2. **ERC-8004承认但不解决** — 规范的Security Considerations明确说sybil attacks是可能的
3. **"Watchtower"概念** — Davide Crapis提出需要独立监控服务，但**还没有人建**

### 4.2 CryptoSlate的批评

**来源：https://cryptoslate.com/ethereum-aims-to-stop-rogue-ai-agents-from-stealing-trust-with-new-erc-8004-but-can-it-really/**
**标题："Ethereum aims to stop rogue AI agents... but can it really?"**

> "ERC-8004 does not promise an on-chain Yelp score"
> "The spec explicitly warns that summaries **without filtering reviewers are vulnerable to Sybil attacks**"
> "71% of organizations deploy AI agents, **only 11% reached production**"
> "52% citing **security and compliance issues**"
> "70% of AI decisions **still requiring human verification**"

### 4.3 Davide Crapis自己承认的局限

**来源：CryptoBriefing Unchained Podcast**

> "Even when you want to buy stuff on x402 you query the 8004 registry... **what happens if this is not decentralized? It's a huge choke point**"
> "We are not in the business of ensuring every review is correct"
> 设计选择：ERC-8004**有意**把复杂的信誉计算留给生态系统构建者

### 4.4 BlockEden分析的挑战

**来源：https://blockeden.xyz/blog/2026/01/30/ai-agents-on-chain-autonomous-defi-trading-infrastructure/**

> "How can you be sure this agent won't steal your money?"
> "Data Quality and Latency: AI agents depend on real-time, high-fidelity data"
> "Errors or manipulation can trigger unintended decisions with serious financial consequences"

### 4.5 OneKey Blog的安全担忧

**来源：https://onekey.so/blog/everything-you-need-to-know-about-erc-8004**

> "Automation amplifies adversarial risk"
> "Without portable trust primitives, open agent markets quickly degrade"
> "ERC-8004 improves trust portability, but **it does not magically remove risk**"

---

## 五、💡 KYA Protocol如何精准解决ERC-8004的痛点

### 5.1 痛点→解决方案映射

| ERC-8004的痛点 | KYA Protocol的解决方案 | 创新点 |
|---------------|---------------------|--------|
| Sybil攻击：任何人可刷好评 | **决策日志验证**：信誉基于可验证的链上行为，不是主观评分 | ⭐⭐⭐⭐⭐ |
| 评分全是98-99/100无区分度 | **多维信誉算法**：准确率、响应速度、风险控制、人类批准率 | ⭐⭐⭐⭐⭐ |
| "Watchtower"概念无人实现 | **我们就是Watchtower**：独立监控+审计Agent行为 | ⭐⭐⭐⭐⭐ |
| 没有decision transparency | **HCS/链上决策日志**：每个交易决策的原因都上链 | ⭐⭐⭐⭐⭐ |
| 70%决策仍需人类验证 | **可配置人类监督**：阈值审批 | ⭐⭐⭐⭐ |
| Registry是数据层不是应用层 | **KYA = 应用层**：在Registry之上建分析/评分/合规 | ⭐⭐⭐⭐ |

### 5.2 KYA Protocol的定位（ERC-8004版）

> **"ERC-8004 gives agents identity. KYA Protocol gives them accountability."**
> 
> ERC-8004提供了身份证，但不检查你用身份证做了什么。
> KYA Protocol = ERC-8004的"审计层" + "Watchtower" + "合规引擎"

### 5.3 Davide Crapis自己在找的就是我们

来源：WEEX/Bitget报道 (2025年11月)

> "Davide Crapis is **seeking input from teams building related applications** on the future directions that should receive priority support"

**他在征集生态builder。我们正是他需要的项目。**

---

## 六、⚠️ 关键风险提醒

### 6.1 奖金结构风险

**$50K prize pool ≠ $50K现金**

奖金的主要部分是"交易账户资金"，通过Surge平台交易，利润共享。这意味着：
- 第一名可能只拿到$3,000-$5,000现金 + $10K-$20K交易资金
- 交易资金的利润才是你的（可能赚也可能亏）
- 实际现金收入可能远低于标题的$50K

### 6.2 lablab.ai平台特殊性

- 需要**组队**（不能solo提交？需确认）
- 需要加入**Discord**
- 需要**Slide Presentation**（Devpost不需要）
- 需要**可在线访问的Demo**（不只是视频）
- 比Devpost的社区感更强，可能有更多互动要求

### 6.3 时间冲突

- 3/9开始 — 此时我们正在做Hedera最后冲刺
- 3/16 Hedera截止 — 3/22 ERC-8004截止 — 只有6天
- 但如果Hedera版的KYA做好了，改造为ERC-8004版本确实只需2-3天

---

## 七、改造方案

### 从Hedera版 → ERC-8004版

| 模块 | Hedera版 | ERC-8004版 | 改动量 |
|------|---------|-----------|-------|
| Agent Identity | HTS NFT | ERC-8004 Identity Registry | 🔴 重写 |
| Reputation | 自建算法 | ERC-8004 Reputation Registry + 增强算法 | 🟡 适配 |
| Decision Logs | HCS | Ethereum events / IPFS | 🟡 适配 |
| Human Oversight | 聊天审批 | 相同 | 🟢 复用 |
| Agent Coordinator | Node.js | 相同 | 🟢 复用 |
| Trading Logic | 分析+执行 | 相同 | 🟢 复用 |
| Frontend | 自建Dashboard | 相同+改部署 | 🟢 复用 |

**预计改造时间：2-3天**（主要改Identity和Log的存储层）

---

## 八、综合评估

| 维度 | 评分 | 说明 |
|------|------|------|
| KYA适配度 | ⭐⭐⭐⭐⭐ | 这个hackathon就是在找KYA |
| 竞争难度 | ⭐⭐⭐ | lablab.ai参赛者质量参差不齐 |
| 实际现金奖 | ⭐⭐ | $50K大部分是交易资金非现金 |
| 时间可行性 | ⭐⭐⭐⭐ | Hedera完成后2-3天改造 |
| 战略价值 | ⭐⭐⭐⭐⭐ | 进入ERC-8004生态 = 进入Ethereum AI核心圈 |
| 获奖概率 | 35-45% | 高适配度 + 低竞争 |

**最大价值可能不是奖金，而是进入Davide Crapis的1000+ builder社区，被EF dAI Team关注。**
