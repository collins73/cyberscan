import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { api_key_id, scan_id, endpoint, response_status } = await req.json();

    const record = await base44.asServiceRole.entities.UsageLog.create({
      api_key_id: api_key_id || '',
      scan_id: scan_id || '',
      endpoint: endpoint || '',
      response_status: response_status || 200
    });

    return Response.json({ logged: true, id: record.id }, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return Response.json({ error_code: 'SERVER_ERROR', message: String(e) }, { status: 500 });
  }
});