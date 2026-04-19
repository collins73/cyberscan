import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, CheckCircle, AlertTriangle, Code, Info, X, GitCompare, FileCode, ListChecks, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'patch', label: 'Patch', icon: GitCompare },
  { id: 'steps', label: 'Fix Steps', icon: ListChecks },
  { id: 'full', label: 'Full Fixed File', icon: FileCode },
  { id: 'risk', label: 'Risk', icon: AlertTriangle },
];

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" onClick={copy} className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700">
      {copied ? <><CheckCircle className="w-3 h-3 mr-1.5" />Copied!</> : <><Copy className="w-3 h-3 mr-1.5" />{label}</>}
    </Button>
  );
}

function DiffView({ original, fixed }) {
  if (!original && !fixed) return null;

  // Compute simple line-by-line diff for display
  const origLines = (original || '').split('\n');
  const fixedLines = (fixed || '').split('\n');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-red-400 text-xs font-semibold uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Vulnerable
          </span>
          {original && <CopyButton text={original} label="Copy" />}
        </div>
        <pre className="bg-slate-950 border border-red-500/30 rounded-lg p-4 overflow-auto max-h-72 text-xs">
          {origLines.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-slate-600 select-none w-6 text-right flex-shrink-0">{i + 1}</span>
              <code className="text-red-300 font-mono whitespace-pre">{line}</code>
            </div>
          ))}
        </pre>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-green-400 text-xs font-semibold uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Patched
          </span>
          {fixed && <CopyButton text={fixed} label="Copy" />}
        </div>
        <pre className="bg-slate-950 border border-green-500/30 rounded-lg p-4 overflow-auto max-h-72 text-xs">
          {fixedLines.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-slate-600 select-none w-6 text-right flex-shrink-0">{i + 1}</span>
              <code className="text-green-300 font-mono whitespace-pre">{line}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

export default function AIRemediationAssistant({ vulnerability, codeSnippet, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingFull, setIsGeneratingFull] = useState(false);
  const [remediation, setRemediation] = useState(null);
  const [fullPatchedFile, setFullPatchedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('patch');

  const generateRemediation = async () => {
    setIsLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite cybersecurity engineer. A code vulnerability has been detected and you must provide a complete, production-ready patch.

VULNERABILITY:
- Title: ${vulnerability.title}
- Severity: ${vulnerability.severity}
- Description: ${vulnerability.description}
- Line: ${vulnerability.line_number || 'unknown'}
${vulnerability.code_example ? `\nVULNERABLE CODE SNIPPET:\n\`\`\`\n${vulnerability.code_example}\n\`\`\`` : ''}
${codeSnippet ? `\nFULL FILE CONTEXT (first 500 chars):\n\`\`\`\n${codeSnippet}\n\`\`\`` : ''}

Provide:
1. fixed_snippet: The exact corrected replacement for just the vulnerable code block (keep it minimal — only the lines that need changing)
2. explanation: Concise technical explanation of what changed and why it fixes the vulnerability
3. security_implications: What attacks become possible if this is NOT fixed (specific CVE classes, attack vectors, real-world impact)
4. remediation_steps: Ordered list of steps to apply the fix safely in production
5. can_automate: true if a script/tool can apply this safely without manual review
6. automation_reasoning: Why it can/can't be automated
7. additional_packages: any new dependencies or imports needed (empty array if none)
8. test_cases: 2-3 test cases to verify the fix works correctly`,
        response_json_schema: {
          type: "object",
          properties: {
            fixed_snippet: { type: "string" },
            explanation: { type: "string" },
            security_implications: { type: "string" },
            remediation_steps: { type: "array", items: { type: "string" } },
            can_automate: { type: "boolean" },
            automation_reasoning: { type: "string" },
            additional_packages: { type: "array", items: { type: "string" } },
            test_cases: { type: "array", items: { type: "string" } }
          },
          required: ["fixed_snippet", "explanation", "security_implications", "remediation_steps", "can_automate", "automation_reasoning"]
        }
      });
      setRemediation(response);
    } catch (error) {
      console.error('Remediation generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFullPatch = async () => {
    if (!codeSnippet || !remediation) return;
    setIsGeneratingFull(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a code patching tool. Apply the security fix below to the full source file.

ORIGINAL FILE:
\`\`\`
${codeSnippet}
\`\`\`

VULNERABILITY TO FIX: ${vulnerability.title}
FIX TO APPLY:
\`\`\`
${remediation.fixed_snippet}
\`\`\`

Return the complete patched file content with the security fix applied. Only fix the vulnerability — do not change any other code. Return ONLY the file content, no markdown fences, no explanation.`,
        response_json_schema: {
          type: "object",
          properties: {
            patched_file: { type: "string" }
          },
          required: ["patched_file"]
        }
      });
      setFullPatchedFile(response.patched_file);
      setActiveTab('full');
    } catch (error) {
      console.error('Full patch generation failed:', error);
    } finally {
      setIsGeneratingFull(false);
    }
  };

  useEffect(() => { generateRemediation(); }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-slate-950 border border-purple-500/30 rounded-xl max-w-5xl w-full my-8 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">AI Patch Assistant</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">{vulnerability.title}</Badge>
                <Badge className={`text-xs ${
                  vulnerability.severity === 'critical' ? 'bg-red-500 text-white' :
                  vulnerability.severity === 'high' ? 'bg-orange-500 text-white' :
                  vulnerability.severity === 'medium' ? 'bg-yellow-500 text-black' :
                  'bg-blue-500 text-white'
                }`}>{vulnerability.severity?.toUpperCase()}</Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5 text-slate-400" /></Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <Loader2 className="w-14 h-14 text-purple-500 animate-spin" />
              <div className="absolute inset-0 blur-xl bg-purple-500/20 animate-pulse" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">Generating Security Patch...</p>
            <p className="text-slate-400 text-sm">Analyzing vulnerability and crafting production-ready fix</p>
          </div>
        ) : remediation ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-800 px-4">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
              {/* PATCH TAB */}
              {activeTab === 'patch' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {/* Automation badge */}
                  <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                    remediation.can_automate
                      ? 'bg-green-950/20 border-green-500/30'
                      : 'bg-yellow-950/20 border-yellow-500/30'
                  }`}>
                    <Zap className={`w-5 h-5 flex-shrink-0 mt-0.5 ${remediation.can_automate ? 'text-green-400' : 'text-yellow-400'}`} />
                    <div>
                      <Badge className={remediation.can_automate ? 'bg-green-500 text-white mb-1' : 'bg-yellow-500 text-black mb-1'}>
                        {remediation.can_automate ? 'Safe to Auto-Apply' : 'Manual Review Required'}
                      </Badge>
                      <p className="text-slate-300 text-sm">{remediation.automation_reasoning}</p>
                    </div>
                  </div>

                  {/* Side-by-side diff */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <GitCompare className="w-4 h-4 text-purple-400" />
                      Code Diff
                    </h3>
                    <DiffView original={vulnerability.code_example} fixed={remediation.fixed_snippet} />
                  </div>

                  {/* Explanation */}
                  <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                      <h3 className="text-cyan-400 font-semibold mb-2 flex items-center gap-2 text-sm">
                        <Info className="w-4 h-4" /> What Changed
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">{remediation.explanation}</p>
                    </CardContent>
                  </Card>

                  {/* Additional packages */}
                  {remediation.additional_packages?.length > 0 && (
                    <Card className="bg-blue-950/20 border-blue-500/30">
                      <CardContent className="p-4">
                        <h3 className="text-blue-400 font-semibold mb-2 text-sm">New Dependencies Required</h3>
                        <div className="flex flex-wrap gap-2">
                          {remediation.additional_packages.map((pkg, i) => (
                            <Badge key={i} className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-mono text-xs">{pkg}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Generate full patch CTA */}
                  {codeSnippet && !fullPatchedFile && (
                    <div className="bg-purple-950/20 border border-purple-500/30 rounded-lg p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-purple-300 font-semibold text-sm">Generate fully patched file?</p>
                        <p className="text-slate-400 text-xs mt-0.5">Apply this fix to the entire original source file</p>
                      </div>
                      <Button
                        onClick={generateFullPatch}
                        disabled={isGeneratingFull}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm flex-shrink-0"
                      >
                        {isGeneratingFull
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Patching...</>
                          : <><FileCode className="w-4 h-4 mr-2" />Patch Full File</>}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEPS TAB */}
              {activeTab === 'steps' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-purple-400" />
                    Step-by-Step Remediation Plan
                  </h3>
                  {remediation.remediation_steps?.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4 p-4 bg-slate-900 rounded-lg border border-slate-800"
                    >
                      <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">{step}</p>
                    </motion.div>
                  ))}

                  {/* Test cases */}
                  {remediation.test_cases?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Verification Test Cases
                      </h3>
                      {remediation.test_cases.map((tc, i) => (
                        <div key={i} className="flex gap-3 p-3 bg-green-950/20 border border-green-500/20 rounded-lg mb-2">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <p className="text-slate-300 text-sm">{tc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* FULL FILE TAB */}
              {activeTab === 'full' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {fullPatchedFile ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-green-400 font-semibold flex items-center gap-2">
                          <FileCode className="w-4 h-4" />
                          Fully Patched File
                        </h3>
                        <CopyButton text={fullPatchedFile} label="Copy Full File" />
                      </div>
                      <pre className="bg-slate-950 border border-green-500/20 rounded-lg p-4 overflow-auto max-h-[45vh] text-xs">
                        {fullPatchedFile.split('\n').map((line, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-slate-600 select-none w-6 text-right flex-shrink-0">{i + 1}</span>
                            <code className="text-green-300 font-mono whitespace-pre">{line}</code>
                          </div>
                        ))}
                      </pre>
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <FileCode className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                      <p className="text-slate-400 mb-4">No full patch generated yet.</p>
                      {codeSnippet ? (
                        <Button
                          onClick={generateFullPatch}
                          disabled={isGeneratingFull}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        >
                          {isGeneratingFull
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Patching File...</>
                            : <><FileCode className="w-4 h-4 mr-2" />Generate Full Patched File</>}
                        </Button>
                      ) : (
                        <p className="text-slate-500 text-sm">Full file context not available for this scan.</p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* RISK TAB */}
              {activeTab === 'risk' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Card className="bg-red-950/20 border-red-500/30">
                    <CardContent className="p-5">
                      <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Security Risk if Unfixed
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">{remediation.security_implications}</p>
                    </CardContent>
                  </Card>
                  {vulnerability.threat_intelligence && (
                    <div className="space-y-3">
                      {vulnerability.threat_intelligence.related_cves?.length > 0 && (
                        <Card className="bg-slate-900 border-slate-800">
                          <CardContent className="p-4">
                            <h3 className="text-orange-400 font-semibold mb-3 text-sm">Related CVEs</h3>
                            <div className="space-y-2">
                              {vulnerability.threat_intelligence.related_cves.map((cve, i) => (
                                <div key={i} className="flex items-start gap-3 p-2 bg-slate-800/50 rounded">
                                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs flex-shrink-0">{cve.cve_id}</Badge>
                                  <div>
                                    <span className="text-cyan-400 text-xs font-semibold mr-2">CVSS: {cve.cvss_score}</span>
                                    <span className="text-slate-400 text-xs">{cve.description}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {vulnerability.threat_intelligence.exploitability && (
                        <Card className="bg-slate-900 border-slate-800">
                          <CardContent className="p-4">
                            <h3 className="text-yellow-400 font-semibold mb-3 text-sm">Exploitability</h3>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { label: 'Ease of Exploit', value: vulnerability.threat_intelligence.exploitability.ease_of_exploit },
                                { label: 'Attack Complexity', value: vulnerability.threat_intelligence.exploitability.attack_complexity },
                                { label: 'Known Exploits', value: vulnerability.threat_intelligence.exploitability.known_exploits },
                              ].map((item, i) => (
                                <div key={i} className="bg-slate-800/50 p-3 rounded text-center">
                                  <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                                  <p className="text-white text-sm font-semibold">{item.value || 'Unknown'}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-5 border-t border-slate-800">
              <p className="text-slate-500 text-xs">AI-generated patch — review before applying to production</p>
              <div className="flex gap-2">
                {remediation?.fixed_snippet && (
                  <CopyButton text={remediation.fixed_snippet} label="Copy Patch" />
                )}
                <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">Close</Button>
              </div>
            </div>
          </>
        ) : null}
      </motion.div>
    </motion.div>
  );
}