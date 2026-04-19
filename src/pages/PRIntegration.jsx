import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GitPullRequest, Plus, Trash2, Play, Shield, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function PRIntegration() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newRepo, setNewRepo] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['codeScans'],
    queryFn: () => base44.entities.CodeScan.list('-created_date'),
  });

  const addMutation = useMutation({
    mutationFn: (repo) => {
      // Store repo config as scan metadata (placeholder for now)
      return Promise.resolve({ success: true });
    },
    onSuccess: () => { setNewRepo(''); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CodeScan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['codeScans'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => {
      // Toggle tracked repos (placeholder for now)
      return Promise.resolve({ success: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['codeScans'] }),
  });

  const handleAdd = () => {
    const trimmed = newRepo.trim();
    if (!trimmed || !trimmed.includes('/')) return;
    addMutation.mutate(trimmed);
  };

  const handleRunNow = async () => {
    const enabledRepos = configs.filter(c => c.enabled).map(c => c.repo_full_name);
    if (!enabledRepos.length) return;
    setIsRunning(true);
    setScanResult(null);
    try {
      const res = await base44.functions.invoke('prSecurityScan', { repos: enabledRepos });
      setScanResult(res.data);
    } catch (e) {
      setScanResult({ error: e.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDIxNywyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

      <div className="relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl">
                <GitPullRequest className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">PR Security Scanner</h1>
                <p className="text-violet-400 text-sm font-medium">Auto-scan pull requests & post vulnerability comments</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/Scanner')}
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Scanner
            </Button>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

          {/* How it works */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-violet-500/20 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-400" /> How it works
            </h2>
            <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
              <li>Add GitHub repositories below (in <code className="text-violet-300">owner/repo</code> format)</li>
              <li>Every 5 minutes, open PRs are polled for new/unscanned entries</li>
              <li>Changed code files in each PR are scanned by the AI security engine</li>
              <li>A vulnerability summary comment is posted directly on the PR</li>
              <li>Scan results are saved to CodeGuard analytics</li>
            </ol>
          </motion.div>

          {/* Add Repo */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Add Repository</h2>
            <div className="flex gap-3">
              <Input
                placeholder="owner/repository (e.g. acme/my-app)"
                value={newRepo}
                onChange={e => setNewRepo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 flex-1"
              />
              <Button onClick={handleAdd} disabled={addMutation.isPending || !newRepo.includes('/')}
                className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
          </motion.div>

          {/* Repo List */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Watched Repositories</h2>
              <Button onClick={handleRunNow} disabled={isRunning || !configs.some(c => c.enabled)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-bold">
                {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                {isRunning ? 'Scanning...' : 'Run Now'}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              </div>
            ) : configs.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <GitPullRequest className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No repositories added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {configs.map(config => (
                  <div key={config.id}
                    className="flex items-center justify-between bg-slate-900/60 rounded-lg px-4 py-3 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <GitPullRequest className="w-4 h-4 text-violet-400" />
                      <span className="text-white font-mono text-sm">{config.repo_full_name}</span>
                      {config.last_checked && (
                        <span className="text-slate-500 text-xs">
                          Last checked: {new Date(config.last_checked).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleMutation.mutate({ id: config.id, enabled: !config.enabled })}>
                        {config.enabled
                          ? <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 cursor-pointer">Active</Badge>
                          : <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 cursor-pointer">Paused</Badge>}
                      </button>
                      <Button size="icon" variant="ghost"
                        onClick={() => deleteMutation.mutate(config.id)}
                        className="text-slate-500 hover:text-red-400 h-7 w-7">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Scan Results */}
          {scanResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Last Run Results</h2>
              {scanResult.error ? (
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-5 h-5" /> {scanResult.error}
                </div>
              ) : scanResult.scanned === 0 ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  No new PRs to scan (all open PRs already have a comment).
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-emerald-400 text-sm mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Scanned {scanResult.scanned} PR(s) and posted comments.
                  </p>
                  {(scanResult.results || []).map((r, i) => (
                    <div key={i} className="bg-slate-900/60 rounded-lg px-4 py-3 flex items-center justify-between">
                      <span className="text-white font-mono text-sm">{r.repo} — PR #{r.pr}: {r.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={r.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : r.score >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}>
                          Score: {r.score}
                        </Badge>
                        <Badge className="bg-slate-700 text-slate-300">{r.vulns} issues</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}