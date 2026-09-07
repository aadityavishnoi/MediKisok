import React, { useState } from 'react';
import { Users, Lock, ShieldCheck, Settings, CheckCircle2, ChevronRight } from 'lucide-react';

export function RbacPoliciesModule() {
  const [sessionTimeout, setSessionTimeout] = useState(120);
  const [kioskTimeout, setKioskTimeout] = useState(45);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="text-blue-400" />
            Roles, Authority & Jurisdiction Governance (RBAC)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Jurisdiction Scoping • `National` → `State` → `District` → `Facility` → `Doctor` → `Kiosk`
          </p>
        </div>
        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold font-mono">
          Jurisdiction Scoping Enforced
        </span>
      </div>

      {/* RBAC Hierarchy Grid */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white">National Authority RBAC Hierarchy</h3>

        <div className="grid grid-cols-6 gap-3 text-xs">
          {[
            { role: 'National Authority', scope: 'All 36 States & UTs', access: 'Infrastructure, Policy, AI Governance, ABDM' },
            { role: 'State Authority', scope: 'Single State Jurisdiction', access: 'State Facilities, Deployment, Performance' },
            { role: 'District Authority', scope: 'Single District Scope', access: 'District Hospitals, Incidents, Capacity' },
            { role: 'Hospital Admin', scope: 'Facility Scope', access: 'Staff, Kiosks, RFID Inventory, OPD Config' },
            { role: 'Doctor / Clinician', scope: 'Assigned Patient Scope', access: 'Patient Intake, AI Summary, Consultation' },
            { role: 'Kiosk Terminal', scope: 'Local Session Scope', access: 'Intake Interface, RFID UID Tap, OCR' },
          ].map((r, idx) => (
            <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <span className="font-bold text-blue-300 block text-[11px]">{r.role}</span>
              <span className="text-[10px] text-slate-400 block font-mono">Scope: {r.scope}</span>
              <span className="text-[10px] text-slate-300 block leading-tight">{r.access}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration & Policy Defaults Center */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings size={16} className="text-blue-400" />
          National System Defaults & Policy Configuration
        </h3>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <span className="font-bold text-slate-200 block">Kiosk Inactivity Timeout (Seconds)</span>
            <input
              type="number"
              value={kioskTimeout}
              onChange={(e) => setKioskTimeout(Number(e.target.value))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white"
            />
            <span className="text-[10px] text-slate-400 block">Automatically resets kiosk intake screen to initial tap prompt.</span>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <span className="font-bold text-slate-200 block">Doctor Consultation Session Timeout (Minutes)</span>
            <input
              type="number"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white"
            />
            <span className="text-[10px] text-slate-400 block">Maximum doctor session idle threshold before requiring re-auth.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
