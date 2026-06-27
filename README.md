# 🛡️ CodeGuard — Security-as-a-Service API

**Automated security scanning for code, repositories, and APIs.**

CodeGuard is a Security-as-a-Service platform that helps developers find and fix vulnerabilities before they ship. Scan code snippets, entire GitHub repos, and API endpoints — then generate compliance reports for SOC 2, HIPAA, PCI DSS, and OWASP.

🔗 **Developer Portal:** [cyber-security-code-scan.base44.app](https://cyber-security-code-scan.base44.app)
📖 **API Docs:** [View Full Documentation](https://cyber-security-code-scan.base44.app/functions/getApiDocs)
⚡ **GitHub Action:** [CI/CD Integration](https://github.com/collins73/cyberscan/tree/main/github-action)

---

## 🚀 Quick Start

### 1. Get an API Key (Free)

```bash
curl -X POST https://cyber-security-code-scan.base44.app/functions/generateApiKey \
  -H "Content-Type: application/json" \
  -d '{"name": "My App", "owner_email": "dev@example.com", "tier": "Free"}'
```

### 2. Scan Your Code

```bash
curl -X POST https://cyber-security-code-scan.base44.app/functions/scanCodeApi \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const query = \"SELECT * FROM users WHERE id=\" + req.params.id;",
    "language": "javascript"
  }'
```

### 3. Get Results

```json
{
  "scan_id": "scan_abc123",
  "status": "completed",
  "results": {
    "total_vulnerabilities": 1,
    "critical": 1,
    "vulnerabilities": [
      {
        "id": "CWE-89",
        "name": "SQL Injection",
        "severity": "CRITICAL",
        "recommendation": "Use parameterized queries instead of string concatenation"
      }
    ]
  }
}
```

---

## 📡 API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/generateApiKey` | POST | ❌ | Generate a new API key |
| `/scanCodeApi` | POST | ✅ | Scan a code snippet (8 CWE checks) |
| `/scanRepositoryApi` | POST | ✅ | Scan a GitHub repository (12 languages) |
| `/scanApiSecurity` | POST | ✅ | OWASP API Security Top 10 (2023) |
| `/generateComplianceReport` | POST | ✅ | SOC 2, HIPAA, PCI DSS, OWASP reports |
| `/getScanResults` | POST | ✅ | Retrieve a specific scan |
| `/listScans` | GET | ✅ | List all scans (paginated) |

**Base URL:** `https://cyber-security-code-scan.base44.app/functions`

---

## 🔍 What We Detect

### Code & Repository Scanning
| Vulnerability | CWE | Severity |
|---|---|---|
| SQL Injection | CWE-89 | 🔴 Critical |
| OS Command Injection | CWE-78 | 🔴 Critical |
| Cross-Site Scripting (XSS) | CWE-79 | 🟠 High |
| Hardcoded Credentials | CWE-798 | 🟠 High |
| Path Traversal | CWE-22 | 🟠 High |
| Insecure Deserialization | CWE-502 | 🟡 Medium |
| Missing Authentication | CWE-306 | 🟡 Medium |
| CORS Misconfiguration | CWE-942 | 🟡 Medium |

### API Security (OWASP API Top 10 — 2023)
| Check | ID |
|---|---|
| Broken Object Level Authorization | API1:2023 |
| Broken Authentication | API2:2023 |
| Broken Object Property Level Authorization | API3:2023 |
| Unrestricted Resource Consumption | API4:2023 |
| Broken Function Level Authorization | API5:2023 |
| Unrestricted Access to Sensitive Business Flows | API6:2023 |
| Server-Side Request Forgery (SSRF) | API7:2023 |
| Security Misconfiguration | API8:2023 |
| Improper Inventory Management | API9:2023 |
| Unsafe Consumption of APIs | API10:2023 |

### Supported Languages
JavaScript · TypeScript · Python · Ruby · PHP · Java · Go · Rust · C/C++ · C# · Swift · Kotlin

---

## 📋 Compliance Reports

Generate auditor-ready compliance reports mapped to major security frameworks:

- **SOC 2 Type II** — Trust Services Criteria (CC6, CC7)
- **HIPAA Security Rule** — Technical safeguards (§164.312)
- **PCI DSS v4.0** — Requirements 6-8
- **OWASP Top 10 (2021)** — A01 through A10

Each report includes:
- Compliance score (percentage)
- Control-by-control assessment (COMPLIANT / AT_RISK / NON_COMPLIANT)
- Audit evidence trail with scan timestamps
- Remediation plan with deadlines (48hr for critical, 2 weeks for high)
- CWE-to-control mapping

```bash
curl -X POST https://cyber-security-code-scan.base44.app/functions/generateComplianceReport \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"framework": "SOC2", "date_range_days": 30, "include_remediation": true}'
```

---

## ⚙️ CI/CD Integration

### GitHub Actions

Add automated security scanning to every pull request:

```yaml
# .github/workflows/security.yml
name: Security Scan
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  codeguard-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: collins73/cyberscan/github-action@main
        with:
          api_key: ${{ secrets.CODEGUARD_API_KEY }}
          fail_on_critical: 'true'
          fail_on_high: 'false'
```

**Setup:**
1. Generate a free API key
2. Add `CODEGUARD_API_KEY` to your repo's **Settings → Secrets → Actions**
3. Copy the workflow above
4. Push — CodeGuard scans every PR automatically

[Full GitHub Action documentation →](https://github.com/collins73/cyberscan/tree/main/github-action)

---

## 💰 Pricing

| Tier | Price | Scans/Day | Features |
|---|---|---|---|
| **Free** | $0/mo | 10 | Code scanning, repo scanning, basic CWE detection |
| **Pro** | $19.99/mo | 100 | + API security, compliance reports, bundled with RebelAgents |
| **Enterprise** | $99.99/mo | 1,000 | + Webhooks, priority scanning, custom frameworks |

---

## 🏗️ Architecture

```
codeguard/
├── base44/
│   ├── entities/          # Data models (ApiKey, ScanRecord, UsageLog, etc.)
│   └── functions/         # Backend API functions (12 deployed)
├── github-action/
│   ├── action.yml         # GitHub Action definition
│   ├── example-workflow.yml
│   └── README.md          # Action-specific docs
└── README.md              # This file
```

---

## 🔐 Security

- API keys are hashed with SHA-256 before storage — plaintext keys are never stored
- HMAC-SHA256 signed webhook payloads (`X-CodeGuard-Signature` header)
- Rate limiting enforced per API key based on pricing tier
- Standardized error responses with proper HTTP status codes

---

## 📜 License

Proprietary — © 2026 RebelAgents. All rights reserved.

---

Built with ⚡ by [RebelAgents](https://rebelagents.ai)
