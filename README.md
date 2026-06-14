# 🛡️ CodeGuard — Application Security Code as a Service (AsCaaS)

> **Scan. Fix. Ship. Secure.**

CodeGuard is an AI-powered **Application Security Code as a Service (AsCaaS)** platform that eliminates the gap between finding vulnerabilities and fixing them. Connect your GitHub repo or paste code — CodeGuard detects the threats, generates the patch, and opens a Pull Request automatically. No manual remediation. No context switching.

Built for developers who move fast and security teams who need to keep up.

🔗 **Live App:** https://cyber-security-code-scan.base44.app

---

## ⚡ The AsCaaS Workflow

```
Connect Repo / Paste Code
        ↓
  AI Scans for 20+ Vulnerability Types
        ↓
  Severity-Rated Findings (Critical → Low)
        ↓
  Auto-Fix: AI Patches Code → GitHub PR Opened
        ↓
  Track, Monitor & Report Security Posture
```

No manual patching. No switching tools. Just: **Scan → Fix → PR. Done.**

---

## 🚀 Core Features

### 🔍 AI Code Scanner
- Paste code, upload a file, or connect a GitHub repository for full codebase scanning
- Detects **20+ vulnerability types**: SQL Injection, XSS, RCE, SSRF, Command Injection, Hardcoded Secrets, Broken Auth, Path Traversal, XXE, IDOR, and more
- OWASP Top 10 coverage with real-world threat intelligence enrichment
- Severity-rated findings (Critical / High / Medium / Low) with line numbers and secure fix examples
- Choose your AI model: GPT-4o-mini, Claude Sonnet, Claude Opus, or GPT-5
- Auto-creates security alerts for critical and high findings

### 🤖 Auto-Fix via GitHub PR
- One click generates an AI-patched pull request directly to your repository
- LLM rewrites the vulnerable file with all selected fixes applied
- Specify the exact file path, branch, and vulnerabilities to target
- PR is opened on GitHub with a full summary of changes made

### 📊 Analytics Dashboard
- Full vulnerability metrics with trend charts, severity distribution, and language breakdowns
- Customizable widget layout — show/hide any panel
- Vulnerability Density Heatmap to visualize risk concentration across files
- Security score history over time
- Export comprehensive security reports in **PDF** or **CSV** format
- Time range filtering (7d / 30d / 90d / All)

### 🌐 Threat Intelligence
- Correlates scan findings with known CVEs from NIST NVD
- Tracks threat actors, attack patterns, and active campaigns
- Risk prioritization across all scans
- Provides exploitability metrics and prevalence data per vulnerability type

### 🔴 Red Team Simulation
- Simulate real-world attack scenarios across your full vulnerability history
- Filter by severity and status
- Test exploit paths and mark findings as remediated

### 🏗️ Monitoring & CI/CD
- Track deployed applications across development, staging, and production
- Automatic security health checks correlated with scan results
- Security alerts for at-risk deployments
- CI/CD integration guides (GitHub Actions, GitLab CI, Jenkins)

### 🛡️ Policy Engine
- Define org-wide security rules and enforce them across every repo
- Generate compliance reports for SOC 2, ISO 27001, and PCI DSS
- Evaluate code against custom security policies

### 🔄 PR Integration
- Auto-scan pull requests as they're opened
- Vulnerability summary comments posted directly on PRs
- Watch multiple repositories simultaneously

### 📅 Scheduled Scans
- Schedule recurring security scans on any repository
- Stay ahead of new vulnerabilities with automated monitoring

---

## 🖥️ How to Use

### Running a Scan
1. Go to **Scanner** in the nav bar
2. Choose **Paste Code**, **Upload File**, or **Scan Repository**
3. Select an AI model (Auto is recommended for most scans)
4. Click **Initiate Security Scan**
5. Review findings — each vulnerability includes a severity rating, description, and secure fix example

### Auto-Fixing a Vulnerability
1. After scanning, click **Auto-Fix** in the scan results
2. Enter your GitHub repo (`owner/repo-name`)
3. Enter the **full file path** within the repo (e.g. `src/utils/auth.js`)
4. Paste the full file content
5. Select the vulnerabilities to fix
6. Click **Generate Fix & Open Pull Request**
7. Review and merge the PR on GitHub

### PR Integration
1. Go to **PR Integration** in the nav bar
2. Add a repository in `owner/repo` format
3. Open PRs will be automatically scanned and commented on

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Framer Motion, Recharts, shadcn/ui |
| Backend | Base44 serverless functions (Deno runtime) |
| AI Engine | Multi-model LLM (GPT-4o-mini, Claude Sonnet/Opus, GPT-5) |
| Database | Base44 managed entity store |
| Integrations | GitHub API (OAuth + PAT) |

---

## 📁 Project Structure

```
src/
  pages/
    Landing.jsx          — AsCaaS marketing landing page
    Scanner.jsx          — AI code vulnerability scanner
    Analytics.jsx        — Security metrics dashboard
    ThreatIntel.jsx      — Threat intelligence center
    Monitoring.jsx       — Deployment monitoring & alerts
    RedTeam.jsx          — Red team simulation
    PolicyEngine.jsx     — Security policy management
    PRIntegration.jsx    — GitHub PR auto-scanning
    AlertsDashboard.jsx  — Active security alerts
    Projects.jsx         — Project management

  components/
    scanner/
      CodeInput.jsx           — Paste / upload / repo scan input
      ScanResults.jsx         — Vulnerability results display
      AutoFixModal.jsx        — GitHub PR auto-fix flow
      VulnerabilityCard.jsx   — Individual finding card
      VulnerabilityDetailModal.jsx — Full finding detail + CVE search
      ScanHistory.jsx         — Past scan history
      RepoScanner.jsx         — Repository-level scan UI
      ScheduleManager.jsx     — Scheduled scan management
    analytics/               — Dashboard chart widgets
    threatintel/             — Threat intelligence components
    monitoring/              — Deployment monitoring components
    policy/                  — Policy editor and evaluator
    redteam/                 — Red team simulation components
    reports/                 — Report generator
    remediation/             — AI remediation assistant

base44/
  functions/
    autoFixPR/       — LLM patch generation + GitHub PR creation
    scanRepository/  — Full repo traversal and scan
    prSecurityScan/  — GitHub PR polling and AI scan bot
    threatIntelligence/ — Threat intel backend
    fetchRepoFile/   — GitHub file content fetcher
    createReadme/    — README generator

  entities/
    CodeScan             — Scan results storage
    VulnerabilityMetric  — Aggregated vulnerability metrics
    DeployedApplication  — Monitored deployments
    SecurityAlert        — Active security alerts
    WatchedRepo          — PR integration watched repositories
    Project              — Project grouping
    SecurityPolicy       — Custom security policies
    ScheduledScan        — Scheduled scan configurations
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | GitHub Personal Access Token (classic, `repo` scope) — required for PR scanning and Auto-Fix |

---

## 🎯 Who It's For

- **Developers** — catch vulnerabilities before they hit production, auto-fix in one click
- **Engineering Leads** — enforce security standards across all repos with policy engine
- **CISOs / Security Teams** — compliance reporting, threat intelligence, red team simulation, full audit trail

---

## 📬 Support & Contributing

For issues or contributions, open an issue or pull request in this repository.

---

*Built with ⚡ using [Base44](https://base44.com) — AI-powered app development platform.*

*CodeGuard is part of the [RebelAgents.ai](https://rebelauto-diagnostics-ai.com) portfolio of autonomous AI agents.*
