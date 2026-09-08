import React, { useState, useEffect } from 'react';
import { Users, Settings, CheckCircle2, Save, RefreshCw } from 'lucide-react';

export function RbacPoliciesModule() {
  const [sessionTimeout, setSessionTimeout] = useState(120);
  const [kioskTimeout, setKioskTimeout] = useState(45);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/system-configs');
      if (res.ok) {
        const data = await res.json();
        if (data.KIOSK_INACTIVITY_TIMEOUT_SECONDS) {
          setKioskTimeout(Number(data.KIOSK_INACTIVITY_TIMEOUT_SECONDS));
        }
        if (data.DOCTOR_SESSION_TIMEOUT_MINUTES) {
          setSessionTimeout(Number(data.DOCTOR_SESSION_TIMEOUT_MINUTES));
        }
      }
    } catch {
      // Fall back safely to defaults
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await Promise.all([
        fetch('/api/admin/system-configs/KIOSK_INACTIVITY_TIMEOUT_SECONDS', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: kioskTimeout, category: 'KIOSK_SETTINGS' }),
        }),
        fetch('/api/admin/system-configs/DOCTOR_SESSION_TIMEOUT_MINUTES', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: sessionTimeout, category: 'SECURITY_SETTINGS' }),
        }),
      ]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update system configs:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="text-blue-600" />
            Roles, Authority & Jurisdiction Governance (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Jurisdiction Scoping • `National` → `State` → `District` → `Facility` → `Doctor` → `Kiosk`
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadConfigs}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
            title="Reload Configs"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold font-mono">
            Jurisdiction Scoping Enforced
          </span>
        </div>
      </div>

      {/* RBAC Hierarchy Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-slide-up">
        <h3 className="text-sm font-bold text-slate-900">National Authority RBAC Hierarchy</h3>

        <div className="grid grid-cols-6 gap-3 text-xs">
          {[
            { role: 'National Authority', scope: 'All 36 States & UTs', access: 'Infrastructure, Policy, AI Governance, ABDM' },
            { role: 'State Authority', scope: 'Single State Jurisdiction', access: 'State Facilities, Deployment, Performance' },
            { role: 'District Authority', scope: 'Single District Scope', access: 'District Hospitals, Incidents, Capacity' },
            { role: 'Hospital Admin', scope: 'Facility Scope', access: 'Staff, Kiosks, RFID Inventory, OPD Config' },
            { role: 'Doctor / Clinician', scope: 'Assigned Patient Scope', access: 'Patient Intake, AI Summary, Consultation' },
            { role: 'Kiosk Terminal', scope: 'Local Session Scope', access: 'Intake Interface, RFID UID Tap, OCR' },
          ].map((r, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-slide-up stagger-item"
              style={{ animationDelay: `${60 + idx * 40}ms` }}
            >
              <span className="font-bold text-blue-700 block text-[11px]">{r.role}</span>
              <span className="text-[10px] text-slate-500 block font-mono">Scope: {r.scope}</span>
              <span className="text-[10px] text-slate-600 block leading-tight">{r.access}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration & Policy Defaults Center */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-slide-up stagger-item" style={{ animationDelay: '320ms' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Settings size={16} className="text-blue-600" />
            National System Defaults & Policy Configuration (Database-Backed)
          </h3>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : 'Save Policies to DB'}
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} />
            System policy timeouts successfully persisted to Database & SystemConfig!
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 block">Kiosk Inactivity Timeout (Seconds)</span>
            <input
              type="number"
              value={kioskTimeout}
              onChange={(e) => setKioskTimeout(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 transition-colors focus:outline-none focus:border-blue-400"
            />
            <span className="text-[10px] text-slate-500 block">Automatically resets kiosk intake screen to initial tap prompt.</span>
          </div>

          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 block">Doctor Consultation Session Timeout (Minutes)</span>
            <input
              type="number"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 transition-colors focus:outline-none focus:border-blue-400"
            />
            <span className="text-[10px] text-slate-500 block">Maximum doctor session idle threshold before requiring re-auth.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
