import React from 'react';
import { Leaf, HeartPulse, Activity, Sparkles, PieChart, ShieldCheck } from 'lucide-react';

export function AyushTelemetryModule() {
  const PRAKRITI_DATA = [
    { type: 'Pitta Predominant (पाचक)', pct: '38%', count: '148,200', desc: 'High metabolic heat, digestion variance', color: 'bg-amber-500' },
    { type: 'Vata Predominant (वात)', pct: '32%', count: '124,800', desc: 'Dry skin, cold sensitivity, joint mobility', color: 'bg-blue-500' },
    { type: 'Kapha Predominant (कफ)', pct: '20%', count: '78,000', desc: 'Heavy constitution, fluid retention', color: 'bg-emerald-500' },
    { type: 'Dwandwaja (Dual Prakriti)', pct: '10%', count: '39,000', desc: 'Combined Vata-Pitta / Pitta-Kapha', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Leaf size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-xl text-white font-display">Ministry of AYUSH Integrative Health Grid</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500 text-white font-bold">
                Ayurveda · Siddha · Unani · Homeopathy
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              National telemetry tracking patient Prakriti self-assessments, pulse triage, and integrative OPD care protocols across public health kiosks.
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Prakriti Distribution (Left 7 cols) */}
        <div className="lg:col-span-7 bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-lg text-white font-display">National Prakriti Assessment Distribution</h3>
          <div className="space-y-4">
            {PRAKRITI_DATA.map((p) => (
              <div key={p.type} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-sm font-bold text-white">
                  <span>{p.type}</span>
                  <span className="font-mono text-emerald-400">{p.pct} ({p.count})</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full ${p.color} rounded-full`} style={{ width: p.pct }} />
                </div>
                <p className="text-xs text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Integrative OPD Metrics (Right 5 cols) */}
        <div className="lg:col-span-5 bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-lg text-white font-display">Integrative Care Metrics</h3>
          
          <div className="space-y-3">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="text-xs text-slate-400 font-semibold">Integrative Teleconsultations (24h)</div>
              <div className="text-2xl font-extrabold text-white mt-1 font-display">42,190</div>
              <div className="text-[11px] text-emerald-400 mt-1">Dual Allopathic + AYUSH Consultation</div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="text-xs text-slate-400 font-semibold">Standard Herbal Formulations Dispensed</div>
              <div className="text-2xl font-extrabold text-white mt-1 font-display">128,400</div>
              <div className="text-[11px] text-slate-400 mt-1">Ayurvedic Pharmacopoeia of India (API) Verified</div>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
              <ShieldCheck size={16} className="inline mr-1 text-emerald-400" />
              100% of AYUSH prescriptions are cross-checked for herb-drug interactions by AI Safety Engine.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
