# GitLab Duo Agent Platform — 技术学习笔记

## 一、平台架构概览

GitLab Duo Agent Platform 是一个AI原生解决方案，在整个SDLC中嵌入多个智能助手（"agents"）。

### 核心概念

| 概念 | 说明 |
|------|------|
| **Foundational Agent** | GitLab预建的Agent，开箱即用（代码审查、安全扫描等） |
| **Custom Agent** | 用户创建，通过System Prompt+Tools定义行为 |
| **External Agent** | 集成外部AI（Claude, OpenAI, Gemini等），通过Runner执行 |
| **Flow** | 多个Agent协作解决复杂问题的工作流 |
| **Foundational Flow** | 预建Flow（Issue→MR, Fix Pipeline, Convert Jenkins, Software Dev Flow） |
| **Custom Flow** | 用户创建的YAML定义的自动化工作流 |
| **Trigger** | 触发Flow的事件（mention, assign, assign reviewer） |
| **Session** | Agent/Flow活动的完整记录（日志+pipeline执行详情） |
| **Service Account** | Flow使用的复合身份账户，命名: `ai-<flow>-<group>` |
| **MCP** | Model Context Protocol — 连接外部工具（Jira, Slack, AWS等） |
| **AGENTS.md** | 行业标准文件，定义Agent行为规则 |
| **AI Catalog** | 发现、创建、分享Agent和Flow的中心目录 |

### 前置条件
- GitLab Duo Enterprise 或 Pro（hackathon期间提供访问）
- GitLab 18.5+（Custom Agents）/ 18.8+（GA）
- 需要Runner（docker/docker-autoscaler/kubernetes executor）

---

## 二、Custom Agent 创建流程

### 步骤：
1. 进入项目 → Automate → Agents → New Agent
2. 填写：名字、描述、Visibility（Public必须！hackathon要求）
3. **System Prompt** — 定义Agent人格、专长、行为
4. **Tools** — 选择Agent可以使用的工具

### System Prompt示例（DevOps Debug Agent）:
```
Your speciality is that you can correlate static SDLC data with runtime 
data from CI/CD pipelines, logs, and other tool calls necessary. Expect 
that the user has advanced knowledge, but always provide commands and 
steps to reproduce your analysis so they can learn from you. Start with 
a short summary and suggested actions, and then go into detail with 
thoughts, analysis, suggestions.
```

### 可用Tools（Agent内置）:
- Create issue
- Create merge request
- Read/write files
- Run pipelines
- Analyze code
- 完整列表在 built-in tool definitions

### 使用方式:
- 在 GitLab Duo Chat 中 `@agent-name 你的指令`
- Agent会执行操作并返回结果

---

## 三、Custom Flow 创建流程

### 步骤：
1. 进入项目 → Automate → Flows → 或通过 AI Catalog
2. 创建Flow（选择项目、设置Visibility）
3. Enable Flow in project
4. 创建Trigger（mention/assign/assign reviewer）
5. 配置 `agent-config.yml` 定义执行环境

### Flow执行方式:
- **在CI/CD Runner上执行**（不是Chat内执行！）
- 触发方式：在issue/MR中 `@ai-<flow>-<group>` mention
- 异步执行，结果post回GitLab

### agent-config.yml 示例:
```yaml
# Custom Docker image
image: python:3.11
# Setup script to run before the flow
setup_script:
  - apt-get update && apt-get install -y build-essential
  - pip install --upgrade pip
  - pip install -r requirements.txt
# Cache configuration
cache:
  key:
    files:
      - requirements.txt
    prefix: python-deps
  paths:
    - .cache/pip
    - venv/
```

### Flow特性:
- 可以使用自定义Docker镜像
- 可以运行setup scripts安装依赖
- 可以配置缓存加速后续执行
- Session记录完整的活动日志+pipeline执行详情

---

## 四、定制化层级

| 层级 | 文件 | 作用域 |
|------|------|--------|
| User-level | `~/.gitlab/duo/chat-rules.md` | 所有项目 |
| Workspace | `.gitlab/duo/chat-rules.md` | 当前项目 |
| AGENTS.md | 项目根目录 `AGENTS.md` | Agent行为规范 |
| Review Instructions | `.gitlab/duo/mr-review-instructions.yaml` | MR审查标准 |
| MCP Config | `.gitlab/duo/mcp.json` | 外部工具连接 |
| System Prompts | AI Catalog中设置 | 单个Agent行为 |

