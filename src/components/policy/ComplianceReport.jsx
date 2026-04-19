import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, XCircle, AlertTriangle, Download, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const frameworkColors = {
  'OWASP Top 10': 'text-red-400',
  'PCI DSS': 'text-blue-400',
  'GDPR': 'text-green-400',
  'HIPAA': 'text-purple-400',
  'SOC 2': 'text-orange-400',
  'NIST': 'text-cyan-400',
  'ISO 27001': 'text-yellow-400',
  'Custom': 'text-slate-400'
};

export default function ComplianceReport({ evaluations, policies }) {
  const [frameworkFilter, setFrameworkFilter] = useState('all');

  // Group evaluations by policy
  const byPolicy = evaluations.reduce((acc, ev) => {
    if (!acc[ev.policy_id]) acc[ev.policy_id] = [];
    acc[ev.policy_id].push(ev);
    return acc;
  }, {});

  const frameworks = [...new Set(evaluations.map(e => e.framework).filter(Boolean))];

  const filtered = Object.entries(byPolicy).filter(([policyId, evals]) => {
    if (frameworkFilter === 'all') return true;
    return evals[0]?.framework === frameworkFilter;
  });

  // Summary stats
  const totalEvals = evaluations.length;
  const passed = evaluations.filter(e => e.status === 'pass').length;
  const failed = evaluations.filter(e => e.status === 'fail').length;
  const warnings = evaluations.filter(e => e.status === 'warning').length;
  const avgScore = totalEvals > 0 ? Math.round(evaluations.reduce((s, e) => s + (e.compliance_score || 0), 0) / totalEvals) : 0;

  const exportReport = () => {
    const rows = [
      ['Policy', 'Framework', 'Status', 'Compliance Score', 'Passed Rules', 'Failed Rules', 'Date'],
      ...evaluations.map(e => [
        e.policy_name, e.framework, e.status, `${e.compliance_score}%`,
        e.passed_rules, e.failed_rules, new Date(e.created_date).toLocaleDateString()
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'compliance-report.csv'; a.click();
  };

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-20">
        <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Evaluations Yet</h2>
        <p className="text-slate-400">Run a policy evaluation to generate compliance reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Evaluations', value: totalEvals, color: 'text-cyan-400' },
          { label: 'Passed', value: passed, color: 'text-green-400' },
          { label: 'Failed', value: failed, color: 'text-red-400' },
          { label: 'Warnings', value: warnings, color: 'text-yellow-400' },
          { label: 'Avg Compliance', value: `${avgScore}%`, color: avgScore >= 80 ? 'text-green-400' : avgScore >= 60 ? 'text-yellow-400' : 'text-red-400' }
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4 text-center">
                <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters + Export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFrameworkFilter('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${frameworkFilter === 'all' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-300'}`}
          >All Frameworks</button>
          {frameworks.map(fw => (
            <button
              key={fw}
              onClick={() => setFrameworkFilter(fw)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${frameworkFilter === fw ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-300'}`}
            >{fw}</button>
          ))}
        </div>
        <Button size="sm" onClick={exportReport} variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Policy Cards */}
      <div className="space-y-4">
        {filtered.map(([policyId, evals]) => {
          const latest = evals[0];
          const history = evals.slice(0, 5);
          const fwColor = frameworkColors[latest.framework] || 'text-slate-400';

          return (
            <motion.div key={policyId} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-white text-base">{latest.policy_name}</CardTitle>
                      <span className={`text-xs font-medium ${fwColor}`}>{latest.framework}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">{evals.length} evaluation{evals.length !== 1 ? 's' : ''}</span>
                      <Badge className={
                        latest.status === 'pass' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        latest.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }>
                        Latest: {latest.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {history.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-800/50 last:border-0">
                        <div className="flex items-center gap-3">
                          {ev.status === 'pass'
                            ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            : ev.status === 'warning'
                            ? <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                          <span className="text-slate-400 text-xs">{ev.app_name || 'Unnamed file'}</span>
                          {ev.violations?.length > 0 && (
                            <span className="text-red-400 text-xs">{ev.violations.length} violation{ev.violations.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-sm ${
                            ev.compliance_score >= 80 ? 'text-green-400' :
                            ev.compliance_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>{ev.compliance_score}%</span>
                          <span className="text-slate-600 text-xs">{new Date(ev.created_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Latest violations detail */}
                  {latest.violations?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <p className="text-xs text-slate-500 uppercase mb-2">Latest Violations</p>
                      <div className="space-y-1">
                        {latest.violations.map((v, vi) => (
                          <div key={vi} className={`text-xs px-2 py-1 rounded flex items-center gap-2 ${
                            v.severity === 'blocker' ? 'bg-red-500/10 text-red-300' : 'bg-yellow-500/10 text-yellow-300'
                          }`}>
                            <span className="font-bold uppercase">{v.severity}</span>
                            <span>{v.rule_name}</span>
                            {v.actual_value && <span className="opacity-60">· got {v.actual_value}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}