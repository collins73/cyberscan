import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Code } from 'lucide-react';

const LANGUAGE_COLORS = {
  'JavaScript': '#f7df1e',
  'JavaScript/React': '#61dafb',
  'TypeScript': '#3178c6',
  'TypeScript/React': '#3178c6',
  'Python': '#3776ab',
  'Java': '#007396',
  'C++': '#00599c',
  'C': '#a8b9cc',
  'Go': '#00add8',
  'Ruby': '#cc342d',
  'PHP': '#777bb4',
  'default': '#06b6d4'
};

export default function LanguageBreakdown({ metrics }) {
  const languageData = metrics.reduce((acc, metric) => {
    const existing = acc.find(item => item.language === metric.language);
    if (existing) {
      existing.vulnerabilities += metric.count;
      existing.scans += 1;
    } else {
      acc.push({
        language: metric.language,
        vulnerabilities: metric.count,
        scans: 1
      });
    }
    return acc;
  }, []);

  const sortedData = languageData.sort((a, b) => b.vulnerabilities - a.vulnerabilities);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-cyan-500/30 p-3 rounded-lg shadow-xl">
          <p className="text-white font-semibold">{data.language}</p>
          <p className="text-slate-300 text-sm">{data.vulnerabilities} vulnerabilities</p>
          <p className="text-slate-400 text-xs">{data.scans} scans</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Code className="w-5 h-5 text-cyan-400" />
          Vulnerabilities by Language
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="language" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="vulnerabilities" radius={[8, 8, 0, 0]}>
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={LANGUAGE_COLORS[entry.language] || LANGUAGE_COLORS.default} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}