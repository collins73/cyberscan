import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, CheckCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AlertsPanel({ alerts }) {
  const queryClient = useQueryClient();

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SecurityAlert.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['securityAlerts'] });
    }
  });

  const acknowledgeAlert = async (alert) => {
    const user = await base44.auth.me();
    await updateAlertMutation.mutateAsync({
      id: alert.id,
      data: {
        ...alert,
        status: 'acknowledged',
        acknowledged_by: user.email,
        acknowledged_date: new Date().toISOString()
      }
    });
  };

  const resolveAlert = async (alert) => {
    await updateAlertMutation.mutateAsync({
      id: alert.id,
      data: {
        ...alert,
        status: 'resolved',
        resolved_date: new Date().toISOString()
      }
    });
  };

  const severityConfig = {
    critical: { color: 'bg-red-500', textColor: 'text-red-400', icon: AlertTriangle },
    high: { color: 'bg-orange-500', textColor: 'text-orange-400', icon: AlertTriangle },
    medium: { color: 'bg-yellow-500', textColor: 'text-yellow-400', icon: Bell },
    low: { color: 'bg-blue-500', textColor: 'text-blue-400', icon: Bell }
  };

  return (
    <Card className="bg-red-950/20 border-red-500/30">
      <CardHeader className="border-b border-red-500/30">
        <CardTitle className="text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-400 animate-pulse" />
          Active Security Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {alerts.map((alert, idx) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-red-500/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className={`w-5 h-5 ${config.textColor} mt-1`} />
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-2">
                        <h4 className="text-white font-semibold">{alert.title}</h4>
                        <Badge className={`${config.color} text-white`}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        {alert.app_name && (
                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                            {alert.app_name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mb-3">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{format(new Date(alert.created_date), 'MMM d, yyyy HH:mm')}</span>
                        {alert.cve_id && (
                          <>
                            <span>•</span>
                            <span className="text-red-400 font-mono">{alert.cve_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert)}
                      className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      Acknowledge
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => resolveAlert(alert)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
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