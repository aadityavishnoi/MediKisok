import React from 'react';
import { ShieldCheck, Lock, Key, AlertTriangle, FileText, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react';

export function SecurityAuditModule() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-emerald-400" />
            Cybersecurity, Audit Trail & Compliance Command
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Government-Grade Security • Real-Time Role Audit, Device Mutual TLS, Suspicious RFID Scan Detection & Consent Logs
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono">
          ISO 27001 & CERT-In Compliant
        </span>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-md">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">mTLS Device Auth</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">100% ENFORCED</div>
          <span className="text-[10px] text-emerald-300">1,240 X.509 Certificates Active</span>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-md">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">Audit Events Logged</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">1.42M</div>
          <span className="text-[10px] text-blue-300">Immutable Hash Chain</span>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl backdrop-blur-md">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">Suspicious Scan Alerts</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">2 Anomalies</div>
          <span className="text-[10px] text-amber-300">Quarantine Enforced</span>
        </div>

        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-md">
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block">API Rate Limits</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">0 Violations</div>
          <span className="text-[10px] text-purple-300">Token Bucket Active</span>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText size={16} className="text-blue-400" />
          National Audit Trail Stream
        </h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 font-semibold">
              <th className="pb-3">Timestamp</th>
              <th className="pb-3">Actor / Entity</th>
              <th className="pb-3">Role & Jurisdiction</th>
              <th className="pb-3">Action Performed</th>
              <th className="pb-3">Target Resource</th>
              <th className="pb-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-[11px]">
            <tr className="hover:bg-white/5">
              <td className="py-3 text-slate-400">09:28:42 AM</td>
              <td className="py-3 text-blue-300 font-bold">NHA-GOVT-001</td>
              <td className="py-3 text-slate-300">National Authority</td>
              <td className="py-3 text-slate-200">Approved Hospital Facility</td>
              <td className="py-3 text-emerald-400">FAC-UP-042 (Varanasi)</td>
              <td className="py-3 text-right font-bold text-emerald-400">SUCCESS</td>
            </tr>
            <tr className="hover:bg-white/5">
              <td className="py-3 text-slate-400">09:24:10 AM</td>
              <td className="py-3 text-blue-300 font-bold">KIOSK-MK-DEL-00421</td>
              <td className="py-3 text-slate-300">Kiosk Terminal</td>
              <td className="py-3 text-slate-200">Session Initialized via RFID UID</td>
              <td className="py-3 text-cyan-400">UID: 04:A7:89:BC</td>
              <td className="py-3 text-right font-bold text-emerald-400">SUCCESS</td>
            </tr>
            <tr className="hover:bg-white/5">
              <td className="py-3 text-slate-400">09:18:02 AM</td>
              <td className="py-3 text-amber-300 font-bold">SHA-MH-ADMIN</td>
              <td className="py-3 text-slate-300">State Authority (MH)</td>
              <td className="py-3 text-slate-200">Pushed Firmware OTA Config</td>
              <td className="py-3 text-blue-400">Fleet v4.2.0 Target</td>
              <td className="py-3 text-right font-bold text-emerald-400">SUCCESS</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
