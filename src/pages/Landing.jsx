import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Code, GitPullRequest, BarChart3, Bell, Settings,
  Globe, Crosshair, ChevronRight, Play, CheckCircle, ArrowRight,
  Zap, Lock, Activity, FolderOpen, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    icon: Code,
    title: 'Paste or Upload Code',
    description: 'Submit any code file or paste code snippets directly into the scanner.',
    color: 'cyan',
    demo: (
      <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-green-400 border border-cyan-500/20">
        <p className="text-slate-500 mb-2"># Paste your code here...</p>
        <p><span className="text-cyan-400">def</span> <span className="text-yellow-400">get_user</span>(id):</p>
        <p className="pl-4"><span className="text-cyan-400">query</span> = <span className="text-orange-400">"SELECT * FROM users WHERE id=" + id</span></p>
        <p className="pl-4 text-red-400 mt-1">{'# ⚠ SQL Injection detected'}</p>
      </div>
    )
  },
  {
    icon: Shield,
    title: 'AI Scans for Vulnerabilities',
    description: 'Our AI engine detects 20+ vulnerability types including SQL injection, XSS, RCE, and more.',
    color: 'orange',
    demo: (
      <div className="space-y-2">
        {['SQL Injection — Critical', 'Hardcoded Secret — High', 'XSS Vector — Medium'].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.3 }}
            className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
              i === 0 ? 'bg-red-950/30 border-red-500/30 text-red-400' :
              i === 1 ? 'bg-orange-950/30 border-orange-500/30 text-orange-400' :
              'bg-yellow-950/30 border-yellow-500/30 text-yellow-400'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-current" />
            {item}
          </motion.div>
        ))}
      </div>
    )
  },
  {
    icon: GitPullRequest,
    title: 'Auto-Fix via GitHub PR',
    description: 'One click generates an AI-patched pull request directly to your repository.',
    color: 'green',
    demo: (
      <div className="bg-slate-900 border border-green-500/20 rounded-lg p-4 text-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-green-400 font-semibold">PR #42 opened</span>
        </div>
        <p className="text-slate-300 mb-1 font-semibold">🔐 Security Fix: SQL Injection</p>
        <p className="text-slate-500">Parameterized query applied in user_service.py</p>
        <div className="mt-3 flex gap-2">
          <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">+3 lines</span>
          <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">-1 line</span>
        </div>
      </div>
    )
  },
  {
    icon: BarChart3,
    title: 'Track & Monitor',
    description: 'View analytics, set policies, schedule scans, and monitor your security posture over time.',
    color: 'violet',
    demo: (
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Security Score', value: '87', unit: '/100', color: 'text-green-400' },
          { label: 'Issues Fixed', value: '24', unit: 'total', color: 'text-cyan-400' },
          { label: 'Active Alerts', value: '2', unit: 'open', color: 'text-orange-400' },
          { label: 'Scans Run', value: '56', unit: 'this month', color: 'text-violet-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-slate-500 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>
    )
  }
];

const FEATURES = [
  { icon: Shield, label: 'AI Code Scanner', desc: 'Detect 20+ vuln types instantly', path: '/Scanner', color: 'cyan' },
  { icon: BarChart3, label: 'Analytics', desc: 'Track security trends over time', path: '/Analytics', color: 'blue' },
  { icon: Activity, label: 'Monitoring', desc: 'Real-time deployment health', path: '/Monitoring', color: 'green' },
  { icon: Globe, label: 'Threat Intel', desc: 'CVE correlation & threat feeds', path: '/ThreatIntel', color: 'orange' },
  { icon: Crosshair, label: 'Red Team', desc: 'Exploit simulation & PoC', path: '/RedTeam', color: 'red' },
  { icon: Settings, label: 'Policy Engine', desc: 'OWASP, PCI DSS, HIPAA compliance', path: '/PolicyEngine', color: 'indigo' },
  { icon: GitPullRequest, label: 'PR Scanning', desc: 'Auto-scan pull requests', path: '/PRIntegration', color: 'violet' },
  { icon: Bell, label: 'Alerts', desc: 'Critical vulnerability alerts', path: '/Alerts', color: 'rose' },
  { icon: FolderOpen, label: 'Projects', desc: 'Organize repos & track progress', path: '/Projects', color: 'amber' },
  { icon: Calendar, label: 'Scheduled Scans', desc: 'Automate recurring security checks', path: '/Scanner', color: 'teal' },
];

