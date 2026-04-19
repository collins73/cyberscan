import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, GitPullRequest, Loader2, CheckCircle, AlertTriangle, ExternalLink, ChevronRight, Zap } from 'lucide-react';

export default function AutoFixModal({ scanData, onClose }) {
  const { vulnerabilities, file_name, code_snippet } = scanData;

  const [repoFullName, setRepoFullName] = useState('');
  const [filePath, setFilePath] = useState(file_name && file_name !== 'Manual Input' ? file_name : '');
  const [branch, setBranch] = useState('main');
  const [originalCode, setOriginalCode] = useState(code_snippet || '');
  const [selectedVulnIds, setSelectedVulnIds] = useState(
    vulnerabilities?.filter(v => v.severity === 'critical' || v.severity === 'high').map((_, i) => i) || []
  );
  const [stage, setStage] = useState('configure'); // configure | running | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fixableVulns = vulnerabilities?.filter(v => v.severity !== 'low') || vulnerabilities || [];
  const selectedVulns = fixableVulns.filter((_, i) => selectedVulnIds.includes(i));

  const toggleVuln = (i) => {
    setSelectedVulnIds(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const severityColor = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500 text-black', low: 'bg-blue-500' };

  const handleSubmit = async () => {
    if (!repoFullName.trim()) return;
    if (!originalCode.trim()) return;
    if (selectedVulns.length === 0) return;

    setStage('running');
    setErrorMsg('');
    try {
      const response = await base44.functions.invoke('autoFixPR', {
        repoFullName: repoFullName.trim(),
        filePath: filePath.trim() || file_name,
        branch: branch.trim() || 'main',
        originalCode,
        vulnerabilities: selectedVulns,
        fileName: file_name
      });
      setResult(response.data);
      setStage('done');
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || err.message || 'Unknown error');
      setStage('error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-slate-900 border border-green-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <GitPullRequest className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Auto-Fix via GitHub PR</h2>
              <p className="text-slate-400 text-xs">LLM generates fixes and opens a pull request</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {stage === 'configure' && (
            <>
              {/* Repo Config */}
              <div className="space-y-3">
                <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">Repository</h3>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Repo (owner/name) *</label>
                  <input
                    value={repoFullName}
                    onChange={e => setRepoFullName(e.target.value)}
                    placeholder="e.g. octocat/hello-world"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-green-500/60 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">File path in repo *</label>
                    <input
                      value={filePath}
                      onChange={e => setFilePath(e.target.value)}
                      placeholder="src/app.py"
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-green-500/60 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Base branch</label>
                    <input
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
                      placeholder="main"
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-green-500/60 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Original Code */}
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Original file content *</label>
                <textarea
                  value={originalCode}
                  onChange={e => setOriginalCode(e.target.value)}
                  rows={6}
                  placeholder="Paste the full file content here…"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:border-green-500/60 focus:outline-none resize-y"
                />
                <p className="text-slate-500 text-xs mt-1">The LLM will rewrite this file with all selected fixes applied.</p>
              </div>

              {/* Vuln selection */}
              <div>
                <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide mb-2">
                  Select Vulnerabilities to Fix ({selectedVulns.length} selected)
                </h3>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {fixableVulns.map((v, i) => (
                    <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedVulnIds.includes(i) ? 'border-green-500/40 bg-green-500/5' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'}`}>
                      <input
                        type="checkbox"
                        checked={selectedVulnIds.includes(i)}
                        onChange={() => toggleVuln(i)}
                        className="mt-0.5 accent-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge className={`${severityColor[v.severity]} text-xs shrink-0`}>{v.severity}</Badge>
                          <span className="text-slate-200 text-sm font-medium truncate">{v.title}</span>
                        </div>
                        {v.recommendation && <p className="text-slate-500 text-xs mt-1 line-clamp-1">{v.recommendation}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!repoFullName.trim() || !originalCode.trim() || selectedVulns.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-3 disabled:opacity-40"
              >
                <Zap className="w-4 h-4 mr-2" />
                Generate Fix & Open Pull Request
              </Button>
            </>
          )}

          {stage === 'running' && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-green-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold text-lg">Generating fixes…</p>
              <p className="text-slate-400 text-sm mt-1">LLM is rewriting the file · Creating branch · Opening PR</p>
            </div>
          )}

          {stage === 'error' && (
            <div className="text-center py-10 space-y-4">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
              <p className="text-white font-semibold">Something went wrong</p>
              <p className="text-slate-400 text-sm bg-slate-950 border border-red-500/20 rounded p-3">{errorMsg}</p>
              <Button onClick={() => setStage('configure')} variant="outline" className="border-slate-700 text-slate-300">
                Back to Configure
              </Button>
            </div>
          )}

          {stage === 'done' && result && (
            <div className="space-y-5">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-white font-bold text-lg">Pull Request Created!</h3>
                <p className="text-slate-400 text-sm mt-1">{result.summary}</p>
              </div>

              <a
                href={result.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <GitPullRequest className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-green-400 font-semibold">View PR #{result.pr_number}</p>
                    <p className="text-slate-400 text-xs">{result.pr_url}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
              </a>

              {result.changes?.length > 0 && (
                <div>
                  <h4 className="text-slate-300 text-sm font-semibold mb-2">Changes Applied</h4>
                  <ul className="space-y-1.5">
                    {result.changes.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <ChevronRight className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                Done
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}