# CodeGuard

**AI-Powered Security Analysis Platform**

CodeGuard is an advanced security analysis tool that leverages artificial intelligence to scan code for vulnerabilities, simulate exploits, and provide automated remediation through GitHub pull requests.

## Features

### 🔍 Code Security Scanner
- **AI-Powered Analysis**: Detects 20+ vulnerability types including SQL Injection, XSS, RCE, and more
- **Multi-Language Support**: JavaScript, TypeScript, Python, Java, C++, Go, Ruby, PHP, and HTML/CSS
- **Real-Time Threat Intelligence**: Correlates findings with CVE databases and threat actors
- **Security Scoring**: 0-100 score with severity classification

### 🤖 Auto-Fix via GitHub
- **Intelligent Code Patches**: LLM-generated fixes for detected vulnerabilities
- **Automated Pull Requests**: One-click remediation that opens PRs with secure code examples
- **Compliance-Ready**: Fixes follow security best practices and industry standards

### 🎯 Red Team Simulation
- **Exploit Simulation**: AI-powered attack chain generation for realistic vulnerability testing
- **Proof-of-Concepts**: Generates safe, educational PoCs to understand exploitability
- **Attack Vectors**: Detailed analysis of how vulnerabilities could be exploited
- **Detection Rules**: IOCs and detection rules for securing your systems

### 📊 Policy Engine & Compliance
- **Framework Support**: OWASP Top 10, PCI DSS, GDPR, HIPAA, SOC 2, NIST, ISO 27001
- **Custom Policies**: Define and enforce security policies across teams
- **Compliance Reporting**: Track policy violations and compliance metrics
- **Automated Alerts**: Get notified of policy breaches in real-time

### 📈 Analytics & Monitoring
- **Security Dashboard**: Real-time metrics on security posture
- **Vulnerability Trends**: Historical analysis of code health improvements
- **Project Tracking**: Monitor security debt across repositories
- **Deployment Monitoring**: Track application security in production

### 🔔 Security Alerts
- **Critical Notifications**: Immediate alerts for critical vulnerabilities
- **Policy Violations**: Alerts when deployments violate security policies
- **Threat Intelligence Updates**: Real-time threat landscape changes
- **Alert Management**: Acknowledge, track, and resolve security issues

### 🔄 PR Integration
- **Auto-Scanning PRs**: Continuously monitor pull requests for security issues
- **Inline Comments**: Security findings posted directly on PRs
- **Scheduled Scans**: Set up recurring security assessments
- **Repository Integration**: GitHub integration for seamless workflow

## Getting Started

### Prerequisites
- GitHub account with repository access
- Base44 account for deployment

### Installation

1. Clone or fork this repository
2. Deploy on Base44
3. Connect your GitHub account via the authorized connector
4. Add repositories to monitor in the PR Integration settings

### Usage

#### Manual Code Scanning
1. Navigate to **Scanner**
2. Paste code or upload a file
3. Select an AI model (Auto, Claude Sonnet, Claude Opus, or GPT-5)
4. Click **Initiate Security Scan**
5. Review findings and export reports

#### Auto-Fix Vulnerabilities
1. In scan results, click **Auto-Fix**
2. Select vulnerabilities to remediate
3. Enter your GitHub repository details
4. Click **Generate Fix** to create a pull request

#### PR Security Scanning
1. Go to **PR Integration**
2. Add your GitHub repositories (format: `owner/repo`)
3. CodeGuard will automatically scan new pull requests
4. Security findings are posted as PR comments

#### Red Team Testing
1. Navigate to **Red Team**
2. Select a vulnerability to simulate
3. Choose your AI model
4. Click **Run Exploit Simulation**
5. Review attack chains, PoCs, and mitigation steps

#### Policy Management
1. Go to **Policy Engine**
2. Create or edit security policies
3. Select compliance frameworks (OWASP, PCI DSS, etc.)
4. Define policy rules and thresholds
5. Monitor compliance across scans and deployments

## Architecture

### Frontend
- **React + Vite**: Modern UI framework
- **TailwindCSS**: Responsive styling
- **Framer Motion**: Smooth animations
- **Recharts**: Data visualization

### Backend
- **Base44 Platform**: Serverless infrastructure
- **Deno Functions**: AI-powered analysis engine
- **GitHub Integration**: Repository scanning and PR automation
- **LinkedI Integration**: Social sharing

### AI Models
- **Automatic (Default)**: GPT-4o-mini (balanced performance/cost)
- **Claude Sonnet**: High-quality analysis (more credits)
- **Claude Opus**: Highest quality analysis (most credits)
- **GPT-5**: Advanced analysis (more credits)

## Security & Privacy

- **No Code Storage**: Your code is analyzed and discarded; never stored permanently
- **OAuth Authentication**: Secure GitHub and LinkedIn integration
- **User Data Protection**: Encrypted connections and secure session handling
- **Vulnerability Data Only**: Only vulnerability metadata is saved for analytics

## Pages & Features

| Page | Purpose |
|------|---------|
| **Scanner** | Main code security scanning interface |
| **Red Team** | Exploit simulation and vulnerability testing |
| **Threat Intel** | Real-time threat landscape and CVE correlation |
| **Policy Engine** | Compliance framework management and reporting |
| **Alerts** | Security alert management dashboard |
| **PR Integration** | GitHub pull request security scanning |
| **Projects** | Repository and security debt tracking |
| **Analytics** | Security metrics and trend analysis |
| **Monitoring** | Deployment and production monitoring |

## API Functions

### Core Functions
- `scanCode()` - Analyze code for vulnerabilities
- `autoFixPR()` - Generate and submit security fix PRs
- `prSecurityScan()` - Scan GitHub PRs automatically
- `threatIntelligence()` - Correlate threats and CVEs

## Configuration

### Environment Variables
- `GITHUB_TOKEN` - GitHub API access token for repository operations
- `LINKEDIN_TOKEN` - LinkedIn API token for social sharing

## Support & Contributing

For issues, feature requests, or contributions, please open an issue on GitHub.

## License

Proprietary - CodeGuard © 2026

---

**Built with ❤️ using Base44 Platform**