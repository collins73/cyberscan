# 🛡️ CodeGuard — AI-Powered Security Analysis Platform

CodeGuard is a comprehensive, AI-driven security vulnerability scanner built to help developers and security teams identify, analyze, and remediate code vulnerabilities before they reach production. It combines deep static analysis, real-world threat intelligence, adversary emulation, and developer community sharing — all in one platform.

---

## 🚀 Features

### 🔍 Code Scanner
- Paste code directly or upload source files for instant analysis
- Detects **30+ vulnerability types** including SQL Injection, XSS, RCE, SSRF, hardcoded secrets, path traversal, insecure deserialization, and more
- Powered by AI (LLM-based analysis) with real-world threat intelligence enrichment
- Returns severity-rated findings (Critical / High / Medium / Low) with line numbers, vulnerable code snippets, and secure code fix examples
- Auto-creates security alerts for critical and high findings

### 📊 Analytics Dashboard
- Full vulnerability metrics with trend charts, severity distribution, and language breakdowns
- Customizable widget layout — show/hide any panel
- Vulnerability Density Heatmap to visualize risk concentration across files
- Security score history over time
- Export comprehensive security reports in **PDF** or **CSV** format

### 📄 Compliance Report Export
- **PDF Report:** Executive summary with overall risk posture (LOW / MEDIUM / HIGH / CRITICAL), severity distribution table, CVE threat intelligence, and a full remediation timeline grouped by deadline
- **CSV Report:** Machine-readable structured export covering executive summary, severity breakdown, detailed scan data, remediation timeline, and full vulnerability details

### 🌐 Threat Intelligence
- Correlates findings with known CVEs from NIST NVD
- Tracks threat actors, attack patterns, and active campaigns
- Provides exploitability metrics and prevalence data per vulnerability

### 🔴 Red Team Dashboard
- Aggregated vulnerability explorer across all scans
- Severity and status filters
- **Exploit Simulation Environment** — animated terminal output, kill chain visualization, and blast-radius impact mapping per vulnerability
- CSV export of all findings

### 🎯 Adversary Simulation Module *(New)*
- Select from **8 real-world threat actor profiles**: APT28 (Fancy Bear), Lazarus Group, APT41 (Double Dragon), FIN7, LAPSUS$, REvil, Script Kiddies, and Malicious Insider
- Each profile includes nation/origin, sophistication rating, MITRE ATT&CK TTPs, signature tools, and primary targets
- AI re-analyzes your actual scan vulnerabilities through the lens of that specific actor's known behaviors
- Generates a full **attack path report** across all MITRE ATT&CK phases (Initial Access → Exfiltration)
- Shows which vulnerabilities the actor would exploit, why, and with which specific technique (mapped to ATT&CK TTP IDs)
- Overall risk score, estimated dwell time, data at risk, and actor-specific defensive recommendations
- Includes OPSEC notes explaining how each actor avoids detection

### 🏗️ Deployment Monitoring
- Track deployed applications across development, staging, and production environments
- Automatic security health checks that correlate deployments with scan results
- Security alerts for at-risk deployments

### 🔔 Alerts Dashboard
- Centralized alert management for critical and high severity findings
- Acknowledge, resolve, or bulk-dismiss alerts
- Filterable by status (active / acknowledged / resolved) and severity

### 📋 Policy Engine
- Create and enforce custom security policies based on frameworks: OWASP Top 10, PCI DSS, GDPR, HIPAA, SOC 2, NIST, ISO 27001
- Define rules with thresholds (e.g. max critical vulns, min security score)
- Evaluate scans against policies and view compliance scores
- Compliance reports per policy framework

### ⏰ Scheduled Scans
- Configure recurring scans (hourly, daily, weekly, monthly) against repositories, URLs, or file patterns
- Notification preferences per schedule (notify on critical/high/any)

### 🤖 GitHub PR Security Scanning
- Watch GitHub repositories for new pull requests
- Automatically scans changed files when a new PR is opened
- Posts a formatted markdown vulnerability report as a PR comment including severity table, score badge, and collapsible findings
- Manageable via the **PR Integration** page

### 🔐 CI/CD Integration
- Integration guides for GitHub Actions, GitLab CI, Jenkins, and webhook payloads
- Embed CyberScan checks directly into your deployment pipeline

### 💼 LinkedIn Post Publisher *(New)*
- Generate and publish developer-focused security content directly to LinkedIn
- **5 AI-powered post templates**: Security Tips, Vulnerability Alerts, Best Practices, Threat Intel, and AI Security
- Posts are auto-enriched with context from your real scan findings
- One-click publish to your LinkedIn network via OAuth integration
- Helps security engineers share insights and grow their professional presence

