import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Code, Scan, FolderOpen, Bot, Github, GitBranch, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const MODELS = [
  { value: 'automatic', label: 'Auto (Default)', description: 'GPT-4o-mini' },
  { value: 'claude_sonnet_4_6', label: 'Claude Sonnet', description: 'High quality · more credits' },
  { value: 'claude_opus_4_6', label: 'Claude Opus', description: 'Highest quality · most credits' },
  { value: 'gpt_5', label: 'GPT-5', description: 'High quality · more credits' },
];

export default function CodeInput({ onScanStart }) {
  const [code, setCode] = useState('');
  const [file, setFile] = useState(null);
  const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'upload' | 'repo'
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedModel, setSelectedModel] = useState('automatic');

  // Repo scan state
  const [repoInput, setRepoInput] = useState('');
  const [repoBranch, setRepoBranch] = useState('main');
  const [repoScanning, setRepoScanning] = useState(false);
  const [repoResult, setRepoResult] = useState(null);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100)
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => setCode(event.target.result);
      reader.readAsText(selectedFile);
    }
  };

  const handleRepoScan = async () => {
    if (!repoInput.trim()) return;
    setRepoScanning(true);
    setRepoResult(null);
    try {
      const response = await base44.functions.invoke('prSecurityScan', {
        repos: [repoInput.trim()],
        branch: repoBranch.trim() || 'main',
      });
      setRepoResult(response.data);
    } catch (error) {
      setRepoResult({ error: error.message });
    } finally {
      setRepoScanning(false);
    }
  };

  const handleScan = () => {
    if (code.trim()) {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      onScanStart({
        code,
        fileName: file ? file.name : 'Manual Input',
        projectId: selectedProjectId || null,
        projectName: selectedProject?.name || null,
        model: selectedModel === 'automatic' ? null : selectedModel
      });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/20 overflow-hidden">
      <div className="p-8">
        {/* Mode Selector */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <Button
            variant={inputMode === 'paste' ? 'default' : 'outline'}
            onClick={() => setInputMode('paste')}
            className={inputMode === 'paste'
              ? 'bg-cyan-500 hover:bg-cyan-600 text-black font-semibold'
              : 'border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50'}
          >
            <Code className="w-4 h-4 mr-2" /> Paste Code
          </Button>
          <Button
            variant={inputMode === 'upload' ? 'default' : 'outline'}
            onClick={() => setInputMode('upload')}
            className={inputMode === 'upload'
              ? 'bg-cyan-500 hover:bg-cyan-600 text-black font-semibold'
              : 'border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50'}
          >
            <Upload className="w-4 h-4 mr-2" /> Upload File
          </Button>
          <Button
            variant={inputMode === 'repo' ? 'default' : 'outline'}
            onClick={() => { setInputMode('repo'); setRepoResult(null); }}
            className={inputMode === 'repo'
              ? 'bg-cyan-500 hover:bg-cyan-600 text-black font-semibold'
              : 'border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50'}
          >
            <Github className="w-4 h-4 mr-2" /> Scan Repository
          </Button>
        </div>

        {/* Paste Mode */}
        {inputMode === 'paste' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here for security analysis..."
              className="min-h-[300px] bg-slate-950 border-slate-700 text-slate-100 font-mono text-sm focus:border-cyan-500 focus:ring-cyan-500/20"
            />
          </motion.div>
        )}

        {/* Upload Mode */}
        {inputMode === 'upload' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center hover:border-cyan-500/50 transition-colors"
          >
            <input type="file" onChange={handleFileChange} className="hidden" id="file-upload"
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rb,.php,.html,.css" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-cyan-500" />
              <p className="text-slate-300 mb-2">{file ? file.name : 'Click to upload or drag and drop'}</p>
              <p className="text-slate-500 text-sm">Supports: JS, TS, Python, Java, C++, Go, Ruby, PHP, HTML, CSS</p>
            </label>
          </motion.div>
        )}

        {/* Repo Scan Mode */}
        {inputMode === 'repo' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs uppercase mb-1.5 flex items-center gap-1.5">
                  <Github className="w-3 h-3" /> Repository (owner/repo)
                </label>
                <input
                  type="text"
                  value={repoInput}
                  onChange={e => setRepoInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRepoScan()}
                  placeholder="e.g. octocat/Hello-World"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-md px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none placeholder-slate-600"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs uppercase mb-1.5 flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3" /> Branch
                </label>
                <input
                  type="text"
                  value={repoBranch}
                  onChange={e => setRepoBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-md px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none placeholder-slate-600"
                />
              </div>

              {repoScanning && (
                <div className="flex items-center gap-3 bg-slate-800/60 border border-cyan-500/20 rounded-lg p-4 text-cyan-400 text-sm">
                  <Scan className="w-5 h-5 animate-spin" />
                  <span>Scanning open PRs in <strong>{repoInput}</strong> for vulnerabilities…</span>
                </div>
              )}

              {repoResult && !repoResult.error && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-1">
                  <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                    <CheckCircle className="w-4 h-4" /> Scan Complete
                  </div>
                  <p className="text-slate-300 text-sm">
                    <span className="text-white font-semibold">{repoResult.scanned ?? 0}</span> PR{(repoResult.scanned ?? 0) !== 1 ? 's' : ''} scanned
                    &nbsp;·&nbsp;
                    <span className="text-white font-semibold">
                      {(repoResult.results || []).reduce((sum, r) => sum + (r.vulns || 0), 0)}
                    </span> vulnerabilities found
                  </p>
                  {repoResult.scanned === 0 && (
                    <p className="text-slate-500 text-xs mt-1">No new open PRs found (or all were already scanned).</p>
                  )}
                </motion.div>
              )}

              {repoResult?.error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                  Error: {repoResult.error}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleRepoScan}
                  disabled={!repoInput.trim() || repoScanning}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-bold px-8 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Github className="w-5 h-5 mr-2" />
                  {repoScanning ? 'Scanning…' : 'Scan Repository'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Project Selector + Model Selector + Scan Button — only for paste/upload modes */}
        {inputMode !== 'repo' && (
          <>
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-violet-400" />
                <label className="text-slate-400 text-xs uppercase">Assign to Project (optional)</label>
              </div>
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

            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Bot className="w-3.5 h-3.5 text-orange-400" />
                <label className="text-slate-400 text-xs uppercase">AI Model</label>
              </div>
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

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleScan}
                disabled={!code.trim()}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-bold px-8 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Scan className="w-5 h-5 mr-2" />
                Initiate Security Scan
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}