# 🛡️ KYA for DevSecOps — Know Your Agent for GitLab

> **Accountability & Audit Trail for AI Agents in the Software Development Lifecycle**

Built for the GitLab AI Hackathon 2026 using GitLab Duo Agent Platform.

## The Problem

AI agents in DevSecOps pipelines make critical decisions:
- Merge code changes automatically
- Fix security vulnerabilities
- Deploy to production
- But **WHO decided WHAT and WHY?** There's no audit trail.

GitLab's own blog states:
> "DevSecOps teams need comprehensive audit trails + human oversight"
> "47% of organizations have no AI compliance governance"

## The Solution

**KYA for DevSecOps** applies Know-Your-Agent principles to the software development lifecycle:

```
Scanner Agent → finds vulnerabilities → audit log
Analyzer Agent → rates severity (CVSS) → audit log  
Fixer Agent → generates fix → CRITICAL? → Human Approval → audit log
Compliance Agent → SOC2/HIPAA report → complete chain of accountability
```

### 4 Custom Agents

| Agent | Role | Tools |
|-------|------|-------|
| 🔍 **Scanner Agent** | Scans MRs for security vulnerabilities | Read files, SAST, Dependency scan |
| 📊 **Analyzer Agent** | Rates vulnerability severity (CVSS score) | Code analysis, CVE database |
| 🔧 **Fixer Agent** | Generates patches for vulnerabilities | Write files, Create MR |
| 📋 **Compliance Agent** | Generates audit reports | Read issues, Read MRs |

### 2 Custom Flows

1. **Security Review Flow**: Scanner → Analyzer → Fixer → (Human if Critical) → Compliance
2. **Audit Report Flow**: Compliance Agent generates full audit trail

### KYA Principles Applied

- **Identity**: Each agent has a defined system prompt, visible in AI Catalog
- **Decision Logging**: Every action logged in Flow Sessions with full reasoning
- **Human Oversight**: CRITICAL severity vulnerabilities require human approval
- **Trust Scores**: Agent accuracy tracked over time (correct findings vs false positives)
- **Accountability**: Complete chain from detection → analysis → fix → approval → deploy

## Files

```
agents/
  scanner-agent.md      — System prompt for vulnerability scanner
  analyzer-agent.md     — System prompt for severity analyzer
  fixer-agent.md        — System prompt for fix generator
  compliance-agent.md   — System prompt for audit reporter

flows/
  security-review.yml   — Full security review pipeline
  audit-report.yml      — Compliance audit generation

AGENTS.md               — Agent behavior rules (industry standard)

src/
  audit-server.js       — KYA audit trail API server
  trust-tracker.js      — Agent trust score tracking
```

## Setup (GitLab Duo)

1. Create a GitLab project with Duo Enterprise enabled
2. Import the 4 agent definitions from `agents/`
3. Import the 2 flow definitions from `flows/`
4. Set up triggers (MR creation → Security Review Flow)
5. Run `node src/audit-server.js` for the companion audit dashboard

## Tech Stack

- **GitLab Duo**: Custom Agents, Custom Flows, Triggers
- **Anthropic Claude**: AI backbone (Anthropic partner bounty)
- **Node.js**: Companion audit server
- **KYA Principles**: Identity, Logging, Oversight, Trust

## Target Prizes

- 🏆 Most Impactful ($5K)
- 🤖 Best Custom Agent ($5K)  
- 🔗 Best Custom Flow ($5K)
- 🧠 Anthropic Partner ($10K)
- 🎯 Grand Prize ($10K)