const colorMap = {
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  green: 'text-green-400 bg-green-500/10 border-green-500/30',
  orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  red: 'text-red-400 bg-red-500/10 border-red-500/30',
  indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  teal: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
};

export default function Landing() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Grid bg */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDIxNywyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30 pointer-events-none" />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold">CodeGuard</span>
            </div>
            <Button
              onClick={() => navigate('/Scanner')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold hover:opacity-90"
            >
              Launch App <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 text-cyan-400 text-sm mb-6">
              <Zap className="w-4 h-4" /> AI-Powered Security Analysis
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Secure Your Code<br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Before Attackers Do
              </span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              CodeGuard scans your code for vulnerabilities, generates AI-powered fixes, and monitors your security posture — all in one platform.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                onClick={() => navigate('/Scanner')}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold text-base px-8 hover:opacity-90"
              >
                <Play className="w-5 h-5 mr-2" /> Start Scanning Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-base px-8"
              >
                See How It Works
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-16"
          >
            {[
              { value: '20+', label: 'Vuln Types' },
              { value: '1-click', label: 'Auto-Fix PR' },
              { value: '100%', label: 'AI-Powered' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-cyan-400">{stat.value}</p>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-slate-400">From code to secure in 4 simple steps</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Steps list */}
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = activeStep === i;
                return (
                  <motion.div
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'bg-slate-800/60 border-cyan-500/40'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg flex-shrink-0 ${isActive ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500 font-semibold">STEP {i + 1}</span>
                        {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                      </div>
                      <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}>{step.title}</h3>
                      <p className="text-slate-500 text-sm mt-0.5">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Demo panel */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 min-h-[200px]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-500 text-xs ml-2">CodeGuard Preview</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-slate-400 text-xs uppercase font-semibold mb-3">
                    Step {activeStep + 1}: {STEPS[activeStep].title}
                  </p>
                  {STEPS[activeStep].demo}
                </motion.div>
              </AnimatePresence>

              {/* Step dots */}
              <div className="flex justify-center gap-2 mt-6">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === activeStep ? 'bg-cyan-400 w-6' : 'bg-slate-700'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything You Need</h2>
            <p className="text-slate-400">A complete security platform for modern development teams</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              const cls = colorMap[feature.color];
              return (
                <motion.div
                  key={feature.label}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => navigate(feature.path)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg bg-slate-900/50 ${cls}`}
                >
                  <Icon className="w-6 h-6 mb-3" />
                  <p className="font-semibold text-sm text-white">{feature.label}</p>
                  <p className="text-slate-500 text-xs mt-1">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-12"
          >
            <Lock className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Secure Your Code?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Start scanning in seconds. No setup required — just paste your code and let CodeGuard do the rest.
            </p>
            <Button
              onClick={() => navigate('/Scanner')}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold text-lg px-10 hover:opacity-90"
            >
              <Shield className="w-5 h-5 mr-2" /> Launch CodeGuard
            </Button>
            <div className="flex justify-center gap-6 mt-8 text-sm text-slate-500">
              {['No credit card required', 'AI-powered results', 'GitHub integration'].map(item => (
                <span key={item} className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" /> {item}
                </span>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-8 text-center text-slate-600 text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-cyan-500" />
            <span className="text-slate-400 font-semibold">CodeGuard</span>
          </div>
          <p>AI-Powered Security Analysis Platform</p>
          <p className="mt-2">© {new Date().getFullYear()} Demayne Collins. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}