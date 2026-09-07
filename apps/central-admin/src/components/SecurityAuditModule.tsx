import React from 'react';
import { ShieldCheck, Lock, Key, AlertTriangle, FileText, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react';

export function SecurityAuditModule() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-emerald-600" />
            Cybersecurity, Audit Trail & Compliance Command
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Government-Grade Security • Real-Time Role Audit, Device Mutual TLS, Suspicious RFID Scan Detection & Consent Logs
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold font-mono">
          ISO 27001 & CERT-In Compliant
        </span>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-slide-up stagger-item" style={{ animationDelay: '0ms' }}>
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">mTLS Device Auth</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">100% ENFORCED</div>
          <span className="text-[10px] text-emerald-700">1,240 X.509 Certificates Active</span>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl animate-slide-up stagger-item" style={{ animationDelay: '40ms' }}>
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">Audit Events Logged</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">1.42M</div>
          <span className="text-[10px] text-blue-700">Immutable Hash Chain</span>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-slide-up stagger-item" style={{ animationDelay: '80ms' }}>
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Suspicious Scan Alerts</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">2 Anomalies</div>
          <span className="text-[10px] text-amber-700">Quarantine Enforced</span>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl animate-slide-up stagger-item" style={{ animationDelay: '120ms' }}>
          <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider block">API Rate Limits</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">0 Violations</div>
          <span className="text-[10px] text-purple-700">Token Bucket Active</span>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-slide-up stagger-item" style={{ animationDelay: '160ms' }}>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText size={16} className="text-blue-600" />
          National Audit Trail Stream
        </h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold">
              <th className="pb-3">Timestamp</th>
              <th className="pb-3">Actor / Entity</th>
              <th className="pb-3">Role & Jurisdiction</th>
              <th className="pb-3">Action Performed</th>
              <th className="pb-3">Target Resource</th>
              <th className="pb-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="py-3 text-slate-500">09:28:42 AM</td>
              <td className="py-3 text-blue-700 font-bold">NHA-GOVT-001</td>
              <td className="py-3 text-slate-600">National Authority</td>
              <td className="py-3 text-slate-700">Approved Hospital Facility</td>
              <td className="py-3 text-emerald-600">FAC-UP-042 (Varanasi)</td>
              <td className="py-3 text-right font-bold text-emerald-600">SUCCESS</td>
            </tr>
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="py-3 text-slate-500">09:24:10 AM</td>
              <td className="py-3 text-blue-700 font-bold">KIOSK-MK-DEL-00421</td>
              <td className="py-3 text-slate-600">Kiosk Terminal</td>
              <td className="py-3 text-slate-700">Session Initialized via RFID UID</td>
              <td className="py-3 text-cyan-600">UID: 04:A7:89:BC</td>
              <td className="py-3 text-right font-bold text-emerald-600">SUCCESS</td>
            </tr>
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="py-3 text-slate-500">09:18:02 AM</td>
              <td className="py-3 text-amber-700 font-bold">SHA-MH-ADMIN</td>
              <td className="py-3 text-slate-600">State Authority (MH)</td>
              <td className="py-3 text-slate-700">Pushed Firmware OTA Config</td>
              <td className="py-3 text-blue-600">Fleet v4.2.0 Target</td>
              <td className="py-3 text-right font-bold text-emerald-600">SUCCESS</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
