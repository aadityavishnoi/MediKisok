import React, { useState } from 'react';
import { AlertTriangle, Flame, ShieldAlert, CheckCircle2, Send, Activity, MapPin, Zap } from 'lucide-react';

export function DiseaseOutbreakModule() {
  const [dispatchedAlert, setDispatchedAlert] = useState<string | null>(null);

  const OUTBREAKS = [
    {
      id: 'OUT-2026-08',
      region: 'Jaipur & Jodhpur Districts (Rajasthan)',
      disease: 'Dengue Hemorrhagic Fever Spike',
      severity: 'CRITICAL',
      cases: '1,420 Flagged (24h)',
      symptomPattern: 'High Fever + Severe Retro-orbital Headache + Low Platelet Trigger',
      aiConfidence: '98.6%',
      status: 'Active Alert',
    },
    {
      id: 'OUT-2026-09',
      region: 'Delhi NCR & Western UP',
      disease: 'Acute Respiratory Distress Cluster',
      severity: 'HIGH',
      cases: '2,890 Flagged (24h)',
      symptomPattern: 'Shortness of Breath + Persistent Cough + Low SpO2 Trigger',
      aiConfidence: '96.2%',
      status: 'Active Alert',
    },
    {
      id: 'OUT-2026-10',
      region: 'Pune & Thane Districts (Maharashtra)',
      disease: 'Viral Gastroenteritis Spike',
      severity: 'MODERATE',
      cases: '840 Flagged (24h)',
      symptomPattern: 'Acute Abdominal Pain + Dehydration Warning',
      aiConfidence: '94.1%',
      status: 'Monitoring',
    },
  ];

  const handleDispatchAlert = (outbreakId: string) => {
    setDispatchedAlert(outbreakId);
    setTimeout(() => {
      setDispatchedAlert(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Alert Header Banner */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <Flame size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-xl text-slate-900 font-display">AI Disease Outbreak & Epidemic Radar</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-500 text-white uppercase animate-pulse">
                NCDC Live Feed
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Automated anomaly detection engine analyzing real-time symptom dictations across 12,450 kiosks for sudden epidemiological clusters.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleDispatchAlert('ALL')}
          className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2 shrink-0"
        >
          <Zap size={16} /> Broadcast National ICMR Alert
        </button>
      </div>

      {dispatchedAlert && (
        <div role="alert" className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 font-bold text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>Automated Emergency Epidemic Protocol Dispatched to ICMR, NCDC, and State Health Secretaries.</span>
        </div>
      )}

      {/* Active Outbreak Cluster Cards */}
      <div className="space-y-4">
        {OUTBREAKS.map((ob, idx) => (
          <div
            key={ob.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-red-300 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-slide-up stagger-item"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold ${
                  ob.severity === 'CRITICAL' ? 'bg-red-500 text-white shadow-sm' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {ob.severity} RISK
                </span>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 font-display">{ob.disease}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <MapPin size={13} className="text-red-600" />
                    <span>{ob.region}</span>
                    <span className="font-mono text-slate-500">• ID: {ob.id}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-mono font-extrabold text-red-600">{ob.cases}</div>
                  <div className="text-[11px] text-slate-500">AI Confidence: {ob.aiConfidence}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDispatchAlert(ob.id)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all duration-200"
                >
                  <Send size={14} /> Dispatch State Taskforce
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-500 font-medium">Symptom Cluster Pattern:</span>
                <p className="font-semibold text-slate-700 mt-0.5">{ob.symptomPattern}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Hospital Capacity Status:</span>
                <p className="font-mono font-bold text-amber-600 mt-0.5">86% Beds Reserved · ICU Overflow Ready</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Automated Response Action:</span>
                <p className="font-semibold text-emerald-600 mt-0.5">Rapid Diagnostic Kits Mobilized to District Stores</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
