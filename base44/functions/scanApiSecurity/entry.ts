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

    // Rate limit
    const tiers = await base44.asServiceRole.entities.PricingTier.filter({ name: keyRecord.tier });
    const tier = tiers && tiers.length > 0 ? tiers[0] : { scan_limit_daily: 10 };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const logs = await base44.asServiceRole.entities.UsageLog.filter({ api_key_id: keyRecord.id });
    const todayCount = (logs || []).filter(l => new Date(l.created_date) >= today).length;
    if (todayCount >= tier.scan_limit_daily) {
      return Response.json({ error_code: 'RATE_LIMITED', message: 'Daily limit exceeded' }, { status: 429, headers: corsHeaders });
    }

    const body = await req.json();
    const { api_code, openapi_spec, endpoint_url } = body;

    if (!api_code && !openapi_spec && !endpoint_url) {
      return Response.json({ error_code: 'BAD_REQUEST', message: 'Provide api_code, openapi_spec, or endpoint_url' }, { status: 400, headers: corsHeaders });
    }

    const scanId = 'scan_' + crypto.randomUUID();
    const vulnerabilities = [];
    const codeToScan = api_code || openapi_spec || '';

    // OWASP API Security Top 10 checks

    // API1: Broken Object Level Authorization (BOLA)
    if (/req\.(params|query)\.(id|userId|user_id)/i.test(codeToScan) && !/authorize|permission|ownership|isOwner|checkAccess/i.test(codeToScan)) {
      vulnerabilities.push({
        id: 'API1:2023',
        owasp_category: 'Broken Object Level Authorization',
        severity: 'CRITICAL',
        description: 'API endpoint accesses resources by user-supplied ID without verifying the requester owns or has permission to access the resource',
        recommendation: 'Implement object-level authorization checks. Verify the authenticated user has permission to access the requested resource before returning data.',
        cwe: 'CWE-639'
      });
    }

    // API2: Broken Authentication
    if (/app\.(get|post|put|delete|patch)\s*\(/i.test(codeToScan) && !/jwt|bearer|token|session|passport|auth|middleware/i.test(codeToScan)) {
      vulnerabilities.push({
        id: 'API2:2023',
        owasp_category: 'Broken Authentication',
        severity: 'CRITICAL',
        description: 'API endpoints appear to lack authentication mechanisms',
        recommendation: 'Implement authentication middleware (JWT, OAuth2, API keys) on all non-public endpoints.',
        cwe: 'CWE-306'
      });
    }

    // API3: Broken Object Property Level Authorization
    if (/Object\.assign|spread.*req\.body|\{\.\.\.req\.body\}|merge.*req/i.test(codeToScan)) {
      vulnerabilities.push({
        id: 'API3:2023',
        owasp_category: 'Broken Object Property Level Authorization',
        severity: 'HIGH',
        description: 'Mass assignment vulnerability — user input is directly spread/merged into data objects without field filtering',
        recommendation: 'Whitelist allowed fields explicitly. Never spread user input directly into database updates.',
        cwe: 'CWE-915'
      });
    }

    // API4: Unrestricted Resource Consumption
    if (!/rateLimit|rate.limit|throttle|express-rate-limit/i.test(codeToScan) && /app\.(get|post|put|delete)/i.test(codeToScan)) {
      vulnerabilities.push({
        id: 'API4:2023',
        owasp_category: 'Unrestricted Resource Consumption',
        severity: 'MEDIUM',
        description: 'No rate limiting detected on API endpoints, making them vulnerable to DoS and brute force attacks',
        recommendation: 'Implement rate limiting middleware (e.g., express-rate-limit) with appropriate thresholds per endpoint.',
        cwe: 'CWE-770'
      });
    }

    // API5: Broken Function Level Authorization
    if (/\/(admin|internal|debug|management)/i.test(codeToScan) && !/isAdmin|role.*admin|adminOnly|requireAdmin/i.test(codeToScan)) {
      vulnerabilities.push({
        id: 'API5:2023',
        owasp_category: 'Broken Function Level Authorization',
        severity: 'CRITICAL',
        description: 'Admin/internal endpoints may lack role-based access control',
        recommendation: 'Implement role-based access control (RBAC). Verify the user has the required role before processing admin/internal requests.',
        cwe: 'CWE-285'
      });
    }

    // API6: Unrestricted Access to Sensitive Business Flows
    if (/(payment|checkout|transfer|withdraw|purchase)/i.test(codeToScan) && !/captcha|recaptcha|verify|confirmation|2fa|mfa/i.test(codeToScan)) {
      vulnerabilities.push({
        id: 'API6:2023',
        owasp_category: 'Unrestricted Access to Sensitive Business Flows',
        severity: 'HIGH',
        description: 'Sensitive business operations (payments, transfers) lack additional verification steps',
        recommendation: 'Add CAPTCHA, multi-factor authentication, or confirmation steps to sensitive business flows.',
        cwe: 'CWE-799'
      });
    }

    // API7: Server Side Request Forgery (SSRF)
    if (/fetch\(.*req\.|axios\(.*req\.|http\.get\(.*req\.|url.*=.*req\./i.test(codeToScan)) {
      vulnerabilities.push({
        id: 'API7:2023',
        owasp_category: 'Server-Side Request Forgery',
        severity: 'HIGH',
        description: 'User-supplied URLs are passed directly to server-side HTTP requests, enabling SSRF attacks',
        recommendation: 'Validate and whitelist allowed URLs/domains. Never pass user input directly as fetch/request URLs.',
        cwe: 'CWE-918'
      });
    }

    // API8: Security Misconfiguration
    if (/Access-Control-Allow-Origin.*\*/i.test(codeToScan)) {
      vulnerabilities.push({
        id: 'API8:2023',
        owasp_category: 'Security Misconfiguration',
        severity: 'MEDIUM',
        description: 'Wildcard CORS configuration allows any origin to access the API',
        recommendation: 'Restrict CORS to specific trusted domains instead of using wildcard (*).',
        cwe: 'CWE-942'
      });
    }

    // API9: Improper Inventory Management
    if (/\/v1\/|\/v2\/|\/api\/|\/beta\/|\/test\//i.test(codeToScan) && /deprecated|legacy|old|v1/i.test(codeToScan)) {
      vulnerabilities.push({
        id: 'API9:2023',
        owasp_category: 'Improper Inventory Management',
        severity: 'LOW',
        description: 'Deprecated or legacy API versions detected that may still be accessible',
        recommendation: 'Maintain an API inventory. Deprecate and remove old API versions. Use API gateway to manage versioning.',
        cwe: 'CWE-1059'
      });
    }

    // API10: Unsafe Consumption of APIs
    if (/fetch\(|axios\.|http\.(get|post)/i.test(codeToScan) && !/try.*catch|\.catch|error.*handling/i.test(codeToScan)) {
      vulnerabilities.push({
        id: 'API10:2023',
        owasp_category: 'Unsafe Consumption of APIs',
        severity: 'MEDIUM',
        description: 'External API calls lack proper error handling and response validation',
        recommendation: 'Validate all responses from external APIs. Implement proper error handling, timeouts, and circuit breakers.',
        cwe: 'CWE-20'
      });
    }

    // Additional: SQL injection in API context
    if (/(\$\{|['"]?\s*\+\s*\w+\s*\+\s*['"]?).*(?:SELECT|INSERT|UPDATE|DELETE|WHERE)/i.test(codeToScan)) {
      vulnerabilities.push({
        id: 'CWE-89',
        owasp_category: 'Injection (API3 2021)',
        severity: 'CRITICAL',
        description: 'SQL injection via string concatenation in API handler',
        recommendation: 'Use parameterized queries or an ORM. Never concatenate user input into SQL strings.',
        cwe: 'CWE-89'
      });
    }

    // Sensitive data exposure
    if (/(password|ssn|social_security|credit_card|card_number).*(?:res\.json|res\.send|return.*Response)/i.test(codeToScan)) {
      vulnerabilities.push({
        id: 'CWE-200',
        owasp_category: 'Sensitive Data Exposure',
        severity: 'HIGH',
        description: 'Sensitive data fields may be returned in API responses without filtering',
        recommendation: 'Never return sensitive fields (passwords, SSNs, full card numbers) in API responses. Use response DTOs.',
        cwe: 'CWE-200'
      });
    }

    const summary = {
      scan_type: 'api_security',
      owasp_api_top10_coverage: true,
      total_vulnerabilities: vulnerabilities.length,
      critical: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      high: vulnerabilities.filter(v => v.severity === 'HIGH').length,
      medium: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
      low: vulnerabilities.filter(v => v.severity === 'LOW').length,
      vulnerabilities,
      scanned_at: new Date().toISOString()
    };

    // Save scan record
    await base44.asServiceRole.entities.ScanRecord.create({
      scan_id: scanId,
      api_key_id: keyRecord.id,
      scan_type: 'snippet',
      target_identifier: 'api-security-scan',
      status: 'completed',
      summary: JSON.stringify(summary),
      completed_at: new Date().toISOString()
    });

    await base44.asServiceRole.entities.UsageLog.create({
      api_key_id: keyRecord.id,
      scan_id: scanId,
      endpoint: '/api/v1/scan/api-security',
      response_status: 200
    });

    await base44.asServiceRole.entities.ApiKey.update(keyRecord.id, { last_used_at: new Date().toISOString() });

    return Response.json({ scan_id: scanId, status: 'completed', results: summary }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error_code: 'SERVER_ERROR', message: String(e) }, { status: 500, headers: corsHeaders });
  }
});