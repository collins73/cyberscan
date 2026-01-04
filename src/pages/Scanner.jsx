import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Loader2, ArrowLeft, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import CodeInput from '../components/scanner/CodeInput';
import ScanResults from '../components/scanner/ScanResults';
import ScanHistory from '../components/scanner/ScanHistory';

export default function Scanner() {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState(null);
  const [view, setView] = useState('input'); // 'input' or 'results'
  const queryClient = useQueryClient();

  const { data: scans = [] } = useQuery({
    queryKey: ['codeScans'],
    queryFn: () => base44.entities.CodeScan.list('-created_date', 10)
  });

  const createScanMutation = useMutation({
    mutationFn: (scanData) => base44.entities.CodeScan.create(scanData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeScans'] });
    }
  });

  const createMetricMutation = useMutation({
    mutationFn: (metricData) => base44.entities.VulnerabilityMetric.create(metricData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilityMetrics'] });
    }
  });

  const handleScanStart = async ({ code, fileName }) => {
    setIsScanning(true);
    const startTime = Date.now();

    try {
      // Detect language from filename or code
      const language = detectLanguage(fileName, code);

      // Use AI to analyze code for vulnerabilities
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert cybersecurity code analyst. Analyze the following code for security vulnerabilities.

Code to analyze:
\`\`\`
${code}
\`\`\`

File: ${fileName}
Language: ${language || 'Unknown'}

Please identify ALL security vulnerabilities including but not limited to:
- SQL Injection vulnerabilities
- Cross-Site Scripting (XSS) 
- Hardcoded secrets/credentials
- Insecure authentication/authorization
- Cryptographic issues
- Input validation issues
- Path traversal vulnerabilities
- Command injection
- Insecure dependencies
- Memory safety issues
- Logic flaws

For each vulnerability found, provide:
1. A clear title
2. Severity level (critical, high, medium, or low)
3. Detailed description of the issue
4. Line number or code location if identifiable
5. The vulnerable code snippet
6. Specific recommendation to fix it

Also provide an overall security score from 0-100 (100 being most secure).`,
        response_json_schema: {
          type: "object",
          properties: {
            vulnerabilities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  severity: { 
                    type: "string",
                    enum: ["critical", "high", "medium", "low"]
                  },
                  description: { type: "string" },
                  line_number: { type: "string" },
                  code_example: { type: "string" },
                  recommendation: { type: "string" }
                },
                required: ["title", "severity", "description", "recommendation"]
              }
            },
            overall_score: { type: "number" }
          },
          required: ["vulnerabilities", "overall_score"]
        }
      });

      const scanDuration = ((Date.now() - startTime) / 1000).toFixed(1);

      const scanData = {
        file_name: fileName,
        language: language || 'Unknown',
        code_snippet: code.substring(0, 500),
        vulnerabilities: response.vulnerabilities || [],
        overall_score: response.overall_score || 0,
        scan_duration: parseFloat(scanDuration)
      };

      // Save scan to database
      const savedScan = await createScanMutation.mutateAsync(scanData);

      // Track metrics for each vulnerability
      if (response.vulnerabilities && response.vulnerabilities.length > 0) {
        for (const vuln of response.vulnerabilities) {
          await createMetricMutation.mutateAsync({
            vulnerability_type: vuln.title,
            severity: vuln.severity,
            language: language || 'Unknown',
            scan_id: savedScan.id,
            count: 1,
            security_score: response.overall_score || 0
          });
        }
      }

      setCurrentScan(scanData);
      setView('results');
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const detectLanguage = (fileName, code) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap = {
      'js': 'JavaScript',
      'jsx': 'JavaScript/React',
      'ts': 'TypeScript',
      'tsx': 'TypeScript/React',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'go': 'Go',
      'rb': 'Ruby',
      'php': 'PHP',
      'html': 'HTML',
      'css': 'CSS'
    };
    return langMap[ext] || null;
  };

  const handleViewScan = (scan) => {
    setCurrentScan(scan);
    setView('results');
  };

  const handleBackToInput = () => {
    setView('input');
    setCurrentScan(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDIxNywyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
      
      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                  <Shield className="w-8 h-8 text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                      CyberScan
                    </h1>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                      v2.0
                    </Badge>
                  </div>
                  <p className="text-cyan-400 text-sm font-medium">
                    AI-Powered Security Analysis
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/Analytics')}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
                {view === 'results' && (
                  <Button
                    onClick={handleBackToInput}
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    New Scan
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {isScanning ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[400px]"
            >
              <div className="relative">
                <Loader2 className="w-20 h-20 text-cyan-500 animate-spin" />
                <div className="absolute inset-0 blur-xl bg-cyan-500/30 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mt-8 mb-2">
                Scanning Code...
              </h2>
              <p className="text-slate-400">
                Analyzing for security vulnerabilities
              </p>
            </motion.div>
          ) : view === 'input' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Submit Code for Analysis
                  </h2>
                  <CodeInput onScanStart={handleScanStart} />
                </motion.div>
              </div>
              
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-6">
                    History
                  </h2>
                  <ScanHistory scans={scans} onViewScan={handleViewScan} />
                </motion.div>
              </div>
            </div>
          ) : (
            <ScanResults scanData={currentScan} />
          )}
        </div>
      </div>
    </div>
  );
}