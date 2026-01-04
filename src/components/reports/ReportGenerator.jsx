import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function ReportGenerator({ scanData }) {
  const printRef = useRef();

  const generateCSV = () => {
    const { file_name, language, overall_score, vulnerabilities, scan_duration, created_date } = scanData;
    
    // CSV Header
    let csv = 'CyberScan Security Report\n\n';
    csv += 'Report Information\n';
    csv += `Generated Date,${format(new Date(created_date || Date.now()), 'yyyy-MM-dd HH:mm:ss')}\n`;
    csv += `File Name,${file_name}\n`;
    csv += `Language,${language || 'Unknown'}\n`;
    csv += `Overall Security Score,${overall_score}/100\n`;
    csv += `Scan Duration,${scan_duration}s\n`;
    csv += `Total Vulnerabilities,${vulnerabilities?.length || 0}\n\n`;

    // Severity Summary
    const criticalCount = vulnerabilities?.filter(v => v.severity === 'critical').length || 0;
    const highCount = vulnerabilities?.filter(v => v.severity === 'high').length || 0;
    const mediumCount = vulnerabilities?.filter(v => v.severity === 'medium').length || 0;
    const lowCount = vulnerabilities?.filter(v => v.severity === 'low').length || 0;

    csv += 'Severity Summary\n';
    csv += `Critical,${criticalCount}\n`;
    csv += `High,${highCount}\n`;
    csv += `Medium,${mediumCount}\n`;
    csv += `Low,${lowCount}\n\n`;

    // Vulnerabilities Details
    csv += 'Vulnerability Details\n';
    csv += 'No.,Title,Severity,Line Number,Description,Recommendation\n';
    
    vulnerabilities?.forEach((vuln, index) => {
      const title = `"${(vuln.title || '').replace(/"/g, '""')}"`;
      const description = `"${(vuln.description || '').replace(/"/g, '""')}"`;
      const recommendation = `"${(vuln.recommendation || '').replace(/"/g, '""')}"`;
      const lineNumber = vuln.line_number || 'N/A';
      
      csv += `${index + 1},${title},${vuln.severity},${lineNumber},${description},${recommendation}\n`;
    });

    // Create and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cyberscan-report-${file_name}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    const { file_name, language, overall_score, vulnerabilities, scan_duration, created_date } = scanData;

    const criticalCount = vulnerabilities?.filter(v => v.severity === 'critical').length || 0;
    const highCount = vulnerabilities?.filter(v => v.severity === 'high').length || 0;
    const mediumCount = vulnerabilities?.filter(v => v.severity === 'medium').length || 0;
    const lowCount = vulnerabilities?.filter(v => v.severity === 'low').length || 0;

    const getScoreColor = (score) => {
      if (score >= 80) return '#10b981';
      if (score >= 60) return '#eab308';
      if (score >= 40) return '#f97316';
      return '#ef4444';
    };

    const getSeverityColor = (severity) => {
      const colors = {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#eab308',
        low: '#3b82f6'
      };
      return colors[severity] || '#6b7280';
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>CyberScan Security Report - ${file_name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
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
          .report-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #06b6d4;
          }
          .report-info h2 {
            color: #0f172a;
            margin-bottom: 15px;
            font-size: 20px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-label {
            font-weight: 600;
            color: #475569;
          }
          .info-value {
            color: #0f172a;
            font-weight: 500;
          }
          .score-section {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .score-circle {
            display: inline-block;
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            font-weight: bold;
            color: ${getScoreColor(overall_score)};
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 15px;
          }
          .severity-summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .severity-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .severity-count {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .severity-label {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .vulnerabilities {
            margin-top: 30px;
          }
          .vulnerability {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .vuln-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f1f5f9;
          }
          .vuln-title {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            flex: 1;
          }
          .vuln-severity {
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            color: white;
          }
          .vuln-section {
            margin-bottom: 15px;
          }
          .vuln-section-title {
            font-weight: 600;
            color: #475569;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .vuln-section-content {
            color: #64748b;
            line-height: 1.6;
          }
          .code-block {
            background: #0f172a;
            color: #ef4444;
            padding: 15px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            overflow-x: auto;
            margin: 10px 0;
          }
          .recommendation {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px;
            border-radius: 4px;
            color: #166534;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
          h2 {
            color: #0f172a;
            margin: 30px 0 20px 0;
            font-size: 24px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🛡️ CyberScan</div>
          <div class="subtitle">AI-Powered Security Analysis Report</div>
        </div>

        <div class="report-info">
          <h2>Report Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Generated:</span>
              <span class="info-value">${format(new Date(created_date || Date.now()), 'PPpp')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">File Name:</span>
              <span class="info-value">${file_name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Language:</span>
              <span class="info-value">${language || 'Unknown'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Scan Duration:</span>
              <span class="info-value">${scan_duration}s</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Issues:</span>
              <span class="info-value">${vulnerabilities?.length || 0}</span>
            </div>
          </div>
        </div>

        <div class="score-section">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div class="score-circle">${overall_score}</div>
            <h3 style="color: #0f172a; margin-bottom: 5px;">Overall Security Score</h3>
            <p style="color: #64748b;">Out of 100</p>
          </div>
        </div>

        <h2>Severity Distribution</h2>
        <div class="severity-summary">
          <div class="severity-card">
            <div class="severity-count" style="color: #ef4444;">${criticalCount}</div>
            <div class="severity-label" style="color: #ef4444;">Critical</div>
          </div>
          <div class="severity-card">
            <div class="severity-count" style="color: #f97316;">${highCount}</div>
            <div class="severity-label" style="color: #f97316;">High</div>
          </div>
          <div class="severity-card">
            <div class="severity-count" style="color: #eab308;">${mediumCount}</div>
            <div class="severity-label" style="color: #eab308;">Medium</div>
          </div>
          <div class="severity-card">
            <div class="severity-count" style="color: #3b82f6;">${lowCount}</div>
            <div class="severity-label" style="color: #3b82f6;">Low</div>
          </div>
        </div>

        <h2>Detailed Findings</h2>
        <div class="vulnerabilities">
          ${vulnerabilities && vulnerabilities.length > 0 ? vulnerabilities.map((vuln, index) => `
            <div class="vulnerability">
              <div class="vuln-header">
                <div class="vuln-title">${index + 1}. ${vuln.title}</div>
                <div class="vuln-severity" style="background-color: ${getSeverityColor(vuln.severity)}">
                  ${vuln.severity}
                </div>
              </div>
              
              ${vuln.line_number ? `
                <div class="vuln-section">
                  <div class="vuln-section-title">📍 Location:</div>
                  <div class="vuln-section-content">Line ${vuln.line_number}</div>
                </div>
              ` : ''}

              <div class="vuln-section">
                <div class="vuln-section-title">📋 Description:</div>
                <div class="vuln-section-content">${vuln.description}</div>
              </div>

              ${vuln.code_example ? `
                <div class="vuln-section">
                  <div class="vuln-section-title">💻 Vulnerable Code:</div>
                  <div class="code-block">${vuln.code_example.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                </div>
              ` : ''}

              <div class="vuln-section">
                <div class="vuln-section-title">✅ Recommendation:</div>
                <div class="recommendation">${vuln.recommendation}</div>
              </div>
            </div>
          `).join('') : '<p style="text-align: center; color: #64748b; padding: 40px;">No vulnerabilities detected.</p>'}
        </div>

        <div class="footer">
          <p>This report was generated by CyberScan - AI-Powered Security Analysis</p>
          <p>Report generated on ${format(new Date(), 'PPpp')}</p>
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
        onClick={generatePDF}
        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold"
      >
        <FileText className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
      <Button
        onClick={generateCSV}
        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}