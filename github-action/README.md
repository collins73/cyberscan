# 🛡️ CodeGuard GitHub Action

Automated security scanning for your CI/CD pipeline. Scans your codebase on every pull request and blocks merges when critical vulnerabilities are found.

## Quick Start

Add this to `.github/workflows/security.yml`:

```yaml
name: Security Scan

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  codeguard-scan:
    runs-on: ubuntu-latest
    name: CodeGuard Security Scan
    steps:
      - uses: actions/checkout@v4
      
      - name: Run CodeGuard Scan
        uses: collins73/cyberscan/github-action@main
        with:
          api_key: ${{ secrets.CODEGUARD_API_KEY }}
          fail_on_critical: 'true'
          fail_on_high: 'false'
```

## Setup

1. Get a free API key at `https://cyber-security-code-scan.base44.app/functions/getApiDocs`
2. Add `CODEGUARD_API_KEY` to your repo's **Settings → Secrets → Actions**
3. Copy the workflow above into `.github/workflows/security.yml`
4. Push — CodeGuard will scan every PR automatically

## What It Scans

| Vulnerability | CWE | Severity |
|---|---|---|
| SQL Injection | CWE-89 | 🔴 Critical |
| Command Injection | CWE-78 | 🔴 Critical |
| Cross-Site Scripting | CWE-79 | 🟠 High |
| Hardcoded Credentials | CWE-798 | 🟠 High |
| Path Traversal | CWE-22 | 🟠 High |
| Insecure Deserialization | CWE-502 | 🟡 Medium |
| Missing Authentication | CWE-306 | 🟡 Medium |
| CORS Misconfiguration | CWE-942 | 🟡 Medium |

**Supported languages:** JavaScript, TypeScript, Python, Ruby, PHP, Java, Go, Rust, C/C++, C#, Swift, Kotlin

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_key` | ✅ | — | Your CodeGuard API key |
| `scan_type` | ❌ | `repository` | `code` or `repository` |
| `fail_on_critical` | ❌ | `true` | Fail build on critical vulns |
| `fail_on_high` | ❌ | `false` | Fail build on high vulns |

## Outputs

| Output | Description |
|---|---|
| `scan_id` | Scan reference ID |
| `total_vulnerabilities` | Total count |
| `critical_count` | Critical vulnerabilities |
| `high_count` | High severity vulnerabilities |

## Pricing

| Tier | Price | Scans/Day |
|---|---|---|
| Free | $0/mo | 10 |
| Pro | $19.99/mo | 100 |
| Enterprise | $99.99/mo | 1,000 |

## Full API

CodeGuard also offers:
- **OWASP API Top 10** scanner (`/scanApiSecurity`)
- **Compliance reports** for SOC 2, HIPAA, PCI DSS (`/generateComplianceReport`)
- **Webhook notifications** for Enterprise tier

Full API docs: `https://cyber-security-code-scan.base44.app/functions/getApiDocs`

---

Built by [RebelAgents](https://rebelagents.ai) ⚡
