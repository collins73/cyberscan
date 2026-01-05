// CyberScan Version Tracking - Dynamic runtime versioning

export const getAppVersion = (scans = [], deployments = [], alerts = []) => {
  const major = 3; // Current major version with monitoring & CI/CD
  
  // Minor version based on feature adoption
  let minor = 0;
  const hasActiveMonitoring = deployments.length > 0;
  const hasActiveAlerts = alerts.filter(a => a.status === 'active').length > 0;
  const hasThreatIntel = scans.some(s => 
    s.vulnerabilities?.some(v => v.threat_intelligence)
  );
  
  if (hasActiveMonitoring) minor = 1;
  if (hasThreatIntel) minor = Math.max(minor, 2);
  if (hasActiveAlerts) minor = Math.max(minor, 3);
  
  // Patch increments with each scan (resets at 99)
  const patch = scans.length % 100;

  return `${major}.${minor}.${patch}`;
};

// Static fallback
export const APP_VERSION = "3.0.0";