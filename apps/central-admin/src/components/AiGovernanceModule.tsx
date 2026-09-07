import React, { useState } from 'react';
import { Bot, ShieldCheck, Cpu, RefreshCw, CheckCircle2, AlertOctagon, Terminal } from 'lucide-react';

export function AiGovernanceModule() {
  const [rollbackStatus, setRollbackStatus] = useState<string | null>(null);

  const MODELS = [
    { version: 'v3.2.0-clinical-nlp', cer: '1.8%', f1: '0.94', latency: '142ms', hallucination: '0.00%', status: 'Production', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    { version: 'v3.1.4-clinical-nlp', cer: '2.3%', f1: '0.91', latency: '156ms', hallucination: '0.01%', status: 'Staged', badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
    { version: 'v2.9.0-clinical-nlp', cer: '3.6%', f1: '0.87', latency: '198ms', hallucination: '0.04%', status: 'Deprecated', badge: 'bg-slate-100 text-slate-500 border border-slate-200' },
  ];

  const handleRollback = (ver: string) => {
    setRollbackStatus(ver);
    setTimeout(() => setRollbackStatus(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-slate-900 font-display">National AI Model Safety & Governance Registry</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Real-time telemetry, medical LLM hallucination audits, character error rates (CER), and safety guardrail monitoring for clinical triage AI.
            </p>
          </div>
        </div>
      </div>

      {rollbackStatus && (
        <div role="alert" className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-700 font-bold text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={20} className="text-blue-600 shrink-0" />
          <span>Active deployment verified for model {rollbackStatus}. Telemetry nominal.</span>
        </div>
      )}

      {/* Model Telemetry Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm animate-slide-up stagger-item" style={{ animationDelay: '60ms' }}>
        <h3 className="font-bold text-lg text-slate-900 font-display">Clinical NLP Model Telemetry</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs border-b border-slate-200 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Model Version</th>
                <th className="pb-3 font-semibold">Character Error Rate (CER)</th>
                <th className="pb-3 font-semibold">Clinical F1 Score</th>
                <th className="pb-3 font-semibold">Inference Latency</th>
                <th className="pb-3 font-semibold">Hallucination Rate</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MODELS.map((m, idx) => (
                <tr key={m.version} className="hover:bg-slate-50 transition-colors animate-slide-up stagger-item" style={{ animationDelay: `${100 + idx * 40}ms` }}>
                  <td className="py-3.5 font-mono font-bold text-slate-900">{m.version}</td>
                  <td className="py-3.5 font-mono text-slate-600">{m.cer}</td>
                  <td className="py-3.5 font-mono font-bold text-emerald-600">{m.f1}</td>
                  <td className="py-3.5 font-mono text-slate-600">{m.latency}</td>
                  <td className="py-3.5 font-mono text-emerald-600 font-bold">{m.hallucination}</td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.badge}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <button
                      type="button"
                      onClick={() => handleRollback(m.version)}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                    >
                      {m.status === 'Production' ? 'Re-Verify' : 'Promote to Prod'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
