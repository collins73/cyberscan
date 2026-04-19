import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Ruby', 'PHP', 'C++', 'C#', 'Rust', 'Other'];

export default function ProjectForm({ onSubmit, onClose }) {
  const [form, setForm] = useState({ name: '', description: '', repository_url: '', language: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="bg-slate-950 border border-violet-500/30 rounded-xl w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600/20 rounded-lg">
              <FolderOpen className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-white font-bold">New Project</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4 text-slate-400" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-slate-400 text-xs uppercase mb-1.5 block">Project Name *</label>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. my-api-service"
              className="bg-slate-900 border-slate-700 text-white focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs uppercase mb-1.5 block">Description</label>
            <Input
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Short description..."
              className="bg-slate-900 border-slate-700 text-white focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs uppercase mb-1.5 block">Repository URL</label>
            <Input
              value={form.repository_url}
              onChange={e => setForm({ ...form, repository_url: e.target.value })}
              placeholder="https://github.com/org/repo"
              className="bg-slate-900 border-slate-700 text-white focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs uppercase mb-1.5 block">Primary Language</label>
            <select
              value={form.language}
              onChange={e => setForm({ ...form, language: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            >
              <option value="">Select language...</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
            <Button type="submit" disabled={!form.name.trim()} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold">
              Create Project
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}