import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FileCode, Eye, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScanHistory({ scans, onViewScan }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  if (!scans || scans.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-12 text-center">
          <FileCode className="w-16 h-16 mx-auto text-slate-700 mb-4" />
          <p className="text-slate-500">No scan history yet. Start by scanning some code!</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    if (score >= 40) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="border-b border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-cyan-400" />
            Recent Scans
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white"
          >
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </Button>
        </div>
      </CardHeader>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800">
                {scans.map((scan, index) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <FileCode className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="font-medium text-white truncate">
                      {scan.file_name}
                    </span>
                    <Badge className={`${getScoreColor(scan.overall_score)} border`}>
                      Score: {scan.overall_score}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{format(new Date(scan.created_date), 'MMM d, yyyy HH:mm')}</span>
                    <span>•</span>
                    <span>{scan.vulnerabilities?.length || 0} issues</span>
                    {scan.language && (
                      <>
                        <span>•</span>
                        <span>{scan.language}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewScan(scan)}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
              </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </motion.div>
      )}
      </AnimatePresence>
    </Card>
  );
}