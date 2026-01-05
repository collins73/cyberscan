import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Eye, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from 'react-router-dom';

export default function DeploymentList({ deployments, scans, onRefresh }) {
  const navigate = useNavigate();

  const statusConfig = {
    healthy: {
      color: 'bg-green-500/10 text-green-400 border-green-500/30',
      icon: CheckCircle,
      label: 'Healthy'
    },
    warning: {
      color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      icon: AlertTriangle,
      label: 'Warning'
    },
    critical: {
      color: 'bg-red-500/10 text-red-400 border-red-500/30',
      icon: AlertTriangle,
      label: 'Critical'
    }
  };

  const envColors = {
    production: 'bg-red-500 text-white',
    staging: 'bg-yellow-500 text-black',
    development: 'bg-blue-500 text-white'
  };

  if (deployments.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-12 text-center">
          <Server className="w-16 h-16 mx-auto text-slate-700 mb-4" />
          <p className="text-slate-500 mb-4">No deployed applications tracked yet</p>
          <p className="text-slate-600 text-sm">Add your deployed applications to start monitoring</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="border-b border-slate-800">
        <CardTitle className="text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          Deployed Applications ({deployments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-800">
          {deployments.map((deployment, idx) => {
            const statusInfo = statusConfig[deployment.status] || statusConfig.healthy;
            const StatusIcon = statusInfo.icon;
            const lastScan = scans.find(s => s.id === deployment.last_scan_id);

            return (
              <motion.div
                key={deployment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-6 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${statusInfo.color} border`}>
                      <StatusIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-bold text-lg">{deployment.app_name}</h3>
                        <Badge className={envColors[deployment.environment]}>
                          {deployment.environment}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                          v{deployment.version}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-slate-500 text-xs">Security Score</p>
                          <p className={`text-xl font-bold ${
                            deployment.security_score >= 80 ? 'text-green-400' :
                            deployment.security_score >= 60 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {deployment.security_score || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Critical</p>
                          <p className="text-xl font-bold text-red-400">
                            {deployment.critical_vulns || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">High</p>
                          <p className="text-xl font-bold text-orange-400">
                            {deployment.high_vulns || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Language</p>
                          <p className="text-sm text-cyan-400 font-semibold">
                            {deployment.language || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Deployed: {deployment.deployment_date ? format(new Date(deployment.deployment_date), 'MMM d, yyyy') : 'Unknown'}
                        </span>
                        {deployment.last_monitored && (
                          <>
                            <span>•</span>
                            <span>Last checked: {format(new Date(deployment.last_monitored), 'MMM d, HH:mm')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {lastScan && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/Scanner')}
                        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Scan
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}