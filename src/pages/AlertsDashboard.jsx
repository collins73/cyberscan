import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Shield, AlertTriangle, CheckCircle, XCircle, Clock, Filter, Trash2, Eye, Calendar, BarChart3, Activity, Globe, Crosshair, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const SEVERITY_CONFIG = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', badge: 'bg-red-500 text-white', icon: XCircle },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', badge: 'bg-orange-500 text-white', icon: AlertTriangle },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', badge: 'bg-yellow-500 text-black', icon: AlertTriangle },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', badge: 'bg-blue-500 text-white', icon: Shield },
};

const STATUS_FILTERS = ['all', 'active', 'acknowledged', 'resolved'];

function AlertCard({ alert, onAcknowledge, onResolve, onDelete }) {
  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
  const Icon = cfg.icon;
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <Card className={`border ${cfg.bg} bg-slate-950/60`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${cfg.bg} flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-white font-semibold text-sm">{alert.title}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{alert.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`${cfg.badge} text-xs`}>{alert.severity?.toUpperCase()}</Badge>
                  <Badge className={`text-xs ${
                    alert.status === 'active' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    alert.status === 'acknowledged' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-green-500/20 text-green-400 border-green-500/30'
                  }`}>{alert.status}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                {alert.app_name && <span>📁 {alert.app_name}</span>}
                {alert.cve_id && <span className="text-orange-400">🔖 {alert.cve_id}</span>}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(alert.created_date)}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {alert.status === 'active' && (
                  <Button size="sm" onClick={() => onAcknowledge(alert.id)} className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 text-xs h-7">
                    <Eye className="w-3 h-3 mr-1" /> Acknowledge
                  </Button>
                )}
                {alert.status !== 'resolved' && (
                  <Button size="sm" onClick={() => onResolve(alert.id)} className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 text-xs h-7">
                    <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                  </Button>
                )}
                <Button size="sm" onClick={() => onDelete(alert.id)} className="bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 text-xs h-7">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AlertsDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['securityAlerts'],
    queryFn: () => base44.entities.SecurityAlert.list('-created_date', 200),
    refetchInterval: 30000
  });

  const { data: scheduledScans = [] } = useQuery({
    queryKey: ['scheduledScans'],
    queryFn: () => base44.entities.ScheduledScan.list('-created_date', 100)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SecurityAlert.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['securityAlerts'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SecurityAlert.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['securityAlerts'] })
  });

  const handleAcknowledge = (id) => updateMutation.mutate({ id, data: { status: 'acknowledged', acknowledged_date: new Date().toISOString() } });
  const handleResolve = (id) => updateMutation.mutate({ id, data: { status: 'resolved', resolved_date: new Date().toISOString() } });
  const handleDelete = (id) => deleteMutation.mutate(id);

  const filtered = alerts.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    return true;
  });

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;
  const activeScans = scheduledScans.filter(s => s.enabled).length;

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
                <div className="relative">
                  <div className="p-3 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl">
                    <Bell className="w-7 h-7 text-white" />
                  </div>
                  {activeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                      {activeCount > 9 ? '9+' : activeCount}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Alerts Dashboard</h1>
                  <p className="text-rose-400 text-sm font-medium">Security Notifications & Scheduled Scans</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => refetch()} className="border-slate-700 text-slate-400 hover:bg-slate-800 h-9">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/Scanner')} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <Shield className="w-4 h-4 mr-2" /> Scanner
                </Button>
                <Button variant="outline" onClick={() => navigate('/Analytics')} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <BarChart3 className="w-4 h-4 mr-2" /> Analytics
                </Button>
                <Button variant="outline" onClick={() => navigate('/Monitoring')} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <Activity className="w-4 h-4 mr-2" /> Monitoring
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Alerts', value: activeCount, color: 'text-red-400', bg: 'border-red-500/20', icon: Bell },
              { label: 'Critical', value: criticalCount, color: 'text-orange-400', bg: 'border-orange-500/20', icon: AlertTriangle },
              { label: 'Resolved', value: resolvedCount, color: 'text-green-400', bg: 'border-green-500/20', icon: CheckCircle },
              { label: 'Scheduled Scans', value: activeScans, color: 'text-cyan-400', bg: 'border-cyan-500/20', icon: Calendar },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`bg-slate-900/60 ${stat.bg}`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Icon className={`w-8 h-8 ${stat.color} flex-shrink-0`} />
                      <div>
                        <p className="text-slate-400 text-xs">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Scheduled Scans quick view */}
          {scheduledScans.length > 0 && (
            <div>
              <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" /> Scheduled Scans
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {scheduledScans.slice(0, 6).map(scan => (
                  <Card key={scan.id} className={`bg-slate-900/60 border ${scan.enabled ? 'border-cyan-500/20' : 'border-slate-800 opacity-50'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h3 className="text-white font-semibold text-sm truncate">{scan.name}</h3>
                          <p className="text-slate-500 text-xs truncate mt-0.5">{scan.target}</p>
                        </div>
                        <Badge className={scan.enabled ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs' : 'bg-slate-700 text-slate-400 text-xs'}>
                          {scan.frequency}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        {scan.last_run && <span>Last: {new Date(scan.last_run).toLocaleDateString()}</span>}
                        {scan.last_vuln_count > 0 && <span className="text-orange-400">{scan.last_vuln_count} vulns</span>}
                        {scan.total_runs > 0 && <span>{scan.total_runs} runs</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {scheduledScans.length > 6 && (
                <p className="text-slate-500 text-xs mt-2">+{scheduledScans.length - 6} more — manage in Scanner</p>
              )}
            </div>
          )}

          {/* Alerts List */}
          <div>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-400" /> Security Alerts
                {activeCount > 0 && <Badge className="bg-red-500 text-white text-xs">{activeCount} active</Badge>}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {/* Status filter */}
                <div className="flex gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
                  {STATUS_FILTERS.map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all capitalize ${statusFilter === f ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-slate-300'}`}>
                      {f}
                    </button>
                  ))}
                </div>
                {/* Severity filter */}
                <div className="flex gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
                  {['all', 'critical', 'high', 'medium', 'low'].map(s => (
                    <button key={s} onClick={() => setSeverityFilter(s)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all capitalize ${severityFilter === s ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-slate-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                {/* Bulk resolve */}
                {activeCount > 0 && (
                  <Button size="sm" variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs"
                    onClick={() => alerts.filter(a => a.status === 'active').forEach(a => handleResolve(a.id))}>
                    <CheckCircle className="w-3 h-3 mr-1" /> Resolve All
                  </Button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-16 text-slate-400">Loading alerts...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <CheckCircle className="w-16 h-16 text-green-500/30 mx-auto mb-4" />
                <h3 className="text-white font-semibold text-lg mb-1">
                  {statusFilter === 'all' && severityFilter === 'all' ? 'No Alerts' : 'No Matching Alerts'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {statusFilter === 'all' && severityFilter === 'all'
                    ? 'All clear! No security alerts at this time.'
                    : 'Try adjusting the filters above.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filtered.map(alert => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={handleAcknowledge}
                      onResolve={handleResolve}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}