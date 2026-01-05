import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Activity, AlertTriangle, Plus, RefreshCw, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DeploymentList from '../components/monitoring/DeploymentList';
import AlertsPanel from '../components/monitoring/AlertsPanel';
import MonitoringStats from '../components/monitoring/MonitoringStats';
import AddDeploymentModal from '../components/monitoring/AddDeploymentModal';
import CICDIntegration from '../components/monitoring/CICDIntegration';

export default function Monitoring() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCICDGuide, setShowCICDGuide] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const { data: deployments = [] } = useQuery({
    queryKey: ['deployedApplications'],
    queryFn: () => base44.entities.DeployedApplication.list('-created_date', 50)
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['securityAlerts'],
    queryFn: () => base44.entities.SecurityAlert.list('-created_date', 100)
  });

  const { data: scans = [] } = useQuery({
    queryKey: ['codeScans'],
    queryFn: () => base44.entities.CodeScan.list('-created_date', 50)
  });

  const createAlertMutation = useMutation({
    mutationFn: (alertData) => base44.entities.SecurityAlert.create(alertData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['securityAlerts'] });
    }
  });

  const updateDeploymentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DeployedApplication.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployedApplications'] });
    }
  });

  const runSecurityMonitoring = async () => {
    setIsMonitoring(true);
    
    try {
      // Check each deployment for new vulnerabilities
      for (const deployment of deployments) {
        const lastScan = scans.find(s => s.id === deployment.last_scan_id);
        
        if (lastScan) {
          // Check for critical vulnerabilities
          const criticalVulns = lastScan.vulnerabilities?.filter(v => v.severity === 'critical') || [];
          const highVulns = lastScan.vulnerabilities?.filter(v => v.severity === 'high') || [];
          
          // Update deployment status
          let status = 'healthy';
          if (criticalVulns.length > 0) {
            status = 'critical';
          } else if (highVulns.length > 3 || lastScan.overall_score < 60) {
            status = 'warning';
          }

          await updateDeploymentMutation.mutateAsync({
            id: deployment.id,
            data: {
              ...deployment,
              status,
              last_monitored: new Date().toISOString(),
              critical_vulns: criticalVulns.length,
              high_vulns: highVulns.length,
              security_score: lastScan.overall_score
            }
          });

          // Create alerts for critical issues
          if (criticalVulns.length > 0 && status === 'critical') {
            const existingAlert = alerts.find(
              a => a.app_name === deployment.app_name && 
                   a.status === 'active' && 
                   a.alert_type === 'critical_vulnerability'
            );

            if (!existingAlert) {
              await createAlertMutation.mutateAsync({
                alert_type: 'critical_vulnerability',
                severity: 'critical',
                title: `Critical Vulnerabilities in ${deployment.app_name}`,
                description: `Found ${criticalVulns.length} critical vulnerabilities in ${deployment.environment} environment. Immediate action required.`,
                app_name: deployment.app_name,
                scan_id: lastScan.id,
                status: 'active'
              });
            }
          }

          // Check for threshold exceeded
          if (lastScan.overall_score < 50) {
            await createAlertMutation.mutateAsync({
              alert_type: 'threshold_exceeded',
              severity: 'high',
              title: `Security Score Below Threshold: ${deployment.app_name}`,
              description: `Security score of ${lastScan.overall_score} is below the acceptable threshold of 50.`,
              app_name: deployment.app_name,
              scan_id: lastScan.id,
              status: 'active'
            });
          }
        }
      }
    } catch (error) {
      console.error('Monitoring check failed:', error);
    } finally {
      setIsMonitoring(false);
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDIxNywyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
      
      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl relative">
                  <Activity className="w-8 h-8 text-black" />
                  {activeAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {activeAlerts.length}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    Security Monitoring
                  </h1>
                  <p className="text-cyan-400 text-sm font-medium">
                    Real-time Application Security
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={runSecurityMonitoring}
                  disabled={isMonitoring}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isMonitoring ? 'animate-spin' : ''}`} />
                  {isMonitoring ? 'Monitoring...' : 'Run Check'}
                </Button>
                <Button
                  onClick={() => setShowCICDGuide(true)}
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  CI/CD Integration
                </Button>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Deployment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/Scanner')}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  Scanner
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
          {/* Stats Overview */}
          <MonitoringStats 
            deployments={deployments} 
            alerts={activeAlerts}
            scans={scans}
          />

          {/* Alerts Panel */}
          {activeAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertsPanel alerts={activeAlerts} />
            </motion.div>
          )}

          {/* Deployments List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <DeploymentList 
              deployments={deployments} 
              scans={scans}
              onRefresh={runSecurityMonitoring}
            />
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddDeploymentModal
          onClose={() => setShowAddModal(false)}
          scans={scans}
        />
      )}
      
      {showCICDGuide && (
        <CICDIntegration onClose={() => setShowCICDGuide(false)} />
      )}
    </div>
  );
}