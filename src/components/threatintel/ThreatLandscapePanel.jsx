import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Loader2, Users, Zap, AlertTriangle, Target, TrendingUp } from 'lucide-react';

const riskColor = (level) => {
  const l = level?.toLowerCase();
  if (l?.includes('critical') || l?.includes('very high')) return 'text-red-400 bg-red-950/30 border-red-500/30';
  if (l?.includes('high')) return 'text-orange-400 bg-orange-950/30 border-orange-500/30';
  if (l?.includes('medium')) return 'text-yellow-400 bg-yellow-950/30 border-yellow-500/30';
  return 'text-blue-400 bg-blue-950/30 border-blue-500/30';
};

const LANGS = ['JavaScript', 'Python', 'Java', 'PHP', 'Go', 'Ruby', 'C/C++', 'TypeScript'];

export default function ThreatLandscapePanel({ scans }) {
  const detectedLangs = [...new Set(scans.map(s => s.language).filter(Boolean))];
  const langOptions = [...new Set([...detectedLangs, ...LANGS])];

  const [selectedLang, setSelectedLang] = useState(detectedLangs[0] || 'JavaScript');
  const [landscape, setLandscape] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLandscape = async () => {
    setLoading(true);
    setLandscape(null);
    try {
      const res = await base44.functions.invoke('threatIntelligence', {
        mode: 'threat_landscape',
        language: selectedLang
      });
      setLandscape(res.data.landscape);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Current Threat Landscape
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Real-time threat actor activity, trending attack techniques, and recent zero-days for your tech stack.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-3 flex-wrap">
            {langOptions.slice(0, 8).map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  selectedLang === lang
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {lang}
                {detectedLangs.includes(lang) && <span className="ml-2 text-xs text-cyan-400">●</span>}
              </button>
            ))}
            <Button onClick={fetchLandscape} disabled={loading} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold ml-auto">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
              {loading ? 'Fetching...' : 'Fetch Landscape'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center py-16">
          <div className="relative inline-block">
            <Globe className="w-16 h-16 text-blue-500 animate-pulse mx-auto" />
            <div className="absolute inset-0 blur-xl bg-blue-500/20" />
          </div>
          <p className="text-white text-xl font-bold mt-6">Scanning global threat feeds...</p>
          <p className="text-slate-400 mt-2">Querying CISA, MITRE ATT&CK, and threat intelligence platforms</p>
        </div>
      )}

      {landscape && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Risk Level */}
          <Card className={`border ${riskColor(landscape.overall_risk_level)}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Overall Risk Level for {selectedLang}</span>
                </div>
                <Badge className="text-base px-4 py-1">{landscape.overall_risk_level}</Badge>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{landscape.landscape_summary}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Exploited Vulns */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800 pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400" /> Top Exploited Vulnerability Types
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {landscape.top_exploited_vulns?.map((v, i) => (
                  <div key={i} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-white text-sm font-medium">{v.vuln_type}</span>
                      {v.cve_example && <Badge className="bg-red-900/50 text-red-300 text-xs border border-red-500/30">{v.cve_example}</Badge>}
                    </div>
                    <p className="text-orange-400 text-xs mb-1">Exploitation rate: {v.exploitation_rate}</p>
                    {v.threat_actors?.length > 0 && (
                      <p className="text-slate-500 text-xs">Used by: {v.threat_actors.join(', ')}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Active APT Groups */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800 pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" /> Active Threat Actor Groups
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {landscape.active_apt_groups?.map((g, i) => (
                  <div key={i} className="bg-slate-800/60 rounded-lg p-3 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-purple-300 font-semibold text-sm">{g.name}</span>
                      <Badge className="bg-slate-700 text-slate-300 text-xs">{g.origin}</Badge>
                    </div>
                    <p className="text-slate-400 text-xs mb-1">{g.recent_activity}</p>
                    {g.primary_targets?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {g.primary_targets.map((t, ti) => (
                          <span key={ti} className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Zero-Days */}
          {landscape.recent_zero_days?.length > 0 && (
            <Card className="bg-red-950/20 border-red-500/30">
              <CardHeader className="border-b border-red-500/20 pb-3">
                <CardTitle className="text-red-400 text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" /> Recent Zero-Days & Critical Disclosures (Last 90 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {landscape.recent_zero_days.map((z, i) => (
                    <div key={i} className="bg-slate-900/60 rounded-lg p-3 border border-red-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-red-600 text-white text-xs">{z.cve_id}</Badge>
                        <Badge className={`text-xs ${z.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>{z.severity}</Badge>
                        <span className="text-slate-500 text-xs ml-auto">{z.disclosed_date}</span>
                      </div>
                      <p className="text-slate-300 text-xs">{z.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trending Techniques */}
          {landscape.trending_techniques?.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800 pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" /> Trending MITRE ATT&CK Techniques
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {landscape.trending_techniques.map((t, i) => (
                    <span key={i} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full text-xs">{t}</span>
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