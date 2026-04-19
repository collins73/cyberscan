import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('linkedin');

  // Get the LinkedIn member URN
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const profile = await profileRes.json();
  const authorUrn = `urn:li:person:${profile.sub}`;

  const postText = `🔐 Just launched CodeGuard — an AI-powered security platform that scans your code for vulnerabilities in seconds.

✅ Detects SQL Injection, XSS, RCE & 20+ vulnerability types
🤖 AI-generated fixes with one-click GitHub Pull Requests
🎯 Red Team exploit simulation to test real-world risk
📊 Compliance tracking for OWASP, PCI DSS, HIPAA & more
⚡ Real-time alerts for critical threats

Built for developers who take security seriously. 🛡️

👉 https://cyber-security-code-scan.base44.app

#CodeGuard #CyberSecurity #DevSecOps #AppSec #AI #CodeSecurity #Vulnerability #SecureCode #Developer`;

  const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: postText },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    })
  });

  if (!postRes.ok) {
    const err = await postRes.text();
    return Response.json({ error: err }, { status: postRes.status });
  }

  return Response.json({ success: true });
});