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

    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization') || '';
    const apiKey = authHeader.replace('Bearer ', '');
    if (!apiKey) return Response.json({ error_code: 'UNAUTHORIZED', message: 'Missing Authorization Bearer token' }, { status: 401, headers: corsHeaders });

    // Hash and authenticate
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(apiKey));
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const keys = await base44.asServiceRole.entities.ApiKey.filter({ key_hash: keyHash });
    if (!keys || keys.length === 0 || !keys[0].is_active) {
      return Response.json({ error_code: 'UNAUTHORIZED', message: 'Invalid or deactivated API key' }, { status: 401, headers: corsHeaders });
    }
    const keyRecord = keys[0];

    // Check rate limit
    const tiers = await base44.asServiceRole.entities.PricingTier.filter({ name: keyRecord.tier });
    const tier = tiers && tiers.length > 0 ? tiers[0] : { scan_limit_daily: 10 };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const logs = await base44.asServiceRole.entities.UsageLog.filter({ api_key_id: keyRecord.id });
    const todayCount = (logs || []).filter(l => new Date(l.created_date) >= today).length;
    if (todayCount >= tier.scan_limit_daily) {
      return Response.json({ error_code: 'RATE_LIMITED', message: `Daily scan limit (${tier.scan_limit_daily}) exceeded`, details: 'Upgrade your tier for more scans' }, { status: 429, headers: { ...corsHeaders, 'Retry-After': '86400' } });
    }

    // Parse request body
    const body = await req.json();
    const { code, language, filename } = body;
    if (!code) return Response.json({ error_code: 'BAD_REQUEST', message: 'code field is required' }, { status: 400, headers: corsHeaders });

    // Generate scan ID
    const scanId = 'scan_' + crypto.randomUUID();

    // Perform security analysis using pattern matching
    const vulnerabilities = [];
    const codeStr = code.toString();

    // SQL Injection patterns
    if (/(\$\{.*\}|['"]?\s*\+\s*\w+\s*\+\s*['"]?).*(?:SELECT|INSERT|UPDATE|DELETE|DROP|EXEC|UNION)/i.test(codeStr)) {
      vulnerabilities.push({ id: 'CWE-89', name: 'SQL Injection', severity: 'CRITICAL', description: 'Possible SQL injection via string concatenation or template literals', recommendation: 'Use parameterized queries or prepared statements', line_hint: 'Check string concatenation in SQL queries' });
    }

    // XSS patterns
    if (/innerHTML\s*=|dangerouslySetInnerHTML|document\.write\(|\.html\(.*\$|eval\(/i.test(codeStr)) {
      vulnerabilities.push({ id: 'CWE-79', name: 'Cross-Site Scripting (XSS)', severity: 'HIGH', description: 'Possible XSS via unsafe DOM manipulation or eval', recommendation: 'Use textContent instead of innerHTML, avoid eval()', line_hint: 'Check innerHTML or eval usage' });
    }

    // Hardcoded secrets
    if (/(api[_-]?key|password|secret|token|private[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/i.test(codeStr)) {
      vulnerabilities.push({ id: 'CWE-798', name: 'Hardcoded Credentials', severity: 'HIGH', description: 'Possible hardcoded API key, password, or secret detected', recommendation: 'Use environment variables or a secrets manager', line_hint: 'Check for hardcoded credential assignments' });
    }

    // Command injection
    if (/exec\(|spawn\(|system\(|child_process|subprocess|os\.system|os\.popen/i.test(codeStr)) {
      vulnerabilities.push({ id: 'CWE-78', name: 'OS Command Injection', severity: 'CRITICAL', description: 'Possible command injection via system command execution', recommendation: 'Validate and sanitize all inputs passed to system commands', line_hint: 'Check exec/spawn/system calls' });
    }

    // Path traversal
    if (/\.\.\//g.test(codeStr) || /path\.(join|resolve)\(.*req\./i.test(codeStr)) {
      vulnerabilities.push({ id: 'CWE-22', name: 'Path Traversal', severity: 'HIGH', description: 'Possible path traversal via unsanitized file path input', recommendation: 'Validate and normalize file paths, restrict to allowed directories', line_hint: 'Check file path handling' });
    }

    // Insecure deserialization
    if (/JSON\.parse\(.*req\.|pickle\.loads|yaml\.load\(|unserialize\(/i.test(codeStr)) {
      vulnerabilities.push({ id: 'CWE-502', name: 'Insecure Deserialization', severity: 'MEDIUM', description: 'Possible insecure deserialization of user input', recommendation: 'Validate input before deserialization, use safe parsers', line_hint: 'Check deserialization of user-controlled data' });
    }

    // Missing authentication checks
    if (/app\.(get|post|put|delete|patch)\s*\(\s*['"]\/(?!auth|login|register|public)/i.test(codeStr) && !/middleware|isAuthenticated|requireAuth|verifyToken/i.test(codeStr)) {
      vulnerabilities.push({ id: 'CWE-306', name: 'Missing Authentication', severity: 'MEDIUM', description: 'API endpoints may lack authentication middleware', recommendation: 'Add authentication middleware to protected routes', line_hint: 'Check route definitions for auth middleware' });
    }

    // CORS misconfiguration
    if (/Access-Control-Allow-Origin.*\*/i.test(codeStr) && /credentials/i.test(codeStr)) {
      vulnerabilities.push({ id: 'CWE-942', name: 'CORS Misconfiguration', severity: 'MEDIUM', description: 'Wildcard CORS with credentials enabled', recommendation: 'Restrict CORS origins instead of using wildcard with credentials', line_hint: 'Check CORS configuration' });
    }

    const summary = {
      total_vulnerabilities: vulnerabilities.length,
      critical: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      high: vulnerabilities.filter(v => v.severity === 'HIGH').length,
      medium: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
      low: vulnerabilities.filter(v => v.severity === 'LOW').length,
      language: language || 'auto-detected',
      filename: filename || 'inline',
      vulnerabilities,
      scanned_at: new Date().toISOString()
    };

    // Save scan record
    await base44.asServiceRole.entities.ScanRecord.create({
      scan_id: scanId,
      api_key_id: keyRecord.id,
      scan_type: 'snippet',
      target_identifier: filename || 'inline-code',
      status: 'completed',
      summary: JSON.stringify(summary),
      completed_at: new Date().toISOString()
    });

    // Log usage
    await base44.asServiceRole.entities.UsageLog.create({
      api_key_id: keyRecord.id,
      scan_id: scanId,
      endpoint: '/api/v1/scan/code',
      response_status: 200
    });

    // Update last used
    await base44.asServiceRole.entities.ApiKey.update(keyRecord.id, { last_used_at: new Date().toISOString() });

    return Response.json({ scan_id: scanId, status: 'completed', results: summary }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error_code: 'SERVER_ERROR', message: String(e) }, { status: 500, headers: corsHeaders });
  }
});