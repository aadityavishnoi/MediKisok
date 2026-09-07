import React, { useState } from 'react';
import { AlertOctagon, ShieldAlert, Zap, CheckCircle2, Siren, Radio, PhoneCall } from 'lucide-react';

export function EmergencyOverrideModule() {
  const [activeEmergency, setActiveEmergency] = useState<string | null>(null);

  const handleTriggerEmergency = (level: string) => {
    setActiveEmergency(level);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4 animate-slide-up">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <Siren size={24} className="animate-bounce text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-xl text-slate-900 font-display">National Emergency Override & Disaster Response</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-600 text-white">
                  SUPREME COMMAND
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Executive override panel for central health ministry officials to declare national/regional health emergencies, enforce priority kiosk triage, and initiate emergency bed diversion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {activeEmergency && (
        <div role="alert" className="p-5 bg-red-600 border-2 border-red-400 rounded-2xl text-white font-extrabold text-base flex items-center justify-between shadow-lg animate-fade-in animate-pulse">
          <div className="flex items-center gap-3">
            <AlertOctagon size={28} />
            <div>
              <div>{activeEmergency} DECLARED NATIONWIDE</div>
              <div className="text-xs text-red-100 font-normal font-mono mt-0.5">All 12,450 Kiosks Forced to Priority Emergency Triage Mode</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveEmergency(null)}
            className="px-4 py-2 rounded-xl bg-white text-red-900 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Deactivate Emergency
          </button>
        </div>
      )}

      {/* Emergency Protocol Trigger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-red-300 animate-slide-up stagger-item" style={{ animationDelay: '0ms' }}>
          <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600">
            <Radio size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 font-display">Level 3 National Disaster Protocol</h3>
            <p className="text-xs text-slate-500 mt-1">For mass casualty events, natural disasters, or major epidemic outbreaks.</p>
          </div>
          <button
            type="button"
            onClick={() => handleTriggerEmergency('LEVEL 3 NATIONAL DISASTER')}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-[0_0_16px_rgba(220,38,38,0.4)]"
          >
            Declare Level 3 Emergency
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-amber-300 animate-slide-up stagger-item" style={{ animationDelay: '60ms' }}>
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 font-display">Regional ICU Diversion Override</h3>
            <p className="text-xs text-slate-500 mt-1">Automatically reroute incoming ambulance & kiosk triage from overloaded tertiary hospitals.</p>
          </div>
          <button
            type="button"
            onClick={() => handleTriggerEmergency('REGIONAL ICU DIVERSION')}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all"
          >
            Activate Bed Diversion
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 animate-slide-up stagger-item" style={{ animationDelay: '120ms' }}>
          <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600">
            <PhoneCall size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 font-display">Rapid Staff Mobilization Dispatch</h3>
            <p className="text-xs text-slate-500 mt-1">Notify duty nursing officers & medical officers across state networks for emergency intake backup.</p>
          </div>
          <button
            type="button"
            onClick={() => handleTriggerEmergency('STAFF MOBILIZATION')}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all"
          >
            Dispatch Staff Alert
          </button>
        </div>
      </div>
    </div>
  );
}
