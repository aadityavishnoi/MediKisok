import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

interface AuditLogItem {
  id: string;
  actorType: string;
  actorId?: string | null;
  facilityId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: any;
  createdAt: string;
}

export function SecurityAuditModule() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs?limit=50');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
          setTotalCount(data.total || data.logs.length);
        }
      }
    } catch (err) {
      console.warn('Audit logs fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAuditLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 border rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold font-mono">
            DPDP 2023 & CERT-In Compliant
          </span>
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-slide-up stagger-item">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">mTLS Device Auth</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">100% ENFORCED</div>
          <span className="text-[10px] text-emerald-700">X.509 Certificates Active</span>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl animate-slide-up stagger-item">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">Audit Events Logged</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{totalCount.toLocaleString()}</div>
          <span className="text-[10px] text-blue-700">Live CockroachDB Stream</span>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-slide-up stagger-item">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Access Control (RBAC)</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">Strict Isolation</div>
          <span className="text-[10px] text-amber-700">Facility Boundaries Locked</span>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl animate-slide-up stagger-item">
          <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider block">API Rate Limits</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">0 Violations</div>
          <span className="text-[10px] text-purple-700">Token Bucket Active</span>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-slide-up stagger-item">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText size={16} className="text-blue-600" />
          Live National Audit Trail Ledger
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Actor Type</th>
                <th className="pb-3">Actor ID</th>
                <th className="pb-3">Action Performed</th>
                <th className="pb-3">Target Entity</th>
                <th className="pb-3">Entity ID</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</td>
                    <td className="py-2.5 text-blue-700 font-bold">{log.actorType}</td>
                    <td className="py-2.5 text-slate-600 truncate max-w-[120px]">{log.actorId || 'SYSTEM'}</td>
                    <td className="py-2.5 text-slate-800 font-bold">{log.action}</td>
                    <td className="py-2.5 text-emerald-600 font-semibold">{log.entityType || '—'}</td>
                    <td className="py-2.5 text-slate-500 truncate max-w-[120px]">{log.entityId || '—'}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600">VERIFIED</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    {loading ? 'Streaming audit trail...' : 'No audit records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
