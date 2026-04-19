import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Play, CheckCircle, AlertTriangle, XCircle, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

function evaluatePolicy(policy, scan) {
  const vulns = scan.vulnerabilities || [];
  const violations = [];
  let passed = 0;

  for (const rule of (policy.rules || [])) {
    let rulePassed = true;
    let actualValue = '';
    let thresholdValue = rule.condition_value;

    if (rule.condition_type === 'min_security_score') {
      const threshold = parseFloat(rule.condition_value);
      actualValue = String(scan.overall_score || 0);
      rulePassed = (scan.overall_score || 0) >= threshold;
    } else if (rule.condition_type === 'max_critical_vulns') {
      const count = vulns.filter(v => v.severity === 'critical').length;
      actualValue = String(count);
      rulePassed = count <= parseInt(rule.condition_value, 10);
    } else if (rule.condition_type === 'max_high_vulns') {
      const count = vulns.filter(v => v.severity === 'high').length;
      actualValue = String(count);
      rulePassed = count <= parseInt(rule.condition_value, 10);
    } else if (rule.condition_type === 'max_total_vulns') {
      actualValue = String(vulns.length);
      rulePassed = vulns.length <= parseInt(rule.condition_value, 10);
    } else if (rule.condition_type === 'forbidden_vuln_type') {
      const keyword = rule.condition_value.toLowerCase();
      const match = vulns.find(v => v.title?.toLowerCase().includes(keyword) || v.description?.toLowerCase().includes(keyword));
      rulePassed = !match;
      actualValue = match ? `Found: ${match.title}` : 'Not found';
    } else if (rule.condition_type === 'max_severity_count') {
      const [sev, maxStr] = rule.condition_value.split(':');
      const count = vulns.filter(v => v.severity === sev).length;
      actualValue = String(count);
      rulePassed = count <= parseInt(maxStr, 10);
      thresholdValue = `${sev} ≤ ${maxStr}`;
    }

    if (!rulePassed) {
      violations.push({
        rule_id: rule.id,
        rule_name: rule.name,
        severity: rule.severity,
        message: `Rule "${rule.name}" failed`,
        actual_value: actualValue,
        threshold_value: thresholdValue
      });
    } else {
      passed++;
    }
  }

  const totalRules = (policy.rules || []).length;
  const blockers = violations.filter(v => v.severity === 'blocker');
  const warnings = violations.filter(v => v.severity === 'warning');
  const status = blockers.length > 0 ? 'fail' : warnings.length > 0 ? 'warning' : 'pass';
  const complianceScore = totalRules > 0 ? Math.round((passed / totalRules) * 100) : 100;

  return { violations, passed_rules: passed, failed_rules: violations.length, status, compliance_score: complianceScore };
}

export default function PolicyEvaluator({ policies, scans, onEvaluated }) {
  const queryClient = useQueryClient();
  const [selectedScan, setSelectedScan] = useState('');
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const enabledPolicies = policies.filter(p => p.enabled);

  const saveEval = async (evalData) => {
    await base44.entities.PolicyEvaluation.create(evalData);
  };

  const runEvaluation = async () => {
    if (!selectedScan) return;
    const scan = scans.find(s => s.id === selectedScan);
    if (!scan) return;

    setIsRunning(true);
    setResults([]);

    const evalResults = [];
    for (const policy of enabledPolicies) {
      const result = evaluatePolicy(policy, scan);
      const evalRecord = {
        policy_id: policy.id,
        policy_name: policy.name,
        framework: policy.framework,
        scan_id: scan.id,
        app_name: scan.file_name,
        ...result
      };
      evalResults.push({ policy, ...result });
      await saveEval(evalRecord);

      // Create alert if violation and policy has alert_on_violation
      if (result.status === 'fail' && policy.alert_on_violation) {
        await base44.entities.SecurityAlert.create({
          alert_type: 'threshold_exceeded',
          severity: 'high',
          title: `Policy Violation: ${policy.name}`,
          description: `${result.violations.length} rule(s) violated in scan of ${scan.file_name}. Compliance score: ${result.compliance_score}%.`,
          app_name: scan.file_name,
          scan_id: scan.id,
          status: 'active'
        });
      }
    }

    setResults(evalResults);
    setIsRunning(false);
    onEvaluated();
    queryClient.invalidateQueries({ queryKey: ['securityAlerts'] });
  };

  return (
    <div className="space-y-8">
      {/* Run Panel */}
      <Card className="bg-slate-900/60 border-indigo-500/20">
        <CardContent className="p-6">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-indigo-400" />
            Run Policy Evaluation
          </h2>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-slate-300 text-xs mb-1 block">Select Scan to Evaluate</Label>
              <Select value={selectedScan} onValueChange={setSelectedScan}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300">
                  <SelectValue placeholder="Choose a scan..." />
                </SelectTrigger>
                <SelectContent>
                  {scans.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.file_name} — Score: {s.overall_score} ({new Date(s.created_date).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={runEvaluation}
              disabled={!selectedScan || isRunning || enabledPolicies.length === 0}
              className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold h-9"
            >
              {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {isRunning ? 'Evaluating...' : `Run Against ${enabledPolicies.length} Policies`}
            </Button>
          </div>
          {enabledPolicies.length === 0 && (
            <p className="text-yellow-400 text-sm mt-3">No active policies. Enable or create policies first.</p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Evaluation Results</h3>
          {results.map((res, i) => (
            <motion.div
              key={res.policy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className={`border ${
                res.status === 'pass' ? 'border-green-500/30 bg-green-950/10' :
                res.status === 'warning' ? 'border-yellow-500/30 bg-yellow-950/10' :
                'border-red-500/30 bg-red-950/10'
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {res.status === 'pass' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                          res.status === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> :
                          <XCircle className="w-5 h-5 text-red-400" />}
                        <h4 className="text-white font-semibold">{res.policy.name}</h4>
                        <Badge className="text-xs bg-slate-700 text-slate-300">{res.policy.framework}</Badge>
                      </div>
                      <p className="text-slate-400 text-xs">
                        {res.passed_rules} of {(res.policy.rules || []).length} rules passed · Compliance Score: <strong className={
                          res.compliance_score >= 80 ? 'text-green-400' :
                          res.compliance_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }>{res.compliance_score}%</strong>
                      </p>
                    </div>
                    <Badge className={
                      res.status === 'pass' ? 'bg-green-500 text-white' :
                      res.status === 'warning' ? 'bg-yellow-500 text-black' :
                      'bg-red-500 text-white'
                    }>
                      {res.status.toUpperCase()}
                    </Badge>
                  </div>

                  {res.violations.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {res.violations.map((v, vi) => (
                        <div key={vi} className={`flex items-start gap-3 text-sm p-2 rounded ${
                          v.severity === 'blocker' ? 'bg-red-500/10 text-red-300' : 'bg-yellow-500/10 text-yellow-300'
                        }`}>
                          <span className="text-xs font-bold uppercase mt-0.5">{v.severity}</span>
                          <div>
                            <span className="font-medium">{v.rule_name}</span>
                            {v.actual_value && (
                              <span className="text-xs opacity-70 ml-2">
                                (got: {v.actual_value}, threshold: {v.threshold_value})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}