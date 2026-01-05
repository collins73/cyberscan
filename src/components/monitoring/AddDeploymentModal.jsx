import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Server } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AddDeploymentModal({ onClose, scans }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    app_name: '',
    environment: 'production',
    version: '',
    language: '',
    last_scan_id: '',
    deployment_date: new Date().toISOString()
  });

  const createDeploymentMutation = useMutation({
    mutationFn: (data) => base44.entities.DeployedApplication.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployedApplications'] });
      onClose();
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Calculate initial stats if scan is selected
    const selectedScan = scans.find(s => s.id === formData.last_scan_id);
    let deploymentData = { ...formData };
    
    if (selectedScan) {
      const criticalVulns = selectedScan.vulnerabilities?.filter(v => v.severity === 'critical').length || 0;
      const highVulns = selectedScan.vulnerabilities?.filter(v => v.severity === 'high').length || 0;
      
      let status = 'healthy';
      if (criticalVulns > 0) status = 'critical';
      else if (highVulns > 3 || selectedScan.overall_score < 60) status = 'warning';
      
      deploymentData = {
        ...deploymentData,
        security_score: selectedScan.overall_score,
        critical_vulns: criticalVulns,
        high_vulns: highVulns,
        status,
        language: selectedScan.language || formData.language,
        last_monitored: new Date().toISOString()
      };
    }

    await createDeploymentMutation.mutateAsync(deploymentData);
  };

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
        className="bg-slate-900 border border-cyan-500/30 rounded-xl max-w-2xl w-full shadow-2xl"
      >
        <CardHeader className="border-b border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              Add Deployed Application
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5 text-slate-400" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-300">Application Name *</Label>
              <Input
                required
                value={formData.app_name}
                onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                placeholder="e.g., Customer Portal API"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Environment *</Label>
                <Select
                  value={formData.environment}
                  onValueChange={(value) => setFormData({ ...formData, environment: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Version</Label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="e.g., 1.2.3 or commit hash"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Primary Language</Label>
              <Input
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                placeholder="e.g., JavaScript, Python"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Link to Security Scan (Optional)</Label>
              <Select
                value={formData.last_scan_id}
                onValueChange={(value) => setFormData({ ...formData, last_scan_id: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select a recent scan" />
                </SelectTrigger>
                <SelectContent>
                  {scans.slice(0, 20).map(scan => (
                    <SelectItem key={scan.id} value={scan.id}>
                      {scan.file_name} - Score: {scan.overall_score}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                disabled={createDeploymentMutation.isPending}
              >
                {createDeploymentMutation.isPending ? 'Adding...' : 'Add Deployment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </motion.div>
    </motion.div>
  );
}