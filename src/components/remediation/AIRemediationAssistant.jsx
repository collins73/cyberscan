import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, CheckCircle, AlertTriangle, Code, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIRemediationAssistant({ vulnerability, codeSnippet, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [remediation, setRemediation] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateRemediation = async () => {
    setIsLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert cybersecurity consultant helping developers fix code vulnerabilities.

Vulnerability Details:
- Title: ${vulnerability.title}
- Severity: ${vulnerability.severity}
- Description: ${vulnerability.description}
${vulnerability.code_example ? `- Vulnerable Code:\n${vulnerability.code_example}` : ''}
${codeSnippet ? `- Full Context:\n${codeSnippet}` : ''}

Please provide:
1. A fixed version of the code with proper security measures
2. A clear explanation of what changes were made and why
3. The security implications and risks if this vulnerability is NOT fixed (be specific about potential attacks)
4. Step-by-step remediation instructions
5. Whether this fix can be safely automated (yes/no) and why

Be specific, practical, and provide production-ready code.`,
        response_json_schema: {
          type: "object",
          properties: {
            fixed_code: {
              type: "string",
              description: "The corrected code snippet with security fixes applied"
            },
            explanation: {
              type: "string",
              description: "Clear explanation of what was fixed and why"
            },
            security_implications: {
              type: "string",
              description: "Detailed explanation of risks if not fixed, including potential attack vectors"
            },
            remediation_steps: {
              type: "array",
              items: { type: "string" },
              description: "Step-by-step instructions to implement the fix"
            },
            can_automate: {
              type: "boolean",
              description: "Whether this fix can be safely automated"
            },
            automation_reasoning: {
              type: "string",
              description: "Why this can or cannot be safely automated"
            }
          }
        }
      });

      setRemediation(response);
    } catch (error) {
      console.error('Failed to generate remediation:', error);
      alert('Failed to generate remediation suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    generateRemediation();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-cyan-500/30 rounded-xl max-w-5xl w-full my-8 shadow-2xl"
      >
        <CardHeader className="border-b border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-white">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              AI Remediation Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
          <div className="mt-3">
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              {vulnerability.title}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
              <p className="text-slate-400">Analyzing vulnerability and generating fixes...</p>
            </div>
          ) : remediation ? (
            <AnimatePresence>
              {/* Security Implications Warning */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-red-950/30 border-red-500/30">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                          Security Implications
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {remediation.security_implications}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Fixed Code */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-green-400 font-semibold flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Fixed Code
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(remediation.fixed_code)}
                      className="bg-slate-800 hover:bg-slate-700 text-cyan-400"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="bg-slate-950 border border-green-500/20 rounded-lg p-4 overflow-x-auto">
                    <code className="text-green-400 font-mono text-sm">
                      {remediation.fixed_code}
                    </code>
                  </pre>
                </div>
              </motion.div>

              {/* Explanation */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <h3 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      What Changed
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {remediation.explanation}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Remediation Steps */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-cyan-400" />
                    Step-by-Step Remediation
                  </h3>
                  <div className="space-y-2">
                    {remediation.remediation_steps?.map((step, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-slate-300 text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Automation Status */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className={`border ${
                  remediation.can_automate 
                    ? 'bg-green-950/30 border-green-500/30' 
                    : 'bg-yellow-950/30 border-yellow-500/30'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Badge className={
                        remediation.can_automate
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-black'
                      }>
                        {remediation.can_automate ? 'Can Automate' : 'Manual Fix Required'}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-slate-300 text-sm">
                          {remediation.automation_reasoning}
                        </p>
                        {remediation.can_automate && (
                          <Button
                            className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => copyToClipboard(remediation.fixed_code)}
                          >
                            <Code className="w-4 h-4 mr-2" />
                            Copy Fixed Code
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          ) : null}
        </CardContent>
      </motion.div>
    </motion.div>
  );
}