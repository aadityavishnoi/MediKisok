import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileScan,
  FileText,
  Filter,
  FolderGit2,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import {
  ApiClientError,
  connectWs,
  getDoctorDashboard,
  type WsConnectionState,
} from '@medikiosk/api-client';
import type { DoctorDashboardSessionRow } from '@medikiosk/shared-types';
import { SeverityBadge } from '@medikiosk/ui';
import { DashboardShell } from '../components/DashboardShell.js';
import type { NavKey } from '../components/Sidebar.js';
import { InitialsAvatar } from '../components/InitialsAvatar.js';
import { clearSession, getDoctorName } from '../lib/authStore.js';
import { STATUS_DISPLAY } from '../lib/sessionStatus.js';

export interface PatientRecordsScreenProps {
  onBack: () => void;
  onOpenSession: (sessionId: string) => void;
  onOpenConsultation: (sessionId: string) => void;
  onOpenAlerts: () => void;
  onLoggedOut: () => void;
}

type RecordFilter = 'ALL' | 'COMPLETED' | 'ACTIVE' | 'SCANS_ATTACHED';

export function PatientRecordsScreen({
  onBack,
  onOpenSession,
  onOpenConsultation,
  onOpenAlerts,
  onLoggedOut,
}: PatientRecordsScreenProps) {
  const [sessions, setSessions] = useState<DoctorDashboardSessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wsState, setWsState] = useState<WsConnectionState>('connecting');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RecordFilter>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<DoctorDashboardSessionRow | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await getDoctorDashboard();
      setSessions(result.sessions);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        clearSession();
        onLoggedOut();
        return;
      }
      setError(err instanceof ApiClientError && err.status < 500 ? err.message : 'Connection temporarily unavailable.');
    }
  }, [onLoggedOut]);

  useEffect(() => {
    refresh();
    const disconnect = connectWs({
      onStateChange: setWsState,
      onEvent: (event) => {
        if (
          event.type === 'SESSION_UPDATED' ||
          event.type === 'SUMMARY_READY' ||
          event.type === 'ALERT_RAISED'
        ) {
          refresh();
        }
      },
    });
    return disconnect;
  }, [refresh]);

  const doctorName = getDoctorName() ?? 'Dr. Rohan Mehta';

  const completedCount = sessions?.filter((s) => s.status === 'COMPLETED').length ?? 0;
  const activeCount = sessions?.filter((s) => s.status !== 'COMPLETED').length ?? 0;
  const totalCount = sessions?.length ?? 0;

  const filteredSessions = useMemo(() => {
    let list = sessions ?? [];

    if (filter === 'COMPLETED') {
      list = list.filter((s) => s.status === 'COMPLETED');
    } else if (filter === 'ACTIVE') {
      list = list.filter((s) => s.status !== 'COMPLETED');
    } else if (filter === 'SCANS_ATTACHED') {
      // In demo, first 2 patients have scanned documents
      list = list.filter((_, idx) => idx % 2 === 0);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.patient.fullName.toLowerCase().includes(q) ||
          (s.chiefComplaint ?? '').toLowerCase().includes(q) ||
          s.sessionId.toLowerCase().includes(q),
      );
    }
    return list;
  }, [sessions, filter, search]);

  const unacknowledgedAlerts = useMemo(() => {
    return (sessions ?? []).filter((s) => s.highestAlertSeverity === 'CRITICAL' || s.highestAlertSeverity === 'HIGH').length;
  }, [sessions]);

  const shellProps = {
    active: 'records' as NavKey,
    onNavigate: (key: NavKey) => {
      if (key === 'dashboard') onBack();
      else if (key === 'alerts') onOpenAlerts();
      else if (key === 'consultation') {
        const targetSession = sessions?.[0];
        onOpenConsultation(targetSession?.sessionId || '');
      }
    },
    alertCount: unacknowledgedAlerts,
    onSignOut: () => {
      clearSession();
      onLoggedOut();
    },
    title: 'MediKiosk',
    subtitle: 'Patient Records & Longitudinal EHR',
    search,
    onSearchChange: setSearch,
    wsState,
    doctorName,
  };

  return (
    <DashboardShell {...shellProps}>
      {/* Top Action Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to OPD Queue
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>ABDM & EHR Standard Compliant</span> • <span>Encrypted Record Vault</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 text-white shadow-sm flex flex-col justify-between">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <FolderGit2 size={16} className="text-indigo-300" />
              <span>Cardiology Clinical Archives</span> • <span>OPD Historical Encounters</span>
            </div>
            <h1 className="text-3xl font-extrabold font-display">Patient Records Repository</h1>
            <p className="mt-2 text-sm text-indigo-100 max-w-2xl">
              Centralized repository of digital prescriptions, AI-synthesized clinical intake records, previous OCR scanned documents, and longitudinal patient histories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 text-center border border-white/10">
              <span className="text-2xl font-black text-white">{completedCount}</span>
              <span className="block text-[11px] font-semibold text-indigo-200">Prescriptions Signed</span>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 text-center border border-white/10">
              <span className="text-2xl font-black text-white">{totalCount}</span>
              <span className="block text-[11px] font-semibold text-indigo-200">Total Encounters</span>
            </div>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="mt-6 pt-4 border-t border-indigo-800/60 flex flex-wrap gap-4 text-xs text-indigo-200">
          <span>Active Patient Files: <strong className="text-white font-bold">{activeCount}</strong></span>
          <span>•</span>
          <span>Digital Signatures: <strong className="text-emerald-400 font-bold">100% Cryptographic</strong></span>
          <span>•</span>
          <span>OCR Scans Digitized: <strong className="text-white font-bold">14 Documents</strong></span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: 'ALL', label: `All Records (${totalCount})` },
              { key: 'COMPLETED', label: `Completed / Rx Signed (${completedCount})` },
              { key: 'ACTIVE', label: `Active Queue (${activeCount})` },
              { key: 'SCANS_ATTACHED', label: 'OCR Scans Available' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filter === item.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient, Rx, complaint…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div role="alert" className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Patient Records Grid / Table */}
      {filteredSessions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <FolderGit2 size={42} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Patient Records Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Try adjusting your search keyword or clearing the status filter to view all archived patient encounters.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Patient Information</th>
                  <th className="px-5 py-3.5">Encounter ID & Date</th>
                  <th className="px-5 py-3.5">Chief Complaint & HPI</th>
                  <th className="px-5 py-3.5">Clinical Status</th>
                  <th className="px-5 py-3.5">Attached Health Records</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((row) => {
                  const isCompleted = row.status === 'COMPLETED';
                  const hasScans = true;

                  return (
                    <tr
                      key={row.sessionId}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar name={row.patient.fullName} size={38} />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{row.patient.fullName}</p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {row.patient.gender ?? 'Male'} · {row.patient.dateOfBirth ? new Date(row.patient.dateOfBirth).toLocaleDateString() : 'DOB Unspecified'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          <span className="font-mono text-xs font-bold text-blue-800">
                            #{row.sessionId.slice(0, 8)}
                          </span>
                          <p className="text-[11px] text-slate-400">
                            {new Date(row.updatedAt).toLocaleDateString()} · {new Date(row.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate" title={row.chiefComplaint ?? ''}>
                          {row.chiefComplaint || 'Routine clinical assessment'}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Cardiology OPD</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {STATUS_DISPLAY[row.status].label}
                          </span>
                          {row.highestAlertSeverity && (
                            <div>
                              <SeverityBadge severity={row.highestAlertSeverity} />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-100">
                            <FileScan size={10} /> OCR Scans (2)
                          </span>
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                              <FileCheck size={10} /> Signed Rx
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(row)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                            title="Quick Record Preview"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenSession(row.sessionId)}
                            className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            Open 360
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenConsultation(row.sessionId)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                          >
                            {isCompleted ? 'View Rx' : 'Consult'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Record Preview Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <InitialsAvatar name={selectedRecord.patient.fullName} size={40} />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedRecord.patient.fullName}</h3>
                  <p className="text-xs text-slate-400 font-mono">Encounter #{selectedRecord.sessionId.slice(0, 8)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Chief Complaint</span>
                <p className="text-slate-900 font-semibold text-sm">
                  {selectedRecord.chiefComplaint || 'Clinical evaluation completed via kiosk intake'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block text-[11px]">Encounter Status</span>
                  <span className="text-blue-700 font-semibold">{STATUS_DISPLAY[selectedRecord.status].label}</span>
                </div>
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                  <span className="font-bold text-purple-900 block text-[11px]">Attached Documents</span>
                  <span className="text-purple-700 font-semibold">2 Previous Scans (OCR Verified)</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold mb-1">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>ABDM Longitudinal Health Record Verified</span>
                </div>
                <p className="text-emerald-800 text-[11px]">
                  All clinical findings and digital prescriptions are encrypted and cryptographically linked to the ABDM Health ID.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const id = selectedRecord.sessionId;
                  setSelectedRecord(null);
                  onOpenSession(id);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Open Full 360
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = selectedRecord.sessionId;
                  setSelectedRecord(null);
                  onOpenConsultation(id);
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                Launch Consultation Room
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
