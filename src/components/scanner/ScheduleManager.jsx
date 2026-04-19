import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Trash2, ToggleRight, ToggleLeft, Clock, Bell, X, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import moment from 'moment';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SEVERITIES = [
  { value: 'critical', label: '🔴 Critical only' },
  { value: 'high', label: '🟠 High & above' },
  { value: 'medium', label: '🟡 Medium & above' },
  { value: 'low', label: '🔵 All severities' },
];

function calcNextRun(frequency, dayOfWeek, timeOfDay) {
  const now = moment();
  const [h, m] = (timeOfDay || '09:00').split(':').map(Number);

  if (frequency === 'daily') {
    const next = moment().hour(h).minute(m).second(0);
    if (next.isBefore(now)) next.add(1, 'day');
    return next.toISOString();
  }
  if (frequency === 'weekly') {
    const dayIdx = DAYS.indexOf(dayOfWeek || 'monday');
    const target = moment().day(dayIdx === -1 ? 1 : dayIdx + 1).hour(h).minute(m).second(0);
    if (target.isBefore(now)) target.add(1, 'week');
    return target.toISOString();
  }
  if (frequency === 'monthly') {
    const next = moment().date(1).add(1, 'month').hour(h).minute(m).second(0);
    return next.toISOString();
  }
  return null;
}

function ScheduleForm({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    target: '',
    target_type: 'repository',
    frequency: 'weekly',
    day_of_week: 'monday',
    time_of_day: '09:00',
    notify_on_new_vulns: true,
    notify_on_score_drop: true,
    min_severity_to_alert: 'high',
    notify_email: '',
    enabled: true,
  });

  const handleSave = () => {
    if (!form.name || !form.target) return;
    const nextRun = calcNextRun(form.frequency, form.day_of_week, form.time_of_day);
    onSave({ ...form, next_run: nextRun, run_count: 0 });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-slate-950 border border-cyan-500/30 rounded-xl max-w-lg w-full shadow-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h2 className="text-white font-bold">New Scheduled Scan</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></Button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <Label className="text-slate-300 text-xs mb-1 block">Schedule Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Nightly API Security Check"
              className="bg-slate-900 border-slate-700 text-white" />
          </div>

          <div>
            <Label className="text-slate-300 text-xs mb-1 block">Target (Repository URL or path) *</Label>
            <Input value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              placeholder="https://github.com/org/repo or /src/api"
              className="bg-slate-900 border-slate-700 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Target Type</Label>
              <Select value={form.target_type} onValueChange={v => setForm(f => ({ ...f, target_type: v }))}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="repository">Repository</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="code_snippet">Code Snippet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Frequency</Label>
              <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {form.frequency === 'weekly' && (
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Day of Week</Label>
                <Select value={form.day_of_week} onValueChange={v => setForm(f => ({ ...f, day_of_week: v }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => <SelectItem key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Time of Day</Label>
              <Input type="time" value={form.time_of_day} onChange={e => setForm(f => ({ ...f, time_of_day: e.target.value }))}
                className="bg-slate-900 border-slate-700 text-white" />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <Label className="text-slate-300 text-sm mb-3 block flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" /> Alert Settings
            </Label>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Minimum Severity to Alert</Label>
                <Select value={form.min_severity_to_alert} onValueChange={v => setForm(f => ({ ...f, min_severity_to_alert: v }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Notification Email (optional)</Label>
                <Input type="email" value={form.notify_email} onChange={e => setForm(f => ({ ...f, notify_email: e.target.value }))}
                  placeholder="security@yourcompany.com"
                  className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div className="flex gap-6">
                {[
                  { key: 'notify_on_new_vulns', label: 'Alert on new vulnerabilities' },
                  { key: 'notify_on_score_drop', label: 'Alert on score drop' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[opt.key]} onChange={e => setForm(f => ({ ...f, [opt.key]: e.target.checked }))}
                      className="w-4 h-4 accent-cyan-500" />
                    <span className="text-slate-300 text-xs">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-800">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name || !form.target}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-semibold">
            <Save className="w-4 h-4 mr-2" /> Schedule Scan
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ScheduleManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: schedules = [] } = useQuery({
    queryKey: ['scheduledScans'],
    queryFn: () => base44.entities.ScheduledScan.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ScheduledScan.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scheduledScans'] }); setShowForm(false); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => base44.entities.ScheduledScan.update(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduledScans'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledScan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduledScans'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-bold">Scheduled Scans</h3>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">{schedules.length}</Badge>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-semibold text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Schedule
        </Button>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-700 rounded-xl">
          <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-3">No scheduled scans yet</p>
          <Button size="sm" onClick={() => setShowForm(true)} variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Create First Schedule
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((sched, i) => (
            <motion.div key={sched.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className={`bg-slate-900/60 border-slate-800 ${!sched.enabled ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-semibold text-sm">{sched.name}</span>
                        <Badge className={`text-xs capitalize ${sched.frequency === 'daily' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : sched.frequency === 'weekly' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                          {sched.frequency}
                        </Badge>
                        {!sched.enabled && <Badge className="text-xs bg-slate-700 text-slate-400">Paused</Badge>}
                      </div>
                      <p className="text-slate-500 text-xs truncate mb-1">{sched.target}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {sched.time_of_day && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sched.time_of_day}{sched.day_of_week ? ` · ${sched.day_of_week}` : ''}</span>}
                        {sched.notify_on_new_vulns && <span className="flex items-center gap-1 text-amber-400"><Bell className="w-3 h-3" />Alerts on</span>}
                        <span>{sched.run_count || 0} runs</span>
                        {sched.last_run && <span>Last: {moment(sched.last_run).fromNow()}</span>}
                      </div>
                      {sched.last_score !== undefined && sched.last_score !== null && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-slate-500 text-xs">Last score:</span>
                          <span className={`text-xs font-bold ${sched.last_score >= 80 ? 'text-green-400' : sched.last_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {sched.last_score}/100
                          </span>
                          {sched.last_vuln_count > 0 && (
                            <span className="text-xs text-slate-500">{sched.last_vuln_count} vulns found</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleMutation.mutate({ id: sched.id, enabled: !sched.enabled })}
                        className="text-slate-400 hover:text-cyan-400 transition-colors">
                        {sched.enabled ? <ToggleRight className="w-6 h-6 text-cyan-400" /> : <ToggleLeft className="w-6 h-6" />}
                      </button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(sched.id)}
                        className="text-red-400 hover:bg-red-500/10 p-1">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <ScheduleForm
            onClose={() => setShowForm(false)}
            onSave={(data) => createMutation.mutate(data)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}