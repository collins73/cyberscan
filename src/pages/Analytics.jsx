import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Shield, Loader2, Settings, Layout as LayoutIcon, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MetricsOverview from '../components/analytics/MetricsOverview';
import VulnerabilityTrends from '../components/analytics/VulnerabilityTrends';
import SeverityDistribution from '../components/analytics/SeverityDistribution';
import TopVulnerabilities from '../components/analytics/TopVulnerabilities';
import LanguageBreakdown from '../components/analytics/LanguageBreakdown';
import SecurityScoreTrend from '../components/analytics/SecurityScoreTrend';
import DashboardWidget from '../components/dashboard/DashboardWidget';
import FileComparisonWidget from '../components/dashboard/FileComparisonWidget';
import ThreatIntelWidget from '../components/dashboard/ThreatIntelWidget';
import TimeRangeFilter from '../components/dashboard/TimeRangeFilter';
import WidgetSelector from '../components/dashboard/WidgetSelector';
import ComprehensiveReport from '../components/dashboard/ComprehensiveReport';
import OptimizationRecommendations from '../components/system/OptimizationRecommendations';

export default function Analytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState(30);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState([
    'metrics', 'trends', 'severity', 'topVulns', 'language', 'comparison', 'threatIntel', 'scoreHistory'
  ]);

  const { data: allScans = [], isLoading: scansLoading } = useQuery({
    queryKey: ['codeScans'],
    queryFn: () => base44.entities.CodeScan.list('-created_date', 200)
  });

  const { data: allMetrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ['vulnerabilityMetrics'],
    queryFn: () => base44.entities.VulnerabilityMetric.list('-created_date', 1000)
  });

  const { data: deployments = [] } = useQuery({
    queryKey: ['deployedApplications'],
    queryFn: () => base44.entities.DeployedApplication.list('-created_date', 50)
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['securityAlerts'],
    queryFn: () => base44.entities.SecurityAlert.list('-created_date', 100)
  });

  // Filter data by time range
  const filterByTimeRange = (data) => {
    if (timeRange === 'all') return data;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    return data.filter(item => new Date(item.created_date) >= cutoffDate);
  };

  const scans = filterByTimeRange(allScans);
  const metrics = filterByTimeRange(allMetrics);

  const isLoading = scansLoading || metricsLoading;

  const toggleWidget = (widgetId) => {
    setActiveWidgets(prev =>
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

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
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    Analytics Dashboard
                  </h1>
                  <p className="text-cyan-400 text-sm font-medium">
                    Vulnerability Metrics & Insights
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 items-center">
                <TimeRangeFilter
                  selectedRange={timeRange}
                  onRangeChange={setTimeRange}
                />
                {scans.length > 0 && (
                  <ComprehensiveReport scans={scans} metrics={metrics} timeRange={timeRange} />
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowWidgetSelector(true)}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <LayoutIcon className="w-4 h-4 mr-2" />
                  Customize
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/ThreatIntel')}
                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Threat Intel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/Scanner')}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Scanner
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {scans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <BarChart3 className="w-20 h-20 text-slate-700 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No Data Available</h2>
              <p className="text-slate-400 mb-6">
                Run some code scans to see analytics and metrics
              </p>
              <Button 
                onClick={() => navigate('/Scanner')}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-bold"
              >
                <Shield className="w-5 h-5 mr-2" />
                Start Scanning
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Optimization Recommendations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <OptimizationRecommendations 
                  scans={allScans} 
                  deployments={deployments} 
                  alerts={alerts}
                  metrics={allMetrics} 
                />
              </motion.div>

              {/* Metrics Overview */}
              {activeWidgets.includes('metrics') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <MetricsOverview scans={scans} metrics={metrics} />
                </motion.div>
              )}

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeWidgets.includes('trends') && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <DashboardWidget title="Vulnerability Trends">
                      <VulnerabilityTrends scans={scans} />
                    </DashboardWidget>
                  </motion.div>
                )}

                {activeWidgets.includes('scoreHistory') && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <DashboardWidget title="Security Score History">
                      <SecurityScoreTrend scans={scans} />
                    </DashboardWidget>
                  </motion.div>
                )}

                {activeWidgets.includes('severity') && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <DashboardWidget title="Severity Distribution">
                      <SeverityDistribution metrics={metrics} />
                    </DashboardWidget>
                  </motion.div>
                )}

                {activeWidgets.includes('language') && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <DashboardWidget title="Language Breakdown">
                      <LanguageBreakdown metrics={metrics} />
                    </DashboardWidget>
                  </motion.div>
                )}

                {activeWidgets.includes('comparison') && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <DashboardWidget title="File Comparison">
                      <FileComparisonWidget scans={scans} />
                    </DashboardWidget>
                  </motion.div>
                )}

                {activeWidgets.includes('threatIntel') && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <DashboardWidget title="Threat Intelligence Summary">
                      <ThreatIntelWidget scans={scans} />
                    </DashboardWidget>
                  </motion.div>
                )}
              </div>

              {/* Full Width Widgets */}
              {activeWidgets.includes('topVulns') && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <DashboardWidget title="Top Vulnerabilities">
                    <TopVulnerabilities metrics={metrics} />
                  </DashboardWidget>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Widget Selector Modal */}
      <AnimatePresence>
        {showWidgetSelector && (
          <WidgetSelector
            activeWidgets={activeWidgets}
            onToggleWidget={toggleWidget}
            onClose={() => setShowWidgetSelector(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}