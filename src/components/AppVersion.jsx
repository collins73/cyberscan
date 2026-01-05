// CyberScan Version Tracking - Auto-generated based on features and usage

export const getAppVersion = (scans = [], deployments = [], alerts = []) => {
  // v3.0+ - Monitoring and CI/CD features are available
  let major = 3;
  let minor = 0;
  
  // Patch version based on total scans
  let patch = Math.min(Math.floor(scans.length / 10), 9);

  return `${major}.${minor}.${patch}`;
};

// Fallback static version
export const APP_VERSION = "3.0.0";