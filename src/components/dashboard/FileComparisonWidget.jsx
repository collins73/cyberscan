import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FileComparisonWidget({ scans }) {
  const fileData = scans.slice(0, 10).map(scan => ({
    name: scan.file_name.length > 20 ? scan.file_name.substring(0, 20) + '...' : scan.file_name,
    score: scan.overall_score,
    vulnerabilities: scan.vulnerabilities?.length || 0,
    critical: scan.vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
    high: scan.vulnerabilities?.filter(v => v.severity === 'high').length || 0
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={fileData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey="name" 
          stroke="#94a3b8"
          angle={-45}
          textAnchor="end"
          height={100}
          fontSize={11}
        />
        <YAxis stroke="#94a3b8" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Bar dataKey="score" fill="#06b6d4" name="Security Score" />
        <Bar dataKey="vulnerabilities" fill="#f97316" name="Total Issues" />
        <Bar dataKey="critical" fill="#ef4444" name="Critical" />
      </BarChart>
    </ResponsiveContainer>
  );
}