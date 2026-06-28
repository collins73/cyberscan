import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Shield, Copy, Check, Terminal, KeyRound, Github, Loader2, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Developer Portal v1.0

const ENDPOINTS = [
  { method: 'POST', path: '/functions/generateApiKey', desc: 'Generate a new API key for a given tier.' },
  { method: 'POST', path: '/functions/scanCodeApi', desc: 'Scan a code snippet for vulnerabilities.' },
  { method: 'POST', path: '/functions/scanRepositoryApi', desc: 'Scan a full GitHub repository.' },
  { method: 'POST', path: '/functions/scanApiSecurity', desc: 'Run OWASP API security checks.' },
  { method: 'POST', path: '/functions/generateComplianceReport', desc: 'Produce an audit-ready compliance report.' },
  { method: 'GET', path: '/functions/getScanResults', desc: 'Retrieve the results of a single scan.' },
  { method: 'GET', path: '/functions/listScans', desc: 'List all scans for your API key.' },
];

const PRICING = [
  { name: 'Free', price: '$0', limit: '10 scans/day', features: ['Code snippet scanning', 'OWASP Top 10', 'Community support'], accent: 'border-slate-700' },
  { name: 'Pro', price: '$19.99', limit: '100 scans/day', features: ['Everything in Free', 'Repository scanning', 'Compliance reports', 'Priority support'], accent: 'border-cyan-500/50', highlighted: true },
  { name: 'Enterprise', price: '$99.99', limit: '1000 scans/day', features: ['Everything in Pro', 'Dedicated throughput', 'SLA & audit support', 'Custom policies'], accent: 'border-violet-500/50' },
];

const CURL_EXAMPLE = `curl -X POST https://your-app.base44.app/functions/scanCodeApi \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "def get_user(id):\\n    query = \\"SELECT * FROM users WHERE id=\\" + id",
    "language": "python"
  }'`;

const YAML_EXAMPLE = `name: CodeGuard Security Scan
on: [pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run CodeGuard Scan
        run: |
          curl -X POST https://your-app.base44.app/functions/scanRepositoryApi \\
            -H "Authorization: Bearer \${{ secrets.CODEGUARD_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{"repo": "\${{ github.repository }}"}'`;

function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      {label && <div className="px-4 py-2 border-b border-slate-800 text-xs text-slate-500 font-mono">{label}</div>}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="p-4 text-xs text-green-300 font-mono overflow-x-auto whitespace-pre">{code}</pre>
    </div>
  );
}

export default function DeveloperPortal() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', tier: 'Free' });
  const [generatedKey, setGeneratedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

  const handleGenerate = async () => {
    if (!form.name || !form.email) {
      setError('Key name and email are required.');
      return;
    }
    setError('');
    setLoading(true);
    setGeneratedKey('');
    try {
      const res = await base44.functions.invoke('generateApiKey', {
        name: form.name,
        owner_email: form.email,
        tier: form.tier,
      });
      const key = res?.data?.api_key || res?.data?.key || res?.data?.apiKey;
      if (key) {
        setGeneratedKey(key);
      } else {
        setError('Key generated, but no key value was returned.');
      }
    } catch (e) {
      setError(e?.message || 'Failed to generate API key.');
    }
    setLoading(false);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <Button
            onClick={() => navigate('/Scanner')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold hover:opacity-90"
          >
            <LayoutDashboard className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-cyan-400 border border-cyan-500/40 bg-cyan-500/10 rounded px-2 py-1">
              v1.1.0
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">CodeGuard Security API</h1>
          <p className="text-slate-400 text-lg">Security-as-a-Service for Developers</p>
        </header>

        {/* API Key Generator */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-cyan-400" />
            <h2 className="text-2xl font-bold">Generate an API Key</h2>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Key name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold hover:opacity-90"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Generate Key
            </Button>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {generatedKey && (
              <div className="bg-slate-950 border border-green-500/30 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-2">Your API key — copy it now, it won't be shown again:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-green-400 font-mono text-sm break-all">{generatedKey}</code>
                  <button onClick={copyKey} className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300">
                    {keyCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-2xl font-bold">Quick Start</h2>
          </div>
          <p className="text-slate-400 text-sm mb-4">Scan a code snippet with a single cURL call:</p>
          <CodeBlock code={CURL_EXAMPLE} label="bash" />
        </section>

        {/* Endpoints */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">API Endpoints</h2>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-left">
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Path</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map((ep) => (
                  <tr key={ep.path} className="border-b border-slate-800/50 last:border-0">
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold font-mono ${ep.method === 'GET' ? 'text-green-400' : 'text-cyan-400'}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-300">{ep.path}</td>
                    <td className="px-5 py-3 text-slate-400">{ep.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* GitHub Action */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <Github className="w-5 h-5 text-cyan-400" />
            <h2 className="text-2xl font-bold">GitHub Action</h2>
          </div>
          <p className="text-slate-400 text-sm mb-4">Add CodeGuard to your CI pipeline to scan every pull request:</p>
          <CodeBlock code={YAML_EXAMPLE} label=".github/workflows/codeguard.yml" />
        </section>

        {/* Pricing */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`relative bg-slate-900/60 border rounded-2xl p-6 ${tier.accent} ${tier.highlighted ? 'md:-translate-y-2' : ''}`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wider text-black bg-cyan-400 rounded-full px-3 py-1">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
                <p className="text-3xl font-extrabold mb-1">{tier.price}<span className="text-sm text-slate-500 font-normal">/mo</span></p>
                <p className="text-cyan-400 text-sm mb-5">{tier.limit}</p>
                <ul className="space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
          <p>Built by RebelAgents</p>
        </footer>
      </div>
    </div>
  );
}