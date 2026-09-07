import React from 'react';
import { TrendingUp, Cpu, Building2, Sparkles, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';

export function CapacityIntelligenceModule() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="text-blue-400" />
            National Resource Planning & Capacity Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            AI-Driven Deployment Recommendations • Infrastructure Gap Identification & OPD Peak Load Forecasting
          </p>
        </div>
        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold font-mono">
          AI Optimization Engine: ACTIVE
        </span>
      </div>

      {/* State Utilization Overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { state: 'Maharashtra', facilities: 18, kiosks: 410, intake: '6,120/day', utilization: 82, rec: 'Deploy +35 kiosks to high-load districts' },
          { state: 'Uttar Pradesh', facilities: 24, kiosks: 320, intake: '5,100/day', utilization: 89, rec: 'Deploy +45 kiosks to tier-2 civil hospitals' },
          { state: 'Tamil Nadu', facilities: 16, kiosks: 290, intake: '4,200/day', utilization: 74, rec: 'Optimal capacity distribution' },
        ].map((st, idx) => (
          <div key={idx} className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-white text-base">{st.state}</span>
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {st.utilization}% Avg Load
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 font-mono">
              <div>Facilities: <span className="text-white font-bold">{st.facilities}</span></div>
              <div>Kiosks: <span className="text-white font-bold">{st.kiosks}</span></div>
              <div>Daily: <span className="text-blue-300 font-bold">{st.intake}</span></div>
            </div>

            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
              <Sparkles size={16} className="shrink-0 mt-0.5 text-indigo-400" />
              <div>
                <span className="font-bold block text-[11px]">NHA Recommendation</span>
                <span>{st.rec}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
