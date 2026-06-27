import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error_code: 'METHOD_NOT_ALLOWED', message: 'Use POST', details: '' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { name, owner_email, tier } = await req.json();
    if (!name || !owner_email) {
      return Response.json({ error_code: 'BAD_REQUEST', message: 'name and owner_email are required', details: '' }, { status: 400 });
    }

    // Generate a secure random API key
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const plaintext_key = 'cg_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');

    // Hash it with SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext_key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const key_hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Store hashed key
    const record = await base44.asServiceRole.entities.ApiKey.create({
      key_hash,
      name,
      owner_email,
      tier: tier || 'Free',
      is_active: true,
      last_used_at: new Date().toISOString()
    });

    return Response.json({
      api_key: plaintext_key,
      key_id: record.id,
      name,
      tier: tier || 'Free',
      warning: 'Store this key securely. It cannot be retrieved again.'
    }, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return Response.json({ error_code: 'SERVER_ERROR', message: String(e), details: '' }, { status: 500 });
  }
});