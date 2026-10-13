import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  color?: 'teal' | 'emerald' | 'rose' | 'amber' | 'indigo';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  color = 'teal'
}) => {
  const colorMap = {
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-100',
      bar: 'bg-teal-500'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      bar: 'bg-emerald-500'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      bar: 'bg-rose-500'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      bar: 'bg-amber-500'
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      bar: 'bg-indigo-500'
    }
  };

  const scheme = colorMap[color];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 left-0 right-0 h-1 ${scheme.bar}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium">
              <span className={trendPositive ? 'text-emerald-600' : 'text-rose-600'}>
                {trend}
              </span>
              <span className="text-slate-400">vs recorded costs</span>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${scheme.bg} ${scheme.border} border flex items-center justify-center ${scheme.text} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
