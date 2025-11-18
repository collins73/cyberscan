import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import VulnerabilityCard from './VulnerabilityCard';

export default function ScanResults({ scanData }) {
  const { vulnerabilities, overall_score, file_name, scan_duration } = scanData;

  const criticalCount = vulnerabilities?.filter(v => v.severity === 'critical').length || 0;
  const highCount = vulnerabilities?.filter(v => v.severity === 'high').length || 0;
  const mediumCount = vulnerabilities?.filter(v => v.severity === 'medium').length || 0;
  const lowCount = vulnerabilities?.filter(v => v.severity === 'low').length || 0;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Security Score</p>
                <p className={`text-4xl font-bold mt-2 ${getScoreColor(overall_score)}`}>
                  {overall_score}
                </p>
                <p className="text-slate-500 text-xs mt-1">{getScoreLabel(overall_score)}</p>
              </div>
              <Shield className={`w-12 h-12 ${getScoreColor(overall_score)}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-950/30 to-slate-900 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Critical</p>
                <p className="text-4xl font-bold mt-2 text-red-400">{criticalCount}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-950/30 to-slate-900 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">High Risk</p>
                <p className="text-4xl font-bold mt-2 text-orange-400">{highCount}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Scan Time</p>
                <p className="text-4xl font-bold mt-2 text-cyan-400">{scan_duration}s</p>
              </div>
              <Clock className="w-12 h-12 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Info */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            <span className="text-slate-300">Scanned File:</span>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
              {file_name}
            </Badge>
          </div>
          <div className="text-slate-400 text-sm">
            {vulnerabilities?.length || 0} issues found
          </div>
        </CardContent>
      </Card>

      {/* Vulnerabilities List */}
      {vulnerabilities && vulnerabilities.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            Detected Vulnerabilities
          </h2>
          {vulnerabilities.map((vulnerability, index) => (
            <VulnerabilityCard
              key={index}
              vulnerability={vulnerability}
              index={index}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-green-950/30 to-slate-900 border-green-500/20">
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h3 className="text-2xl font-bold text-green-400 mb-2">All Clear!</h3>
            <p className="text-slate-400">No security vulnerabilities detected in this scan.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}