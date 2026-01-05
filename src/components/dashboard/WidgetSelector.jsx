import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, BarChart3, TrendingUp, Shield, FileText, Target, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WidgetSelector({ activeWidgets, onToggleWidget, onClose }) {
  const availableWidgets = [
    { id: 'metrics', name: 'Metrics Overview', icon: BarChart3, description: 'Key security metrics' },
    { id: 'trends', name: 'Vulnerability Trends', icon: TrendingUp, description: 'Trends over time' },
    { id: 'severity', name: 'Severity Distribution', icon: PieChart, description: 'Vulnerability breakdown' },
    { id: 'topVulns', name: 'Top Vulnerabilities', icon: Target, description: 'Most common issues' },
    { id: 'language', name: 'Language Breakdown', icon: FileText, description: 'By programming language' },
    { id: 'comparison', name: 'File Comparison', icon: BarChart3, description: 'Compare security scores' },
    { id: 'threatIntel', name: 'Threat Intelligence', icon: Shield, description: 'CVE and threat data' },
    { id: 'scoreHistory', name: 'Score History', icon: TrendingUp, description: 'Score trends' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-cyan-500/30 rounded-xl max-w-4xl w-full shadow-2xl"
      >
        <CardHeader className="border-b border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Customize Dashboard Widgets</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5 text-slate-400" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableWidgets.map(widget => {
              const Icon = widget.icon;
              const isActive = activeWidgets.includes(widget.id);
              
              return (
                <div
                  key={widget.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isActive
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                  onClick={() => onToggleWidget(widget.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-1 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <div>
                        <h4 className="text-white font-semibold">{widget.name}</h4>
                        <p className="text-slate-400 text-sm mt-1">{widget.description}</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isActive ? 'border-cyan-500 bg-cyan-500' : 'border-slate-600'
                    }`}>
                      {isActive && <Plus className="w-4 h-4 text-black rotate-45" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </motion.div>
    </motion.div>
  );
}