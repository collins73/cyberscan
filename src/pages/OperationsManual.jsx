import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, FileText, Download, ArrowLeft, Github, Code,
  Search, GitPullRequest, BarChart3, Bell, Activity,
  Globe, Lock, BookOpen, ChevronRight, CheckCircle, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  {
    id: 'overview',
    title: '1. Overview',
    icon: Shield,
    color: 'cyan',
    content: [
      {
        type: 'para',
        text: 'CodeGuard is an AI-powered security analysis platform designed to help developers and security teams identify and fix vulnerabilities in their code. It connects directly to your GitHub repositories or accepts manual code input, then uses advanced AI to detect security issues, generate automatic fixes, and monitor your overall security posture.'
      },
      {
        type: 'para',
        text: 'This manual walks you through every feature of the platform so you can get the most out of CodeGuard.'
      }
    ]
  },
  {
    id: 'getting-started',
    title: '2. Getting Started',
    icon: BookOpen,
    color: 'blue',
    content: [
      {
        type: 'heading',
        text: 'Accessing the Dashboard'
      },
      {
        type: 'para',
        text: 'From the Landing page, click "Enter Dashboard" or "Start Scanning Free" to access the main application. The primary navigation bar at the top of every page gives you quick access to all major sections.'
      },
      {
        type: 'heading',
        text: 'Navigation Bar'
      },
      {
        type: 'list',
        items: [
          'Scanner — Run security scans on code or repositories',
          'Analytics — View vulnerability trends and metrics',
          'Monitoring — Monitor deployed applications in real-time',
          'Threat Intel — Explore CVE data and threat intelligence',
          'Projects — Organize scans by project or repository',
          'Policy Engine — Define and enforce security policies',
          'PR Integration — Automate security checks on pull requests',
          'Alerts — View and manage active security alerts',
        ]
      }
    ]
  },
  {
    id: 'scanner',
    title: '3. Running a Security Scan',
    icon: Search,
    color: 'indigo',
    content: [
      {
        type: 'para',
        text: 'The Scanner is the core feature of CodeGuard. You can scan code in two ways:'
      },
      {
        type: 'heading',
        text: 'Option A: Code / File Scan (Paste or Upload)'
      },
      {
        type: 'steps',
        items: [
          'Navigate to the Scanner page.',
          'Ensure the "Code / File" tab is selected.',
          'Choose "Paste Code" to type or paste code directly, or "Upload File" to upload a source file from your computer.',
          'Optionally assign the scan to a Project using the dropdown.',
          'Select an AI Model — "Auto" is recommended for most users. Higher-quality models use more credits.',
          'Click "Initiate Security Scan" and wait for results (typically 10–30 seconds).',
        ]
      },
      {
        type: 'heading',
        text: 'Option B: Repository Scan (Full Codebase via GitHub)'
      },
      {
        type: 'steps',
        items: [
          'Navigate to the Scanner page.',
          'Click the "Repository" tab.',
          'Enter your GitHub repository URL (e.g., https://github.com/owner/repo or just owner/repo).',
          'Specify the branch to scan (default: main).',
          'Choose how many files to scan — 30 files is recommended for a balanced scan.',
          'Optionally assign to a Project and choose an AI Model.',
          'Click "Scan Repository". The scan fetches your files via the GitHub API and analyzes them in batches.',
        ]
      },
      {
        type: 'note',
        text: 'Private repositories require a GitHub token with repo scope to be configured in the platform settings. Contact your administrator if you need access to private repos.'
      },
      {
        type: 'heading',
        text: 'Understanding Scan Results'
      },
      {
        type: 'para',
        text: 'Once a scan completes, you will see a results dashboard with:'
      },
      {
        type: 'list',
        items: [
          'Security Score (0–100) — A higher score means fewer/less severe issues.',
          'Vulnerability count by severity: Critical, High, Medium, Low.',
          'Individual vulnerability cards showing the affected code, line number, description, and a recommended fix.',
          'Secure code examples showing exactly how to patch each issue.',
          'Threat intelligence data linking vulnerabilities to known CVEs and real-world exploits.',
        ]
      }
    ]
  },
  {
    id: 'autofix',
    title: '4. Auto-Fix via GitHub Pull Request',
    icon: GitPullRequest,
    color: 'green',
    content: [
      {
        type: 'para',
        text: 'CodeGuard can automatically generate a GitHub Pull Request with AI-written security patches applied to your code.'
      },
      {
        type: 'steps',
        items: [
          'After a scan completes, click the "Auto-Fix PR" button in the scan results.',
          'Review the list of vulnerabilities that will be patched.',
          'Confirm the target repository and branch.',
          'Click "Create Pull Request". CodeGuard will open a PR in your GitHub repo with the fixes applied.',
          'Review the PR in GitHub, test the changes, and merge when ready.',
        ]
      },
      {
        type: 'note',
        text: 'Auto-Fix requires the GitHub connector to be authorized with repo write permissions. The generated PR includes a detailed description of each fix applied.'
      }
    ]
  },
  {
    id: 'analytics',
    title: '5. Analytics Dashboard',
    icon: BarChart3,
    color: 'violet',
    content: [
      {
        type: 'para',
        text: 'The Analytics page gives you a bird\'s-eye view of your security posture over time.'
      },
      {
        type: 'list',
        items: [
          'Vulnerability Trends — See how the number of issues changes over time.',
          'Severity Distribution — Pie/bar charts showing the breakdown of critical, high, medium, and low issues.',
          'Top Vulnerabilities — The most frequently detected vulnerability types across your scans.',
          'Language Breakdown — Which programming languages have the most issues.',
          'Security Score Trend — Track improvement or regression in your overall score.',
          'Time Range Filter — Filter all data by Last 7 Days, 30 Days, 90 Days, or All Time.',
        ]
      },
      {
        type: 'para',
        text: 'Use the "Customize Widgets" button to show or hide specific dashboard panels based on your preferences. You can also download a comprehensive PDF or CSV report from this page.'
      }
    ]
  },
  {
    id: 'monitoring',
    title: '6. Application Monitoring',
    icon: Activity,
    color: 'cyan',
    content: [
      {
        type: 'para',
        text: 'The Monitoring page lets you track the security status of your deployed applications in real-time.'
      },
      {
        type: 'steps',
        items: [
          'Click "Add Deployment" to register a deployed application.',
          'Enter the application name, environment (development, staging, production), version, and language.',
          'CodeGuard will track the last security scan result and show the current risk status.',
          'Applications are color-coded: green (healthy), yellow (warning), red (critical).',
        ]
      },
      {
        type: 'list',
        items: [
          'CI/CD Integration tab — Connect CodeGuard to your CI/CD pipeline for automatic scans on every deploy.',
          'Alerts Panel — View security alerts triggered by monitoring checks.',
        ]
      }
    ]
  },
  {
    id: 'threatintel',
    title: '7. Threat Intelligence',
    icon: Globe,
    color: 'orange',
    content: [
      {
        type: 'para',
        text: 'The Threat Intel page provides context about the real-world impact of vulnerabilities found in your scans.'
      },
      {
        type: 'list',
        items: [
          'Scan Prioritizer — Ranks your vulnerabilities by real-world exploitability so you fix the most dangerous issues first.',
          'CVE Correlator — Links detected vulnerabilities to known CVE identifiers with CVSS scores.',
          'Threat Actor Panel — Shows active threat campaigns that exploit vulnerability types found in your code.',
          'Threat Landscape — Provides a high-level view of the current security threat environment.',
        ]
      }
    ]
  },
  {
    id: 'policies',
    title: '8. Policy Engine',
    icon: Lock,
    color: 'rose',
    content: [
      {
        type: 'para',
        text: 'The Policy Engine allows you to define and enforce security standards across your codebase.'
      },
      {
        type: 'steps',
        items: [
          'Navigate to Policy Engine.',
          'Click "Create Policy" and choose a compliance framework (OWASP Top 10, PCI DSS, HIPAA, SOC 2, etc.).',
          'Add rules — for example: "No critical vulnerabilities", "Minimum security score of 80", "Max 5 high-severity issues".',
          'Enable the policy and set whether violations should block deployments or trigger alerts.',
          'Run a policy evaluation against any past scan to see compliance status instantly.',
        ]
      },
      {
        type: 'note',
        text: 'Policies are evaluated automatically when new scans are saved if they are enabled. Violations appear in the Alerts dashboard.'
      }
    ]
  },
  {
    id: 'alerts',
    title: '9. Alerts Dashboard',
    icon: Bell,
    color: 'amber',
    content: [
      {
        type: 'para',
        text: 'Alerts are automatically created when scans detect critical or high-severity vulnerabilities, or when policy rules are violated.'
      },
      {
        type: 'list',
        items: [
          'Active — New alerts that need attention.',
          'Acknowledged — Alerts that have been seen and are being worked on.',
          'Resolved — Closed alerts where the issue has been fixed.',
        ]
      },
      {
        type: 'steps',
        items: [
          'Click an alert to view its details and the related scan.',
          'Click "Acknowledge" to mark it as in-progress.',
          'After fixing the issue and running a new clean scan, click "Resolve" to close the alert.',
        ]
      }
    ]
  },
  {
    id: 'projects',
    title: '10. Projects',
    icon: Code,
    color: 'teal',
    content: [
      {
        type: 'para',
        text: 'Projects help you organize scans by repository or team. Every scan can be assigned to a project.'
      },
      {
        type: 'steps',
        items: [
          'Navigate to Projects and click "New Project".',
          'Enter a project name, description, repository URL, and primary language.',
          'Assign a color badge for easy identification.',
          'When running scans, select the project from the dropdown — all results will be grouped under it.',
          'The Projects page shows aggregate security scores and vulnerability counts per project.',
        ]
      }
    ]
  },
  {
    id: 'pr-integration',
    title: '11. PR Integration',
    icon: Github,
    color: 'blue',
    content: [
      {
        type: 'para',
        text: 'The PR Integration feature automatically scans open GitHub Pull Requests for security issues and posts a summary comment directly on the PR.'
      },
      {
        type: 'steps',
        items: [
          'Navigate to PR Integration.',
          'Ensure your GitHub connector is authorized.',
          'Click "Scan Open PRs" to analyze all currently open pull requests in your connected repositories.',
          'Results are posted as a comment on each PR in GitHub, summarizing any issues found.',
          'Configure auto-scan to run automatically on every new PR using the Scheduled Scans feature.',
        ]
      }
    ]
  },
  {
    id: 'tips',
    title: '12. Tips & Best Practices',
    icon: CheckCircle,
    color: 'green',
    content: [
      {
        type: 'list',
        items: [
          'Start with a full repo scan to get a baseline security score before making changes.',
          'Use the "30 files" setting for repository scans — it balances speed and coverage well.',
          'Always review AI-generated fixes before merging a PR; treat them as suggestions, not final code.',
          'Create a policy with your minimum acceptable security score and check it before every release.',
          'Schedule regular scans (daily or weekly) using the Scheduled Scans feature in the Scanner page.',
          'Use Projects to track security trends per repository over time.',
          'Check the Threat Intel page after a critical vulnerability is found to understand its real-world risk.',
          'Acknowledge and resolve alerts promptly to keep your alert feed clean and actionable.',
        ]
      }
    ]
  }
];

