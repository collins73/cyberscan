import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Loader2, ExternalLink, ChevronDown, ChevronUp, AlertTriangle, BookOpen, Code2 } from 'lucide-react';

export default function CVECorrelationPanel({ scans }) {
  const [selectedScanId, setSelectedScanId] = useState('');
  const [selectedVulnIdx, setSelectedVulnIdx] = useState('');
  const [intelData, setIntelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState('cves');

  const selectedScan = scans.find(s => s.id === selectedScanId);
  const vulnerabilities = selectedScan?.vulnerabilities || [];
  const selectedVuln = selectedVulnIdx !== '' ? vulnerabilities[parseInt(selectedVulnIdx)] : null;

  const fetchIntel = async () => {
    if (!selectedVuln) return;
    setLoading(true);
    setIntelData(null);
    try {
      const res = await base44.functions.invoke('threatIntelligence', {
        mode: 'enrich_single',
        vulnerabilities: [selectedVuln],
        language: selectedScan?.language
      });
      setIntelData(res.data.intel);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (s) => setExpandedSection(prev => prev === s ? null : s);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Deep CVE Correlation
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Select a vulnerability to enrich it with CVE data, exploit availability, threat actor attribution, and MITRE ATT&CK mappings.
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 text-sm mb-2 block">Select Scan</label>
              <Select value={selectedScanId} onValueChange={(v) => { setSelectedScanId(v); setSelectedVulnIdx(''); setIntelData(null); }}>
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
              <label className="text-slate-300 text-sm mb-2 block">Select Vulnerability</label>
              <Select value={selectedVulnIdx} onValueChange={setSelectedVulnIdx} disabled={!selectedScanId}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Choose a vulnerability..." />
                </SelectTrigger>
                <SelectContent>
                  {vulnerabilities.map((v, i) => (
                    <SelectItem key={i} value={String(i)}>
                      [{v.severity?.toUpperCase()}] {v.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={fetchIntel}
            disabled={!selectedVuln || loading}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
            {loading ? 'Enriching...' : 'Enrich with CVE & Threat Intel'}
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center py-16">
          <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto" />
          <p className="text-white text-xl font-bold mt-6">Querying threat intelligence feeds...</p>
          <p className="text-slate-400 mt-2">Cross-referencing NVD, ExploitDB, CISA KEV, and MITRE ATT&CK</p>
        </div>
      )}

      {intelData && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Header */}
          <Card className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border-cyan-500/30">
            <CardContent className="p-6">
              <h3 className="text-white font-bold text-lg mb-2">{selectedVuln?.title}</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-orange-500 text-white">Score: {intelData.risk_priority_score}/100</Badge>
                <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Exploitation Freq: {intelData.exploitation_frequency}/100
                </Badge>
                {intelData.exploit_availability?.has_public_exploit && (
                  <Badge className="bg-purple-600 text-white">Public Exploit Available</Badge>
                )}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{intelData.threat_summary}</p>
            </CardContent>
          </Card>

          {/* Contextual Remediation */}
          <Card className="bg-green-950/20 border-green-500/30">
            <CardHeader className="pb-2 border-b border-green-500/20">
              <CardTitle className="text-green-400 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Contextual Remediation Advice
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-slate-300 text-sm leading-relaxed">{intelData.contextual_remediation}</p>
            </CardContent>
          </Card>

          {/* CVEs */}
          {intelData.cves?.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800">
              <button onClick={() => toggle('cves')} className="w-full p-4 flex items-center justify-between border-b border-slate-800 hover:bg-slate-800/30">
                <span className="text-white font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Related CVEs ({intelData.cves.length})
                </span>
                {expandedSection === 'cves' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {expandedSection === 'cves' && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      {intelData.cves.map((cve, i) => (
                        <div key={i} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <a href={`https://nvd.nist.gov/vuln/detail/${cve.cve_id}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-mono font-semibold text-sm flex items-center gap-1 hover:underline">
                              {cve.cve_id} <ExternalLink className="w-3 h-3" />
                            </a>
                            {cve.cvss_score && <Badge className="bg-red-800 text-white text-xs">CVSS {cve.cvss_score}</Badge>}
                            {cve.in_cisa_kev && <Badge className="bg-red-600 text-white text-xs">CISA KEV</Badge>}
                          </div>
                          <p className="text-slate-400 text-xs">{cve.description}</p>
                          {cve.cvss_vector && <p className="text-slate-600 text-xs mt-1 font-mono">{cve.cvss_vector}</p>}
                        </div>
                      ))}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Exploit Availability */}
          {intelData.exploit_availability && (
            <Card className="bg-slate-900/50 border-slate-800">
              <button onClick={() => toggle('exploit')} className="w-full p-4 flex items-center justify-between border-b border-slate-800 hover:bg-slate-800/30">
                <span className="text-white font-semibold flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  Exploit Availability
                </span>
                {expandedSection === 'exploit' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {expandedSection === 'exploit' && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <CardContent className="p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/60 p-3 rounded-lg">
                          <p className="text-slate-400 text-xs mb-1">Public Exploit</p>
                          <p className={`font-semibold ${intelData.exploit_availability.has_public_exploit ? 'text-red-400' : 'text-green-400'}`}>
                            {intelData.exploit_availability.has_public_exploit ? 'YES' : 'No'}
                          </p>
                        </div>
                        <div className="bg-slate-800/60 p-3 rounded-lg">
                          <p className="text-slate-400 text-xs mb-1">Ease of Exploitation</p>
                          <p className="text-orange-400 font-semibold text-sm">{intelData.exploit_availability.ease_of_exploitation}</p>
                        </div>
                      </div>
                      {intelData.exploit_availability.metasploit_module && (
                        <div className="bg-slate-800/60 p-3 rounded-lg">
                          <p className="text-slate-400 text-xs mb-1">Metasploit Module</p>
                          <code className="text-purple-300 text-xs">{intelData.exploit_availability.metasploit_module}</code>
                        </div>
                      )}
                      {intelData.exploit_availability.exploitdb_ids?.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {intelData.exploit_availability.exploitdb_ids.map((id, i) => (
                            <a key={i} href={`https://www.exploit-db.com/exploits/${id}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-purple-900/40 text-purple-300 border border-purple-500/30 px-2 py-1 rounded hover:bg-purple-900/60 flex items-center gap-1">
                              EDB-{id} <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* MITRE ATT&CK */}
          {intelData.mitre_attack?.techniques?.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800">
              <button onClick={() => toggle('mitre')} className="w-full p-4 flex items-center justify-between border-b border-slate-800 hover:bg-slate-800/30">
                <span className="text-white font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  MITRE ATT&CK Mappings ({intelData.mitre_attack.techniques.length})
                </span>
                {expandedSection === 'mitre' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {expandedSection === 'mitre' && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {intelData.mitre_attack.techniques.map((t, i) => (
                          <a key={i} href={`https://attack.mitre.org/techniques/${t.technique_id}/`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-950/40 border border-blue-500/30 rounded-lg px-3 py-2 hover:bg-blue-950/60">
                            <span className="text-blue-300 font-mono text-xs font-bold">{t.technique_id}</span>
                            <span className="text-slate-300 text-xs">{t.technique_name}</span>
                            <Badge className="bg-slate-700 text-slate-300 text-xs">{t.tactic}</Badge>
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Detection Rules & IOCs */}
          {(intelData.detection_rules?.length > 0 || intelData.iocs?.length > 0) && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800 pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" /> Detection Rules & IOCs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {intelData.detection_rules?.map((r, i) => (
                  <div key={i} className="bg-slate-800/60 border border-green-500/20 rounded p-3">
                    <p className="text-green-300 text-xs font-mono">{r}</p>
                  </div>
                ))}
                {intelData.iocs?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {intelData.iocs.map((ioc, i) => (
                      <span key={i} className="bg-yellow-900/30 text-yellow-300 border border-yellow-500/30 px-2 py-1 rounded text-xs font-mono">{ioc}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}