import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

export default function AnalyticsReport({ scans, metrics }) {
  const generateAnalyticsCSV = () => {
    let csv = 'CyberScan Analytics Report\n\n';
    csv += `Generated Date,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n\n`;

    // Overall Statistics
    const totalScans = scans.length;
    const totalVulnerabilities = metrics.reduce((sum, m) => sum + m.count, 0);
    const criticalVulns = metrics.filter(m => m.severity === 'critical').reduce((sum, m) => sum + m.count, 0);
    const highVulns = metrics.filter(m => m.severity === 'high').reduce((sum, m) => sum + m.count, 0);
    const mediumVulns = metrics.filter(m => m.severity === 'medium').reduce((sum, m) => sum + m.count, 0);
    const lowVulns = metrics.filter(m => m.severity === 'low').reduce((sum, m) => sum + m.count, 0);
    const avgScore = scans.length > 0
      ? (scans.reduce((sum, s) => sum + s.overall_score, 0) / scans.length).toFixed(1)
      : 0;

    csv += 'Overall Statistics\n';
    csv += `Total Scans,${totalScans}\n`;
    csv += `Total Vulnerabilities,${totalVulnerabilities}\n`;
    csv += `Critical Issues,${criticalVulns}\n`;
    csv += `High Issues,${highVulns}\n`;
    csv += `Medium Issues,${mediumVulns}\n`;
    csv += `Low Issues,${lowVulns}\n`;
    csv += `Average Security Score,${avgScore}\n\n`;

    // Top Vulnerabilities
    const vulnTypes = metrics.reduce((acc, metric) => {
      const existing = acc.find(item => item.type === metric.vulnerability_type);
      if (existing) {
        existing.count += metric.count;
      } else {
        acc.push({
          type: metric.vulnerability_type,
          count: metric.count
        });
      }
      return acc;
    }, []).sort((a, b) => b.count - a.count).slice(0, 10);

    csv += 'Top 10 Vulnerabilities\n';
    csv += 'Rank,Vulnerability Type,Count\n';
    vulnTypes.forEach((vuln, index) => {
      csv += `${index + 1},"${vuln.type}",${vuln.count}\n`;
    });
    csv += '\n';

    // Language Breakdown
    const languageData = metrics.reduce((acc, metric) => {
      const existing = acc.find(item => item.language === metric.language);
      if (existing) {
        existing.vulnerabilities += metric.count;
        existing.scans += 1;
      } else {
        acc.push({
          language: metric.language,
          vulnerabilities: metric.count,
          scans: 1
        });
      }
      return acc;
    }, []).sort((a, b) => b.vulnerabilities - a.vulnerabilities);

    csv += 'Language Breakdown\n';
    csv += 'Language,Scans,Vulnerabilities\n';
    languageData.forEach(lang => {
      csv += `${lang.language},${lang.scans},${lang.vulnerabilities}\n`;
    });
    csv += '\n';

    // Scan History
    csv += 'Scan History\n';
    csv += 'Date,File Name,Language,Security Score,Total Vulnerabilities,Critical,High,Medium,Low\n';
    scans.forEach(scan => {
      const vulns = scan.vulnerabilities || [];
      const critical = vulns.filter(v => v.severity === 'critical').length;
      const high = vulns.filter(v => v.severity === 'high').length;
      const medium = vulns.filter(v => v.severity === 'medium').length;
      const low = vulns.filter(v => v.severity === 'low').length;

      csv += `${format(new Date(scan.created_date), 'yyyy-MM-dd HH:mm:ss')},"${scan.file_name}",${scan.language || 'Unknown'},${scan.overall_score},${vulns.length},${critical},${high},${medium},${low}\n`;
    });

    // Create and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cyberscan-analytics-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateAnalyticsPDF = () => {
    const printWindow = window.open('', '_blank');

    const totalScans = scans.length;
    const totalVulnerabilities = metrics.reduce((sum, m) => sum + m.count, 0);
    const criticalVulns = metrics.filter(m => m.severity === 'critical').reduce((sum, m) => sum + m.count, 0);
    const highVulns = metrics.filter(m => m.severity === 'high').reduce((sum, m) => sum + m.count, 0);
    const mediumVulns = metrics.filter(m => m.severity === 'medium').reduce((sum, m) => sum + m.count, 0);
    const lowVulns = metrics.filter(m => m.severity === 'low').reduce((sum, m) => sum + m.count, 0);
    const avgScore = scans.length > 0
      ? (scans.reduce((sum, s) => sum + s.overall_score, 0) / scans.length).toFixed(1)
      : 0;

    const vulnTypes = metrics.reduce((acc, metric) => {
      const existing = acc.find(item => item.type === metric.vulnerability_type);
      if (existing) {
        existing.count += metric.count;
      } else {
        acc.push({
          type: metric.vulnerability_type,
          count: metric.count
        });
      }
      return acc;
    }, []).sort((a, b) => b.count - a.count).slice(0, 10);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>CyberScan Analytics Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: #ffffff;
            color: #1e293b;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #06b6d4;
          }
          .logo {
            font-size: 36px;
            font-weight: bold;
            color: #06b6d4;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #64748b;
            font-size: 14px;
          }
          h2 {
            color: #0f172a;
            margin: 30px 0 20px 0;
            font-size: 24px;
            border-left: 4px solid #06b6d4;
            padding-left: 15px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e2e8f0;
          }
          .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #06b6d4;
            margin-bottom: 5px;
          }
          .stat-label {
            color: #64748b;
            font-size: 14px;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          th {
            background: #f8fafc;
            font-weight: 600;
            color: #475569;
          }
          tr:hover {
            background: #f8fafc;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">📊 CyberScan Analytics</div>
          <div class="subtitle">Comprehensive Security Metrics Report</div>
          <p style="margin-top: 10px; color: #64748b;">Generated: ${format(new Date(), 'PPpp')}</p>
        </div>

        <h2>Overall Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${totalScans}</div>
            <div class="stat-label">Total Scans</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalVulnerabilities}</div>
            <div class="stat-label">Total Vulnerabilities</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #ef4444;">${criticalVulns}</div>
            <div class="stat-label">Critical Issues</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #10b981;">${avgScore}</div>
            <div class="stat-label">Avg Security Score</div>
          </div>
        </div>

        <h2>Severity Breakdown</h2>
        <table>
          <tr>
            <th>Severity</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
          <tr>
            <td style="color: #ef4444; font-weight: 600;">Critical</td>
            <td>${criticalVulns}</td>
            <td>${((criticalVulns / totalVulnerabilities) * 100 || 0).toFixed(1)}%</td>
          </tr>
          <tr>
            <td style="color: #f97316; font-weight: 600;">High</td>
            <td>${highVulns}</td>
            <td>${((highVulns / totalVulnerabilities) * 100 || 0).toFixed(1)}%</td>
          </tr>
          <tr>
            <td style="color: #eab308; font-weight: 600;">Medium</td>
            <td>${mediumVulns}</td>
            <td>${((mediumVulns / totalVulnerabilities) * 100 || 0).toFixed(1)}%</td>
          </tr>
          <tr>
            <td style="color: #3b82f6; font-weight: 600;">Low</td>
            <td>${lowVulns}</td>
            <td>${((lowVulns / totalVulnerabilities) * 100 || 0).toFixed(1)}%</td>
          </tr>
        </table>

        <h2>Top 10 Vulnerabilities</h2>
        <table>
          <tr>
            <th>Rank</th>
            <th>Vulnerability Type</th>
            <th>Occurrences</th>
          </tr>
          ${vulnTypes.map((vuln, index) => `
            <tr>
              <td><strong>${index + 1}</strong></td>
              <td>${vuln.type}</td>
              <td>${vuln.count}</td>
            </tr>
          `).join('')}
        </table>

        <h2>Recent Scan History</h2>
        <table>
          <tr>
            <th>Date</th>
            <th>File Name</th>
            <th>Language</th>
            <th>Score</th>
            <th>Issues</th>
          </tr>
          ${scans.slice(0, 20).map(scan => `
            <tr>
              <td>${format(new Date(scan.created_date), 'MMM d, yyyy HH:mm')}</td>
              <td>${scan.file_name}</td>
              <td>${scan.language || 'Unknown'}</td>
              <td><strong>${scan.overall_score}</strong></td>
              <td>${scan.vulnerabilities?.length || 0}</td>
            </tr>
          `).join('')}
        </table>

        <div class="footer">
          <p>CyberScan - AI-Powered Security Analysis</p>
          <p>This analytics report provides insights into security trends and patterns</p>
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

  return (
    <div className="flex gap-3">
      <Button
        onClick={generateAnalyticsPDF}
        variant="outline"
        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
      >
        <FileText className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
      <Button
        onClick={generateAnalyticsCSV}
        variant="outline"
        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}