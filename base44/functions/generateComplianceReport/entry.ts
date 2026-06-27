import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return Response.json({ error_code: 'METHOD_NOT_ALLOWED', message: 'Use POST' }, { status: 405, headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);

    // Auth
    const authHeader = req.headers.get('Authorization') || '';
    const apiKey = authHeader.replace('Bearer ', '');
    if (!apiKey) return Response.json({ error_code: 'UNAUTHORIZED', message: 'Missing API key' }, { status: 401, headers: corsHeaders });

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(apiKey));
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const keys = await base44.asServiceRole.entities.ApiKey.filter({ key_hash: keyHash });
    if (!keys || keys.length === 0 || !keys[0].is_active) {
      return Response.json({ error_code: 'UNAUTHORIZED', message: 'Invalid API key' }, { status: 401, headers: corsHeaders });
    }
    const keyRecord = keys[0];

    const body = await req.json();
    const { framework, date_range_days, include_remediation } = body;
    const selectedFramework = framework || 'SOC2';
    const rangeDays = date_range_days || 30;

    // Fetch all scans for this API key within the date range
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays);

    const allScans = await base44.asServiceRole.entities.ScanRecord.filter({ api_key_id: keyRecord.id });
    const scansInRange = (allScans || []).filter(s => new Date(s.created_date) >= cutoff);

    // Parse all scan summaries
    let totalVulns = 0;
    let criticalVulns = 0;
    let highVulns = 0;
    let mediumVulns = 0;
    const allVulnerabilities = [];
    const scannedTargets = new Set();

    for (const scan of scansInRange) {
      try {
        const summary = JSON.parse(scan.summary || '{}');
        totalVulns += summary.total_vulnerabilities || 0;
        criticalVulns += summary.critical || 0;
        highVulns += summary.high || 0;
        mediumVulns += summary.medium || 0;
        scannedTargets.add(scan.target_identifier);

        if (summary.vulnerabilities) {
          for (const v of summary.vulnerabilities) {
            allVulnerabilities.push({
              ...v,
              scan_id: scan.scan_id,
              target: scan.target_identifier,
              scan_date: scan.created_date,
              scan_type: scan.scan_type
            });
          }
        }
      } catch {}
    }

    // CWE to compliance framework mapping
    const complianceMapping = {
      SOC2: {
        name: 'SOC 2 Type II',
        controls: {
          'CC6.1': { name: 'Logical and Physical Access Controls', cwes: ['CWE-306', 'CWE-798', 'CWE-942'] },
          'CC6.6': { name: 'Security of System Boundaries', cwes: ['CWE-89', 'CWE-79', 'CWE-78'] },
          'CC6.7': { name: 'Data Integrity and Confidentiality', cwes: ['CWE-22', 'CWE-502'] },
          'CC7.1': { name: 'Vulnerability Management', cwes: ['CWE-89', 'CWE-79', 'CWE-78', 'CWE-22', 'CWE-798'] },
          'CC7.2': { name: 'Security Event Monitoring', cwes: ['CWE-306'] }
        }
      },
      HIPAA: {
        name: 'HIPAA Security Rule',
        controls: {
          '164.312(a)(1)': { name: 'Access Control', cwes: ['CWE-306', 'CWE-798', 'CWE-942'] },
          '164.312(a)(2)(iv)': { name: 'Encryption and Decryption', cwes: ['CWE-798'] },
          '164.312(c)(1)': { name: 'Integrity Controls', cwes: ['CWE-89', 'CWE-79', 'CWE-78', 'CWE-502'] },
          '164.312(e)(1)': { name: 'Transmission Security', cwes: ['CWE-22', 'CWE-942'] }
        }
      },
      PCI_DSS: {
        name: 'PCI DSS v4.0',
        controls: {
          '6.2': { name: 'Secure Development', cwes: ['CWE-89', 'CWE-79', 'CWE-78', 'CWE-22', 'CWE-502'] },
          '6.3': { name: 'Vulnerability Management', cwes: ['CWE-89', 'CWE-79', 'CWE-78', 'CWE-798'] },
          '6.4': { name: 'Public-Facing Web Application Protection', cwes: ['CWE-79', 'CWE-942'] },
          '7.1': { name: 'Access Control', cwes: ['CWE-306', 'CWE-798'] },
          '8.3': { name: 'Authentication Management', cwes: ['CWE-798', 'CWE-306'] }
        }
      },
      OWASP: {
        name: 'OWASP Top 10 (2021)',
        controls: {
          'A01': { name: 'Broken Access Control', cwes: ['CWE-306', 'CWE-22'] },
          'A02': { name: 'Cryptographic Failures', cwes: ['CWE-798'] },
          'A03': { name: 'Injection', cwes: ['CWE-89', 'CWE-79', 'CWE-78'] },
          'A04': { name: 'Insecure Design', cwes: ['CWE-502'] },
          'A05': { name: 'Security Misconfiguration', cwes: ['CWE-942'] },
          'A08': { name: 'Software and Data Integrity', cwes: ['CWE-502'] }
        }
      }
    };

    const frameworkDef = complianceMapping[selectedFramework] || complianceMapping.SOC2;

    // Build control assessment
    const controlAssessment = [];
    const foundCWEs = new Set(allVulnerabilities.map(v => v.id));

    for (const [controlId, control] of Object.entries(frameworkDef.controls)) {
      const violations = control.cwes.filter(cwe => foundCWEs.has(cwe));
      const relatedVulns = allVulnerabilities.filter(v => control.cwes.includes(v.id));

      controlAssessment.push({
        control_id: controlId,
        control_name: control.name,
        status: violations.length === 0 ? 'COMPLIANT' : relatedVulns.some(v => v.severity === 'CRITICAL') ? 'NON_COMPLIANT' : 'AT_RISK',
        violation_count: relatedVulns.length,
        violations: violations,
        affected_files: [...new Set(relatedVulns.map(v => v.file || v.target))],
        remediation_priority: violations.length === 0 ? 'NONE' : relatedVulns.some(v => v.severity === 'CRITICAL') ? 'IMMEDIATE' : 'SCHEDULED'
      });
    }

    const compliantCount = controlAssessment.filter(c => c.status === 'COMPLIANT').length;
    const totalControls = controlAssessment.length;
    const complianceScore = totalControls > 0 ? Math.round((compliantCount / totalControls) * 100) : 100;

    const report = {
      report_id: 'rpt_' + crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      framework: {
        id: selectedFramework,
        name: frameworkDef.name
      },
      period: {
        start: cutoff.toISOString(),
        end: new Date().toISOString(),
        days: rangeDays
      },
      summary: {
        compliance_score: complianceScore,
        total_controls_assessed: totalControls,
        compliant: compliantCount,
        at_risk: controlAssessment.filter(c => c.status === 'AT_RISK').length,
        non_compliant: controlAssessment.filter(c => c.status === 'NON_COMPLIANT').length,
        total_scans: scansInRange.length,
        unique_targets: scannedTargets.size,
        total_vulnerabilities: totalVulns,
        critical: criticalVulns,
        high: highVulns,
        medium: mediumVulns
      },
      controls: controlAssessment,
      audit_evidence: {
        scan_frequency: scansInRange.length > 0 ? `${scansInRange.length} scans over ${rangeDays} days` : 'No scans in period',
        last_scan_date: scansInRange.length > 0 ? scansInRange[scansInRange.length - 1].created_date : null,
        targets_scanned: [...scannedTargets],
        scanner_version: 'CodeGuard API v1.0.0',
        methodology: 'Static Application Security Testing (SAST) via pattern-based vulnerability detection with CWE classification'
      }
    };

    if (include_remediation) {
      report.remediation_plan = allVulnerabilities
        .filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH')
        .map(v => ({
          vulnerability: v.name || v.id,
          severity: v.severity,
          file: v.file || v.target,
          cwe: v.id,
          recommendation: v.recommendation || `Address ${v.id} vulnerability`,
          deadline: v.severity === 'CRITICAL' ? '48 hours' : '2 weeks',
          compliance_impact: controlAssessment
            .filter(c => c.violations.includes(v.id))
            .map(c => `${c.control_id}: ${c.control_name}`)
        }));
    }

    // Log usage
    await base44.asServiceRole.entities.UsageLog.create({
      api_key_id: keyRecord.id,
      scan_id: report.report_id,
      endpoint: '/api/v1/compliance/report',
      response_status: 200
    });

    return Response.json(report, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error_code: 'SERVER_ERROR', message: String(e) }, { status: 500, headers: corsHeaders });
  }
});