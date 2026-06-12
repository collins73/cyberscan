import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Supported code file extensions
const CODE_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'go',
  'rb', 'php', 'swift', 'kt', 'rs', 'scala', 'sh', 'bash', 'yaml', 'yml',
  'json', 'xml', 'html', 'css', 'sql', 'tf', 'env', 'config'
]);

const LANG_MAP = {
  js: 'JavaScript', jsx: 'JavaScript/React', ts: 'TypeScript', tsx: 'TypeScript/React',
  py: 'Python', java: 'Java', cpp: 'C++', c: 'C', h: 'C/C++ Header', cs: 'C#',
  go: 'Go', rb: 'Ruby', php: 'PHP', swift: 'Swift', kt: 'Kotlin', rs: 'Rust',
  scala: 'Scala', sh: 'Shell', bash: 'Bash', sql: 'SQL', tf: 'Terraform',
  html: 'HTML', css: 'CSS', yaml: 'YAML', yml: 'YAML', json: 'JSON'
};

// Recursively fetch all code files from a GitHub repo tree
async function fetchRepoFiles(owner, repo, branch, token) {
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json'
  };

  // Get the commit tree SHA
  const branchRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
    { headers }
  );
  if (!branchRes.ok) {
    const err = await branchRes.json();
    throw new Error(`Branch fetch failed: ${err.message}`);
  }
  const branchData = await branchRes.json();
  const treeSha = branchData.commit.commit.tree.sha;

  // Get full recursive tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
    { headers }
  );
  if (!treeRes.ok) throw new Error('Failed to fetch repo tree');
  const treeData = await treeRes.json();

  // Filter to code files only, skip node_modules / vendor / build dirs, limit size
  const codeFiles = treeData.tree.filter(item => {
    if (item.type !== 'blob') return false;
    const ext = item.path.split('.').pop()?.toLowerCase();
    if (!CODE_EXTENSIONS.has(ext)) return false;
    // Skip common non-source directories
    const skipDirs = ['node_modules/', 'vendor/', 'dist/', 'build/', '.git/', '__pycache__/', 'venv/', '.venv/'];
    if (skipDirs.some(d => item.path.startsWith(d))) return false;
    // Skip files larger than 100KB
    if (item.size > 100000) return false;
    return true;
  });

  return codeFiles;
}

// Fetch file content from GitHub
async function fetchFileContent(owner, repo, filePath, branch, token) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
    {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  // GitHub returns base64-encoded content
  const content = atob(data.content.replace(/\n/g, ''));
  return content;
}

