import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Github, GitBranch, FolderOpen, Bot, Scan, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const MODELS = [
  { value: 'automatic', label: 'Auto', description: 'Default' },
  { value: 'claude_sonnet_4_6', label: 'Claude Sonnet', description: 'High quality' },
  { value: 'claude_opus_4_6', label: 'Claude Opus', description: 'Max quality' },
  { value: 'gpt_5', label: 'GPT-5', description: 'High quality' },
];

export default function RepoScanner({ onScanComplete, onScanStart }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedModel, setSelectedModel] = useState('automatic');
  const [maxFiles, setMaxFiles] = useState(15);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState('');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100)
  });

  const handleScan = async () => {
    if (!repoUrl.trim()) return;

    setIsScanning(true);
    onScanStart?.();

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    try {
      setProgress(`Scanning up to ${maxFiles} files — this can take 1–2 minutes for larger repos...`);
      const response = await base44.functions.invoke('scanRepository', {
        repoUrl: repoUrl.trim(),
        branch: branch.trim() || null,
        projectId: selectedProjectId || null,
        projectName: selectedProject?.name || null,
        maxFiles,
        model: selectedModel === 'automatic' ? null : selectedModel
      });

      onScanComplete?.(response.data.scan, response.data);
    } catch (error) {
      const status = error.response?.status;
      let msg = error.response?.data?.error || error.message || 'Unknown server error';
      // A timeout / network abort usually means the scan is still running but the browser gave up
      if (!error.response || status === 504 || /timeout|network|aborted/i.test(msg)) {
        msg = 'The scan took too long and the connection timed out. Try lowering "Max Files to Scan" to 10–15 and scan again.';
      }
      alert(`Repository scan failed: ${msg}`);
      console.error('scanRepository error:', error);
    } finally {
      setIsScanning(false);
      setProgress('');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/20 overflow-hidden">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Github className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Repository Scanner</h3>
            <p className="text-slate-400 text-sm">Scan entire GitHub codebases via the cloud</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6 text-xs text-blue-300">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Fetches and analyzes up to <strong>{maxFiles} files</strong> from your repository using the GitHub API.
            Private repos require a valid <code className="bg-slate-800 px-1 rounded">GITHUB_TOKEN</code> with <code className="bg-slate-800 px-1 rounded">repo</code> scope.
          </span>
        </div>

        {/* Repo URL */}
        <div className="mb-4">
          <label className="text-slate-400 text-xs uppercase mb-1.5 flex items-center gap-1.5">
            <Github className="w-3 h-3" /> Repository URL
          </label>
          <Input
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo  or  owner/repo"
            className="bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500"
          />
        </div>

        {/* Branch + Max Files */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-slate-400 text-xs uppercase mb-1.5 flex items-center gap-1.5">
              <GitBranch className="w-3 h-3" /> Branch
            </label>
            <Input
              value={branch}
              onChange={e => setBranch(e.target.value)}
              placeholder="auto-detect (default branch)"
              className="bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs uppercase mb-1.5 flex items-center gap-1.5">
              <FolderOpen className="w-3 h-3" /> Max Files to Scan
            </label>
            <select
              value={maxFiles}
              onChange={e => setMaxFiles(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-md px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            >
              <option value={10}>10 files (fast)</option>
              <option value={20}>20 files</option>
              <option value={30}>30 files (recommended)</option>
              <option value={50}>50 files (thorough)</option>
              <option value={80}>80 files (deep scan)</option>
            </select>
          </div>
        </div>

        {/* Project Selector */}
        <div className="mb-4">
          <label className="text-slate-400 text-xs uppercase mb-1.5 flex items-center gap-1.5">
            <FolderOpen className="w-3 h-3 text-violet-400" /> Assign to Project (optional)
          </label>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-md px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="">— No project —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Model Selector */}
        <div className="mb-6">
          <label className="text-slate-400 text-xs uppercase mb-1.5 flex items-center gap-1.5">
            <Bot className="w-3 h-3 text-orange-400" /> AI Model
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MODELS.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setSelectedModel(m.value)}
                className={`px-3 py-2 rounded-lg border text-left transition-all ${
                  selectedModel === m.value
                    ? 'border-orange-500/60 bg-orange-500/10 text-orange-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <p className="text-xs font-semibold leading-tight">{m.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{m.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Warning for large scans */}
        {maxFiles >= 50 && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Large scans may take 2–5 minutes and use more AI credits. Consider starting with 30 files.</span>
          </div>
        )}

        {/* Progress */}
        {isScanning && progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 text-sm text-cyan-400 flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            {progress}
          </motion.div>
        )}

        {/* Scan Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleScan}
            disabled={!repoUrl.trim() || isScanning}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-bold px-8 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Scan className="w-5 h-5 mr-2" />
            {isScanning ? 'Scanning Repository...' : 'Scan Repository'}
          </Button>
        </div>
      </div>
    </Card>
  );
}