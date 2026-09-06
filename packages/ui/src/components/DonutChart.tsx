import React from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  title?: string;
  totalLabel?: string;
  segments: DonutSegment[];
  size?: number;
}

export function DonutChart({
  title = 'Patient Status Breakdown',
  totalLabel = 'Total',
  segments,
  size = 140,
}: DonutChartProps) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {title && <h3 className="text-base font-bold text-slate-900 mb-4">{title}</h3>}
      <div className="flex items-center gap-6">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {total > 0 &&
              segments.map((seg, idx) => {
                const strokeDasharray = `${(seg.value / total) * circumference} ${circumference}`;
                const strokeDashoffset = -currentOffset;
                currentOffset += (seg.value / total) * circumference;
                return (
                  <circle
                    key={idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    fill="transparent"
                    className="transition-all duration-500 ease-out"
                  />
                );
              })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold text-slate-900 font-display">{total}</span>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{totalLabel}</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {segments.map((seg, idx) => {
            const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
            return (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="font-medium text-slate-700">{seg.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{seg.value}</span>
                  <span className="text-slate-400 font-mono text-[11px]">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