// Analyze a batch of files with the LLM
async function analyzeFileBatch(files, base44) {
  const combinedCode = files.map(f => `\n\n// === FILE: ${f.path} ===\n${f.content}`).join('');
  const fileList = files.map(f => f.path).join(', ');

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert cybersecurity code analyst. Analyze the following code files for security vulnerabilities.

Files being analyzed: ${fileList}

Code:
\`\`\`
${combinedCode.substring(0, 12000)}
\`\`\`

Identify ALL security vulnerabilities including:
- SQL Injection, XSS, Command Injection, RCE
- Hardcoded secrets, API keys, passwords, tokens
- Insecure authentication & broken access control
- Cryptographic weaknesses
- Path traversal, SSRF, XXE
- Insecure deserialization
- Memory safety issues
- Logic flaws and misconfigurations

For each vulnerability:
1. Title
2. Severity (critical, high, medium, low)
3. Description
4. File path and line number if identifiable
5. The vulnerable code snippet
6. Recommendation to fix it
7. Secure code example

Provide an overall security score from 0-100.`,
    response_json_schema: {
      type: "object",
      properties: {
        vulnerabilities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
              description: { type: "string" },
              line_number: { type: "string" },
              code_example: { type: "string" },
              recommendation: { type: "string" },
              secure_code_example: { type: "string" }
            },
            required: ["title", "severity", "description", "recommendation", "secure_code_example"]
          }
        },
        overall_score: { type: "number" }
      },
      required: ["vulnerabilities", "overall_score"]
    }
  });

  return response;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { repoUrl, branch = 'main', projectId, projectName, maxFiles = 30 } = await req.json();

    if (!repoUrl) {
      return Response.json({ error: 'repoUrl is required' }, { status: 400 });
    }

    // Parse repo URL — support https://github.com/owner/repo or owner/repo
    const match = repoUrl.match(/(?:github\.com\/)?([^/]+)\/([^/\s]+?)(?:\.git)?$/);
    if (!match) {
      return Response.json({ error: 'Invalid GitHub repository URL' }, { status: 400 });
    }
    const [, owner, repo] = match;

    const token = Deno.env.get('GITHUB_TOKEN');
    if (!token) {
      return Response.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 });
    }

    // Fetch file list
    const allFiles = await fetchRepoFiles(owner, repo, branch, token);

    if (allFiles.length === 0) {
      return Response.json({ error: 'No scannable code files found in repository' }, { status: 400 });
    }

    // Limit to maxFiles most important files (prioritize certain extensions)
    const priorityExts = new Set(['py', 'js', 'ts', 'java', 'php', 'rb', 'go', 'cs', 'cpp', 'c', 'sql', 'sh', 'env']);
    const sorted = allFiles.sort((a, b) => {
      const aExt = a.path.split('.').pop()?.toLowerCase();
      const bExt = b.path.split('.').pop()?.toLowerCase();
      return (priorityExts.has(bExt) ? 1 : 0) - (priorityExts.has(aExt) ? 1 : 0);
    });
    const selectedFiles = sorted.slice(0, maxFiles);

    // Fetch file contents in parallel (batches of 5)
    const filesWithContent = [];
    for (let i = 0; i < selectedFiles.length; i += 5) {
      const batch = selectedFiles.slice(i, i + 5);
      const contents = await Promise.all(
        batch.map(async (f) => {
          const content = await fetchFileContent(owner, repo, f.path, branch, token);
          if (!content || content.trim().length === 0) return null;
          const ext = f.path.split('.').pop()?.toLowerCase();
          return { path: f.path, content, language: LANG_MAP[ext] || ext };
        })
      );
      filesWithContent.push(...contents.filter(Boolean));
    }

    if (filesWithContent.length === 0) {
      return Response.json({ error: 'Could not read any files from the repository' }, { status: 400 });
    }

    const startTime = Date.now();

    // Split into batches of 5 files for LLM analysis
    const BATCH_SIZE = 5;
    const batches = [];
    for (let i = 0; i < filesWithContent.length; i += BATCH_SIZE) {
      batches.push(filesWithContent.slice(i, i + BATCH_SIZE));
    }

    // Analyze batches (sequentially to avoid rate limits)
    const allVulnerabilities = [];
    let totalScore = 0;
    let scoreCount = 0;

    for (const batch of batches) {
      const result = await analyzeFileBatch(batch, base44);
      if (result.vulnerabilities) allVulnerabilities.push(...result.vulnerabilities);
      if (result.overall_score) { totalScore += result.overall_score; scoreCount++; }
    }

    const overallScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 50;
    const scanDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    const repoName = `${owner}/${repo}`;
    const scanData = {
      file_name: repoName,
      language: 'Multi-language Repository',
      code_snippet: `Repository: ${repoUrl}\nBranch: ${branch}\nFiles scanned: ${filesWithContent.length}`,
      vulnerabilities: allVulnerabilities,
      overall_score: overallScore,
      scan_duration: parseFloat(scanDuration),
      project_id: projectId || null,
      project_name: projectName || null
    };

    let savedScan = null;

    // Try to save scan record — don't crash if it fails
    try {
      savedScan = await base44.entities.CodeScan.create(scanData);
    } catch (saveError) {
      console.error('Failed to save CodeScan record:', saveError.message);
    }

    // Create alerts for critical/high (best-effort)
    if (savedScan) {
      try {
        const critical = allVulnerabilities.filter(v => v.severity === 'critical');
        const high = allVulnerabilities.filter(v => v.severity === 'high');

        if (critical.length > 0) {
          await base44.entities.SecurityAlert.create({
            alert_type: 'critical_vulnerability',
            severity: 'critical',
            title: `${critical.length} Critical Vulnerabilities in ${repoName}`,
            description: `Critical issues: ${critical.map(v => v.title).join(', ')}`,
            app_name: repoName,
            scan_id: savedScan.id,
            status: 'active'
          });
        } else if (high.length > 0) {
          await base44.entities.SecurityAlert.create({
            alert_type: 'threshold_exceeded',
            severity: 'high',
            title: `${high.length} High Severity Issues in ${repoName}`,
            description: `High severity vulnerabilities found in repository scan`,
            app_name: repoName,
            scan_id: savedScan.id,
            status: 'active'
          });
        }

        // Save vulnerability metrics
        for (const vuln of allVulnerabilities) {
          await base44.entities.VulnerabilityMetric.create({
            vulnerability_type: vuln.title,
            severity: vuln.severity,
            language: 'Repository',
            scan_id: savedScan.id,
            count: 1,
            security_score: overallScore
          });
        }
      } catch (metaError) {
        console.error('Failed to save alerts/metrics:', metaError.message);
        // Continue — scan results are still valid
      }
    }

    return Response.json({
      success: true,
      scan: scanData,
      scanId: savedScan?.id || null,
      filesScanned: filesWithContent.length,
      totalFiles: allFiles.length,
      vulnerabilitiesFound: allVulnerabilities.length,
      overallScore
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});