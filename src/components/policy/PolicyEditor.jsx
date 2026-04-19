import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Save, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CONDITION_TYPES = [
  { value: 'min_security_score', label: 'Min Security Score', placeholder: '70' },
  { value: 'max_critical_vulns', label: 'Max Critical Vulnerabilities', placeholder: '0' },
  { value: 'max_high_vulns', label: 'Max High Vulnerabilities', placeholder: '2' },
  { value: 'max_total_vulns', label: 'Max Total Vulnerabilities', placeholder: '10' },
  { value: 'forbidden_vuln_type', label: 'Forbidden Vulnerability Type', placeholder: 'SQL Injection' },
  { value: 'max_severity_count', label: 'Max Vulnerabilities of Severity', placeholder: 'critical:0' }
];

const FRAMEWORKS = ['OWASP Top 10', 'PCI DSS', 'GDPR', 'HIPAA', 'SOC 2', 'NIST', 'ISO 27001', 'Custom'];

const PRESET_RULES = {
  'OWASP Top 10': [
    { name: 'No Critical Injection Flaws', condition_type: 'max_critical_vulns', condition_value: '0', severity: 'blocker' },
    { name: 'Minimum Security Score', condition_type: 'min_security_score', condition_value: '70', severity: 'blocker' },
    { name: 'No SQL Injection', condition_type: 'forbidden_vuln_type', condition_value: 'SQL Injection', severity: 'blocker' },
    { name: 'No XSS', condition_type: 'forbidden_vuln_type', condition_value: 'Cross-Site Scripting', severity: 'blocker' },
    { name: 'Max High Vulns', condition_type: 'max_high_vulns', condition_value: '3', severity: 'warning' }
  ],
  'PCI DSS': [
    { name: 'Zero Critical Vulnerabilities', condition_type: 'max_critical_vulns', condition_value: '0', severity: 'blocker' },
    { name: 'No Hardcoded Secrets', condition_type: 'forbidden_vuln_type', condition_value: 'Hardcoded', severity: 'blocker' },
    { name: 'High Security Score Required', condition_type: 'min_security_score', condition_value: '80', severity: 'blocker' },
    { name: 'Max High Vulnerabilities', condition_type: 'max_high_vulns', condition_value: '0', severity: 'blocker' }
  ],
  'GDPR': [
    { name: 'No Insecure Data Handling', condition_type: 'forbidden_vuln_type', condition_value: 'Insecure', severity: 'blocker' },
    { name: 'No Cryptographic Weaknesses', condition_type: 'forbidden_vuln_type', condition_value: 'Cryptographic', severity: 'blocker' },
    { name: 'Minimum Security Score', condition_type: 'min_security_score', condition_value: '75', severity: 'blocker' }
  ],
  'HIPAA': [
    { name: 'Zero Critical Vulnerabilities', condition_type: 'max_critical_vulns', condition_value: '0', severity: 'blocker' },
    { name: 'No Authentication Issues', condition_type: 'forbidden_vuln_type', condition_value: 'Authentication', severity: 'blocker' },
    { name: 'High Security Score', condition_type: 'min_security_score', condition_value: '85', severity: 'blocker' }
  ]
};

const newRule = () => ({
  id: crypto.randomUUID(),
  name: '',
  description: '',
  condition_type: 'max_critical_vulns',
  condition_value: '0',
  severity: 'blocker'
});

export default function PolicyEditor({ policy, onClose }) {
  const isEdit = !!policy;
  const [form, setForm] = useState({
    name: '',
    framework: 'OWASP Top 10',
    description: '',
    enabled: true,
    alert_on_violation: true,
    block_deployment: false,
    rules: []
  });

  useEffect(() => {
    if (policy) setForm({ ...policy, rules: policy.rules || [] });
  }, [policy]);

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit
      ? base44.entities.SecurityPolicy.update(policy.id, data)
      : base44.entities.SecurityPolicy.create(data),
    onSuccess: onClose
  });

  const loadPreset = (framework) => {
    const presets = PRESET_RULES[framework];
    if (!presets) return;
    setForm(f => ({
      ...f,
      framework,
      rules: presets.map(r => ({ ...r, id: crypto.randomUUID(), description: '' }))
    }));
  };

  const updateRule = (id, field, value) => {
    setForm(f => ({ ...f, rules: f.rules.map(r => r.id === id ? { ...r, [field]: value } : r) }));
  };

  const removeRule = (id) => {
    setForm(f => ({ ...f, rules: f.rules.filter(r => r.id !== id) }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-slate-950 border border-indigo-500/30 rounded-xl max-w-2xl w-full shadow-2xl my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h2 className="text-white font-bold">{isEdit ? 'Edit Policy' : 'New Security Policy'}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></Button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Policy Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Production Security Gate"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Framework</Label>
              <Select value={form.framework} onValueChange={v => setForm(f => ({ ...f, framework: v }))}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRAMEWORKS.map(fw => <SelectItem key={fw} value={fw}>{fw}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-xs mb-1 block">Description</Label>
            <Input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What does this policy enforce?"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          {/* Options */}
          <div className="flex gap-6 flex-wrap">
            {[
              { key: 'enabled', label: 'Policy Active' },
              { key: 'alert_on_violation', label: 'Alert on Violation' },
              { key: 'block_deployment', label: 'Block Deployment on Fail' }
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[opt.key]}
                  onChange={e => setForm(f => ({ ...f, [opt.key]: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-500"
                />
                <span className="text-slate-300 text-sm">{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Preset loader */}
          {!isEdit && PRESET_RULES[form.framework] && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 flex items-center justify-between">
              <p className="text-indigo-300 text-sm">Load preset rules for <strong>{form.framework}</strong>?</p>
              <Button size="sm" onClick={() => loadPreset(form.framework)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                Load Preset
              </Button>
            </div>
          )}

          {/* Rules */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-slate-300 text-sm">Policy Rules ({form.rules.length})</Label>
              <Button size="sm" onClick={() => setForm(f => ({ ...f, rules: [...f.rules, newRule()] }))}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700">
                <Plus className="w-3 h-3 mr-1" /> Add Rule
              </Button>
            </div>

            <div className="space-y-3">
              {form.rules.map((rule) => (
                <div key={rule.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      value={rule.name}
                      onChange={e => updateRule(rule.id, 'name', e.target.value)}
                      placeholder="Rule name"
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                    <div className="flex gap-2">
                      <Select value={rule.severity} onValueChange={v => updateRule(rule.id, 'severity', v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blocker">🚫 Blocker</SelectItem>
                          <SelectItem value="warning">⚠️ Warning</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" onClick={() => removeRule(rule.id)} className="text-red-400 hover:bg-red-500/10 px-2">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Select value={rule.condition_type} onValueChange={v => updateRule(rule.id, 'condition_type', v)}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      value={rule.condition_value}
                      onChange={e => updateRule(rule.id, 'condition_value', e.target.value)}
                      placeholder={CONDITION_TYPES.find(c => c.value === rule.condition_type)?.placeholder || 'Value'}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  </div>
                </div>
              ))}
              {form.rules.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No rules yet. Add rules or load a preset.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-800">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={!form.name || saveMutation.isPending}
            className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Policy'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}