// CyberScan Version Tracking - Auto-generated based on features

export const getAppVersion = (scans = [], deployments = [], alerts = []) => {
  let major = 1;
  let minor = 0;
  let patch = 0;

  // Check for v2.0 features (AI remediation, analytics)
  if (scans.length > 0) {
    major = 2;
    const hasAIRemediation = scans.some(s => 
      s.vulnerabilities?.some(v => v.secure_code_example)
    );
    if (hasAIRemediation) minor = 1;
  }

  // Check for v3.0 features (monitoring, deployments)
  if (deployments.length > 0 || alerts.length > 0) {
    major = 3;
    minor = 0;
  }

  // Patch version based on total scans
  patch = Math.min(Math.floor(scans.length / 10), 9);

  return `${major}.${minor}.${patch}`;
};

// Fallback static version
export const APP_VERSION = "3.0.0";