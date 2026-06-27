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
    if (!apiKey) return Response.json({ error_code: 'UNAUTHORIZED', message: 'Missing Authorization Bearer token' }, { status: 401, headers: corsHeaders });

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(apiKey));
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const keys = await base44.asServiceRole.entities.ApiKey.filter({ key_hash: keyHash });
    if (!keys || keys.length === 0 || !keys[0].is_active) {
      return Response.json({ error_code: 'UNAUTHORIZED', message: 'Invalid or deactivated API key' }, { status: 401, headers: corsHeaders });
    }
    const keyRecord = keys[0];

    // Rate limit
    const tiers = await base44.asServiceRole.entities.PricingTier.filter({ name: keyRecord.tier });
    const tier = tiers && tiers.length > 0 ? tiers[0] : { scan_limit_daily: 10 };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const logs = await base44.asServiceRole.entities.UsageLog.filter({ api_key_id: keyRecord.id });
    const todayCount = (logs || []).filter(l => new Date(l.created_date) >= today).length;
    if (todayCount >= tier.scan_limit_daily) {
      return Response.json({ error_code: 'RATE_LIMITED', message: 'Daily scan limit exceeded' }, { status: 429, headers: corsHeaders });
    }

    const body = await req.json();
    const { repo_url, branch } = body;
    if (!repo_url) return Response.json({ error_code: 'BAD_REQUEST', message: 'repo_url is required' }, { status: 400, headers: corsHeaders });

    // Validate GitHub URL
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\/)?$/;
    if (!githubRegex.test(repo_url)) {
      return Response.json({ error_code: 'BAD_REQUEST', message: 'Invalid GitHub repository URL', details: 'URL must be a valid GitHub repo (e.g., https://github.com/owner/repo)' }, { status: 400, headers: corsHeaders });
    }

    // Extract owner/repo
    const parts = repo_url.replace(/\/$/, '').split('/');
    const repo = parts.pop();
    const owner = parts.pop();
    const targetBranch = branch || 'main';

    const scanId = 'scan_' + crypto.randomUUID();

    // Create initial scan record
    await base44.asServiceRole.entities.ScanRecord.create({
      scan_id: scanId,
      api_key_id: keyRecord.id,
      scan_type: 'repository',
      target_identifier: repo_url,
      status: 'scanning',
      summary: '',
      completed_at: ''
    });

    // Fetch repo tree from GitHub API
    let files = [];
    try {
      const treeResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`, {
        headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'CodeGuard-Scanner' }
      });
      if (!treeResp.ok) throw new Error(`GitHub API returned ${treeResp.status}`);
      const treeData = await treeResp.json();
      files = (treeData.tree || []).filter(f => f.type === 'blob' && /\.(js|ts|jsx|tsx|py|rb|php|java|go|rs|c|cpp|h|cs|swift|kt)$/i.test(f.path)).slice(0, 20);
    } catch (e) {
      // Update scan as failed
      const scans = await base44.asServiceRole.entities.ScanRecord.filter({ scan_id: scanId });
      if (scans && scans.length > 0) {
        await base44.asServiceRole.entities.ScanRecord.update(scans[0].id, { status: 'failed', summary: JSON.stringify({ error: String(e) }) });
      }
      return Response.json({ error_code: 'SCAN_FAILED', message: `Could not access repository: ${e}` }, { status: 400, headers: corsHeaders });
    }

    // Scan each file
    const allVulnerabilities = [];
    let filesScanned = 0;

    for (const file of files) {
      try {
        const contentResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${targetBranch}`, {
          headers: { 'Accept': 'application/vnd.github.v3.raw', 'User-Agent': 'CodeGuard-Scanner' }
        });
        if (!contentResp.ok) continue;
        const content = await contentResp.text();
        filesScanned++;

        // Run vulnerability checks
        const checks = [
          { pattern: /(\$\{.*\}|['"]?\s*\+\s*\w+\s*\+\s*['"]?).*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/i, id: 'CWE-89', name: 'SQL Injection', severity: 'CRITICAL' },
          { pattern: /innerHTML\s*=|dangerouslySetInnerHTML|document\.write\(|eval\(/i, id: 'CWE-79', name: 'XSS', severity: 'HIGH' },
          { pattern: /(api[_-]?key|password|secret|token)\s*[:=]\s*['"][^'"]{8,}['"]/i, id: 'CWE-798', name: 'Hardcoded Credentials', severity: 'HIGH' },
          { pattern: /exec\(|spawn\(|system\(|child_process|os\.system/i, id: 'CWE-78', name: 'Command Injection', severity: 'CRITICAL' },
          { pattern: /\.\.\//g, id: 'CWE-22', name: 'Path Traversal', severity: 'HIGH' },
        ];

        for (const check of checks) {
          if (check.pattern.test(content)) {
            allVulnerabilities.push({ id: check.id, name: check.name, severity: check.severity, file: file.path });
          }
        }
      } catch { continue; }
    }

    const summary = {
      repository: repo_url,
      branch: targetBranch,
      files_scanned: filesScanned,
      total_files: files.length,
      total_vulnerabilities: allVulnerabilities.length,
      critical: allVulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      high: allVulnerabilities.filter(v => v.severity === 'HIGH').length,
      medium: allVulnerabilities.filter(v => v.severity === 'MEDIUM').length,
      vulnerabilities: allVulnerabilities,
      scanned_at: new Date().toISOString()
    };

    // Update scan record
    const scans = await base44.asServiceRole.entities.ScanRecord.filter({ scan_id: scanId });
    if (scans && scans.length > 0) {
      await base44.asServiceRole.entities.ScanRecord.update(scans[0].id, {
        status: 'completed',
        summary: JSON.stringify(summary),
        completed_at: new Date().toISOString()
      });
    }

    // Log usage
    await base44.asServiceRole.entities.UsageLog.create({ api_key_id: keyRecord.id, scan_id: scanId, endpoint: '/api/v1/scan/repository', response_status: 200 });
    await base44.asServiceRole.entities.ApiKey.update(keyRecord.id, { last_used_at: new Date().toISOString() });

    return Response.json({ scan_id: scanId, status: 'completed', results: summary }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error_code: 'SERVER_ERROR', message: String(e) }, { status: 500, headers: corsHeaders });
  }
});