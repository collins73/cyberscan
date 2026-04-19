import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Plus, Trash2, Clock, ToggleLeft, ToggleRight, Save, Bell, Github, Globe, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

const FREQUENCIES = [
  { value: 'hourly', label: 'Every Hour', desc: 'Runs once per hour' },
  { value: 'daily', label: 'Daily', desc: 'Runs once per day' },
  { value: 'weekly', label: 'Weekly', desc: 'Runs once per week' },
  { value: 'monthly', label: 'Monthly', desc: 'Runs once per month' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TARGET_TYPES = [
  { value: 'repository', label: 'Repository URL', icon: Github, placeholder: 'https://github.com/org/repo' },
  { value: 'url', label: 'Web URL / API', icon: Globe, placeholder: 'https://example.com/api' },
  { value: 'file_pattern', label: 'File Pattern', icon: FileCode, placeholder: '*.py, src/**/*.js' },
];

const calcNextRun = (freq, day, time) => {
  const now = new Date();
  const [h, m] = (time || '09:00').split(':').map(Number);
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setHours(h, m);
  if (next <= now) {
    if (freq === 'hourly') next.setHours(next.getHours() + 1);
    else if (freq === 'daily') next.setDate(next.getDate() + 1);
    else if (freq === 'weekly') next.setDate(next.getDate() + 7);
    else if (freq === 'monthly') next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString();
};

function ScheduleForm({ onSave, onCancel, existing }) {
  const [form, setForm] = useState(existing || {
    name: '',
    target: '',
    target_type: 'repository',
    frequency: 'daily',
    day_of_week: 'monday',
    time_of_day: '09:00',
    notify_on_critical: true,
    notify_on_high: true,
    notify_on_any: false,
    enabled: true,
    notes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim() || !form.target.trim()) return;
    onSave({ ...form, next_run: calcNextRun(form.frequency, form.day_of_week, form.time_of_day) });
  };

  const TargetIcon = TARGET_TYPES.find(t => t.value === form.target_type)?.icon || Globe;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-300 text-xs mb-1 block">Schedule Name *</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Daily API Security Scan"
            className="bg-slate-900 border-slate-700 text-white" />
        </div>
        <div>
          <Label className="text-slate-300 text-xs mb-1 block">Target Type</Label>
          <Select value={form.target_type} onValueChange={v => set('target_type', v)}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-slate-300 text-xs mb-1 block flex items-center gap-1">
          <TargetIcon className="w-3 h-3" /> Target *
        </Label>
        <Input value={form.target} onChange={e => set('target', e.target.value)}
          placeholder={TARGET_TYPES.find(t => t.value === form.target_type)?.placeholder}
          className="bg-slate-900 border-slate-700 text-white font-mono text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-slate-300 text-xs mb-1 block">Frequency</Label>
          <Select value={form.frequency} onValueChange={v => set('frequency', v)}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {form.frequency === 'weekly' && (
          <div>
            <Label className="text-slate-300 text-xs mb-1 block">Day of Week</Label>
            <Select value={form.day_of_week} onValueChange={v => set('day_of_week', v)}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {form.frequency !== 'hourly' && (
          <div>
            <Label className="text-slate-300 text-xs mb-1 block flex items-center gap-1"><Clock className="w-3 h-3" /> Time</Label>
            <Input type="time" value={form.time_of_day} onChange={e => set('time_of_day', e.target.value)}
              className="bg-slate-900 border-slate-700 text-white" />
          </div>
        )}
      </div>

      {/* Notification prefs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
        <h4 className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-rose-400" /> Alert Notifications
        </h4>
        <div className="space-y-2">
          {[
            { key: 'notify_on_critical', label: 'Alert on Critical vulnerabilities', color: 'text-red-400' },
            { key: 'notify_on_high', label: 'Alert on High vulnerabilities', color: 'text-orange-400' },
            { key: 'notify_on_any', label: 'Alert on any new vulnerability', color: 'text-yellow-400' },
          ].map(opt => (
            <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form[opt.key]} onChange={e => set(opt.key, e.target.checked)}
                className="w-4 h-4 accent-rose-500" />
              <span className={`text-sm ${opt.color}`}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-slate-300 text-xs mb-1 block">Notes (optional)</Label>
        <Input value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Any context about this scan..."
          className="bg-slate-900 border-slate-700 text-white" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="border-slate-700 text-slate-300">Cancel</Button>
        <Button onClick={handleSave} disabled={!form.name.trim() || !form.target.trim()}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold">
          <Save className="w-4 h-4 mr-2" /> Save Schedule
        </Button>
      </div>
    </div>
  );
}

export default function ScheduleModal({ onClose }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: schedules = [] } = useQuery({
    queryKey: ['scheduledScans'],
    queryFn: () => base44.entities.ScheduledScan.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ScheduledScan.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scheduledScans'] }); setShowForm(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScheduledScan.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scheduledScans'] }); setShowForm(false); setEditingId(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledScan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduledScans'] })
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => base44.entities.ScheduledScan.update(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduledScans'] })
  });

  const handleSave = (formData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (s) => { setEditingId(s.id); setShowForm(true); };

  const freqBadgeColor = { hourly: 'bg-purple-500/20 text-purple-400', daily: 'bg-cyan-500/20 text-cyan-400', weekly: 'bg-blue-500/20 text-blue-400', monthly: 'bg-indigo-500/20 text-indigo-400' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-slate-950 border border-cyan-500/30 rounded-xl max-w-3xl w-full shadow-2xl my-8">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Scheduled Scans</h2>
              <p className="text-cyan-400 text-xs">Automate recurring security scans</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showForm && (
              <Button onClick={() => { setShowForm(true); setEditingId(null); }}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm">
                <Plus className="w-4 h-4 mr-1" /> New Schedule
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5 text-slate-400" /></Button>
          </div>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-slate-900/60 border border-cyan-500/20 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">{editingId ? 'Edit Schedule' : 'Create New Schedule'}</h3>
                <ScheduleForm
                  existing={editingId ? schedules.find(s => s.id === editingId) : null}
                  onSave={handleSave}
                  onCancel={() => { setShowForm(false); setEditingId(null); }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Schedules list */}
          {schedules.length === 0 && !showForm ? (
            <div className="text-center py-16">
              <Calendar className="w-14 h-14 text-slate-700 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-1">No Scheduled Scans</h3>
              <p className="text-slate-400 text-sm mb-5">Create your first schedule to automate security scanning.</p>
              <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                <Plus className="w-4 h-4 mr-2" /> Create First Schedule
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map(s => (
                <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className={`border ${s.enabled ? 'border-slate-800 bg-slate-900/40' : 'border-slate-800/50 bg-slate-900/20 opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-white font-semibold text-sm">{s.name}</h3>
                            <Badge className={`${freqBadgeColor[s.frequency] || 'bg-slate-700 text-slate-300'} text-xs border-0`}>
                              {s.frequency}
                            </Badge>
                            {s.notify_on_critical && <Badge className="bg-red-500/20 text-red-400 text-xs border-0">critical alerts</Badge>}
                          </div>
                          <p className="text-slate-500 text-xs font-mono truncate">{s.target}</p>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                            {s.frequency !== 'hourly' && s.time_of_day && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.time_of_day}{s.day_of_week && s.frequency === 'weekly' ? ` · ${s.day_of_week}` : ''}</span>}
                            {s.last_run && <span>Last run: {new Date(s.last_run).toLocaleDateString()}</span>}
                            {s.next_run && <span className="text-cyan-500">Next: {new Date(s.next_run).toLocaleDateString()}</span>}
                            {s.total_runs > 0 && <span>{s.total_runs} total runs</span>}
                            {s.last_vuln_count > 0 && <span className="text-orange-400">{s.last_vuln_count} vulns last scan</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => toggleMutation.mutate({ id: s.id, enabled: !s.enabled })}
                            className="text-slate-400 hover:text-cyan-400 transition-colors p-1">
                            {s.enabled ? <ToggleRight className="w-6 h-6 text-cyan-400" /> : <ToggleLeft className="w-6 h-6" />}
                          </button>
                          <Button size="sm" variant="ghost" onClick={() => startEdit(s)} className="text-slate-400 hover:text-white h-7 px-2 text-xs">Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(s.id)} className="text-slate-400 hover:text-red-400 h-7 px-2">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}