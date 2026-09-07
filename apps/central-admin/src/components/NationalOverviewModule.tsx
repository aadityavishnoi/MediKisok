import React from 'react';
import { Building2, Server, Users, ShieldCheck, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface NationalOverviewModuleProps {
  searchQuery: string;
}

const STATE_DATA = [
  { state: 'Maharashtra', facilities: 142, kiosks: 1240, volume: '118,420', wait: '11 min', occupancy: '84%', trend: '↑ 4.2%', color: 'text-emerald-400' },
  { state: 'Uttar Pradesh', facilities: 186, kiosks: 1680, volume: '142,100', wait: '16 min', occupancy: '91%', trend: '↑ 8.1%', color: 'text-amber-400' },
  { state: 'Tamil Nadu', facilities: 118, kiosks: 980, volume: '94,600', wait: '10 min', occupancy: '76%', trend: '↓ 1.4%', color: 'text-emerald-400' },
  { state: 'Karnataka', facilities: 104, kiosks: 890, volume: '88,240', wait: '9 min', occupancy: '72%', trend: '↑ 2.8%', color: 'text-emerald-400' },
  { state: 'Rajasthan', facilities: 112, kiosks: 940, volume: '79,150', wait: '14 min', occupancy: '82%', trend: '↑ 5.6%', color: 'text-amber-400' },
  { state: 'Delhi NCR', facilities: 86, kiosks: 740, volume: '84,900', wait: '13 min', occupancy: '89%', trend: '↑ 9.3%', color: 'text-red-400' },
  { state: 'Gujarat', facilities: 98, kiosks: 820, volume: '72,400', wait: '12 min', occupancy: '74%', trend: '↓ 0.8%', color: 'text-emerald-400' },
  { state: 'West Bengal', facilities: 110, kiosks: 910, volume: '81,300', wait: '15 min', occupancy: '85%', trend: '↑ 3.1%', color: 'text-emerald-400' },
  { state: 'Kerala', facilities: 72, kiosks: 610, volume: '48,600', wait: '8 min', occupancy: '68%', trend: '↓ 2.1%', color: 'text-emerald-400' },
];

export function NationalOverviewModule({ searchQuery }: NationalOverviewModuleProps) {
  const filtered = STATE_DATA.filter((s) => s.state.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Executive KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.15)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              +14 This Month
            </span>
          </div>
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Public Hospitals Monitored</div>
          <div className="text-3xl font-extrabold text-white mt-1 font-display">1,482</div>
        </div>

        <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.15)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Server size={20} />
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              99.94% Online
            </span>
          </div>
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active RFID Intake Kiosks</div>
          <div className="text-3xl font-extrabold text-white mt-1 font-display">12,450</div>
        </div>

        <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.15)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={14} /> 5.8%
            </span>
          </div>
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">24h National OPD Volume</div>
          <div className="text-3xl font-extrabold text-white mt-1 font-display">842,910</div>
        </div>

        <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 hover:border-emerald-500/40 hover:shadow-[0_0_24px_rgba(5,150,105,0.15)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-400">Zero Flags</span>
          </div>
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">AI Clinical Safety Score</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-display drop-shadow-[0_0_10px_rgba(5,150,105,0.4)]">
            99.8%
          </div>
        </div>
      </div>

      {/* Main Grid: State Surveillance Table & Language Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* State Surveillance Table */}
        <div className="lg:col-span-8 bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-white font-display">State & UT Health Telemetry Grid</h2>
              <p className="text-xs text-slate-400">Live intake volume, wait times, and bed occupancy across India</p>
            </div>
            <span className="text-xs font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-300">
              36 States & UTs Monitored
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs border-b border-white/10 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">State / UT</th>
                  <th className="pb-3 font-semibold">Hospitals</th>
                  <th className="pb-3 font-semibold">Active Kiosks</th>
                  <th className="pb-3 font-semibold">24h OPD Volume</th>
                  <th className="pb-3 font-semibold">Avg Wait</th>
                  <th className="pb-3 font-semibold">ICU Bed Occupancy</th>
                  <th className="pb-3 font-semibold">24h Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((r) => (
                  <tr key={r.state} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {r.state}
                    </td>
                    <td className="py-3.5 text-slate-400 font-mono">{r.facilities}</td>
                    <td className="py-3.5 text-slate-400 font-mono">{r.kiosks}</td>
                    <td className="py-3.5 font-mono font-bold text-blue-400">{r.volume}</td>
                    <td className="py-3.5 text-slate-300">{r.wait}</td>
                    <td className="py-3.5 font-mono text-slate-300">{r.occupancy}</td>
                    <td className={`py-3.5 font-mono font-bold ${r.color}`}>{r.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* National Language Distribution */}
        <div className="lg:col-span-4 bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="font-bold text-lg text-white font-display">Multilingual Intake Mix</h2>
            <p className="text-xs text-slate-400">Distribution across 13 native script Indian languages</p>
          </div>

          <div className="space-y-4">
            {[
              { lang: 'Hindi (हिन्दी)', pct: '42%', count: '354,000 sessions', color: 'bg-blue-500' },
              { lang: 'English', pct: '28%', count: '236,000 sessions', color: 'bg-emerald-500' },
              { lang: 'Bengali (বাংলা)', pct: '10%', count: '84,200 sessions', color: 'bg-amber-500' },
              { lang: 'Marathi (मराठी)', pct: '8%', count: '67,400 sessions', color: 'bg-indigo-500' },
              { lang: 'Telugu (తెలుగు)', pct: '6%', count: '50,500 sessions', color: 'bg-purple-500' },
              { lang: 'Tamil (தமிழ்)', pct: '6%', count: '50,500 sessions', color: 'bg-pink-500' },
            ].map((l) => (
              <div key={l.lang} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>{l.lang}</span>
                  <span className="font-mono text-blue-400">{l.pct} ({l.count})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full ${l.color} rounded-full`} style={{ width: l.pct }} />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
            💡 Real-time voice TTS enabled across all 13 official languages.
          </div>
        </div>
      </div>
    </div>
  );
}
