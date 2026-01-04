import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bug, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TopVulnerabilities({ metrics }) {
  // Group by vulnerability type and count occurrences
  const vulnTypes = metrics.reduce((acc, metric) => {
    const existing = acc.find(item => item.type === metric.vulnerability_type);
    if (existing) {
      existing.count += metric.count;
      existing.critical += metric.severity === 'critical' ? metric.count : 0;
      existing.high += metric.severity === 'high' ? metric.count : 0;
    } else {
      acc.push({
        type: metric.vulnerability_type,
        count: metric.count,
        critical: metric.severity === 'critical' ? metric.count : 0,
        high: metric.severity === 'high' ? metric.count : 0
      });
    }
    return acc;
  }, []);

  // Sort by count and get top 10
  const topVulns = vulnTypes
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const getSeverityColor = (critical, high) => {
    if (critical > 0) return 'bg-red-500';
    if (high > 0) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bug className="w-5 h-5 text-cyan-400" />
          Most Common Vulnerabilities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topVulns.map((vuln, index) => (
            <motion.div
              key={vuln.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-1 h-12 rounded-full ${getSeverityColor(vuln.critical, vuln.high)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {vuln.type}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {vuln.critical > 0 && (
                      <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {vuln.critical} Critical
                      </Badge>
                    )}
                    {vuln.high > 0 && (
                      <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">
                        {vuln.high} High
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-cyan-400">{vuln.count}</p>
                <p className="text-xs text-slate-500">occurrences</p>
              </div>
            </motion.div>
          ))}
          {topVulns.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No vulnerability data yet. Run some scans to see metrics.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}