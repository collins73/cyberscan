import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Edit2, Trash2, Plus, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const frameworkColors = {
  'OWASP Top 10': 'bg-red-500/20 text-red-400 border-red-500/30',
  'PCI DSS': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'GDPR': 'bg-green-500/20 text-green-400 border-green-500/30',
  'HIPAA': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'SOC 2': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'NIST': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'ISO 27001': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Custom': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

export default function PolicyList({ policies, evaluations, isLoading, onEdit, onDelete, onNew }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => base44.entities.SecurityPolicy.update(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['securityPolicies'] })
  });

  const getLastEval = (policyId) => {
    return evaluations.find(e => e.policy_id === policyId);
  };

  if (isLoading) return <div className="text-slate-400 text-center py-20">Loading policies...</div>;

  if (policies.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
        <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Policies Defined</h2>
        <p className="text-slate-400 mb-6">Create your first security policy to start evaluating scan results.</p>
        <Button onClick={onNew} className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Create First Policy
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {policies.map((policy, i) => {
        const lastEval = getLastEval(policy.id);
        const frameColor = frameworkColors[policy.framework] || frameworkColors['Custom'];
        return (
          <motion.div
            key={policy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`bg-slate-900/60 border-slate-800 hover:border-indigo-500/40 transition-all ${!policy.enabled ? 'opacity-50' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{policy.name}</h3>
                    <Badge className={`mt-1 text-xs ${frameColor}`}>{policy.framework}</Badge>
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate({ id: policy.id, enabled: !policy.enabled })}
                    className="ml-2 mt-1 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {policy.enabled
                      ? <ToggleRight className="w-5 h-5 text-cyan-400" />
                      : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </div>

                {policy.description && (
                  <p className="text-slate-400 text-xs mb-3 line-clamp-2">{policy.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span>{policy.rules?.length || 0} rules</span>
                  {policy.block_deployment && (
                    <span className="text-red-400">• Blocks deployment</span>
                  )}
                  {policy.alert_on_violation && (
                    <span className="text-yellow-400">• Alerts on violation</span>
                  )}
                </div>

                {/* Last eval status */}
                {lastEval && (
                  <div className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded mb-3 ${
                    lastEval.status === 'pass' ? 'bg-green-500/10 text-green-400' :
                    lastEval.status === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {lastEval.status === 'pass'
                      ? <CheckCircle className="w-3 h-3" />
                      : <AlertTriangle className="w-3 h-3" />}
                    Last eval: {lastEval.status.toUpperCase()} — Score {lastEval.compliance_score}%
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(policy)} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs">
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDelete(policy.id)} className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}