---

## 🖥️ How to Use

### 1. Scan Your Code
1. Navigate to the **Scanner** page (home)
2. Paste your code into the text area **or** click **Upload File** to select a source file
3. Click **Scan for Vulnerabilities**
4. Review findings — each vulnerability includes a description, location, vulnerable code, and a secure fix example

### 2. View Analytics
1. Click **Analytics** in the Scanner header
2. Use the time range filter to scope data
3. Customize widgets via the **Customize** button
4. Export a full compliance report using **Export Comprehensive PDF** or **Export Comprehensive CSV**

### 3. Run an Adversary Simulation
1. Click **Red Team** → **Adversary Sim** in the header
2. Select a threat actor profile (e.g. APT28, Lazarus Group, Script Kiddie)
3. Review their TTPs and click **Launch Simulation**
4. The AI maps your real vulnerabilities to that actor's attack patterns across all kill chain phases
5. Review per-phase results, matched vulnerabilities, and targeted defensive recommendations

### 4. Set Up PR Scanning
1. Click **PR Scan** in the Scanner header
2. Add your GitHub repository in `owner/repo` format (e.g. `acme/backend-api`)
3. Enable the config — CyberScan will poll for new PRs every 5 minutes and post scan results as PR comments

### 5. Schedule Recurring Scans
1. Click **Schedule** in the Scanner header
2. Enter a target (repository URL or file pattern), frequency, and notification preferences
3. CyberScan will run automatically on the defined schedule

### 6. Manage Policies
1. Click **Policies** in the Scanner header
2. Create a policy tied to a compliance framework
3. Add rules (e.g. "max 0 critical vulnerabilities")
4. Evaluate any scan against the policy to get a compliance score

### 7. Monitor Deployments
1. Click **Monitoring** in the Scanner header
2. Add your deployed applications with environment and version info
3. Run security health checks to correlate deployment state with vulnerability findings

### 8. Share on LinkedIn
1. Click **Post** in the Scanner header
2. Choose an AI template or write your own post
3. Click **Post to LinkedIn** to publish instantly to your network

---

## 🧰 Tech Stack

- **Frontend:** React, Tailwind CSS, Framer Motion, Recharts, shadcn/ui
- **Backend:** Base44 serverless functions (Deno)
- **AI Engine:** LLM-based vulnerability analysis (Claude Sonnet for adversary simulation) with internet-augmented threat intelligence
- **Database:** Base44 managed entity store
- **Integrations:** GitHub API (PR scanning and commenting), LinkedIn API (post publishing)

---

## 📁 Project Structure

```
pages/
  Scanner.jsx               — Main code scanner UI
  Analytics.jsx             — Metrics and reporting dashboard
  ThreatIntel.jsx           — Threat intelligence center
  RedTeam.jsx               — Red team / exploit simulation
  AdversarySimulation.jsx   — TTP-based threat actor attack emulation
  PolicyEngine.jsx          — Compliance policy management
  AlertsDashboard.jsx       — Security alert management
  Monitoring.jsx            — Deployment monitoring
  PRIntegration.jsx         — GitHub PR scan configuration
  LinkedInPost.jsx          — LinkedIn post composer and publisher

components/redteam/adversary/
  ThreatActorProfiles.js    — 8 threat actor definitions with TTPs
  ThreatActorCard.jsx       — Actor selection card UI
  ThreatActorDetail.jsx     — Full TTP breakdown display
  AdversarySimResults.jsx   — Simulation results with attack path analysis

functions/
  prSecurityScan.js         — GitHub PR polling and AI scan + comment bot
  linkedinPost.js           — LinkedIn post publishing via OAuth
  createReadme.js           — GitHub README updater

entities/
  CodeScan                  — Scan results storage
  VulnerabilityMetric       — Aggregated vulnerability metrics
  ScheduledScan             — Scheduled scan configurations
  SecurityPolicy            — Policy definitions
  PolicyEvaluation          — Policy evaluation results
  DeployedApplication       — Monitored deployments
  SecurityAlert             — Active security alerts
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | GitHub Personal Access Token — required for PR scanning and commenting |

---

## 📬 Support

For issues, feature requests, or contributions, open an issue or pull request in this repository.

---

*Built with ❤️ using [Base44](https://base44.com) — AI-powered app development platform.*
