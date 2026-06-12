import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { repoFullName, filePath, branch } = await req.json();

    if (!repoFullName || !filePath) {
      return Response.json({ error: 'repoFullName and filePath are required' }, { status: 400 });
    }

    const ref = branch || 'main';
    const token = Deno.env.get('GITHUB_TOKEN');

    const url = `https://api.github.com/repos/${repoFullName}/contents/${filePath}?ref=${ref}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'CodeGuard-App'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json(
        { error: `GitHub API error (${res.status}): ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    if (Array.isArray(data) || data.type !== 'file') {
      return Response.json({ error: 'Path is not a file' }, { status: 400 });
    }

    // Decode base64 content, handling multi-byte characters correctly
    const base64 = (data.content || '').replace(/\n/g, '');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const content = new TextDecoder('utf-8').decode(bytes);

    return Response.json({ success: true, content, branch: ref });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});