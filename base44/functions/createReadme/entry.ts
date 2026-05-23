import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const README_CONTENT = `# 🛡️ CodeGuard — AI-Powered Security Analysis Platform

CodeGuard is a focused AI-driven security platform that helps developers and security teams identify, analyze, and track code vulnerabilities. It provides three core modules accessible from a unified navigation bar.

---

## 🚀 Core Features

### 📊 Analytics Dashboard (Home)
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
- Provides exploitability metrics and prevalence data per vulnerability

### 🏗️ Monitoring
- Track deployed applications across development, staging, and production environments
- Automatic security health checks that correlate deployments with scan results
- Security alerts for at-risk deployments
- CI/CD integration guides (GitHub Actions, GitLab CI, Jenkins)

### 🔍 AI Code Scanner (via Analytics)
- Detects **20+ vulnerability types** including SQL Injection, XSS, RCE, SSRF, hardcoded secrets, and more
- AI-powered analysis with real-world threat intelligence enrichment
- Severity-rated findings (Critical / High / Medium / Low) with line numbers and secure fix examples
- Auto-creates security alerts for critical and high findings

---

## 🖥️ How to Use

### Navigation
All pages are accessible from the top navigation bar:
- **Analytics** — your main security dashboard
- **Threat Intel** — CVE correlation and threat landscape
- **Monitoring** — deployment health and alerts

### Running a Scan
1. Go to **Analytics** and click **Start Scanning** (if no data yet)
2. Paste code or upload a file, then click **Scan for Vulnerabilities**
3. Review findings with recommendations and secure code examples
4. Return to **Analytics** to see metrics update in real-time

### Viewing Threat Intelligence
1. Click **Threat Intel** in the nav bar
2. Explore risk prioritization, CVE correlation, threat actors, and landscape analysis

### Monitoring Deployments
1. Click **Monitoring** in the nav bar
2. Add deployed applications with environment and version info
3. Run security health checks to assess deployment risk

---

## 🧰 Tech Stack

- **Frontend:** React, Tailwind CSS, Framer Motion, Recharts, shadcn/ui
- **Backend:** Base44 serverless functions (Deno)
- **AI Engine:** LLM-based vulnerability analysis with internet-augmented threat intelligence
- **Database:** Base44 managed entity store
- **Integrations:** GitHub API

---

## 📁 Project Structure

\`\`\`
pages/
  Landing.jsx          — Marketing landing page
  Analytics.jsx        — Main security metrics dashboard
  ThreatIntel.jsx      — Threat intelligence center
  Monitoring.jsx       — Deployment monitoring & alerts
  Scanner.jsx          — AI code vulnerability scanner

components/
  AppNav.jsx           — Shared navigation bar
  analytics/           — Dashboard widgets
  threatintel/         — Threat intelligence components
  monitoring/          — Monitoring components
  scanner/             — Scanner components

functions/
  prSecurityScan.js    — GitHub PR polling and AI scan bot
  threatIntelligence.js — Threat intelligence backend

entities/
  CodeScan             — Scan results storage
  VulnerabilityMetric  — Aggregated vulnerability metrics
  DeployedApplication  — Monitored deployments
  SecurityAlert        — Active security alerts
\`\`\`

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| \`GITHUB_TOKEN\` | GitHub Personal Access Token — required for PR scanning |

---

## 📬 Support

For issues or contributions, open an issue or pull request in this repository.

---

*Built with ❤️ using [Base44](https://base44.com) — AI-powered app development platform.*
`;

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const token = Deno.env.get('GITHUB_TOKEN');
    if (!token) {
        return Response.json({ error: 'GITHUB_TOKEN not set' }, { status: 500 });
    }

    const owner = 'collins73';
    const repo = 'cyberscan';

    // Check if README.md already exists to get its SHA (needed for update)
    let sha = null;
    const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/README.md`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    if (checkRes.ok) {
        const existing = await checkRes.json();
        sha = existing.sha;
    }

    const body = {
        message: sha ? 'docs: update README.md with full app documentation' : 'docs: add README.md with full app documentation',
        content: btoa(unescape(encodeURIComponent(README_CONTENT))),
        ...(sha ? { sha } : {})
    };

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/README.md`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
        return Response.json({ error: data.message }, { status: res.status });
    }

    return Response.json({ success: true, url: data.content?.html_url });
});