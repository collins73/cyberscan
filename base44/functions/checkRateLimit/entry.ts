import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { api_key_id, scan_limit_daily } = await req.json();
    if (!api_key_id) {
      return Response.json({ error_code: 'BAD_REQUEST', message: 'api_key_id required' }, { status: 400 });
    }

    // Count today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await base44.asServiceRole.entities.UsageLog.filter({ api_key_id });
    const todayLogs = (logs || []).filter(log => new Date(log.created_date) >= today);
    const count = todayLogs.length;
    const limit = scan_limit_daily || 10;

    return Response.json({
      allowed: count < limit,
      usage_today: count,
      limit: limit,
      remaining: Math.max(0, limit - count)
    }, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return Response.json({ error_code: 'SERVER_ERROR', message: String(e) }, { status: 500 });
  }
});