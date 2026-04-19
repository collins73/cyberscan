import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ProjectDebtChart({ scans }) {
  const data = [...scans]
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .map(s => ({
      date: new Date(s.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: s.overall_score || 0,
      vulns: s.vulnerabilities?.length || 0
    }));

  if (data.length < 2) return null;

  return (
    <div>
      <p className="text-slate-400 text-xs uppercase mb-3">Security Score Trend</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#67e8f9' }}
          />
          <Line type="monotone" dataKey="score" stroke="#67e8f9" strokeWidth={2} dot={{ fill: '#67e8f9', r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}