import React, { useState } from 'react';
import { en } from '@medikiosk/ui';
import { simulateRfidScan, type WsConnectionState } from '@medikiosk/api-client';
import { CreditCard, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toUserMessage } from '../lib/errors.js';

const t = en.identify;
const tc = en.common;

export interface IdentifyScreenProps {
  wsState: WsConnectionState;
  error: string | null;
  onError: (message: string) => void;
}

const CONNECTION_CONFIG: Record<WsConnectionState, { color: string; label: string }> = {
  open: { color: 'bg-emerald-500', label: 'Connected' },
  connecting: { color: 'bg-amber-400', label: tc.connecting },
  closed: { color: 'bg-red-500', label: tc.reconnecting },
};

export function IdentifyScreen({ wsState, error, onError }: IdentifyScreenProps) {
  const [simulating, setSimulating] = useState<string | null>(null);
  const connection = CONNECTION_CONFIG[wsState];

  async function simulate(uid: string) {
    setSimulating(uid);
    try {
      await simulateRfidScan({ uid });
    } catch (err) {
      onError(toUserMessage(err, en));
    } finally {
      setSimulating(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center max-w-xl mx-auto w-full">
      <h1 className="text-4xl font-extrabold text-slate-900 mb-2 font-display">Welcome to MediKiosk</h1>
      <p className="text-slate-500 mb-8 text-lg font-medium">Let's get your visit started</p>

      {/* Pulsing RFID Card Icon Badge */}
      <div className="w-28 h-28 rounded-full border-4 border-blue-500 flex items-center justify-center bg-blue-50 shadow-[0_0_0_12px_rgba(59,130,246,0.15)] animate-pulse mb-6">
        <CreditCard size={48} className="text-blue-600" />
      </div>

      <p className="text-xl font-bold text-slate-800 mb-6">Tap your patient card on the reader</p>

      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white border border-slate-200 shadow-sm text-emerald-700 mb-8">
        <span className={`w-2.5 h-2.5 rounded-full ${connection.color} animate-pulse`} />
        {connection.label}
      </span>

      {error && (
        <div role="alert" className="w-full rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-800 mb-4">
          {error}
        </div>
      )}

      {/* Demo RFID Simulator Box */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-dashed border-slate-300 p-6 text-center space-y-3">
        <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">NO CARD READER NEARBY? (DEMO)</div>
        <p className="text-xs text-slate-500 mb-3">Physical RFID hardware is not connected yet — use a demo button below to continue.</p>
        <button
          type="button"
          disabled={simulating !== null}
          onClick={() => simulate('DEMO-RFID-001')}
          className="w-full py-3.5 rounded-2xl border-2 border-blue-500 text-blue-600 font-bold text-base hover:bg-blue-50 transition-all disabled:opacity-50"
        >
          {simulating === 'DEMO-RFID-001' ? 'Simulating Scan...' : 'Simulate RFID Scan — Demo Patient 001'}
        </button>
        <button
          type="button"
          disabled={simulating !== null}
          onClick={() => simulate('DEMO-RFID-002')}
          className="w-full py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-base hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          {simulating === 'DEMO-RFID-002' ? 'Simulating Scan...' : 'Simulate RFID Scan — Demo Patient 002'}
        </button>
      </div>
    </div>
  );
}
