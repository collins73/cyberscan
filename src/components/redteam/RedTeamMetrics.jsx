import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Target, CheckCircle, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function RedTeamMetrics({ vulnerabilities }) {
  const critical = vulnerabilities.filter(v => v.severity === 'critical').length;
  const high = vulnerabilities.filter(v => v.severity === 'high').length;
  const open = vulnerabilities.filter(v => !v.status || v.status === 'open').length;
  const exploited = vulnerabilities.filter(v => v.status === 'exploited').length;
  const fixed = vulnerabilities.filter(v => v.status === 'fixed').length;
  const total = vulnerabilities.length;

  const fixRate = total > 0 ? Math.round((fixed / total) * 100) : 0;

  const stats = [
    {
      label: 'Critical Vulnerabilities',
      value: critical,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'from-red-950/40 to-slate-900',
      border: 'border-red-500/30'
    },
    {
      label: 'High Risk',
      value: high,
      icon: TrendingUp,
      color: 'text-orange-400',
      bg: 'from-orange-950/30 to-slate-900',
      border: 'border-orange-500/30'
    },
    {
      label: 'Open / Unresolved',
      value: open,
      icon: Target,
      color: 'text-yellow-400',
      bg: 'from-yellow-950/20 to-slate-900',
      border: 'border-yellow-500/30'
    },
    {
      label: 'Exploited (Tested)',
      value: exploited,
      icon: Zap,
      color: 'text-purple-400',
      bg: 'from-purple-950/30 to-slate-900',
      border: 'border-purple-500/30'
    },
    {
      label: 'Fixed',
      value: `${fixed} (${fixRate}%)`,
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'from-green-950/20 to-slate-900',
      border: 'border-green-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`bg-gradient-to-br ${stat.bg} ${stat.border} border`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-xs">{stat.label}</p>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}