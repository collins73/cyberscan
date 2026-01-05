import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function ComprehensiveReport({ scans, metrics, timeRange }) {
  const generateComprehensivePDF = () => {
    const printWindow = window.open('', '_blank');
    
    // Calculate comprehensive statistics
    const totalScans = scans.length;
    const totalVulnerabilities = scans.reduce((sum, s) => sum + (s.vulnerabilities?.length || 0), 0);
    const avgScore = scans.length > 0
      ? (scans.reduce((sum, s) => sum + s.overall_score, 0) / scans.length).toFixed(1)
      : 0;
    
    const severityBreakdown = scans.reduce((acc, scan) => {
      scan.vulnerabilities?.forEach(v => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
      });
      return acc;
    }, {});

    // Threat intelligence aggregation
    const threatIntel = scans.reduce((acc, scan) => {
      scan.vulnerabilities?.forEach(vuln => {
        if (vuln.threat_intelligence) {
          acc.totalCVEs += vuln.threat_intelligence.related_cves?.length || 0;
          if (vuln.threat_intelligence.related_cves) {
            vuln.threat_intelligence.related_cves.forEach(cve => {
              if (!acc.cveList.includes(cve.cve_id)) {
                acc.cveList.push(cve.cve_id);
              }
            });
          }
        }
      });
      return acc;
    }, { totalCVEs: 0, cveList: [] });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>CyberScan Comprehensive Security Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 50px;
            background: white;
            color: #1e293b;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 50px;
            padding-bottom: 30px;
            border-bottom: 4px solid #06b6d4;
          }
          .logo {
            font-size: 42px;
            font-weight: bold;
            background: linear-gradient(135deg, #06b6d4, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #64748b;
            font-size: 16px;
            margin-top: 10px;
          }
          .executive-summary {
            background: #f8fafc;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 40px;
            border-left: 6px solid #06b6d4;
          }
          h2 {
            color: #0f172a;
            margin: 40px 0 25px 0;
            font-size: 28px;
            border-left: 6px solid #06b6d4;
            padding-left: 20px;
          }
          h3 {
            color: #334155;
            margin: 25px 0 15px 0;
            font-size: 20px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 25px;
            margin-bottom: 40px;
          }
          .stat-card {
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            border: 2px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          .stat-value {
            font-size: 42px;
            font-weight: bold;
            color: #06b6d4;
            margin-bottom: 8px;
          }
          .stat-label {
            color: #64748b;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
            background: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border-radius: 8px;
            overflow: hidden;
          }
          th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          th {
            background: linear-gradient(135deg, #0f172a, #1e293b);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
          }
          tr:hover {
            background: #f8fafc;
          }
          .severity-critical { color: #ef4444; font-weight: bold; }
          .severity-high { color: #f97316; font-weight: bold; }
          .severity-medium { color: #eab308; font-weight: bold; }
          .severity-low { color: #3b82f6; font-weight: bold; }
          .threat-section {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
          }
          .cve-badge {
            display: inline-block;
            background: #fee2e2;
            color: #dc2626;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            margin: 4px;
            font-family: monospace;
          }
          .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 3px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 13px;
          }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🛡️ CyberScan</div>
          <h1 style="color: #0f172a; font-size: 32px; margin: 15px 0;">
            Comprehensive Security Report
          </h1>
          <div class="subtitle">
            <strong>Generated:</strong> ${format(new Date(), 'PPpp')}<br/>
            <strong>Report Period:</strong> ${timeRange === 'all' ? 'All Time' : `Last ${timeRange} Days`}
          </div>
        </div>

        <div class="executive-summary">
          <h3 style="margin-top: 0;">📊 Executive Summary</h3>
          <p style="margin-top: 15px; font-size: 15px; line-height: 1.8;">
            This comprehensive security report provides a detailed analysis of ${totalScans} security scans 
            performed across your codebase. The analysis identified ${totalVulnerabilities} potential 
            vulnerabilities with an average security score of ${avgScore}/100. 
            ${threatIntel.totalCVEs > 0 ? `The scan correlated findings with ${threatIntel.totalCVEs} known CVE entries, providing additional context for remediation priorities.` : ''}
          </p>
        </div>

        <h2>📈 Overall Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${totalScans}</div>
            <div class="stat-label">Total Scans</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalVulnerabilities}</div>
            <div class="stat-label">Vulnerabilities</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: ${avgScore >= 80 ? '#10b981' : avgScore >= 60 ? '#eab308' : '#ef4444'};">
              ${avgScore}
            </div>
            <div class="stat-label">Avg Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #ef4444;">${severityBreakdown.critical || 0}</div>
            <div class="stat-label">Critical Issues</div>
          </div>
        </div>

        <h2>⚠️ Severity Distribution</h2>
        <table>
          <thead>
            <tr>
              <th>Severity Level</th>
              <th>Count</th>
              <th>Percentage</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="severity-critical">🔴 Critical</td>
              <td>${severityBreakdown.critical || 0}</td>
              <td>${((severityBreakdown.critical || 0) / totalVulnerabilities * 100 || 0).toFixed(1)}%</td>
              <td>Immediate Action Required</td>
            </tr>
            <tr>
              <td class="severity-high">🟠 High</td>
              <td>${severityBreakdown.high || 0}</td>
              <td>${((severityBreakdown.high || 0) / totalVulnerabilities * 100 || 0).toFixed(1)}%</td>
              <td>Urgent Attention Needed</td>
            </tr>
            <tr>
              <td class="severity-medium">🟡 Medium</td>
              <td>${severityBreakdown.medium || 0}</td>
              <td>${((severityBreakdown.medium || 0) / totalVulnerabilities * 100 || 0).toFixed(1)}%</td>
              <td>Plan Remediation</td>
            </tr>
            <tr>
              <td class="severity-low">🔵 Low</td>
              <td>${severityBreakdown.low || 0}</td>
              <td>${((severityBreakdown.low || 0) / totalVulnerabilities * 100 || 0).toFixed(1)}%</td>
              <td>Monitor & Review</td>
            </tr>
          </tbody>
        </table>

        ${threatIntel.cveList.length > 0 ? `
          <div class="threat-section">
            <h3>🔒 Threat Intelligence: Related CVEs</h3>
            <p style="margin: 15px 0;">
              The following CVE entries were identified as related to vulnerabilities in your scans:
            </p>
            <div style="margin-top: 15px;">
              ${threatIntel.cveList.map(cve => `<span class="cve-badge">${cve}</span>`).join('')}
            </div>
            <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
              <strong>Note:</strong> Visit <a href="https://nvd.nist.gov/" style="color: #06b6d4;">NIST NVD</a> 
              for detailed CVE information and mitigation strategies.
            </p>
          </div>
        ` : ''}

        <div class="page-break"></div>
        
        <h2>📁 Scan Details</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>File Name</th>
              <th>Language</th>
              <th>Score</th>
              <th>Issues</th>
              <th>Critical</th>
              <th>High</th>
            </tr>
          </thead>
          <tbody>
            ${scans.slice(0, 50).map(scan => {
              const vulns = scan.vulnerabilities || [];
              const critical = vulns.filter(v => v.severity === 'critical').length;
              const high = vulns.filter(v => v.severity === 'high').length;
              
              return `
                <tr>
                  <td>${format(new Date(scan.created_date), 'MMM d, yyyy HH:mm')}</td>
                  <td><strong>${scan.file_name}</strong></td>
                  <td>${scan.language || 'Unknown'}</td>
                  <td><strong style="color: ${scan.overall_score >= 80 ? '#10b981' : scan.overall_score >= 60 ? '#eab308' : '#ef4444'};">${scan.overall_score}</strong></td>
                  <td>${vulns.length}</td>
                  <td class="severity-critical">${critical}</td>
                  <td class="severity-high">${high}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>CyberScan</strong> - AI-Powered Security Analysis Platform</p>
          <p style="margin-top: 10px;">
            This comprehensive report provides actionable insights into your code security posture.<br/>
            Regular scanning and timely remediation are essential for maintaining secure applications.
          </p>
          <p style="margin-top: 15px; font-size: 11px;">
            Report ID: ${Date.now()} | Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
          </p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const generateComprehensiveCSV = () => {
    let csv = 'CyberScan Comprehensive Security Report\n';
    csv += `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
    csv += `Time Range: ${timeRange === 'all' ? 'All Time' : `Last ${timeRange} Days`}\n\n`;

    // Overall stats
    const totalScans = scans.length;
    const totalVulns = scans.reduce((sum, s) => sum + (s.vulnerabilities?.length || 0), 0);
    const avgScore = scans.length > 0
      ? (scans.reduce((sum, s) => sum + s.overall_score, 0) / scans.length).toFixed(1)
      : 0;

    csv += 'EXECUTIVE SUMMARY\n';
    csv += `Total Scans,${totalScans}\n`;
    csv += `Total Vulnerabilities,${totalVulns}\n`;
    csv += `Average Security Score,${avgScore}\n\n`;

    // Severity breakdown
    const severityBreakdown = scans.reduce((acc, scan) => {
      scan.vulnerabilities?.forEach(v => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
      });
      return acc;
    }, {});

    csv += 'SEVERITY DISTRIBUTION\n';
    csv += 'Severity,Count,Percentage\n';
    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      const count = severityBreakdown[severity] || 0;
      const pct = (count / totalVulns * 100 || 0).toFixed(1);
      csv += `${severity},${count},${pct}%\n`;
    });
    csv += '\n';

    // Detailed scan data
    csv += 'DETAILED SCAN DATA\n';
    csv += 'Date,File Name,Language,Security Score,Total Issues,Critical,High,Medium,Low,Scan Duration\n';
    scans.forEach(scan => {
      const vulns = scan.vulnerabilities || [];
      const critical = vulns.filter(v => v.severity === 'critical').length;
      const high = vulns.filter(v => v.severity === 'high').length;
      const medium = vulns.filter(v => v.severity === 'medium').length;
      const low = vulns.filter(v => v.severity === 'low').length;

      csv += `${format(new Date(scan.created_date), 'yyyy-MM-dd HH:mm:ss')},"${scan.file_name}",${scan.language || 'Unknown'},${scan.overall_score},${vulns.length},${critical},${high},${medium},${low},${scan.scan_duration}s\n`;
    });
    csv += '\n';

    // Vulnerability details
    csv += 'VULNERABILITY DETAILS\n';
    csv += 'Scan Date,File,Vulnerability,Severity,Description,Recommendation\n';
    scans.forEach(scan => {
      scan.vulnerabilities?.forEach(vuln => {
        csv += `${format(new Date(scan.created_date), 'yyyy-MM-dd HH:mm:ss')},"${scan.file_name}","${vuln.title}",${vuln.severity},"${vuln.description.replace(/"/g, '""')}","${vuln.recommendation.replace(/"/g, '""')}"\n`;
      });
    });

    // Create and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cyberscan-comprehensive-report-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-3">
      <Button
        onClick={generateComprehensivePDF}
        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-semibold"
      >
        <FileText className="w-4 h-4 mr-2" />
        Export Comprehensive PDF
      </Button>
      <Button
        onClick={generateComprehensiveCSV}
        variant="outline"
        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Export Comprehensive CSV
      </Button>
    </div>
  );
}