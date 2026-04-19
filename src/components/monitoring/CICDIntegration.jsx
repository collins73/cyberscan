import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, GitBranch, Copy, CheckCircle, Code } from "lucide-react";

export default function CICDIntegration({ onClose }) {
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const githubActionsYaml = `name: CyberScan Security Check

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Security Scan
        run: |
          # Submit code to CyberScan API
          curl -X POST https://your-cyberscan-api.com/scan \\
            -H "Authorization: Bearer \${{ secrets.CYBERSCAN_TOKEN }}" \\
            -F "code=@./src" \\
            -F "project=\${GITHUB_REPOSITORY}" \\
            -F "branch=\${GITHUB_REF_NAME}"
      
      - name: Check Results
        run: |
          # Fail build if critical vulnerabilities found
          SCORE=$(curl -s https://your-cyberscan-api.com/scan/\${SCAN_ID}/score)
          if [ \$SCORE -lt 60 ]; then
            echo "❌ Security score below threshold"
            exit 1
          fi`;

  const gitlabCIYaml = `security-scan:
  stage: test
  image: node:16
  script:
    - npm install -g @cyberscan/cli
    - cyberscan scan --project $CI_PROJECT_NAME --branch $CI_COMMIT_REF_NAME
    - cyberscan check --min-score 60
  only:
    - main
    - develop
  artifacts:
    reports:
      security: cyberscan-report.json`;

  const jenkinsGroovy = `pipeline {
    agent any
    stages {
        stage('Security Scan') {
            steps {
                script {
                    sh '''
                        curl -X POST https://your-cyberscan-api.com/scan \\
                          -H "Authorization: Bearer \${CYBERSCAN_TOKEN}" \\
                          -F "code=@./src" \\
                          -F "project=\${JOB_NAME}" \\
                          -F "branch=\${GIT_BRANCH}"
                    '''
                }
            }
        }
        stage('Check Score') {
            steps {
                script {
                    def score = sh(returnStdout: true, script: 'cyberscan get-score').trim()
                    if (score.toInteger() < 60) {
                        error("Security score below threshold: \${score}")
                    }
                }
            }
        }
    }
}`;

  const webhookExample = `{
  "event": "push",
  "repository": "myorg/myapp",
  "branch": "main",
  "commit": "abc123",
  "scan_config": {
    "min_score": 60,
    "fail_on_critical": true,
    "notify_on_new_cve": true
  }
}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-cyan-500/30 rounded-xl max-w-5xl w-full shadow-2xl my-8"
      >
        <CardHeader className="border-b border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-cyan-400" />
              CI/CD Integration Guide
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5 text-slate-400" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="github">GitHub Actions</TabsTrigger>
              <TabsTrigger value="gitlab">GitLab CI</TabsTrigger>
              <TabsTrigger value="jenkins">Jenkins</TabsTrigger>
              <TabsTrigger value="webhook">Webhooks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-white font-semibold text-lg mb-3">Automated Security Scanning</h3>
                <p className="text-slate-300 mb-4">
                  Integrate CyberScan into your CI/CD pipeline to automatically scan code on every commit or merge request.
                </p>
                <div className="grid gap-4 mt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-400 font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Trigger on Events</h4>
                      <p className="text-slate-400 text-sm">Automatically scan on push, pull requests, or scheduled intervals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-400 font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Real-time Feedback</h4>
                      <p className="text-slate-400 text-sm">Get immediate security insights before code reaches production</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-400 font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Fail on Threshold</h4>
                      <p className="text-slate-400 text-sm">Block deployments if security score is below acceptable levels</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-400 font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Track Deployments</h4>
                      <p className="text-slate-400 text-sm">Automatically register deployments in the monitoring dashboard</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="github" className="space-y-4 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    .github/workflows/security-scan.yml
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(githubActionsYaml, 'github')}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    {copied === 'github' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <pre className="bg-slate-950 rounded p-4 overflow-x-auto">
                  <code className="text-sm text-green-400 font-mono">{githubActionsYaml}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="gitlab" className="space-y-4 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    .gitlab-ci.yml
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(gitlabCIYaml, 'gitlab')}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    {copied === 'gitlab' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <pre className="bg-slate-950 rounded p-4 overflow-x-auto">
                  <code className="text-sm text-green-400 font-mono">{gitlabCIYaml}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="jenkins" className="space-y-4 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Jenkinsfile
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(jenkinsGroovy, 'jenkins')}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    {copied === 'jenkins' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <pre className="bg-slate-950 rounded p-4 overflow-x-auto">
                  <code className="text-sm text-green-400 font-mono">{jenkinsGroovy}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="webhook" className="space-y-4 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">Webhook Configuration</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Configure your repository to send webhook events to CyberScan for automatic scanning.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-300 text-sm">Webhook URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        readOnly
                        value="https://api.cyberscan.app/webhook/scan"
                        className="bg-slate-950 border-slate-700 text-slate-300 font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard('https://api.cyberscan.app/webhook/scan', 'webhook-url')}
                      >
                        {copied === 'webhook-url' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h5 className="text-white font-semibold mb-2">Example Payload</h5>
                    <pre className="bg-slate-950 rounded p-4 overflow-x-auto">
                      <code className="text-sm text-cyan-400 font-mono">{webhookExample}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </motion.div>
    </motion.div>
  );
}