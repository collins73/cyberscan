import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Crosshair, CheckCircle, Clock, Filter, Download, RefreshCw, Zap, Target, Bug, Lock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import RedTeamMetrics from '../components/redteam/RedTeamMetrics';
import VulnerabilityTable from '../components/redteam/VulnerabilityTable';
import ExploitSimulator from '../components/redteam/ExploitSimulator';

export default function RedTeam() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [showExploit, setShowExploit] = useState(false);

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ['codeScans'],
    queryFn: () => base44.entities.CodeScan.list('-created_date', 200)
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['vulnerabilityMetrics'],
    queryFn: () => base44.entities.VulnerabilityMetric.list('-created_date', 1000)
  });

  // Flatten all vulnerabilities from all scans into a red team list
  const allVulnerabilities = scans.flatMap(scan =>
    (scan.vulnerabilities || []).map((v, i) => ({
      ...v,
      id: `${scan.id}-${i}`,
      scan_id: scan.id,
      file_name: scan.file_name,
      language: scan.language,
      scan_date: scan.created_date,
      status: v.status || 'open',
      assigned_to: v.assigned_to || null,
      exploit_tested: v.exploit_tested || false
    }))
  );

  const criticalAndHigh = allVulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high');

  const filtered = allVulnerabilities.filter(v => {
    const sevMatch = filterSeverity === 'all' || v.severity === filterSeverity;
    const statusMatch = filterStatus === 'all' || (v.status || 'open') === filterStatus;
    return sevMatch && statusMatch;
  });

  const handleExploit = (vuln) => {
    setSelectedVuln(vuln);
    setShowExploit(true);
  };

  const exportCSV = () => {
    const rows = [
      ['File', 'Vulnerability', 'Severity', 'Status', 'Line', 'Description', 'Scan Date'],
      ...filtered.map(v => [
        v.file_name, v.title, v.severity, v.status || 'open',
        v.line_number || '', `"${(v.description || '').replace(/"/g, "'")}"`,
        new Date(v.scan_date).toLocaleDateString()
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'redteam-vulns.csv'; a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/10 to-slate-950">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMCwwLDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-red-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl">
                  <Crosshair className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Red Team Tracker</h1>
                  <p className="text-red-400 text-sm font-medium">Exploit Simulation & Vulnerability Management</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => navigate('/Scanner')} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <Shield className="w-4 h-4 mr-2" /> Scanner
                </Button>
                <Button variant="outline" onClick={() => navigate('/Analytics')} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <BarChart3 className="w-4 h-4 mr-2" /> Analytics
                </Button>
                <Button onClick={exportCSV} className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-semibold">
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          {/* Metrics */}
          <RedTeamMetrics vulnerabilities={allVulnerabilities} />

          {/* Filters + Table */}
          <Card className="bg-slate-900/60 border-red-500/20">
            <CardHeader className="border-b border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Bug className="w-5 h-5 text-red-400" />
                  Vulnerability Tracker
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-2">
                    {filtered.length} findings
                  </Badge>
                </CardTitle>
                <div className="flex gap-3">
                  <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                    <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-300">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-300">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="exploited">Exploited</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-red-400" />
                  Loading vulnerability data...
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <Target className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400">No vulnerabilities found. Run a scan first.</p>
                  <Button onClick={() => navigate('/Scanner')} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
                    Run Scan
                  </Button>
                </div>
              ) : (
                <VulnerabilityTable
                  vulnerabilities={filtered}
                  onExploit={handleExploit}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Exploit Simulator Modal */}
      <AnimatePresence>
        {showExploit && selectedVuln && (
          <ExploitSimulator
            vulnerability={selectedVuln}
            onClose={() => { setShowExploit(false); setSelectedVuln(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}