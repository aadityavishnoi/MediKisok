import React, { useState } from 'react';
import { Cpu, ShieldAlert, CheckCircle2, Lock, AlertTriangle, RefreshCw, Layers, Key, ShieldCheck, Search, Filter } from 'lucide-react';

interface RfidTokenBatch {
  batchId: string;
  manufacturedDate: string;
  totalCards: number;
  assignedState: string;
  status: 'Available' | 'Assigned' | 'Active' | 'Suspended' | 'Damaged' | 'Retired';
  clonedAlerts: number;
  securityHash: string;
}

const INITIAL_BATCHES: RfidTokenBatch[] = [
  { batchId: 'BATCH-2026-NHA-001', manufacturedDate: '2026-07-15', totalCards: 25000, assignedState: 'Maharashtra', status: 'Active', clonedAlerts: 0, securityHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
  { batchId: 'BATCH-2026-NHA-002', manufacturedDate: '2026-07-20', totalCards: 30000, assignedState: 'Uttar Pradesh', status: 'Active', clonedAlerts: 1, securityHash: 'sha256:8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4' },
  { batchId: 'BATCH-2026-NHA-003', manufacturedDate: '2026-08-01', totalCards: 15000, assignedState: 'Karnataka', status: 'Assigned', clonedAlerts: 0, securityHash: 'sha256:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e' },
  { batchId: 'BATCH-2026-NHA-004', manufacturedDate: '2026-08-12', totalCards: 20000, assignedState: 'Delhi NCR', status: 'Available', clonedAlerts: 0, securityHash: 'sha256:3b5d5c3712955042212316173ccf37be8a07c3e479c25d5127d697a668b07456' },
  { batchId: 'BATCH-2026-NHA-005', manufacturedDate: '2026-08-25', totalCards: 10000, assignedState: 'Tamil Nadu', status: 'Suspended', clonedAlerts: 4, securityHash: 'sha256:d41d8cd98f00b204e9800998ecf8427e' },
];

export function RfidNationalRegistryModule() {
  const [batches, setBatches] = useState<RfidTokenBatch[]>(INITIAL_BATCHES);
  const [scanUid, setScanUid] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);

  const totalCardsInCirculation = batches.reduce((sum, b) => sum + b.totalCards, 0);

  const handleSimulateScan = () => {
    if (!scanUid) return;
    setScanResult(`UID Verified: tokenized as SHA-256[${scanUid}] • Status: ACTIVE • No Medical Data On Chip (GDPR/DPDP Compliant)`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Cpu className="text-blue-400" />
            RFID National Token Registry & Inventory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tokenized Session Identifiers • Strict Security Audit (Zero PHI / Aadhaar stored on chip)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono">
            Total Cards: {totalCardsInCirculation.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Security Banner: RFID Token Privacy Rule */}
      <div className="p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-2xl flex items-center justify-between text-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300">
            <Lock size={18} />
          </div>
          <div>
            <div className="font-bold text-white">NHA Security Spec: RFID Card ≠ Patient EHR</div>
            <div className="text-[11px] text-slate-400">
              Cards contain only encrypted 13.56MHz UID tokens (`04:A7:XX:XX`). Clinical diagnoses, prescriptions, and identity tokens are stored exclusively in ABDM-backed encrypted databases.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <ShieldCheck size={16} />
          <span>DPDP 2023 Compliant</span>
        </div>
      </div>

      {/* Card Status Lifecycle Distribution */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Available Stock', val: '45,000', color: 'border-slate-500/30 bg-slate-500/10 text-slate-300' },
          { label: 'Assigned', val: '35,000', color: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
          { label: 'Active Sessions', val: '18,420', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
          { label: 'Suspended', val: '412', color: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
          { label: 'Damaged / Lost', val: '188', color: 'border-red-500/30 bg-red-500/10 text-red-300' },
          { label: 'Retired', val: '1,200', color: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
        ].map((item, idx) => (
          <div key={idx} className={`p-3 rounded-2xl border ${item.color} backdrop-blur-md text-center`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">{item.label}</span>
            <span className="text-xl font-extrabold font-mono mt-1 block">{item.val}</span>
          </div>
        ))}
      </div>

      {/* Scanner & Duplicate UID Sentinel */}
      <div className="grid grid-cols-12 gap-6">
        {/* Token Verification Console */}
        <div className="col-span-6 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key size={16} className="text-blue-400" />
            Live RFID UID Security Verification Tool
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={scanUid}
              onChange={(e) => setScanUid(e.target.value)}
              placeholder="Enter UID e.g. 04:A7:89:BC:D1..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleSimulateScan}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all"
            >
              Verify Token
            </button>
          </div>
          {scanResult && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 font-mono">
              {scanResult}
            </div>
          )}
        </div>

        {/* Security Alerts: Duplicate/Cloned UID Sentinel */}
        <div className="col-span-6 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-400" />
              Duplicate & Cloned UID Security Sentinel
            </h3>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
              5 Anomalies Flagged
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between text-red-300">
              <div>
                <span className="font-bold block">UID Clone Attempt Blocked</span>
                <span className="text-[10px] text-slate-400 font-mono">UID: 04:A7:99:FF • Hospital: KEM Mumbai</span>
              </div>
              <button type="button" className="px-2.5 py-1 bg-red-600 text-white font-bold text-[10px] rounded-lg">
                Revoke Token
              </button>
            </div>

            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-amber-300">
              <div>
                <span className="font-bold block">Rapid Re-tap Anomaly</span>
                <span className="text-[10px] text-slate-400 font-mono">UID: 04:B2:11:09 • 12 taps in 30 seconds</span>
              </div>
              <button type="button" className="px-2.5 py-1 bg-amber-600 text-white font-bold text-[10px] rounded-lg">
                Quarantine
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Allocation Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white">National RFID Batch Allocation & Audit Trail</h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 font-semibold">
              <th className="pb-3">Batch ID</th>
              <th className="pb-3">Manufactured</th>
              <th className="pb-3">Card Count</th>
              <th className="pb-3">Assigned State</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Cloned Alerts</th>
              <th className="pb-3 text-right">Cryptographic Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {batches.map((b) => (
              <tr key={b.batchId} className="hover:bg-white/5">
                <td className="py-3 font-mono text-blue-300 font-bold">{b.batchId}</td>
                <td className="py-3 text-slate-300">{b.manufacturedDate}</td>
                <td className="py-3 font-mono text-white">{b.totalCards.toLocaleString()}</td>
                <td className="py-3 text-slate-200">{b.assignedState}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    b.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' :
                    b.status === 'Suspended' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="py-3 font-mono font-bold text-amber-400">{b.clonedAlerts}</td>
                <td className="py-3 text-right font-mono text-[10px] text-slate-500">{b.securityHash.slice(0, 24)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
