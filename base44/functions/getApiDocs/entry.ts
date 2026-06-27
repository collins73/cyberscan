Deno.serve(async (req) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const docs = {
    name: "CodeGuard Security API",
    version: "1.0.0",
    base_url: "https://cyber-security-code-scan.base44.app/functions",
    description: "Security-as-a-Service API for scanning code snippets and GitHub repositories for vulnerabilities.",
    authentication: {
      type: "Bearer Token",
      header: "Authorization: Bearer <your_api_key>",
      description: "All endpoints require a valid API key. Generate one via the generateApiKey endpoint."
    },
    pricing_tiers: [
      { name: "Free", price: "$0/mo", scans_per_day: 10, description: "Basic vulnerability detection" },
      { name: "Pro", price: "$19.99/mo", scans_per_day: 100, description: "Included with RebelAgents subscription" },
      { name: "Enterprise", price: "$99.99/mo", scans_per_day: 1000, description: "Priority scanning + webhook support" }
    ],
    endpoints: [
      {
        path: "/generateApiKey",
        method: "POST",
        auth_required: false,
        summary: "Generate a new API key",
        request_body: { name: "string (required)", owner_email: "string (required)", tier: "string (optional: Free|Pro|Enterprise, default: Free)" },
        response: { api_key: "string (save this — shown only once)", key_id: "string", name: "string", tier: "string" },
        example: { request: { name: "My App", owner_email: "dev@example.com", tier: "Free" }, response: { api_key: "cg_abc123...", key_id: "id123", name: "My App", tier: "Free", warning: "Store this key securely." } }
      },
      {
        path: "/scanCodeApi",
        method: "POST",
        auth_required: true,
        summary: "Scan a code snippet for vulnerabilities",
        request_body: { code: "string (required)", language: "string (optional)", filename: "string (optional)" },
        response: { scan_id: "string", status: "completed", results: { total_vulnerabilities: "number", critical: "number", high: "number", medium: "number", low: "number", vulnerabilities: "array" } },
        vulnerability_checks: ["CWE-89 SQL Injection", "CWE-79 XSS", "CWE-798 Hardcoded Credentials", "CWE-78 Command Injection", "CWE-22 Path Traversal", "CWE-502 Insecure Deserialization", "CWE-306 Missing Authentication", "CWE-942 CORS Misconfiguration"]
      },
      {
        path: "/scanRepositoryApi",
        method: "POST",
        auth_required: true,
        summary: "Scan a public GitHub repository for vulnerabilities",
        request_body: { repo_url: "string (required, full GitHub URL)", branch: "string (optional, default: main)" },
        response: { scan_id: "string", status: "completed", results: { repository: "string", files_scanned: "number", total_vulnerabilities: "number", vulnerabilities: "array" } }
      },
      {
        path: "/getScanResults",
        method: "POST",
        auth_required: true,
        summary: "Get results for a specific scan",
        request_body: { scan_id: "string (required)" },
        response: { scan_id: "string", scan_type: "string", target: "string", status: "string", results: "object" }
      },
      {
        path: "/listScans",
        method: "GET",
        auth_required: true,
        summary: "List all scans for your API key",
        query_params: { type: "snippet|repository (optional)", status: "queued|scanning|completed|failed (optional)", limit: "number (max 100, default 20)", offset: "number (default 0)" },
        response: { total: "number", limit: "number", offset: "number", has_more: "boolean", scans: "array" }
      }
    ],
    error_format: { error_code: "string", message: "string", details: "string (optional)" },
    rate_limiting: { description: "Enforced per API key based on tier. Returns HTTP 429 with Retry-After header when exceeded." }
  };

  return Response.json(docs, { headers: corsHeaders });
});