const colorClasses = {
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  green: 'text-green-400 bg-green-500/10 border-green-500/30',
  orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  teal: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
};

function renderContent(content) {
  return content.map((block, i) => {
    if (block.type === 'para') {
      return <p key={i} className="text-slate-300 leading-relaxed mb-3">{block.text}</p>;
    }
    if (block.type === 'heading') {
      return <h4 key={i} className="text-white font-semibold mt-5 mb-2">{block.text}</h4>;
    }
    if (block.type === 'list') {
      return (
        <ul key={i} className="space-y-1.5 mb-3">
          {block.items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-slate-300">
              <ChevronRight className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (block.type === 'steps') {
      return (
        <ol key={i} className="space-y-2 mb-3">
          {block.items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-slate-300">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center mt-0.5">
                {j + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    }
    if (block.type === 'note') {
      return (
        <div key={i} className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-3 text-sm text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{block.text}</span>
        </div>
      );
    }
    return null;
  });
}

export default function OperationsManual() {
  const navigate = useNavigate();
  const manualRef = useRef(null);

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank');
    const content = document.getElementById('manual-content').innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CodeGuard Operations Manual</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; padding: 40px; line-height: 1.6; }
            h1 { font-size: 28px; color: #0e7490; margin-bottom: 6px; }
            .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 30px; }
            .section { margin-bottom: 36px; page-break-inside: avoid; }
            .section-title { font-size: 18px; font-weight: 700; color: #0e7490; border-bottom: 2px solid #e0f2fe; padding-bottom: 6px; margin-bottom: 14px; }
            h4 { font-size: 14px; font-weight: 600; color: #1e293b; margin: 14px 0 6px; }
            p { font-size: 13px; color: #374151; margin-bottom: 10px; }
            ul, ol { padding-left: 0; margin-bottom: 10px; list-style: none; }
            li { font-size: 13px; color: #374151; margin-bottom: 6px; padding-left: 18px; position: relative; }
            li::before { content: "•"; position: absolute; left: 4px; color: #0e7490; }
            ol li::before { content: counter(list-item) "."; counter-increment: list-item; }
            ol { counter-reset: list-item; }
            .note { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 14px; font-size: 13px; color: #92400e; margin-bottom: 10px; border-radius: 4px; }
            .header { border-bottom: 3px solid #0e7490; padding-bottom: 20px; margin-bottom: 32px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛡️ CodeGuard — Operations Manual</h1>
            <p class="subtitle">End-User Guide · Version 1.0 · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div id="pdf-body"></div>
          <script>
            const sections = ${JSON.stringify(SECTIONS)};
            const body = document.getElementById('pdf-body');
            sections.forEach(sec => {
              const div = document.createElement('div');
              div.className = 'section';
              let html = '<div class="section-title">' + sec.title + '</div>';
              sec.content.forEach(block => {
                if (block.type === 'para') html += '<p>' + block.text + '</p>';
                else if (block.type === 'heading') html += '<h4>' + block.text + '</h4>';
                else if (block.type === 'list') {
                  html += '<ul>' + block.items.map(i => '<li>' + i + '</li>').join('') + '</ul>';
                }
                else if (block.type === 'steps') {
                  html += '<ol>' + block.items.map(i => '<li>' + i + '</li>').join('') + '</ol>';
                }
                else if (block.type === 'note') {
                  html += '<div class="note">⚠️ Note: ' + block.text + '</div>';
                }
              });
              div.innerHTML = html;
              body.appendChild(div);
            });
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadWord = () => {
    let docContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>CodeGuard Operations Manual</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; color: #1a1a2e; margin: 1in; line-height: 1.6; }
      h1 { font-size: 24pt; color: #0e7490; }
      h2 { font-size: 14pt; color: #0e7490; border-bottom: 1px solid #e0f2fe; padding-bottom: 4px; margin-top: 24px; }
      h4 { font-size: 11pt; font-weight: bold; margin-top: 12px; }
      p { font-size: 10.5pt; margin-bottom: 8px; }
      li { font-size: 10.5pt; margin-bottom: 4px; }
      .note { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 8px 12px; font-size: 10pt; color: #92400e; margin: 8px 0; }
      .subtitle { font-size: 10pt; color: #6b7280; margin-bottom: 24px; }
    </style></head><body>
    <h1>🛡️ CodeGuard — Operations Manual</h1>
    <p class="subtitle">End-User Guide &nbsp;·&nbsp; Version 1.0 &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>`;

    SECTIONS.forEach(sec => {
      docContent += `<h2>${sec.title}</h2>`;
      sec.content.forEach(block => {
        if (block.type === 'para') docContent += `<p>${block.text}</p>`;
        else if (block.type === 'heading') docContent += `<h4>${block.text}</h4>`;
        else if (block.type === 'list') {
          docContent += '<ul>' + block.items.map(i => `<li>${i}</li>`).join('') + '</ul>';
        }
        else if (block.type === 'steps') {
          docContent += '<ol>' + block.items.map(i => `<li>${i}</li>`).join('') + '</ol>';
        }
        else if (block.type === 'note') {
          docContent += `<div class="note">⚠️ Note: ${block.text}</div>`;
        }
      });
    });

    docContent += '</body></html>';

    const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CodeGuard_Operations_Manual.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDIxNywyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Operations Manual</h1>
              <p className="text-slate-400 text-sm">CodeGuard End-User Guide · v1.0</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadWord} variant="outline" className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 gap-2">
              <FileText className="w-4 h-4" /> Download Word
            </Button>
            <Button onClick={downloadPDF} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold gap-2 hover:opacity-90">
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" /> Table of Contents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm py-1 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {sec.title}
                </a>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        <div id="manual-content" className="space-y-6">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const cls = colorClasses[sec.color];
            return (
              <div key={sec.id} id={sec.id} className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6 scroll-mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg border ${cls}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{sec.title}</h2>
                </div>
                <div>{renderContent(sec.content)}</div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-slate-600 text-sm pb-10">
          <p>CodeGuard Operations Manual · Version 1.0</p>
          <p className="mt-1">© {new Date().getFullYear()} Demayne Collins. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}