### AGENTS.md 支持层级:
- User-level: `~/.gitlab/duo/AGENTS.md`
- Workspace: 项目根 `AGENTS.md`
- Subdirectory: 子目录 `AGENTS.md`（monorepo用）
- 所有层级会合并生效

---

## 五、External Agent 集成

### 支持的外部AI:
- **Claude Code** (Anthropic) ← 我们可以用！
- OpenAI Codex
- Google Gemini

### 触发方式:
```
@ai-codex Please implement this issue
```
→ 触发Runner执行外部AI工具 → 结果post回GitLab

---

## 六、Session监控（审计基础）

- 路径: 项目 → Automate → Sessions
- 包含：Agent/Flow活动的完整日志
- 包含：Pipeline执行详情
- **这就是我们可以增强的地方 — 把Sessions变成结构化审计日志**

---

## 七、对KYA Protocol GitLab版的可行性评估

### ✅ 完全可行的部分：

1. **创建Custom Agents**（Scanner, Analyzer, Fixer, Compliance）
   - 每个Agent有自己的System Prompt定义行为
   - 每个Agent选择不同的Tools
   - 公开可见（hackathon要求Public）

2. **创建Custom Flow**（编排多Agent协作）
   - Flow触发: MR提交时 → @mention service account
   - Scanner → Analyzer → Fixer → Compliance 按序执行
   - 在Runner上异步执行

3. **AGENTS.md作为KYA规则定义**
   - 定义每个Agent的行为边界
   - 定义人类审批规则
   - 定义日志记录标准

4. **Session日志作为审计基础**
   - GitLab原生已有基础日志
   - 我们在上面建增强层：结构化、可搜索、合规映射

5. **MCP集成外部工具**
   - 可以连接外部安全扫描器（如Snyk, SonarQube）
   - 可以连接通知系统（Slack）

### ⚠️ 需要额外开发的部分：

1. **Agent身份注册系统** — GitLab没有Agent Registry概念
   - 需要自建一个轻量级注册表（JSON文件或简单API）
   - 或者用GitLab Variables/CI来模拟

2. **增强审计日志** — 超出GitLab Sessions的结构化日志
   - 需要在Flow执行中输出额外日志
   - 格式化为合规可审计的结构

3. **信誉评分计算** — GitLab没有Agent评分
   - 需要自建评分逻辑
   - 可以基于Session历史计算

4. **人类审批流程** — GitLab有MR审批但不是Agent级别的
   - 可以利用MR审批流程（Critical漏洞→创建MR→需人类approve）
   - 或者在Flow中加一个暂停步骤

### ❌ 潜在困难：

1. **Custom Flow的YAML格式细节不够清晰** — 文档说"YAML-defined"但没给完整示例
   - 可能需要在hackathon期间摸索
   - Foundational Flow是好的参考模板

2. **Runner配置** — 需要有可用的Runner
   - GitLab.com提供共享Runner
   - hackathon应该有提供

3. **GitLab 18.8要求** — 部分功能需要最新版本
   - hackathon提供的环境应该是最新的

---

## 八、代码复用具体方案

### 从Hedera版复用:
```
KYA Protocol Core (可复用):
├── agent-coordinator.js → 改为GitLab Flow YAML
├── kya-identity.js → 改为GitLab Agent Registry JSON
├── decision-log.js → 改为GitLab Session增强日志
├── human-oversight.js → 改为MR审批+Flow暂停
├── trust-score.js → 直接复用算法逻辑
└── reporting.js → 改为GitLab合规报告格式

GitLab专属新开发:
├── .gitlab/duo/chat-rules.md → KYA行为规则
├── AGENTS.md → Agent规范定义
├── agent-config.yml → Flow执行配置
├── Custom Agents (4个) → 通过GitLab UI创建
├── Custom Flow (1个) → 编排4个Agent
└── Trigger配置 → MR事件触发
```

### 预计额外开发时间: 3-4天（在Hedera版完成后）
