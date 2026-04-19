import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, ExternalLink, Shield, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CVECorrelator({ scans }) {
  const [selectedScanId, setSelectedScanId] = useState('');
  const [selectedVulnIdx, setSelectedVulnIdx] = useState('');
  const [loading, setLoading] = useState(false);
  const [intel, setIntel] = useState(null);
  const [expandedCve, setExpandedCve] = useState(null);

  const selectedScan = scans.find(s => s.id === selectedScanId);
  const selectedVuln = selectedScan?.vulnerabilities?.[parseInt(selectedVulnIdx)];

  const analyze = async () => {
    if (!selectedVuln) return;
    setLoading(true);
    setIntel(null);
    try {
      const res = await base44.functions.invoke('threatIntelligence', {
        mode: 'enrich_single',
        vulnerabilities: [selectedVuln],
        language: selectedScan.language,
      });
      setIntel(res.data?.intel);
    } finally {
      setLoading(false);
    }
  };

  const cvssColor = (score) => {
    if (!score) return 'text-slate-400';
    if (score >= 9) return 'text-red-400';
    if (score >= 7) return 'text-orange-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Select Scan</label>
              <Select value={selectedScanId} onValueChange={(v) => { setSelectedScanId(v); setSelectedVulnIdx(''); setIntel(null); }}>
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
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Select Vulnerability</label>
              <Select value={selectedVulnIdx} onValueChange={setSelectedVulnIdx} disabled={!selectedScan}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Choose a vulnerability..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedScan?.vulnerabilities?.map((v, i) => (
                    <SelectItem key={i} value={String(i)}>
                      [{v.severity.toUpperCase()}] {v.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={analyze}
            disabled={!selectedVuln || loading}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            {loading ? 'Searching CVE Databases...' : 'Correlate with CVE / NVD / ExploitDB'}
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          <p className="text-white font-semibold">Searching NVD, CISA KEV, ExploitDB...</p>
          <p className="text-slate-400 text-sm">Mapping MITRE ATT&CK techniques</p>
        </div>
      )}

      {intel && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Risk Summary */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Risk Priority Score</p>
                  <p className={`text-4xl font-bold mt-1 ${intel.risk_priority_score >= 80 ? 'text-red-400' : intel.risk_priority_score >= 60 ? 'text-orange-400' : 'text-yellow-400'}`}>
                    {intel.risk_priority_score}<span className="text-lg text-slate-500">/100</span>
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 text-sm mb-1">Threat Summary</p>
                  <p className="text-white text-sm leading-relaxed">{intel.threat_summary}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm font-semibold text-cyan-400 mb-1">Contextual Remediation</p>
                <p className="text-slate-300 text-sm">{intel.contextual_remediation}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CVEs */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800 py-3 px-4">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  Related CVEs ({intel.cves?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-800">
                {intel.cves?.length ? intel.cves.map((cve, i) => (
                  <div key={i} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a href={`https://nvd.nist.gov/vuln/detail/${cve.cve_id}`} target="_blank" rel="noopener noreferrer"
                            className="text-cyan-400 font-mono text-sm hover:underline flex items-center gap-1">
                            {cve.cve_id} <ExternalLink className="w-3 h-3" />
                          </a>
                          {cve.in_cisa_kev && <Badge className="bg-red-900 text-red-300 border border-red-500/40 text-xs">CISA KEV</Badge>}
                        </div>
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2">{cve.description}</p>
                        {cve.kev_date_added && <p className="text-xs text-red-400 mt-1">Added to KEV: {cve.kev_date_added}</p>}
                      </div>
                      <span className={`text-lg font-bold flex-shrink-0 ${cvssColor(cve.cvss_score)}`}>{cve.cvss_score}</span>
                    </div>
                  </div>
                )) : <p className="p-4 text-slate-500 text-sm">No direct CVE matches found.</p>}
              </CardContent>
            </Card>

            {/* Exploit Availability */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800 py-3 px-4">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-400" />
                  Exploit Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {intel.exploit_availability && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Public Exploit</span>
                      <Badge className={intel.exploit_availability.has_public_exploit ? 'bg-red-500 text-white' : 'bg-green-700 text-green-200'}>
                        {intel.exploit_availability.has_public_exploit ? 'YES' : 'NOT FOUND'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Ease of Exploitation</span>
                      <span className="text-orange-400 text-sm font-medium">{intel.exploit_availability.ease_of_exploitation}</span>
                    </div>
                    {intel.exploit_availability.metasploit_module && (
                      <div>
                        <span className="text-slate-400 text-xs">Metasploit Module</span>
                        <p className="text-cyan-400 font-mono text-xs mt-0.5">{intel.exploit_availability.metasploit_module}</p>
                      </div>
                    )}
                    {intel.exploit_availability.exploitdb_ids?.length > 0 && (
                      <div>
                        <span className="text-slate-400 text-xs">ExploitDB IDs</span>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {intel.exploit_availability.exploitdb_ids.map((id, i) => (
                            <a key={i} href={`https://www.exploit-db.com/exploits/${id}`} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-orange-400 hover:underline">EDB-{id}</a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* MITRE ATT&CK */}
          {intel.mitre_attack?.techniques?.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800 py-3 px-4">
                <CardTitle className="text-white text-sm">MITRE ATT&CK Techniques</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex gap-2 flex-wrap">
                  {intel.mitre_attack.techniques.map((t, i) => (
                    <a key={i} href={`https://attack.mitre.org/techniques/${t.technique_id?.replace('.', '/')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-cyan-500/40 rounded-lg px-3 py-2 group transition-colors">
                      <span className="text-cyan-400 font-mono text-xs">{t.technique_id}</span>
                      <span className="text-slate-300 text-xs">{t.technique_name}</span>
                      <span className="text-slate-500 text-xs">({t.tactic})</span>
                      <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* IOCs / Detection Rules */}
          {(intel.iocs?.length > 0 || intel.detection_rules?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {intel.detection_rules?.length > 0 && (
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="border-b border-slate-800 py-3 px-4">
                    <CardTitle className="text-white text-sm">Detection Rules</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {intel.detection_rules.map((rule, i) => (
                      <p key={i} className="text-slate-300 text-xs bg-slate-800 rounded p-2 font-mono">{rule}</p>
                    ))}
                  </CardContent>
                </Card>
              )}
              {intel.iocs?.length > 0 && (
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="border-b border-slate-800 py-3 px-4">
                    <CardTitle className="text-white text-sm">Indicators of Compromise</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {intel.iocs.map((ioc, i) => (
                      <p key={i} className="text-orange-300 text-xs bg-slate-800 rounded p-2 font-mono">{ioc}</p>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}