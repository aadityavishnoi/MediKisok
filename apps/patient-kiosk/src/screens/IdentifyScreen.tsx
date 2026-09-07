import React, { useState } from 'react';
import { en } from '@medikiosk/ui';
import { simulateRfidScan, type WsConnectionState } from '@medikiosk/api-client';
import { CreditCard, CheckCircle2, ShieldAlert, UserCheck, Sparkles, ArrowRight } from 'lucide-react';
import { toUserMessage } from '../lib/errors.js';

const tc = en.common;

export interface IdentifyScreenProps {
  wsState: WsConnectionState;
  error: string | null;
  onError: (message: string) => void;
}

const CONNECTION_CONFIG: Record<WsConnectionState, { color: string; label: string }> = {
  open: { color: 'bg-emerald-500', label: tc.connected },
  connecting: { color: 'bg-amber-400', label: tc.connecting },
  closed: { color: 'bg-red-500', label: tc.reconnecting },
};

const DEMO_PATIENTS = [
  {
    uid: 'DEMO-RFID-001',
    name: 'Aarav Sharma',
    label: 'Demo Patient 001',
    age: 34,
    gender: 'Male',
    abhaId: '91-4820-9102-3819',
    bloodGroup: 'O+',
    lastVisit: 'Cardiology OPD',
  },
  {
    uid: 'DEMO-RFID-002',
    name: 'Priya Patel',
    label: 'Demo Patient 002',
    age: 28,
    gender: 'Female',
    abhaId: '91-1029-4829-5710',
    bloodGroup: 'B+',
    lastVisit: 'General Medicine',
  },
];

export function IdentifyScreen({ wsState, error, onError }: IdentifyScreenProps) {
  const [simulating, setSimulating] = useState<string | null>(null);
  const [lastScannedPatient, setLastScannedPatient] = useState<(typeof DEMO_PATIENTS)[0] | null>(null);
  const connection = CONNECTION_CONFIG[wsState];

  async function simulate(patient: (typeof DEMO_PATIENTS)[0]) {
    setSimulating(patient.uid);
    setLastScannedPatient(patient);
    try {
      await simulateRfidScan({ uid: patient.uid });
    } catch (err) {
      onError(toUserMessage(err, en));
      setLastScannedPatient(null);
    } finally {
      setSimulating(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 text-center max-w-lg mx-auto w-full">
      <div className="mb-2 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100/80">
          <Sparkles size={13} /> Quick Intake Terminal
        </span>
      </div>

      <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight font-display animate-slide-up stagger-item" style={{ animationDelay: '40ms' }}>
        Welcome to MediKiosk
      </h1>
      <p className="text-slate-500 mb-8 text-base font-medium leading-relaxed animate-slide-up stagger-item" style={{ animationDelay: '80ms' }}>
        Tap your patient card on the reader to begin intake
      </p>

      {/* Serene Glowing RFID Tap Ring */}
      <div className="relative mb-8 group cursor-pointer animate-slide-up">
        <div className="absolute -inset-2 rounded-full bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all animate-pulse-subtle" />
        <div className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-600 shadow-xl shadow-blue-600/25 flex flex-col items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
          <CreditCard size={44} className="drop-shadow-sm mb-1" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">Tap Card</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200/80 shadow-xs text-slate-700">
          <span className={`w-2 h-2 rounded-full ${connection.color} animate-pulse`} />
          {connection.label}
        </span>
      </div>

      {/* Patient Profile Card Preview */}
      {lastScannedPatient && (
        <div className="w-full bg-white border border-emerald-200 rounded-3xl p-6 mb-8 text-left shadow-lg shadow-emerald-500/5 animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-base font-display">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>Card Verified: {lastScannedPatient.name}</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
              {lastScannedPatient.bloodGroup}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div><span className="font-semibold text-slate-400">ABHA:</span> {lastScannedPatient.abhaId}</div>
            <div><span className="font-semibold text-slate-400">Age:</span> {lastScannedPatient.age}y ({lastScannedPatient.gender})</div>
            <div className="col-span-2"><span className="font-semibold text-slate-400">Department:</span> {lastScannedPatient.lastVisit}</div>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="w-full rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-800 mb-6 flex items-center justify-center gap-2">
          <ShieldAlert size={16} />
          {error}
        </div>
      )}

      {/* Clean Demo Actions */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs text-center space-y-3 animate-slide-up stagger-item" style={{ animationDelay: '120ms' }}>
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Simulate RFID Card Reader (Demo)
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          {DEMO_PATIENTS.map((p) => (
            <button
              key={p.uid}
              type="button"
              disabled={simulating !== null}
              onClick={() => simulate(p)}
              className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 text-slate-800 font-semibold text-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-between"
            >
              <div className="text-left">
                <div className="font-bold text-slate-900">{p.name}</div>
                <div className="text-[10px] text-slate-400">{p.lastVisit}</div>
              </div>
              <span className="text-[11px] font-bold text-blue-600">
                {simulating === p.uid ? 'Scanning…' : `Simulate RFID Scan — ${p.label}`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

