import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GITHUB_API = 'https://api.github.com';

async function githubFetch(url, accessToken, options = {}) {
  const res = await fetch(`${GITHUB_API}${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');

    // Get watched repos from request body or entity
    const body = await req.json().catch(() => ({}));
    const repoFullNames = body.repos || []; // e.g. ["owner/repo"]

    if (!repoFullNames.length) {
      return Response.json({ message: 'No repos configured', scanned: 0 });
    }

    const results = [];

    for (const repoFullName of repoFullNames) {
      const [owner, repo] = repoFullName.split('/');

      // Get open PRs
      const prs = await githubFetch(`/repos/${owner}/${repo}/pulls?state=open&per_page=20`, accessToken);

      for (const pr of prs) {
        const prNumber = pr.number;

        // Check if we already commented on this PR (look for our bot marker)
        const comments = await githubFetch(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, accessToken);
        const alreadyCommented = comments.some(c => c.body && c.body.includes('<!-- codeguard-bot -->'));
        if (alreadyCommented) continue;

        // Get changed files
        const files = await githubFetch(`/repos/${owner}/${repo}/pulls/${prNumber}/files`, accessToken);
        const codeFiles = files.filter(f =>
          /\.(js|jsx|ts|tsx|py|java|go|rb|php|cpp|c|cs)$/.test(f.filename) && f.patch
        ).slice(0, 5); // limit to 5 files

        if (!codeFiles.length) continue;

        // Scan each file's diff
        const allVulnerabilities = [];
        let totalScore = 0;

        for (const file of codeFiles) {
          const codeSnippet = file.patch.substring(0, 3000);
          const ext = file.filename.split('.').pop();
          const langMap = { js: 'JavaScript', jsx: 'JavaScript/React', ts: 'TypeScript', tsx: 'TypeScript/React', py: 'Python', java: 'Java', go: 'Go', rb: 'Ruby', php: 'PHP', cpp: 'C++', c: 'C', cs: 'C#' };
          const language = langMap[ext] || 'Unknown';

          const scanResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `You are an expert security code analyst. Analyze this git diff for security vulnerabilities.

File: ${file.filename}
Language: ${language}
Diff (lines starting with + are additions):
\`\`\`
${codeSnippet}
\`\`\`

Focus ONLY on the added lines (starting with +). Identify security vulnerabilities and provide an overall security score 0-100.`,
            response_json_schema: {
              type: 'object',
              properties: {
                vulnerabilities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                      description: { type: 'string' },
                      recommendation: { type: 'string' },
                      line_number: { type: 'string' }
                    }
                  }
                },
                overall_score: { type: 'number' }
              }
            }
          });

          for (const v of (scanResult.vulnerabilities || [])) {
            allVulnerabilities.push({ ...v, file: file.filename });
          }
          totalScore += scanResult.overall_score || 80;
        }

        const avgScore = Math.round(totalScore / Math.max(codeFiles.length, 1));
        const critical = allVulnerabilities.filter(v => v.severity === 'critical');
        const high = allVulnerabilities.filter(v => v.severity === 'high');
        const medium = allVulnerabilities.filter(v => v.severity === 'medium');
        const low = allVulnerabilities.filter(v => v.severity === 'low');

        const scoreEmoji = avgScore >= 80 ? '🟢' : avgScore >= 60 ? '🟡' : avgScore >= 40 ? '🟠' : '🔴';
        const statusText = avgScore >= 80 ? 'PASS' : avgScore >= 60 ? 'WARNING' : 'FAIL';

        // Build comment markdown
        let comment = `<!-- codeguard-bot -->
        ## 🛡️ CodeGuard Security Analysis

${scoreEmoji} **Security Score: ${avgScore}/100** — ${statusText}

| Severity | Count |
|----------|-------|
| 🔴 Critical | ${critical.length} |
| 🟠 High | ${high.length} |
| 🟡 Medium | ${medium.length} |
| 🟢 Low | ${low.length} |

**Files Scanned:** ${codeFiles.map(f => `\`${f.filename}\``).join(', ')}
`;

        if (allVulnerabilities.length === 0) {
          comment += `\n✅ **No vulnerabilities detected in the changed files.**\n`;
        } else {
          comment += `\n### 🔍 Findings\n`;
          const sevOrder = ['critical', 'high', 'medium', 'low'];
          const sorted = allVulnerabilities.sort((a, b) => sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity));

          for (const v of sorted.slice(0, 10)) {
            const icon = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[v.severity] || '⚪';
            comment += `\n<details>\n<summary>${icon} <strong>[${v.severity.toUpperCase()}]</strong> ${v.title} — <code>${v.file}</code>${v.line_number ? ` (line ${v.line_number})` : ''}</summary>\n\n**Description:** ${v.description}\n\n**Recommendation:** ${v.recommendation}\n\n</details>\n`;
          }

          if (allVulnerabilities.length > 10) {
            comment += `\n> ⚠️ ${allVulnerabilities.length - 10} additional findings not shown. View full report in [CodeGuard Analytics](/Analytics).\n`;
          }
          }

          comment += `\n---\n*Powered by [CodeGuard](/) AI Security Scanner • [View Full Analytics](/Analytics)*`;

        // Post comment on PR
        await githubFetch(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, accessToken, {
          method: 'POST',
          body: JSON.stringify({ body: comment }),
        });

        // Save scan record
        await base44.asServiceRole.entities.CodeScan.create({
          file_name: `PR #${prNumber}: ${pr.title}`,
          language: codeFiles.map(f => f.filename.split('.').pop()).join(', '),
          code_snippet: `GitHub PR #${prNumber} in ${repoFullName}`,
          vulnerabilities: allVulnerabilities,
          overall_score: avgScore,
          scan_duration: 0,
        });

        results.push({ repo: repoFullName, pr: prNumber, title: pr.title, vulns: allVulnerabilities.length, score: avgScore });
      }
    }

    return Response.json({ scanned: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});