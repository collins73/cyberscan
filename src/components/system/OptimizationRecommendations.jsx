import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, Zap, Shield, Database } from "lucide-react";

export default function OptimizationRecommendations({ scans, deployments, alerts, metrics }) {
  const recommendations = [];

  // Performance optimizations
  const totalScans = scans.length;
  const totalMetrics = metrics.length;
  
  if (totalScans > 100) {
    recommendations.push({
      type: 'performance',
      priority: 'medium',
      title: 'Enable Data Pagination',
      description: `You have ${totalScans} scans. Consider implementing pagination or virtualization for better performance.`,
      impact: 'Faster page loads, reduced memory usage'
    });
  }

  // Security recommendations
  const recentScans = scans.slice(0, 10);
  const avgScore = recentScans.reduce((sum, s) => sum + s.overall_score, 0) / (recentScans.length || 1);
  
  if (avgScore < 70) {
    recommendations.push({
      type: 'security',
      priority: 'high',
      title: 'Security Score Below Optimal',
      description: `Average security score is ${avgScore.toFixed(1)}. Focus on fixing high-priority vulnerabilities.`,
      impact: 'Reduced security risks'
    });
  }

  // Monitoring optimizations
  const unmonitoredDeployments = deployments.filter(d => !d.last_monitored || 
    (new Date() - new Date(d.last_monitored)) > 24 * 60 * 60 * 1000
  );
  
  if (unmonitoredDeployments.length > 0) {
    recommendations.push({
      type: 'monitoring',
      priority: 'high',
      title: 'Stale Deployment Monitoring',
      description: `${unmonitoredDeployments.length} deployment(s) haven't been checked in 24+ hours.`,
      impact: 'Up-to-date security posture'
    });
  }

  // Alert management
  const activeAlerts = alerts.filter(a => a.status === 'active');
  if (activeAlerts.length > 5) {
    recommendations.push({
      type: 'alerts',
      priority: 'high',
      title: 'High Alert Volume',
      description: `${activeAlerts.length} active alerts need attention. Review and resolve critical issues first.`,
      impact: 'Improved security response time'
    });
  }

  // Data retention
  if (totalScans > 200) {
    recommendations.push({
      type: 'database',
      priority: 'low',
      title: 'Archive Old Scans',
      description: 'Consider archiving scans older than 90 days to optimize database performance.',
      impact: 'Improved query performance'
    });
  }

  // CI/CD integration
  const hasCICDScans = scans.some(s => 
    s.file_name?.includes('commit') || s.file_name?.includes('PR')
  );
  
  if (!hasCICDScans && deployments.length > 0) {
    recommendations.push({
      type: 'integration',
      priority: 'medium',
      title: 'Enable CI/CD Integration',
      description: 'Automate security scanning in your pipeline for continuous monitoring.',
      impact: 'Catch vulnerabilities earlier'
    });
  }

  // Best practices
  const scansWithoutThreatIntel = scans.filter(s => 
    !s.vulnerabilities?.some(v => v.threat_intelligence)
  ).length;
  
  if (scansWithoutThreatIntel > 5) {
    recommendations.push({
      type: 'enhancement',
      priority: 'low',
      title: 'Enable Threat Intelligence',
      description: 'New scans can correlate findings with CVE databases for richer context.',
      impact: 'Better informed remediation'
    });
  }

  const priorityColors = {
    high: 'bg-red-500 text-white',
    medium: 'bg-yellow-500 text-black',
    low: 'bg-blue-500 text-white'
  };

  const typeIcons = {
    performance: Zap,
    security: Shield,
    monitoring: TrendingUp,
    alerts: Lightbulb,
    database: Database,
    integration: Zap,
    enhancement: Lightbulb
  };

  if (recommendations.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-950/30 to-slate-900 border-green-500/20">
        <CardContent className="p-8 text-center">
          <Lightbulb className="w-12 h-12 mx-auto text-green-400 mb-3" />
          <h3 className="text-lg font-semibold text-green-400 mb-2">All Optimized!</h3>
          <p className="text-slate-400 text-sm">Your application is running efficiently with best practices.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="border-b border-slate-800">
        <CardTitle className="text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Optimization Recommendations ({recommendations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {recommendations.map((rec, idx) => {
            const Icon = typeIcons[rec.type] || Lightbulb;
            return (
              <div
                key={idx}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-white font-semibold">{rec.title}</h4>
                      <Badge className={priorityColors[rec.priority]}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{rec.description}</p>
                    <p className="text-cyan-400 text-xs flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Impact: {rec.impact}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}