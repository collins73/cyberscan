import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Activity, Zap, Globe, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ThreatLandscape from '../components/threatintel/ThreatLandscape';
import ScanPrioritizer from '../components/threatintel/ScanPrioritizer';
import CVECorrelator from '../components/threatintel/CVECorrelator';
import ThreatActorPanel from '../components/threatintel/ThreatActorPanel';

export default function ThreatIntel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('prioritizer');

  const { data: scans = [] } = useQuery({
    queryKey: ['codeScans'],
    queryFn: () => base44.entities.CodeScan.list('-created_date', 50)
  });

  const tabs = [
    { id: 'prioritizer', label: 'Risk Prioritizer', icon: Zap },
    { id: 'cve', label: 'CVE Correlator', icon: AlertTriangle },
    { id: 'actors', label: 'Threat Actors', icon: Activity },
    { id: 'landscape', label: 'Threat Landscape', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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
                <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Threat Intelligence</h1>
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold">LIVE FEEDS</span>
                  </div>
                  <p className="text-orange-400 text-sm font-medium">CVE Correlation · Exploit DB · Threat Actor Tracking</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/Scanner')}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <Shield className="w-4 h-4 mr-2" /> Scanner
                </Button>
                <Button variant="outline" onClick={() => navigate('/Analytics')}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  Analytics
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          {activeTab === 'prioritizer' && <ScanPrioritizer scans={scans} />}
          {activeTab === 'cve' && <CVECorrelator scans={scans} />}
          {activeTab === 'actors' && <ThreatActorPanel scans={scans} />}
          {activeTab === 'landscape' && <ThreatLandscape scans={scans} />}
        </div>
      </div>
    </div>
  );
}