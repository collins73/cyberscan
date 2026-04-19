import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Plus, Shield, AlertTriangle, TrendingDown, TrendingUp, ArrowLeft, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import ProjectForm from '../components/projects/ProjectForm';
import ProjectDebtChart from '../components/projects/ProjectDebtChart';

export default function Projects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100)
  });

  const { data: scans = [] } = useQuery({
    queryKey: ['codeScans'],
    queryFn: () => base44.entities.CodeScan.list('-created_date', 500)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
    }
  });

  // Compute per-project stats from scans
  const projectStats = projects.map(project => {
    const projectScans = scans.filter(s => s.project_id === project.id);
    const totalVulns = projectScans.reduce((sum, s) => sum + (s.vulnerabilities?.length || 0), 0);
    const criticalVulns = projectScans.reduce((sum, s) => sum + (s.vulnerabilities?.filter(v => v.severity === 'critical').length || 0), 0);
    const highVulns = projectScans.reduce((sum, s) => sum + (s.vulnerabilities?.filter(v => v.severity === 'high').length || 0), 0);
    const avgScore = projectScans.length
      ? Math.round(projectScans.reduce((sum, s) => sum + (s.overall_score || 0), 0) / projectScans.length)
      : null;
    const lastScan = projectScans[0] || null;
    const trend = projectScans.length >= 2
      ? (projectScans[0].overall_score || 0) - (projectScans[1].overall_score || 0)
      : 0;
    return { ...project, projectScans, totalVulns, criticalVulns, highVulns, avgScore, lastScan, trend };
  });

  const getScoreColor = (score) => {
    if (score === null) return 'text-slate-500';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusBadge = (score) => {
    if (score === null) return <Badge className="bg-slate-700 text-slate-400">No scans</Badge>;
    if (score >= 80) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Healthy</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Fair</Badge>;
    if (score >= 40) return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">At Risk</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
  };

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
                <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-xl">
                  <FolderOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Projects</h1>
                  <p className="text-violet-400 text-sm font-medium">Security Debt Tracker by Repository</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => navigate('/Scanner')} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Scanner
                </Button>
                <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600 text-white font-semibold">
                  <Plus className="w-4 h-4 mr-2" /> New Project
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          {/* Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Projects', value: projects.length, color: 'text-violet-400' },
              { label: 'Total Scans', value: scans.filter(s => s.project_id).length, color: 'text-cyan-400' },
              { label: 'Critical Vulns', value: projectStats.reduce((s, p) => s + p.criticalVulns, 0), color: 'text-red-400' },
              { label: 'Avg Score', value: projectStats.filter(p => p.avgScore !== null).length
                  ? Math.round(projectStats.filter(p => p.avgScore !== null).reduce((s, p) => s + p.avgScore, 0) / projectStats.filter(p => p.avgScore !== null).length)
                  : '—', color: 'text-green-400' }
            ].map(stat => (
              <Card key={stat.label} className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-5">
                  <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Projects List */}
          {loadingProjects ? (
            <div className="text-center text-slate-400 py-12">Loading projects...</div>
          ) : projects.length === 0 ? (
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-16 text-center">
                <FolderOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h3 className="text-white font-semibold text-lg mb-2">No projects yet</h3>
                <p className="text-slate-400 mb-6">Create a project to start grouping scans and tracking security debt.</p>
                <Button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Create First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projectStats.map((project) => (
                <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-slate-900/60 border-slate-800 hover:border-violet-500/30 transition-colors">
                    <CardContent className="p-0">
                      {/* Project Row */}
                      <div
                        className="flex items-center justify-between p-5 cursor-pointer"
                        onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-violet-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-semibold">{project.name}</h3>
                              {getStatusBadge(project.avgScore)}
                              {project.language && (
                                <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">{project.language}</Badge>
                              )}
                            </div>
                            {project.description && (
                              <p className="text-slate-500 text-xs mt-0.5">{project.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="hidden sm:flex gap-6 text-center">
                            <div>
                              <p className="text-slate-500 text-xs">Avg Score</p>
                              <p className={`font-bold text-lg ${getScoreColor(project.avgScore)}`}>
                                {project.avgScore ?? '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Scans</p>
                              <p className="font-bold text-lg text-slate-300">{project.projectScans.length}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Critical</p>
                              <p className="font-bold text-lg text-red-400">{project.criticalVulns}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Trend</p>
                              <p className={`font-bold text-lg flex items-center ${project.trend > 0 ? 'text-green-400' : project.trend < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                {project.trend > 0 ? <TrendingUp className="w-4 h-4" /> : project.trend < 0 ? <TrendingDown className="w-4 h-4" /> : '—'}
                                {project.trend !== 0 && Math.abs(project.trend)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {project.repository_url && (
                              <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); window.open(project.repository_url, '_blank'); }}>
                                <ExternalLink className="w-4 h-4 text-slate-400" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteMutation.mutate(project.id); }}
                              className="hover:text-red-400 text-slate-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            {expandedProject === project.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded: scan history + chart */}
                      <AnimatePresence>
                        {expandedProject === project.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-800"
                          >
                            <div className="p-5 space-y-4">
                              {project.projectScans.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-4">
                                  No scans yet. Assign this project when scanning code.
                                </p>
                              ) : (
                                <>
                                  <ProjectDebtChart scans={project.projectScans} />
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {project.projectScans.map(scan => (
                                      <div key={scan.id} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-4 py-2">
                                        <div className="flex items-center gap-3">
                                          <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                          <span className="text-slate-300 text-sm font-mono">{scan.file_name}</span>
                                          <span className="text-slate-500 text-xs">{new Date(scan.created_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-red-400 text-xs">{scan.vulnerabilities?.filter(v => v.severity === 'critical').length || 0} critical</span>
                                          <Badge className={`text-xs ${
                                            (scan.overall_score || 0) >= 80 ? 'bg-green-500/20 text-green-400' :
                                            (scan.overall_score || 0) >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'}`}>
                                            {scan.overall_score ?? '?'}/100
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      <AnimatePresence>
        {showForm && (
          <ProjectForm
            onSubmit={(data) => createMutation.mutate(data)}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}