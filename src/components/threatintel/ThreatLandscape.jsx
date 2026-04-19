import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Globe, Loader2, Zap, Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LANGUAGES = [
  'JavaScript', 'Python', 'Java', 'TypeScript', 'PHP', 'Go', 'Ruby', 'C++', 'C#', 'Rust'
];

const riskLevelStyle = {
  critical: 'text-red-400 border-red-500/30 bg-red-500/10',
  high: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  low: 'text-green-400 border-green-500/30 bg-green-500/10',
};

export default function ThreatLandscape({ scans }) {
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [landscape, setLandscape] = useState(null);

  // Auto-detect most common language from scans
  const detectedLang = scans.reduce((acc, s) => {
    if (s.language) acc[s.language] = (acc[s.language] || 0) + 1;
    return acc;
  }, {});
  const topLang = Object.entries(detectedLang).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  const fetch = async () => {
    const lang = language || topLang || 'JavaScript';
    setLoading(true);
    setLandscape(null);
    try {
      const res = await base44.functions.invoke('threatIntelligence', {
        mode: 'threat_landscape',
        language: lang,
      });
      setLandscape(res.data?.landscape);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6 flex items-end gap-4">
          <div className="flex-1">
            <label className="text-sm text-slate-400 mb-2 block">
              Tech Stack / Language {topLang && <span className="text-slate-500">(detected: {topLang})</span>}
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder={topLang ? `Auto: ${topLang}` : 'Select language...'} />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetch} disabled={loading}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
            {loading ? 'Fetching Live Threat Data...' : 'Get Current Threat Landscape'}
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <Globe className="w-14 h-14 text-cyan-400 animate-pulse" />
          <p className="text-white font-semibold">Analyzing current global threat landscape...</p>
          <p className="text-slate-400 text-sm">Querying CISA, NIST, threat intelligence feeds</p>
        </div>
      )}

      {landscape && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Risk Level Banner */}
          <Card className={`border ${riskLevelStyle[landscape.overall_risk_level?.toLowerCase()] || 'border-slate-700 bg-slate-900/50'}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Current Threat Level for {language || topLang}</p>
                  <p className={`text-3xl font-bold mt-1 uppercase ${riskLevelStyle[landscape.overall_risk_level?.toLowerCase()]?.split(' ')[0] || 'text-cyan-400'}`}>
                    {landscape.overall_risk_level}
                  </p>
                </div>
                <div className="flex-1 ml-6">
                  <p className="text-slate-300 text-sm">{landscape.landscape_summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Exploited Vuln Types */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800 py-3 px-4">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400" />
                  Most Actively Exploited Right Now
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-800">
                {landscape.top_exploited_vulns?.map((v, i) => (
                  <div key={i} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">{v.vuln_type}</span>
                          {v.cve_example && <span className="text-cyan-400 font-mono text-xs">{v.cve_example}</span>}
                        </div>
                        <p className="text-orange-400 text-xs mt-0.5">Rate: {v.exploitation_rate}</p>
                        {v.threat_actors?.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {v.threat_actors.map((ta, j) => (
                              <span key={j} className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">{ta}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-slate-500 text-xs font-bold">#{i + 1}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Active APT Groups */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800 py-3 px-4">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Active APT Groups
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-800">
                {landscape.active_apt_groups?.map((apt, i) => (
                  <div key={i} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm">{apt.name}</span>
                          {apt.origin && <span className="text-slate-500 text-xs">({apt.origin})</span>}
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">{apt.recent_activity}</p>
                        {apt.primary_targets?.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {apt.primary_targets.map((t, j) => (
                              <span key={j} className="text-xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Zero-Days */}
          {landscape.recent_zero_days?.length > 0 && (
            <Card className="bg-red-950/20 border-red-500/20">
              <CardHeader className="border-b border-red-500/20 py-3 px-4">
                <CardTitle className="text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Recent Zero-Days / Critical Disclosures (Last 90 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-red-900/20">
                {landscape.recent_zero_days.map((z, i) => (
                  <div key={i} className="p-3 flex items-start gap-3">
                    <span className="text-red-400 font-mono text-sm font-bold flex-shrink-0">{z.cve_id}</span>
                    <div className="flex-1">
                      <p className="text-slate-300 text-xs">{z.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${z.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                          {z.severity?.toUpperCase()}
                        </Badge>
                        <span className="text-slate-500 text-xs">{z.disclosed_date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Trending ATT&CK Techniques */}
          {landscape.trending_techniques?.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800 py-3 px-4">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Trending MITRE ATT&CK Techniques
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {landscape.trending_techniques.map((t, i) => (
                    <span key={i} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg">{t}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}