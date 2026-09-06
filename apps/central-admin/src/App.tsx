import React, { useState } from 'react';
import {
  Globe,
  Building2,
  Bot,
  TrendingUp,
  Settings,
  Bell,
  Search,
  CheckCircle2,
  Server,
  Users,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [activeNav, setActiveNav] = useState('overview');
  const [search, setSearch] = useState('');

  const states = [
    { state: 'Rajasthan', facilities: '24', volume: '5,120', wait: '14 min', trend: '↑', trendColor: 'text-emerald-400' },
    { state: 'Maharashtra', facilities: '31', volume: '7,860', wait: '11 min', trend: '↑', trendColor: 'text-emerald-400' },
    { state: 'Uttar Pradesh', facilities: '28', volume: '6,240', wait: '17 min', trend: '↓', trendColor: 'text-red-400' },
    { state: 'Karnataka', facilities: '19', volume: '4,110', wait: '9 min', trend: '↑', trendColor: 'text-emerald-400' },
    { state: 'Tamil Nadu', facilities: '22', volume: '5,610', wait: '12 min', trend: '—', trendColor: 'text-slate-400' },
  ];

  const models = [
    { version: 'v3.2.0-clinical-nlp', cer: '1.8%', f1: '0.94', latency: '142ms', status: 'Production', badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
    { version: 'v3.1.4-clinical-nlp', cer: '2.3%', f1: '0.91', latency: '156ms', status: 'Staged', badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
    { version: 'v2.9.0-clinical-nlp', cer: '3.6%', f1: '0.87', latency: '198ms', status: 'Deprecated', badge: 'bg-white/5 text-slate-400 border border-white/10' },
  ];

  const filteredStates = states.filter(s => s.state.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans flex selection:bg-blue-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-60 h-screen sticky top-0 bg-white/[0.04] border-r border-white/10 backdrop-blur-md flex flex-col shrink-0">
        <div className="px-5 py-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center text-white font-extrabold text-lg shadow-[0_0_16px_rgba(59,130,246,0.6)]">
            M
          </div>
          <div>
            <div className="font-extrabold text-white leading-none text-base font-display">MediCore AI</div>
            <div className="text-xs text-slate-400 leading-none mt-1">Central Command</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm font-medium">
          {[
            { id: 'overview', label: 'National Overview', icon: Globe },
            { id: 'facilities', label: 'Facilities', icon: Building2 },
            { id: 'governance', label: 'AI Governance', icon: Bot },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(item => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  active
                    ? 'bg-blue-500 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            National Grid Online
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white/[0.04] border-b border-white/10 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="w-96 max-w-full relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
              placeholder="Search states, facilities, models..."
            />
          </div>

          <div className="flex items-center gap-4">
            <button type="button" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 transition-colors">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
                NC
              </div>
              <div className="text-sm">
                <div className="font-semibold leading-none text-white">National Control</div>
                <div className="text-xs text-slate-400 leading-none mt-1">Executive Dashboard</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-6 space-y-5 max-w-7xl mx-auto w-full">
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.15)] transition-all group">
              <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                <Building2 size={20} />
              </div>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Facilities</div>
              <div className="text-3xl font-extrabold text-white mt-1 font-display">142</div>
            </div>

            <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.15)] transition-all group">
              <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                <Server size={20} />
              </div>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Kiosks Deployed</div>
              <div className="text-3xl font-extrabold text-white mt-1 font-display">618</div>
            </div>

            <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.15)] transition-all group">
              <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                <Users size={20} />
              </div>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Intake Volume (24h)</div>
              <div className="text-3xl font-extrabold text-white mt-1 font-display">28,940</div>
            </div>

            <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 hover:border-emerald-500/40 hover:shadow-[0_0_24px_rgba(5,150,105,0.15)] transition-all group">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <ShieldCheck size={20} />
              </div>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">AI Hallucination Rate</div>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-display drop-shadow-[0_0_10px_rgba(5,150,105,0.4)]">0.0%</div>
            </div>
          </div>

          {/* 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* State-wise OPD Throughput (Left 7 cols) */}
            <div className="lg:col-span-7 bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-6">
              <h2 className="font-bold text-base mb-4 text-white font-display">State-wise OPD Throughput</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs border-b border-white/10 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">State</th>
                      <th className="pb-3 font-semibold">Facilities</th>
                      <th className="pb-3 font-semibold">OPD Volume</th>
                      <th className="pb-3 font-semibold">Avg Wait</th>
                      <th className="pb-3 font-semibold">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredStates.map((r) => (
                      <tr key={r.state} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 font-bold text-white">{r.state}</td>
                        <td className="py-3 text-slate-400">{r.facilities}</td>
                        <td className="py-3 font-mono font-bold text-blue-400">{r.volume}</td>
                        <td className="py-3 text-slate-400">{r.wait}</td>
                        <td className={`py-3 font-bold ${r.trendColor}`}>{r.trend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* National Language Breakdown (Right 5 cols) */}
            <div className="lg:col-span-5 bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="font-bold text-base mb-1 text-white font-display">National Language Breakdown</h2>
                <p className="text-xs text-slate-400 mb-6">Patient interaction distribution across supported languages</p>
              </div>

              <div className="flex items-center justify-around gap-6 py-2">
                <div className="relative flex items-center justify-center">
                  <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
                    <circle cx="70" cy="70" r="55" fill="none" stroke="#1e293b" strokeWidth="18" />
                    <circle cx="70" cy="70" r="55" fill="none" stroke="#3B82F6" strokeWidth="18" strokeDasharray="345.6" strokeDashoffset="0" />
                    <circle cx="70" cy="70" r="55" fill="none" stroke="#059669" strokeWidth="18" strokeDasharray="345.6" strokeDashoffset="207.4" />
                    <circle cx="70" cy="70" r="55" fill="none" stroke="#D97706" strokeWidth="18" strokeDasharray="345.6" strokeDashoffset="276.5" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-extrabold text-white font-display">100%</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Coverage</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 font-medium text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Hindi</span>
                    <span className="text-slate-400 font-mono">— 40%</span>
                  </div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>English</span>
                    <span className="text-slate-400 font-mono">— 40%</span>
                  </div>
                  <div className="flex items-center gap-2.5 font-medium text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Regional</span>
                    <span className="text-slate-400 font-mono">— 20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Model Governance Registry */}
          <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <h2 className="font-bold text-base mb-4 text-white font-display">AI Model Governance Registry</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs border-b border-white/10 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Model Version</th>
                    <th className="pb-3 font-semibold">CER</th>
                    <th className="pb-3 font-semibold">F1 Score</th>
                    <th className="pb-3 font-semibold">Latency</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {models.map((m) => (
                    <tr key={m.version} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-white">{m.version}</td>
                      <td className="py-3.5 text-slate-300 font-mono">{m.cer}</td>
                      <td className="py-3.5 text-slate-300 font-mono font-bold text-emerald-400">{m.f1}</td>
                      <td className="py-3.5 text-slate-300 font-mono">{m.latency}</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.badge}`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
