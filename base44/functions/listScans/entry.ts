import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);

    const authHeader = req.headers.get('Authorization') || '';
    const apiKey = authHeader.replace('Bearer ', '');
    if (!apiKey) return Response.json({ error_code: 'UNAUTHORIZED', message: 'Missing API key' }, { status: 401, headers: corsHeaders });

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(apiKey));
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const keys = await base44.asServiceRole.entities.ApiKey.filter({ key_hash: keyHash });
    if (!keys || keys.length === 0 || !keys[0].is_active) return Response.json({ error_code: 'UNAUTHORIZED', message: 'Invalid API key' }, { status: 401, headers: corsHeaders });
    const keyRecord = keys[0];

    // Get filters
    const url = new URL(req.url);
    const scanType = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch scans for this key
    let scans = await base44.asServiceRole.entities.ScanRecord.filter({ api_key_id: keyRecord.id });
    scans = scans || [];

    if (scanType) scans = scans.filter(s => s.scan_type === scanType);
    if (status) scans = scans.filter(s => s.status === status);

    // Sort by created_date descending
    scans.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

    const total = scans.length;
    const paginated = scans.slice(offset, offset + limit);

    return Response.json({
      total,
      limit,
      offset,
      has_more: offset + limit < total,
      scans: paginated.map(s => ({
        scan_id: s.scan_id,
        scan_type: s.scan_type,
        target: s.target_identifier,
        status: s.status,
        created_at: s.created_date,
        completed_at: s.completed_at
      }))
    }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error_code: 'SERVER_ERROR', message: String(e) }, { status: 500, headers: corsHeaders });
  }
});