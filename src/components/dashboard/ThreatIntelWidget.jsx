import React from 'react';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, TrendingUp } from "lucide-react";

export default function ThreatIntelWidget({ scans }) {
  // Aggregate threat intelligence data
  const threatData = scans.reduce((acc, scan) => {
    scan.vulnerabilities?.forEach(vuln => {
      if (vuln.threat_intelligence) {
        acc.totalCVEs += vuln.threat_intelligence.related_cves?.length || 0;
        
        if (vuln.threat_intelligence.exploitability?.ease_of_exploit?.toLowerCase().includes('easy')) {
          acc.easyExploits++;
        }
        
        if (vuln.threat_intelligence.threat_landscape?.active_campaigns?.toLowerCase().includes('active')) {
          acc.activeCampaigns++;
        }
      }
    });
    return acc;
  }, { totalCVEs: 0, easyExploits: 0, activeCampaigns: 0 });

  const stats = [
    {
      label: 'Related CVEs',
      value: threatData.totalCVEs,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      label: 'Easy to Exploit',
      value: threatData.easyExploits,
      icon: TrendingUp,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    {
      label: 'Active Campaigns',
      value: threatData.activeCampaigns,
      icon: Shield,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    }
  ];

  return (
    <div className="space-y-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className={`${stat.bgColor} rounded-lg p-4 border border-slate-700`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-slate-300 text-sm">{stat.label}</span>
              </div>
              <Badge className={`${stat.color} bg-transparent font-bold text-lg`}>
                {stat.value}
              </Badge>
            </div>
          </div>
        );
      })}
      
      {threatData.totalCVEs === 0 && (
        <p className="text-slate-500 text-sm text-center py-6">
          No threat intelligence data available yet
        </p>
      )}
    </div>
  );
}