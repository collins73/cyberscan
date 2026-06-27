import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const { api_key_id, scan_id, scan_results } = await req.json();
    if (!api_key_id || !scan_id) return Response.json({ error: 'api_key_id and scan_id required' }, { status: 400, headers: corsHeaders });

    // Get webhook configs for this API key
    const webhooks = await base44.asServiceRole.entities.WebhookConfig.filter({ api_key_id, is_active: true });
    if (!webhooks || webhooks.length === 0) return Response.json({ delivered: 0, message: 'No active webhooks configured' }, { headers: corsHeaders });

    const results = [];
    for (const webhook of webhooks) {
      try {
        const payload = JSON.stringify({
          event: 'scan.completed',
          scan_id,
          results: scan_results,
          timestamp: new Date().toISOString()
        });

        // Generate HMAC signature
        const encoder = new TextEncoder();
        const keyData = encoder.encode(webhook.secret_token || 'default-secret');
        const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
        const sigHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');

        const resp = await fetch(webhook.callback_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CodeGuard-Signature': `sha256=${sigHex}`,
            'X-CodeGuard-Event': 'scan.completed'
          },
          body: payload
        });

        results.push({ url: webhook.callback_url, status: resp.status, success: resp.ok });
      } catch (e) {
        results.push({ url: webhook.callback_url, status: 0, success: false, error: String(e) });
      }
    }

    return Response.json({ delivered: results.filter(r => r.success).length, total: results.length, details: results }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500, headers: corsHeaders });
  }
});