import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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
    if (!keys || keys.length === 0 || !keys[0].is_active) return Response.json({ error_code: 'UNAUTHORIZED', message: 'Invalid API key' }, { status: 401, headers: corsHeaders });
    const keyRecord = keys[0];

    // Get scan_id from query or body
    const url = new URL(req.url);
    let scanId = url.searchParams.get('scan_id');
    if (!scanId && req.method === 'POST') {
      const body = await req.json();
      scanId = body.scan_id;
    }
    if (!scanId) return Response.json({ error_code: 'BAD_REQUEST', message: 'scan_id is required' }, { status: 400, headers: corsHeaders });

    // Fetch scan
    const scans = await base44.asServiceRole.entities.ScanRecord.filter({ scan_id: scanId });
    if (!scans || scans.length === 0) return Response.json({ error_code: 'NOT_FOUND', message: 'Scan not found' }, { status: 404, headers: corsHeaders });

    const scan = scans[0];
    if (scan.api_key_id !== keyRecord.id) return Response.json({ error_code: 'FORBIDDEN', message: 'Access denied to this scan' }, { status: 403, headers: corsHeaders });

    let summary = {};
    try { summary = JSON.parse(scan.summary || '{}'); } catch { summary = { raw: scan.summary }; }

    return Response.json({
      scan_id: scan.scan_id,
      scan_type: scan.scan_type,
      target: scan.target_identifier,
      status: scan.status,
      results: summary,
      created_at: scan.created_date,
      completed_at: scan.completed_at
    }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error_code: 'SERVER_ERROR', message: String(e) }, { status: 500, headers: corsHeaders });
  }
});