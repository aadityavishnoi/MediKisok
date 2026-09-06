import React, { type ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({
  label,
  value,
  delta,
  deltaType = 'positive',
  icon,
  iconBg = 'bg-blue-50 text-blue-600',
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${iconBg}`}>
            {icon}
          </div>
        )}
        {delta && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              deltaType === 'positive'
                ? 'bg-emerald-50 text-emerald-700'
                : deltaType === 'negative'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-slate-100 text-slate-600'
            }`}
          >
            {delta}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-3xl font-extrabold text-slate-900 font-display">{value}</p>
      </div>
    </div>
  );
}
