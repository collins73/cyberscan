import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, FileCode, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MetricsOverview({ scans, metrics }) {
  const totalScans = scans.length;
  const totalVulnerabilities = metrics.reduce((sum, m) => sum + m.count, 0);
  const criticalVulns = metrics
    .filter(m => m.severity === 'critical')
    .reduce((sum, m) => sum + m.count, 0);
  const avgScore = scans.length > 0
    ? (scans.reduce((sum, s) => sum + s.overall_score, 0) / scans.length).toFixed(1)
    : 0;

  const stats = [
    {
      title: 'Total Scans',
      value: totalScans,
      icon: FileCode,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Total Vulnerabilities',
      value: totalVulnerabilities,
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      iconColor: 'text-orange-400'
    },
    {
      title: 'Critical Issues',
      value: criticalVulns,
      icon: AlertTriangle,
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-500/10',
      iconColor: 'text-red-400'
    },
    {
      title: 'Avg Security Score',
      value: avgScore,
      icon: Shield,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                  <p className={`text-4xl font-bold mt-2 ${stat.iconColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}