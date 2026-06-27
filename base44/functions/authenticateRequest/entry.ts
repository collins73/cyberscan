import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { api_key } = await req.json();
    if (!api_key) {
      return Response.json({ authenticated: false, error: 'No API key provided' }, { status: 401 });
    }

    // Hash the provided key
    const encoder = new TextEncoder();
    const data = encoder.encode(api_key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const key_hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Look up the key
    const keys = await base44.asServiceRole.entities.ApiKey.filter({ key_hash });
    if (!keys || keys.length === 0) {
      return Response.json({ authenticated: false, error: 'Invalid API key' }, { status: 401 });
    }

    const keyRecord = keys[0];
    if (!keyRecord.is_active) {
      return Response.json({ authenticated: false, error: 'API key is deactivated' }, { status: 401 });
    }

    // Update last used
    await base44.asServiceRole.entities.ApiKey.update(keyRecord.id, { last_used_at: new Date().toISOString() });

    // Get tier info
    const tiers = await base44.asServiceRole.entities.PricingTier.filter({ name: keyRecord.tier });
    const tier = tiers && tiers.length > 0 ? tiers[0] : { name: 'Free', scan_limit_daily: 10 };

    return Response.json({
      authenticated: true,
      key_id: keyRecord.id,
      owner_email: keyRecord.owner_email,
      tier: tier
    }, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return Response.json({ authenticated: false, error: String(e) }, { status: 500 });
  }
});