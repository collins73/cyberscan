import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Code, Scan, FolderOpen, Bot, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const MODELS = [
  { value: 'automatic', label: 'Auto (Default)', description: 'GPT-4o-mini' },
  { value: 'claude_sonnet_4_6', label: 'Claude Sonnet', description: 'High quality · more credits' },
  { value: 'claude_opus_4_6', label: 'Claude Opus', description: 'Highest quality · most credits' },
  { value: 'gpt_5', label: 'GPT-5', description: 'High quality · more credits' },
];

const ACCEPTED_EXTENSIONS = '.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rb,.php,.html,.css,.json,.yaml,.yml,.sh,.sql,.swift,.kt,.rs';

export default function CodeInput({ onScanStart }) {
  const [code, setCode] = useState('');
  const [file, setFile] = useState(null);
  const [inputMode, setInputMode] = useState('paste');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedModel, setSelectedModel] = useState('automatic');
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [readError, setReadError] = useState('');
  const fileInputRef = useRef(null);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100)
  });

  const readFileContents = (selectedFile) => {
    if (!selectedFile) return;
    setReadError('');
    setFile(selectedFile);
    setIsReading(true);
    setCode('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string' && result.trim().length > 0) {
        setCode(result);
      } else {
        setReadError('File appears to be empty or unreadable. Please try a different file.');
      }
      setIsReading(false);
    };
    reader.onerror = () => {
      setReadError('Failed to read file. Make sure it is a plain text or source code file.');
      setIsReading(false);
    };
    reader.readAsText(selectedFile);
  };

  const handleFileInputChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) readFileContents(selected);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) readFileContents(dropped);
  };

  const handleClearFile = () => {
    setFile(null);
    setCode('');
    setReadError('');
  };

  const handleScan = () => {
    if (!code.trim()) {
      alert('No code to scan. Please paste code or upload a source file first.');
      return;
    }
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    onScanStart({
      code,
      fileName: file ? file.name : 'Manual Input',
      projectId: selectedProjectId || null,
      projectName: selectedProject?.name || null,
      model: selectedModel === 'automatic' ? null : selectedModel
    });
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/20 overflow-hidden">
      <div className="p-8">
        {/* Mode Toggle */}
        <div className="flex gap-3 mb-6">
          <Button
            type="button"
            variant={inputMode === 'paste' ? 'default' : 'outline'}
            onClick={() => setInputMode('paste')}
            className={inputMode === 'paste'
              ? 'bg-cyan-500 hover:bg-cyan-600 text-black font-semibold'
              : 'border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50'}
          >
            <Code className="w-4 h-4 mr-2" />
            Paste Code
          </Button>
          <Button
            type="button"
            variant={inputMode === 'upload' ? 'default' : 'outline'}
            onClick={() => setInputMode('upload')}
            className={inputMode === 'upload'
              ? 'bg-cyan-500 hover:bg-cyan-600 text-black font-semibold'
              : 'border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50'}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>

        {/* Paste Mode */}
        {inputMode === 'paste' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Hidden real file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileInputChange}
              className="hidden"
              aria-label="Upload source file"
            />

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleUploadClick}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all select-none ${
                isDragging
                  ? 'border-cyan-500 bg-cyan-500/10 scale-[1.01]'
                  : file && !readError
                  ? 'border-green-500/50 bg-green-500/5'
                  : readError
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-slate-700 hover:border-cyan-500/60 hover:bg-slate-800/60'
              }`}
            >
              {isReading ? (
                <>
                  <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-cyan-400 font-medium">Reading file…</p>
                </>
              ) : readError ? (
                <>
                  <XCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                  <p className="text-red-400 font-medium mb-1">Could not read file</p>
                  <p className="text-slate-500 text-sm mb-4">{readError}</p>
                  <Button type="button" size="sm" onClick={(e) => { e.stopPropagation(); handleClearFile(); }}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-xs">
                    Try another file
                  </Button>
                </>
              ) : file ? (
                <>
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p className="text-green-400 font-semibold mb-1">{file.name}</p>
                  <p className="text-slate-400 text-sm">{code.length.toLocaleString()} characters loaded — ready to scan</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleClearFile(); }}
                    className="mt-3 text-slate-500 text-xs underline hover:text-slate-300">
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-cyan-500" />
                  <p className="text-slate-200 font-medium mb-1">Click to upload or drag & drop</p>
                  <p className="text-slate-500 text-sm">JS, TS, Python, Java, Go, Ruby, PHP, C/C++, Swift, Rust, SQL, YAML, HTML, CSS</p>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Project Selector */}
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-violet-400" />
            <label className="text-slate-400 text-xs uppercase tracking-wide">Assign to Project (optional)</label>
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

        {/* Model Selector */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Bot className="w-3.5 h-3.5 text-orange-400" />
            <label className="text-slate-400 text-xs uppercase tracking-wide">AI Model</label>
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

        {/* Scan Button */}
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            onClick={handleScan}
            disabled={!code.trim() || isReading}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-bold px-8 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Scan className="w-5 h-5 mr-2" />
            {isReading ? 'Reading file…' : 'Initiate Security Scan'}
          </Button>
        </div>
      </div>
    </Card>
  );
}