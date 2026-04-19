import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, Shield, AlertTriangle, CheckCircle, Clock, Calendar, XCircle, BarChart3, Crosshair, Settings, Eye, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const severityConfig = {
  critical: { color: 'bg-red-500/10 text-red-400 border-red-500/30', badge: 'bg-red-500 text-white', dot: 'bg-red-500' },
  high: { color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', badge: 'bg-orange-500 text-white', dot: 'bg-orange-500' },
  medium: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', badge: 'bg-yellow-500 text-black', dot: 'bg-yellow-500' },
  low: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', badge: 'bg-blue-500 text-white', dot: 'bg-blue-500' },
};

const alertTypeLabels = {
  critical_vulnerability: 'Critical Vulnerability',
  new_cve: 'New CVE',
  threshold_exceeded: 'Policy Violation',
  deployment_risk: 'Deployment Risk',
};

export default function AlertsDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['securityAlerts'],
    queryFn: () => base44.entities.SecurityAlert.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const { data: scheduledScans = [] } = useQuery({
    queryKey: ['scheduledScans'],
    queryFn: () => base44.entities.ScheduledScan.list('-created_date', 50),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id) => base44.entities.SecurityAlert.update(id, { status: 'acknowledged', acknowledged_date: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['securityAlerts'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id) => base44.entities.SecurityAlert.update(id, { status: 'resolved', resolved_date: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['securityAlerts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SecurityAlert.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['securityAlerts'] }),
  });

  const filtered = alerts.filter(a => {
    const sev = severityFilter === 'all' || a.severity === severityFilter;
    const sta = statusFilter === 'all' || a.status === statusFilter;
    return sev && sta;
  });

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;
  const activeSchedules = scheduledScans.filter(s => s.enabled).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDIxNywyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

      <div className="relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl relative">
                  <Bell className="w-7 h-7 text-white" />
                  {activeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{activeCount > 9 ? '9+' : activeCount}</span>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Alerts Dashboard</h1>
                  <p className="text-amber-400 text-sm font-medium">Security Alerts & Scheduled Scans</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => navigate('/Scanner')} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <Shield className="w-4 h-4 mr-2" /> Scanner
                </Button>
                <Button variant="outline" onClick={() => navigate('/Monitoring')} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <BarChart3 className="w-4 h-4 mr-2" /> Monitoring
                </Button>
                <Button variant="outline" onClick={() => navigate('/PolicyEngine')} className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
                  <Settings className="w-4 h-4 mr-2" /> Policies
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Alerts', value: activeCount, color: 'text-red-400', icon: AlertTriangle, bg: 'from-red-950/30' },
              { label: 'Critical', value: criticalCount, color: 'text-red-400', icon: XCircle, bg: 'from-red-950/20' },
              { label: 'Resolved', value: resolvedCount, color: 'text-green-400', icon: CheckCircle, bg: 'from-green-950/20' },
              { label: 'Active Schedules', value: activeSchedules, color: 'text-cyan-400', icon: Calendar, bg: 'from-cyan-950/20' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`bg-gradient-to-br ${stat.bg} to-slate-900 border-slate-800`}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                      <Icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Alerts Section */}
          <div>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-white font-bold text-xl flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" /> Security Alerts
              </h2>
              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <div className="flex gap-1">
                  {['all', 'active', 'acknowledged', 'resolved'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all capitalize ${statusFilter === s ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {['all', 'critical', 'high', 'medium', 'low'].map(s => (
                    <button key={s} onClick={() => setSeverityFilter(s)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all capitalize ${severityFilter === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-slate-400 text-center py-16">Loading alerts...</div>
            ) : filtered.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-16 text-center">
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">All Clear</h3>
                  <p className="text-slate-400">No alerts matching your filter.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((alert, i) => {
                  const cfg = severityConfig[alert.severity] || severityConfig.low;
                  return (
                    <motion.div key={alert.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                      <Card className={`border ${cfg.color} bg-slate-900/50 hover:border-opacity-60 transition-all`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4 flex-wrap">
                            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} mt-1.5 flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="text-white font-semibold text-sm">{alert.title}</h4>
                                <Badge className={`text-xs ${cfg.badge}`}>{alert.severity?.toUpperCase()}</Badge>
                                <Badge className="text-xs bg-slate-700 text-slate-300">{alertTypeLabels[alert.alert_type] || alert.alert_type}</Badge>
                                {alert.status === 'resolved' && <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">Resolved</Badge>}
                                {alert.status === 'acknowledged' && <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">Acknowledged</Badge>}
                              </div>
                              <p className="text-slate-400 text-xs mb-2 line-clamp-2">{alert.description}</p>
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                {alert.app_name && <span>📦 {alert.app_name}</span>}
                                {alert.cve_id && <span className="text-orange-400">🔗 {alert.cve_id}</span>}
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{moment(alert.created_date).fromNow()}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              {alert.status === 'active' && (
                                <Button size="sm" variant="outline" onClick={() => acknowledgeMutation.mutate(alert.id)}
                                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs">
                                  <Eye className="w-3 h-3 mr-1" /> Ack
                                </Button>
                              )}
                              {alert.status !== 'resolved' && (
                                <Button size="sm" variant="outline" onClick={() => resolveMutation.mutate(alert.id)}
                                  className="border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(alert.id)}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scheduled Scans section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-xl flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" /> Scheduled Scans
              </h2>
              <Button onClick={() => navigate('/Scanner')} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-semibold text-sm">
                <Shield className="w-4 h-4 mr-2" /> Manage in Scanner
              </Button>
            </div>
            {scheduledScans.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-10 text-center">
                  <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400">No scheduled scans yet. Create one from the Scanner page.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {scheduledScans.map((scan, i) => (
                  <motion.div key={scan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className={`bg-slate-900/60 border-slate-800 ${!scan.enabled ? 'opacity-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-semibold text-sm">{scan.name}</h4>
                          <Badge className={scan.enabled ? 'bg-green-500/20 text-green-400 border-green-500/30 text-xs' : 'bg-slate-700 text-slate-400 text-xs'}>
                            {scan.enabled ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <p className="text-slate-500 text-xs truncate mb-2">{scan.target}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                          <span className="capitalize">🔁 {scan.frequency}</span>
                          {scan.time_of_day && <span>⏰ {scan.time_of_day}</span>}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{scan.run_count || 0} runs</span>
                          {scan.last_score !== undefined && scan.last_score !== null && (
                            <span className={`font-bold ${scan.last_score >= 80 ? 'text-green-400' : scan.last_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                              Last score: {scan.last_score}
                            </span>
                          )}
                        </div>
                        {scan.last_run && (
                          <p className="text-slate-600 text-xs mt-1">Last run {moment(scan.last_run).fromNow()}</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}