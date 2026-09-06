import React, { useState } from 'react';

export default function App() {
  const [tab, setTab] = useState<'national' | 'models' | 'languages'>('national');

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Command Bar */}
        <header className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">National Healthcare Infrastructure</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">MediKiosk — Central Command Center</h1>
            <p className="text-xs text-slate-400">Multi-tenant State/District hierarchy, OPD load analytics, and AI model registry governance</p>
          </div>
          <div className="flex space-x-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setTab('national')}
              className={`px-4 py-2 rounded-lg transition-all ${tab === 'national' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              National Overview
            </button>
            <button
              onClick={() => setTab('models')}
              className={`px-4 py-2 rounded-lg transition-all ${tab === 'models' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              AI Model Registry
            </button>
            <button
              onClick={() => setTab('languages')}
              className={`px-4 py-2 rounded-lg transition-all ${tab === 'languages' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Language & Accessibility
            </button>
          </div>
        </header>

        {/* National Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Facilities</span>
            <div className="text-3xl font-black text-white">46 / 48</div>
            <span className="text-xs font-semibold text-emerald-400">95.8% Online</span>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kiosks Deployed</span>
            <div className="text-3xl font-black text-white">1,240</div>
            <span className="text-xs font-semibold text-blue-400">Active Fleet</span>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patients Intaked Today</span>
            <div className="text-3xl font-black text-white">18,420</div>
            <span className="text-xs font-semibold text-emerald-400">↑ +8.4% vs last week</span>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Hallucination Rate</span>
            <div className="text-3xl font-black text-emerald-400">0.0%</div>
            <span className="text-xs font-semibold text-emerald-400">100% Traceable Evidence</span>
          </div>
        </div>

        {tab === 'national' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg space-y-4">
              <h2 className="text-base font-bold text-white">State & District OPD Throughput</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900 text-xs font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="p-3">State</th>
                      <th className="p-3">Districts</th>
                      <th className="p-3">Facilities</th>
                      <th className="p-3">Intake Volume</th>
                      <th className="p-3">Red Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {[
                      { state: 'Delhi NCR', districts: 11, facilities: 12, volume: '4,890', redFlags: 42 },
                      { state: 'Maharashtra', districts: 36, facilities: 18, volume: '6,120', redFlags: 58 },
                      { state: 'Karnataka', districts: 31, facilities: 10, volume: '3,840', redFlags: 29 },
                      { state: 'Tamil Nadu', districts: 38, facilities: 8, volume: '3,570', redFlags: 21 },
                    ].map((row) => (
                      <tr key={row.state} className="hover:bg-slate-750">
                        <td className="p-3 font-bold text-white">{row.state}</td>
                        <td className="p-3 text-slate-400">{row.districts}</td>
                        <td className="p-3 text-slate-400">{row.facilities}</td>
                        <td className="p-3 font-mono font-semibold text-emerald-400">{row.volume}</td>
                        <td className="p-3 font-mono font-semibold text-red-400">{row.redFlags}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg space-y-4">
              <h2 className="text-base font-bold text-white">National Infrastructure Status</h2>
              <div className="space-y-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-300">Central API Gateway</span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-900 text-emerald-300 rounded-full">Operational</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-300">Realtime WebSocket Hub</span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-900 text-emerald-300 rounded-full">100% Health</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-300">OCR & Entity Extractors</span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-900 text-emerald-300 rounded-full">420ms Latency</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'models' && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-white">AI / ML Model Governance & Evaluation Registry</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-blue-400">v2.1-med-llama-7b (Active Summarizer)</h3>
                  <span className="px-2.5 py-1 text-xs font-bold bg-emerald-900 text-emerald-300 rounded-full">STABLE</span>
                </div>
                <p className="text-xs text-slate-400">Task: Physician-ready evidence-linked clinical summary generation.</p>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2">
                  <div className="p-2 bg-slate-800 rounded">F1 Score: <span className="text-emerald-400">0.962</span></div>
                  <div className="p-2 bg-slate-800 rounded">Hallucination: <span className="text-emerald-400">0.0%</span></div>
                  <div className="p-2 bg-slate-800 rounded">Latency: <span className="text-blue-400">420ms</span></div>
                </div>
              </div>

              <div className="p-5 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-purple-400">v1.4-ocr-layout-parser (Document OCR)</h3>
                  <span className="px-2.5 py-1 text-xs font-bold bg-emerald-900 text-emerald-300 rounded-full">STABLE</span>
                </div>
                <p className="text-xs text-slate-400">Task: Multi-page prescription and lab report key-value entity extraction.</p>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2">
                  <div className="p-2 bg-slate-800 rounded">CER: <span className="text-emerald-400">0.021</span></div>
                  <div className="p-2 bg-slate-800 rounded">WER: <span className="text-emerald-400">0.043</span></div>
                  <div className="p-2 bg-slate-800 rounded">Confidence: <span className="text-blue-400">94.2%</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'languages' && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-white">Multilingual India-First Usage Distribution</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { lang: 'English (EN)', pct: '42%' },
                { lang: 'Hindi (HI)', pct: '35%' },
                { lang: 'Bengali (BN)', pct: '10%' },
                { lang: 'Marathi (MR)', pct: '8%' },
                { lang: 'Tamil (TA)', pct: '3%' },
                { lang: 'Telugu (TE)', pct: '2%' },
              ].map(item => (
                <div key={item.lang} className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-xs text-slate-400">{item.lang}</span>
                  <div className="text-2xl font-bold text-blue-400">{item.pct}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
