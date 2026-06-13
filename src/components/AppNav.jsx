import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, BarChart3, Activity, Globe, BookOpen } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Analytics', path: '/Analytics', icon: BarChart3, color: 'cyan' },
  { label: 'Threat Intel', path: '/ThreatIntel', icon: Globe, color: 'orange' },
  { label: 'Monitoring', path: '/Monitoring', icon: Activity, color: 'cyan' },
  { label: 'Manual', path: '/OperationsManual', icon: BookOpen, color: 'blue' },
];

const colorClasses = {
  cyan: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  orange: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  blue: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
};

export default function AppNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-bold text-white">CodeGuard</span>
          <span className="text-[10px] font-bold tracking-wider text-green-400 border border-green-500/40 bg-green-500/10 rounded px-1.5 py-0.5">
            AsCaaS
          </span>
        </button>

        {/* Nav Links */}
        <div className="flex gap-2">
          {NAV_ITEMS.map(({ label, path, icon: Icon, color }) => {
            const isActive = location.pathname === path;
            const cls = colorClasses[color];
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  isActive
                    ? cls
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}