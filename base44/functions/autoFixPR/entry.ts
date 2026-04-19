import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { repoFullName, filePath, branch, originalCode, vulnerabilities, fileName } = await req.json();

    if (!repoFullName || !filePath || !originalCode || !vulnerabilities?.length) {
      return Response.json({ error: 'Missing required fields: repoFullName, filePath, originalCode, vulnerabilities' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');

    // Step 1: Use LLM to generate the fixed code
    const fixedResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude_sonnet_4_6',
      prompt: `You are a security engineer. You must fix ALL of the following vulnerabilities in the code below.

FILE: ${fileName || filePath}

VULNERABILITIES TO FIX:
${vulnerabilities.map((v, i) => `${i + 1}. [${v.severity?.toUpperCase()}] ${v.title}
   Description: ${v.description}
   Recommendation: ${v.recommendation}
   ${v.secure_code_example ? `Secure example:\n${v.secure_code_example}` : ''}`).join('\n\n')}

ORIGINAL CODE:
\`\`\`
${originalCode}
\`\`\`

Return ONLY the complete fixed file content with ALL vulnerabilities addressed. Do not include any explanation, markdown fences, or commentary — only the raw source code.`,
      response_json_schema: {
        type: 'object',
        properties: {
          fixed_code: { type: 'string' },
          summary: { type: 'string' },
          changes: { type: 'array', items: { type: 'string' } }
        },
        required: ['fixed_code', 'summary', 'changes']
      }
    });

    const fixedCode = fixedResult.fixed_code;
    const summary = fixedResult.summary || 'Auto-fix security vulnerabilities';
    const changes = fixedResult.changes || [];

    // Step 2: Get default branch info
    const baseBranch = branch || 'main';
    const newBranch = `cyberscan/autofix-${Date.now()}`;

    // Step 3: Get the latest commit SHA of base branch
    const refRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/ref/heads/${baseBranch}`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'CyberScan' }
    });
    if (!refRes.ok) {
      const err = await refRes.text();
      return Response.json({ error: `Could not get branch ref: ${err}` }, { status: 400 });
    }
    const refData = await refRes.json();
    const latestSha = refData.object.sha;

    // Step 4: Create new branch
    await fetch(`https://api.github.com/repos/${repoFullName}/git/refs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'User-Agent': 'CyberScan' },
      body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: latestSha })
    });

    // Step 5: Get current file SHA (needed to update)
    const fileRes = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${filePath}?ref=${baseBranch}`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'CyberScan' }
    });
    let fileSha = null;
    if (fileRes.ok) {
      const fileData = await fileRes.json();
      fileSha = fileData.sha;
    }

    // Step 6: Commit the fixed file
    const commitMessage = `fix(security): ${summary}\n\nChanges made by CyberScan Auto-Fix:\n${changes.map(c => `- ${c}`).join('\n')}\n\nVulnerabilities fixed:\n${vulnerabilities.map(v => `- [${v.severity}] ${v.title}`).join('\n')}`;
    const encodedContent = btoa(unescape(encodeURIComponent(fixedCode)));

    const commitBody = {
      message: commitMessage,
      content: encodedContent,
      branch: newBranch
    };
    if (fileSha) commitBody.sha = fileSha;

    const commitRes = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${filePath}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'User-Agent': 'CyberScan' },
      body: JSON.stringify(commitBody)
    });
    if (!commitRes.ok) {
      const err = await commitRes.text();
      return Response.json({ error: `Failed to commit file: ${err}` }, { status: 400 });
    }

    // Step 7: Create Pull Request
    const vulnTitles = vulnerabilities.map(v => `- [${v.severity?.toUpperCase()}] ${v.title}`).join('\n');
    const prBody = `## 🔒 CyberScan Auto-Fix\n\n${summary}\n\n### Vulnerabilities Fixed\n${vulnTitles}\n\n### Changes Applied\n${changes.map(c => `- ${c}`).join('\n')}\n\n> Generated automatically by [CyberScan](https://cyberscan.app) AI security scanner.`;

    const prRes = await fetch(`https://api.github.com/repos/${repoFullName}/pulls`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'User-Agent': 'CyberScan' },
      body: JSON.stringify({
        title: `[CyberScan] Security Auto-Fix: ${vulnerabilities.length} vulnerabilit${vulnerabilities.length === 1 ? 'y' : 'ies'} in ${fileName || filePath}`,
        body: prBody,
        head: newBranch,
        base: baseBranch
      })
    });

    if (!prRes.ok) {
      const err = await prRes.text();
      return Response.json({ error: `Failed to create PR: ${err}` }, { status: 400 });
    }

    const prData = await prRes.json();
    return Response.json({
      success: true,
      pr_url: prData.html_url,
      pr_number: prData.number,
      branch: newBranch,
      summary,
      changes,
      fixed_code: fixedCode
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});