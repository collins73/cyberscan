import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Play, FileText, AlertTriangle, CheckCircle, Settings, BarChart3, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import PolicyList from '../components/policy/PolicyList';
import PolicyEditor from '../components/policy/PolicyEditor';
import ComplianceReport from '../components/policy/ComplianceReport';
import PolicyEvaluator from '../components/policy/PolicyEvaluator';

const TABS = [
  { id: 'policies', label: 'Policies', icon: Shield },
  { id: 'evaluate', label: 'Run Evaluation', icon: Play },
  { id: 'reports', label: 'Compliance Reports', icon: FileText }
];

export default function PolicyEngine() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('policies');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  const { data: policies = [], isLoading: policiesLoading } = useQuery({
    queryKey: ['securityPolicies'],
    queryFn: () => base44.entities.SecurityPolicy.list('-created_date', 100)
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['policyEvaluations'],
    queryFn: () => base44.entities.PolicyEvaluation.list('-created_date', 200)
  });

  const { data: scans = [] } = useQuery({
    queryKey: ['codeScans'],
    queryFn: () => base44.entities.CodeScan.list('-created_date', 50)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SecurityPolicy.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['securityPolicies'] })
  });

  const enabledPolicies = policies.filter(p => p.enabled);
  const recentEvals = evaluations.slice(0, 50);
  const failedEvals = evaluations.filter(e => e.status === 'fail').length;
  const passedEvals = evaluations.filter(e => e.status === 'pass').length;

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setShowEditor(true);
  };

  const handleNew = () => {
    setEditingPolicy(null);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingPolicy(null);
    queryClient.invalidateQueries({ queryKey: ['securityPolicies'] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDIxNywyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl">
                  <Settings className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Policy Engine</h1>
                  <p className="text-cyan-400 text-sm font-medium">Custom Security Policies & Compliance</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                {/* Summary badges */}
                <div className="flex gap-2 mr-2">
                  <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                    {enabledPolicies.length} active policies
                  </Badge>
                  {failedEvals > 0 && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {failedEvals} violations
                    </Badge>
                  )}
                </div>
                <Button variant="outline" onClick={() => navigate('/Scanner')} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <Shield className="w-4 h-4 mr-2" /> Scanner
                </Button>
                <Button variant="outline" onClick={() => navigate('/RedTeam')} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  <Crosshair className="w-4 h-4 mr-2" /> Red Team
                </Button>
                <Button onClick={handleNew} className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold">
                  <Plus className="w-4 h-4 mr-2" /> New Policy
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-5">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 py-10">
          {activeTab === 'policies' && (
            <PolicyList
              policies={policies}
              evaluations={evaluations}
              isLoading={policiesLoading}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              onNew={handleNew}
            />
          )}
          {activeTab === 'evaluate' && (
            <PolicyEvaluator
              policies={policies}
              scans={scans}
              onEvaluated={() => queryClient.invalidateQueries({ queryKey: ['policyEvaluations'] })}
            />
          )}
          {activeTab === 'reports' && (
            <ComplianceReport
              evaluations={recentEvals}
              policies={policies}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showEditor && (
          <PolicyEditor
            policy={editingPolicy}
            onClose={handleEditorClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}