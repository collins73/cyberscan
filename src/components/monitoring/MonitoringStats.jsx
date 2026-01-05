import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle, Server } from "lucide-react";
import { motion } from "framer-motion";

export default function MonitoringStats({ deployments, alerts, scans }) {
  const criticalDeployments = deployments.filter(d => d.status === 'critical').length;
  const warningDeployments = deployments.filter(d => d.status === 'warning').length;
  const healthyDeployments = deployments.filter(d => d.status === 'healthy').length;
  const totalAlerts = alerts.length;

  const stats = [
    {
      label: 'Total Deployments',
      value: deployments.length,
      icon: Server,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    },
    {
      label: 'Critical Status',
      value: criticalDeployments,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      label: 'Active Alerts',
      value: totalAlerts,
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    {
      label: 'Healthy',
      value: healthyDeployments,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={`${stat.bgColor} border-slate-800`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                    <p className={`text-4xl font-bold mt-2 ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`w-12 h-12 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}