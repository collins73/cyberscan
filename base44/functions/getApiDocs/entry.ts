Deno.serve(async (req) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const docs = {
    name: "CodeGuard Security API",
    version: "1.1.0",
    base_url: "https://cyber-security-code-scan.base44.app/functions",
    description: "Security-as-a-Service API — scan code snippets, GitHub repos, and APIs for vulnerabilities. Generate compliance reports for SOC 2, HIPAA, PCI DSS, and OWASP.",
    authentication: {
      type: "Bearer Token",
      header: "Authorization: Bearer <your_api_key>",
      description: "All scan endpoints require a valid API key. Generate one via /generateApiKey."
    },
    pricing_tiers: [
      { name: "Free", price: "$0/mo", scans_per_day: 10, features: ["Code snippet scanning", "GitHub repo scanning", "Basic vulnerability detection"] },
      { name: "Pro", price: "$19.99/mo", scans_per_day: 100, features: ["Everything in Free", "API security scanning (OWASP Top 10)", "Compliance reports (SOC 2, HIPAA, PCI DSS)", "Included with RebelAgents subscription"] },
      { name: "Enterprise", price: "$99.99/mo", scans_per_day: 1000, features: ["Everything in Pro", "Webhook notifications", "Priority scanning", "Custom compliance frameworks"] }
    ],
    endpoints: [
      {
        path: "/generateApiKey",
        method: "POST",
        auth_required: false,
        summary: "Generate a new API key",
        request_body: { name: "string (required)", owner_email: "string (required)", tier: "string (Free|Pro|Enterprise, default: Free)" },
        response: { api_key: "string", key_id: "string", tier: "string", warning: "string" }
      },
      {
        path: "/scanCodeApi",
        method: "POST",
        auth_required: true,
        summary: "Scan a code snippet for vulnerabilities",
        request_body: { code: "string (required)", language: "string (optional)", filename: "string (optional)" },
        vulnerability_checks: ["CWE-89 SQL Injection", "CWE-79 XSS", "CWE-798 Hardcoded Credentials", "CWE-78 Command Injection", "CWE-22 Path Traversal", "CWE-502 Insecure Deserialization", "CWE-306 Missing Authentication", "CWE-942 CORS Misconfiguration"]
      },
      {
        path: "/scanRepositoryApi",
        method: "POST",
        auth_required: true,
        summary: "Scan a public GitHub repository",
        request_body: { repo_url: "string (required)", branch: "string (default: main)" },
        supported_languages: ["JavaScript", "TypeScript", "Python", "Ruby", "PHP", "Java", "Go", "Rust", "C/C++", "C#", "Swift", "Kotlin"]
      },
      {
        path: "/scanApiSecurity",
        method: "POST",
        auth_required: true,
        summary: "Scan API code against OWASP API Security Top 10 (2023)",
        request_body: { api_code: "string (API handler code)", openapi_spec: "string (OpenAPI/Swagger spec, optional)", endpoint_url: "string (optional)" },
        owasp_api_top10_checks: [
          "API1:2023 Broken Object Level Authorization",
          "API2:2023 Broken Authentication",
          "API3:2023 Broken Object Property Level Authorization",
          "API4:2023 Unrestricted Resource Consumption",
          "API5:2023 Broken Function Level Authorization",
          "API6:2023 Unrestricted Access to Sensitive Business Flows",
          "API7:2023 Server-Side Request Forgery",
          "API8:2023 Security Misconfiguration",
          "API9:2023 Improper Inventory Management",
          "API10:2023 Unsafe Consumption of APIs"
        ]
      },
      {
        path: "/generateComplianceReport",
        method: "POST",
        auth_required: true,
        summary: "Generate a compliance report mapped to security frameworks",
        request_body: { framework: "string (SOC2|HIPAA|PCI_DSS|OWASP, default: SOC2)", date_range_days: "number (default: 30)", include_remediation: "boolean (default: false)" },
        response_includes: ["Compliance score", "Control-by-control assessment", "Audit evidence trail", "Remediation plan with deadlines", "CWE-to-control mapping"],
        supported_frameworks: ["SOC 2 Type II", "HIPAA Security Rule", "PCI DSS v4.0", "OWASP Top 10 (2021)"]
      },
      {
        path: "/getScanResults",
        method: "POST",
        auth_required: true,
        summary: "Get detailed results for a specific scan",
        request_body: { scan_id: "string (required)" }
      },
      {
        path: "/listScans",
        method: "GET",
        auth_required: true,
        summary: "List all scans for your API key",
        query_params: { type: "snippet|repository", status: "queued|scanning|completed|failed", limit: "number (max 100)", offset: "number" }
      }
    ],
    error_format: { error_code: "string", message: "string", details: "string" },
    rate_limiting: { description: "Enforced per API key based on tier. HTTP 429 + Retry-After header when exceeded." },
    ci_cd_integration: {
      github_actions: {
        description: "Drop-in GitHub Action for automated security scanning on every PR",
        usage: "Add to .github/workflows/security.yml — blocks merges when critical vulnerabilities are found",
        configuration: { api_key: "Store as GitHub secret CODEGUARD_API_KEY", fail_on_critical: "true (default)", fail_on_high: "false (default)" }
      }
    }
  };

  return Response.json(docs, { headers: corsHeaders });
});