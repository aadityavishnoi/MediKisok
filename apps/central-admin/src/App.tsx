import React, { useState } from 'react';
import {
  Globe,
  Cpu,
  TrendingUp,
  ShieldCheck,
  Building,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DonutChart } from '@medikiosk/ui';

interface ModelRegistryRow {
  version: string;
  cer: string;
  f1: string;
  latency: string;
  status: 'Production' | 'Staged' | 'Deprecated';
  task: string;
  updatedAt: string;
  notes: string;
}

export default function App() {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const executiveStats = [
    { label: 'Total Facilities', value: '142', delta: '+12 onboarded', icon: Building, color: 'from-blue-500/20 to-blue-600/10 text-blue-400' },
    { label: 'Kiosks Deployed', value: '1,280', delta: '99.4% online', icon: Server, color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400' },
    { label: 'Intake Volume (National)', value: '1,482,000', delta: '↑ 18% MoM', icon: TrendingUp, color: 'from-purple-500/20 to-purple-600/10 text-purple-400' },
    { label: 'AI Hallucination Rate', value: '0.0%', delta: '100% Citation Grounded', icon: ShieldCheck, color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400', isHighlight: true },
  ];

  const stateThroughput = [
    { state: 'Delhi NCR', facilities: 38, volume: '482,900', wait: '4.2 min', trend: '↑ +8%' },
    { state: 'Maharashtra', facilities: 42, volume: '512,100', wait: '3.8 min', trend: '↑ +12%' },
    { state: 'Karnataka', facilities: 28, volume: '298,400', wait: '4.5 min', trend: '↑ +5%' },
    { state: 'Tamil Nadu', facilities: 22, volume: '188,600', wait: '3.9 min', trend: '↑ +7%' },
  ];

  const languageBreakdownData = [
    { label: 'Hindi (HI)', value: 520, color: '#3B82F6' },
    { label: 'English (EN)', value: 380, color: '#059669' },
    { label: 'Bengali (BN)', value: 180, color: '#D97706' },
    { label: 'Tamil / Marathi / Other', value: 200, color: '#8B5CF6' },
  ];

  const models: ModelRegistryRow[] = [
    {
      version: 'medikiosk-clinical-llm-v2.1',
      cer: '0.012',
      f1: '0.984',
      latency: '340ms',
      status: 'Production',
      task: 'Grounded Patient Intake Synthesis & Evidence Citation',
      updatedAt: '2026-08-28',
      notes: 'Fine-tuned on 200k anonymized Indian OPD intake transcripts with mandatory source-grounding tokens.',
    },
    {
      version: 'medikiosk-ocr-layout-v1.8',
      cer: '0.018',
      f1: '0.962',
      latency: '210ms',
      status: 'Production',
      task: 'Multi-lingual Handwritten Prescription & Lab Report Extraction',
      updatedAt: '2026-08-15',
      notes: 'Optimized for degraded mobile uploads and doctor cursive handwriting in Hindi/English.',
    },
    {
      version: 'medikiosk-triage-v3.0-rc',
      cer: '0.008',
      f1: '0.991',
      latency: '180ms',
      status: 'Staged',
      task: 'Real-time Emergency Red-Flag Escalation Engine',
      updatedAt: '2026-09-02',
      notes: 'Staged for rollout in Safdarjung and AIIMS OPD units. Zero false negatives on cardiac symptoms.',
    },
    {
      version: 'medikiosk-legacy-triage-v1.2',
      cer: '0.045',
      f1: '0.910',
      latency: '520ms',
      status: 'Deprecated',
      task: 'Basic Symptom Keyword Matching',
      updatedAt: '2026-04-10',
      notes: 'Deprecated in favor of deep clinical entity embeddings.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Dark Topbar */}
      <header className="sticky top-0 z-30 h-16 bg-[#090D16]/90 backdrop-blur border-b border-white/10 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-base font-extrabold font-display text-white tracking-wide">MediCore AI</h1>
            <p className="text-[11px] text-blue-400 font-semibold tracking-wider uppercase">Central Command Center</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            National Network Healthy
          </span>
          <span className="text-slate-400 font-mono">142 Facilities Syncing</span>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Executive Stat Cards (Dark Glass Cards with Subtle Glow) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {executiveStats.map((stat, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur shadow-lg hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} border border-white/10`}>
                  <stat.icon size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                  {stat.delta}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{stat.label}</p>
                <p className={`mt-1 text-3xl font-extrabold font-display ${stat.isHighlight ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(5,150,105,0.4)]' : 'text-white'}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 2-Column Row: State-wise OPD Throughput (Left 7 cols) & National Language Breakdown (Right 5 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 7 cols: State-wise OPD Throughput */}
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white">State-wise OPD Throughput</h2>
                <p className="text-xs text-slate-400">National healthcare intake volume & wait time metrics</p>
              </div>
              <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                Live Data Stream
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">State / Region</th>
                    <th className="px-4 py-3">Facilities</th>
                    <th className="px-4 py-3">OPD Volume</th>
                    <th className="px-4 py-3">Avg Wait Time</th>
                    <th className="px-4 py-3 text-right">MoM Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stateThroughput.map((row) => (
                    <tr key={row.state} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-white">{row.state}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-300">{row.facilities} units</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-blue-400">{row.volume}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">{row.wait}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-400 text-xs">{row.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right 5 cols: National Language Breakdown */}
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-lg flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-white mb-1">National Language Breakdown</h2>
              <p className="text-xs text-slate-400 mb-4">Patient interaction distribution across official languages</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <DonutChart title="" totalLabel="Kiosk Sessions" segments={languageBreakdownData} size={150} />
            </div>
          </div>
        </div>

        {/* Bottom Full-Width Table: AI Model Governance Registry */}
        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">AI Model Governance Registry</h2>
              <p className="text-xs text-slate-400">Model versioning, Character Error Rate (CER), F1 scores, and latency benchmarks</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Audit Standard: HIPAA & ABDM Compliant
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Model Version</th>
                  <th className="px-5 py-3.5">CER</th>
                  <th className="px-5 py-3.5">F1 Score</th>
                  <th className="px-5 py-3.5">Latency</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {models.map((m) => {
                  const isExp = expandedModel === m.version;
                  return (
                    <React.Fragment key={m.version}>
                      <tr
                        onClick={() => setExpandedModel(isExp ? null : m.version)}
                        className="cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <td className="px-5 py-4 font-mono font-bold text-blue-400">{m.version}</td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-300">{m.cer}</td>
                        <td className="px-5 py-4 font-mono text-xs font-bold text-emerald-400">{m.f1}</td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-300">{m.latency}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            m.status === 'Production' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            m.status === 'Staged' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-slate-400">
                          {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                      </tr>
                      {isExp && (
                        <tr className="bg-white/[0.02]">
                          <td colSpan={6} className="px-6 py-4 border-t border-white/5">
                            <div className="space-y-2 text-xs text-slate-300">
                              <p><strong className="text-white">Primary Task:</strong> {m.task}</p>
                              <p><strong className="text-white">Last Updated:</strong> {m.updatedAt}</p>
                              <p className="text-slate-400"><strong className="text-white">Governance Notes:</strong> {m.notes}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
