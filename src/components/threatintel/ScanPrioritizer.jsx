import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, AlertTriangle, Shield, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const urgencyConfig = {
  immediate: { color: 'bg-red-500 text-white', label: 'IMMEDIATE' },
  within_7_days: { color: 'bg-orange-500 text-white', label: '7 DAYS' },
  within_30_days: { color: 'bg-yellow-500 text-black', label: '30 DAYS' },
  next_sprint: { color: 'bg-blue-500 text-white', label: 'NEXT SPRINT' },
};

export default function ScanPrioritizer({ scans }) {
  const [selectedScanId, setSelectedScanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);

  const selectedScan = scans.find(s => s.id === selectedScanId);

  const runPrioritization = async () => {
    if (!selectedScan?.vulnerabilities?.length) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('threatIntelligence', {
        mode: 'prioritize_scan',
        vulnerabilities: selectedScan.vulnerabilities,
        language: selectedScan.language,
        scan_id: selectedScan.id,
      });
      setResult(res.data?.prioritization);
    } finally {
      setLoading(false);
    }
  };

  const threatLevelColor = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-green-400',
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm text-slate-400 mb-2 block">Select a scan to prioritize</label>
              <Select value={selectedScanId} onValueChange={setSelectedScanId}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Choose a scan..." />
                </SelectTrigger>
                <SelectContent>
                  {scans.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.file_name} — Score {s.overall_score} ({s.vulnerabilities?.length || 0} vulns)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={runPrioritization}
              disabled={!selectedScanId || loading}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold px-6"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              {loading ? 'Analyzing Threat Feeds...' : 'Prioritize with Threat Intel'}
            </Button>
          </div>
          {selectedScan && (
            <p className="text-slate-500 text-xs mt-3">
              {selectedScan.vulnerabilities?.length || 0} vulnerabilities in {selectedScan.language} • Base score: {selectedScan.overall_score}/100
            </p>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center py-16 gap-4">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-orange-400 animate-spin" />
            <div className="absolute inset-0 blur-xl bg-orange-500/20 animate-pulse" />
          </div>
          <p className="text-white font-semibold">Querying CISA KEV, NVD, ExploitDB & Threat Feeds...</p>
          <p className="text-slate-400 text-sm">Correlating with active threat actor campaigns</p>
        </motion.div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Summary Banner */}
          <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-orange-500/30">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Overall Threat Level</p>
                  <p className={`text-2xl font-bold uppercase ${threatLevelColor[result.overall_threat_level?.toLowerCase()] || 'text-orange-400'}`}>
                    {result.overall_threat_level}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 text-sm mb-1">Threat Intelligence Summary</p>
                  <p className="text-white text-sm leading-relaxed">{result.top_risk_summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prioritized List */}
          <div className="space-y-3">
            {result.prioritized_vulnerabilities?.map((vuln, idx) => {
              const urgency = urgencyConfig[vuln.fix_urgency] || urgencyConfig.next_sprint;
              const isOpen = expandedIdx === idx;
              return (
                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}>
                  <Card className="bg-slate-900/50 border-slate-700 hover:border-orange-500/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Priority Score */}
                        <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                          style={{ background: `conic-gradient(${vuln.risk_priority_score >= 80 ? '#ef4444' : vuln.risk_priority_score >= 60 ? '#f97316' : '#eab308'} ${vuln.risk_priority_score * 3.6}deg, #1e293b 0deg)` }}>
                          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                            <span className={`text-sm font-bold ${vuln.risk_priority_score >= 80 ? 'text-red-400' : vuln.risk_priority_score >= 60 ? 'text-orange-400' : 'text-yellow-400'}`}>
                              {vuln.risk_priority_score}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <h3 className="text-white font-semibold">{vuln.original_title}</h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge className={urgency.color + ' text-xs'}>{urgency.label}</Badge>
                                <Badge className="bg-slate-700 text-slate-300 text-xs">{vuln.original_severity?.toUpperCase()}</Badge>
                                {vuln.in_cisa_kev && (
                                  <Badge className="bg-red-900 text-red-300 border border-red-500/50 text-xs">CISA KEV</Badge>
                                )}
                                {vuln.has_public_exploit && (
                                  <Badge className="bg-orange-900 text-orange-300 border border-orange-500/50 text-xs">PUBLIC EXPLOIT</Badge>
                                )}
                              </div>
                            </div>
                            <button onClick={() => setExpandedIdx(isOpen ? null : idx)}
                              className="text-slate-400 hover:text-white p-1">
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>

                          {vuln.active_threat_actors?.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-xs text-slate-500">Threat actors:</span>
                              {vuln.active_threat_actors.map((ta, i) => (
                                <span key={i} className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">{ta}</span>
                              ))}
                            </div>
                          )}

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="mt-3 pt-3 border-t border-slate-700">
                                  <p className="text-cyan-400 text-sm">
                                    <span className="font-semibold text-white">Key Insight: </span>{vuln.key_insight}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {!loading && !result && scans.length === 0 && (
        <div className="text-center py-20">
          <AlertTriangle className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400">Run a code scan first to enable threat prioritization.</p>
        </div>
      )}
    </div>
  );
}