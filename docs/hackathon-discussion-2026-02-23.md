# KYA Protocol — Hackathon方案讨论记录 (2026-02-23)

## 已确认决策
1. ✅ **项目名：KYA Protocol — Know Your Agent**
2. ✅ **定位：The trust & accountability layer for autonomous DeFi agents**
3. ✅ **Gemini 3 hackathon已结束**，替代为 Gemini Live Agent Challenge ($80K, 截止3/16)

## 待确认决策
- [ ] Demo场景 — HBAR/USDC交易分析？
- [ ] 优先级 — Hedera第一 → Gemini第二 → GitLab第三？
- [ ] Amazon Nova — 确认放弃？
- [ ] 录视频时间 — 3/12-3/14？

---

## Hedera Apex 方案

### 核心产品4大模块
| 模块 | 功能 | 依据 |
|------|------|------|
| 🪪 KYA身份 | Agent链上注册(HTS NFT)，信誉评分 | a16z: 非人身份96:1但无法证明自己 |
| 📜 决策日志 | 每个Agent决策上链(HCS)，可查可审计 | Reddit: 3个bot 2个骗局=不透明 |
| 🛡️ 人类监督 | 高风险操作需人类审批，可配置阈值 | FINRA 2026首次要求human-in-the-loop |
| 🤖 多Agent协作 | Intel→Analyst→Trader协作DeFi策略 | 展示KYA在真实场景下工作 |

### Demo场景
```
用户: "分析HBAR/USDC并给出交易建议"
→ Intel Agent [KYA ID: 0x001, Trust 95] 收集数据 → 决策日志#1上链
→ Analyst Agent [KYA ID: 0x002, Trust 92] RSI+MACD分析 → 决策日志#2上链
→ Trader Agent [KYA ID: 0x003, Trust 88] 金额>$50→人类审批→x402执行 → 决策日志#3上链
```

### 技术栈
- Hedera Agent Kit v3, HCS-10/OpenConvAI, HTS, HCS, x402, HOL Registry
- Anthropic Claude, Node.js + Express

### 评分对照 (总分100)
| 标准(权重) | 得分策略 |
|-----------|---------|
| Innovation 10% | KYA=a16z级创新 |
| Feasibility 10% | 基于现有Hedera工具 |
| Execution 20% | 能跑的testnet demo |
| Integration 15% | 全家桶集成 |
| Success 20% | 真实DeFi场景 |
| Validation 15% | 180+来源研究 |
| Pitch 10% | 视频 |

### 修正后获奖概率
| 情景 | 概率 |
|------|------|
| AI Track名次 | 35-45% |
| HOL Bounty | 45-55% |
| 至少拿一个奖 | 45-55% |

---

## GitLab AI Hackathon 方案

### 🔥 关键发现：GitLab官方在喊KYA

GitLab自己的博文：
1. "DevSecOps teams need **comprehensive audit trails** + **human oversight**"
2. "Chain of **accountability**: who initiated, which AI agents involved, reasoning behind each decision"  
3. "CISOs should establish **identity policies** for agent actions"
4. 47%组织没有AI合规治理

### KYA Protocol for DevSecOps
```
GitLab Flow:
1. 🔍 Scanner Agent → 扫描MR找安全漏洞 → 审计日志
2. 📊 Analyzer Agent → 评估漏洞严重程度(CVSS) → 审计日志  
3. 🔧 Fixer Agent → 自动生成修复 → Critical→人类审批 → 审计日志
4. 📋 Compliance Agent → 生成SOC2/HIPAA合规报告 → 完整变更链条
```

### 代码复用率：~65-70%
| 组件 | 复用率 |
|------|--------|
| Agent协调引擎 | 90% |
| Agent身份注册 | 70% |
| 决策日志系统 | 60% |
| 人类审批机制 | 80% |
| 信誉评分算法 | 90% |

### 目标奖项
- Most Impactful ($5K) ⭐⭐⭐⭐⭐
- Anthropic + GitLab Grand ($10K) ⭐⭐⭐⭐
- 最佳case: $15K

### 截止：Mar 25, 2026

---

## "一鱼多吃"总览

| Hackathon | 截止 | 奖金 | 适配度 | 额外开发量 | 最佳case |
|-----------|------|------|--------|-----------|---------|
| 🥇 Hedera Apex | 3/16 | $250K | ⭐⭐⭐⭐⭐ | 低 | $22.5K |
| 🥈 GitLab AI | 3/25 | $65K | ⭐⭐⭐⭐ | 中 | $15K |
| 🥉 Gemini Live | 3/16 | $80K | ⭐⭐⭐ | 中高 | $25K |
| ❌ Amazon Nova | 3/16 | $40K | ⭐⭐ | 高 | 放弃 |

### 时间安排
| 阶段 | 天数 | 内容 |
|------|------|------|
| Week 1 (2/24-3/2) | 7天 | Hedera核心重构 |
| Week 2 (3/3-3/9) | 7天 | Demo+前端+集成 |
| Week 3 (3/10-3/16) | 7天 | 测试+视频+提交Hedera(+Gemini) |
| Week 4 (3/17-3/25) | 8天 | GitLab版本改造+提交 |

---

## 研究报告
- 路径: `/home/node/.openclaw/workspace/agentswarm/docs/research-report.md`
- 2,337行，181个独立来源URL
- 8轮研究完成
