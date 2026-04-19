import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Activity, Loader2, AlertTriangle, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const activityColors = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function ThreatActorPanel({ scans }) {
  const [selectedScanId, setSelectedScanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [actors, setActors] = useState(null);
  const [campaigns, setCampaigns] = useState(null);
  const [summary, setSummary] = useState('');

  const selectedScan = scans.find(s => s.id === selectedScanId);

  const analyze = async () => {
    if (!selectedScan?.vulnerabilities?.length) return;
    setLoading(true);
    setActors(null);
    try {
      const res = await base44.functions.invoke('threatIntelligence', {
        mode: 'prioritize_scan',
        vulnerabilities: selectedScan.vulnerabilities,
        language: selectedScan.language,
      });
      const data = res.data?.prioritization;
      setSummary(data?.top_risk_summary || '');

      // Aggregate unique threat actors across all vulns
      const actorMap = {};
      data?.prioritized_vulnerabilities?.forEach(v => {
        v.active_threat_actors?.forEach(ta => {
          if (!actorMap[ta]) actorMap[ta] = { name: ta, vuln_count: 0, vulns: [] };
          actorMap[ta].vuln_count++;
          actorMap[ta].vulns.push({ title: v.original_title, severity: v.original_severity, score: v.risk_priority_score });
        });
      });
      setActors(Object.values(actorMap).sort((a, b) => b.vuln_count - a.vuln_count));

      // Gather campaigns from individual enrichment of top vuln
      const topVuln = selectedScan.vulnerabilities.find(v =>
        data?.prioritized_vulnerabilities?.[0]?.original_title === v.title
      ) || selectedScan.vulnerabilities[0];

      if (topVuln) {
        const enrichRes = await base44.functions.invoke('threatIntelligence', {
          mode: 'enrich_single',
          vulnerabilities: [topVuln],
          language: selectedScan.language,
        });
        setCampaigns(enrichRes.data?.intel?.attack_campaigns || []);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6 flex items-end gap-4">
          <div className="flex-1">
            <label className="text-sm text-slate-400 mb-2 block">Select scan to identify threat actors</label>
            <Select value={selectedScanId} onValueChange={(v) => { setSelectedScanId(v); setActors(null); }}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Choose a scan..." />
              </SelectTrigger>
              <SelectContent>
                {scans.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.file_name} ({s.vulnerabilities?.length || 0} vulns)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={analyze} disabled={!selectedScanId || loading}
            className="bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white font-bold">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Target className="w-4 h-4 mr-2" />}
            {loading ? 'Identifying Threat Actors...' : 'Identify Threat Actors'}
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          <p className="text-white font-semibold">Cross-referencing APT groups & threat actor databases...</p>
          <p className="text-slate-400 text-sm">Analyzing MITRE ATT&CK, FireEye, CrowdStrike threat intel</p>
        </div>
      )}

      {actors && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {summary && (
            <Card className="bg-slate-900/50 border-purple-500/20">
              <CardContent className="p-4">
                <p className="text-purple-400 text-sm font-semibold mb-1">Threat Intelligence Summary</p>
                <p className="text-slate-300 text-sm">{summary}</p>
              </CardContent>
            </Card>
          )}

          {actors.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-10 text-center">
                <Activity className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">No specific threat actor activity identified for these vulnerability types.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actors.map((actor, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.07 }}>
                  <Card className="bg-slate-900/50 border-slate-700 hover:border-purple-500/30 transition-colors h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <Target className="w-4 h-4 text-red-400" />
                          </div>
                          <div>
                            <h3 className="text-white font-bold">{actor.name}</h3>
                            <p className="text-slate-500 text-xs">{actor.vuln_count} vulnerability class{actor.vuln_count > 1 ? 'es' : ''} targeted</p>
                          </div>
                        </div>
                        <Badge className="bg-red-900/50 text-red-300 border border-red-500/30 text-xs">ACTIVE</Badge>
                      </div>
                      <div className="space-y-1.5">
                        {actor.vulns.slice(0, 3).map((v, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <AlertTriangle className={`w-3 h-3 flex-shrink-0 ${
                              v.severity === 'critical' ? 'text-red-400' :
                              v.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'}`} />
                            <span className="text-slate-400 truncate">{v.title}</span>
                            <span className={`ml-auto flex-shrink-0 font-bold ${v.score >= 80 ? 'text-red-400' : 'text-orange-400'}`}>{v.score}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Active Campaigns */}
          {campaigns?.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800 py-3 px-4">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Recent Attack Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-800">
                {campaigns.map((c, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-sm">{c.campaign_name}</h4>
                        <p className="text-slate-400 text-xs mt-1">{c.description}</p>
                        {c.industry_targets?.length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {c.industry_targets.map((ind, j) => (
                              <span key={j} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{ind}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-slate-500 text-xs flex-shrink-0">{c.date}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}