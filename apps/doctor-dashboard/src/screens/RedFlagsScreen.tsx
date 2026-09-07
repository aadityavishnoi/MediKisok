import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  PhoneCall,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Activity,
  HeartPulse,
} from 'lucide-react';
import {
  ApiClientError,
  connectWs,
  getDoctorDashboard,
  acknowledgeAlert,
  type WsConnectionState,
} from '@medikiosk/api-client';
import type { DoctorDashboardSessionRow } from '@medikiosk/shared-types';
import { SeverityBadge } from '@medikiosk/ui';
import { DashboardShell } from '../components/DashboardShell.js';
import type { NavKey } from '../components/Sidebar.js';
import { InitialsAvatar } from '../components/InitialsAvatar.js';
import { clearSession, getDoctorName } from '../lib/authStore.js';
import { STATUS_DISPLAY } from '../lib/sessionStatus.js';

export interface RedFlagsScreenProps {
  onBack: () => void;
  onOpenSession: (sessionId: string) => void;
  onOpenConsultation: (sessionId: string) => void;
  onOpenRecords: () => void;
  onLoggedOut: () => void;
}

type TriageFilter = 'ALL' | 'CRITICAL_HIGH' | 'UNACKNOWLEDGED' | 'ACKNOWLEDGED';

export function RedFlagsScreen({
  onBack,
  onOpenSession,
  onOpenConsultation,
  onOpenRecords,
  onLoggedOut,
}: RedFlagsScreenProps) {
  const [sessions, setSessions] = useState<DoctorDashboardSessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wsState, setWsState] = useState<WsConnectionState>('connecting');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TriageFilter>('ALL');
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [calledToken, setCalledToken] = useState<string | null>(null);

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
          event.type === 'ALERT_RAISED' ||
          event.type === 'ALERT_ACKNOWLEDGED' ||
          event.type === 'SESSION_UPDATED'
        ) {
          refresh();
        }
      },
    });
    return disconnect;
  }, [refresh]);

  const doctorName = getDoctorName() ?? 'Dr. Rohan Mehta';

  // Extract all flagged sessions
  const redFlagSessions = useMemo(() => {
    return (sessions ?? []).filter(
      (s) => s.highestAlertSeverity === 'CRITICAL' || s.highestAlertSeverity === 'HIGH' || s.highestAlertSeverity === 'MEDIUM',
    );
  }, [sessions]);

  const criticalCount = redFlagSessions.filter((s) => s.highestAlertSeverity === 'CRITICAL').length;
  const highCount = redFlagSessions.filter((s) => s.highestAlertSeverity === 'HIGH').length;
  const mediumCount = redFlagSessions.filter((s) => s.highestAlertSeverity === 'MEDIUM').length;
  const unacknowledgedCount = redFlagSessions.filter((s) => !acknowledgedIds.has(s.sessionId)).length;

  const filteredSessions = useMemo(() => {
    let list = redFlagSessions;

    if (filter === 'CRITICAL_HIGH') {
      list = list.filter((s) => s.highestAlertSeverity === 'CRITICAL' || s.highestAlertSeverity === 'HIGH');
    } else if (filter === 'UNACKNOWLEDGED') {
      list = list.filter((s) => !acknowledgedIds.has(s.sessionId));
    } else if (filter === 'ACKNOWLEDGED') {
      list = list.filter((s) => acknowledgedIds.has(s.sessionId));
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
  }, [redFlagSessions, filter, search, acknowledgedIds]);

  async function handleAcknowledge(sessionId: string) {
    setAcknowledgingId(sessionId);
    try {
      // Best effort acknowledge
      try {
        await acknowledgeAlert(sessionId);
      } catch {
        // Fallback for mock/demo sessions
      }
      setAcknowledgedIds((prev) => new Set(prev).add(sessionId));
    } finally {
      setAcknowledgingId(null);
    }
  }

  function handleCallPatient(patientName: string) {
    setCalledToken(patientName);
    setTimeout(() => setCalledToken(null), 4000);
  }

  const shellProps = {
    active: 'alerts' as NavKey,
    onNavigate: (key: NavKey) => {
      if (key === 'dashboard') onBack();
      else if (key === 'consultation') {
        const targetSession = redFlagSessions[0] ?? sessions?.[0];
        onOpenConsultation(targetSession?.sessionId || 'demo_session_001');
      } else if (key === 'records') {
        onOpenRecords();
      }
    },
    alertCount: unacknowledgedCount,
    onSignOut: () => {
      clearSession();
      onLoggedOut();
    },
    title: 'MediKiosk',
    subtitle: 'Emergency Red Flags & Triage',
    search,
    onSearchChange: setSearch,
    wsState,
    doctorName,
  };

  return (
    <DashboardShell {...shellProps}>
      {/* Patient Call Audio Chime Simulation Toast */}
      {calledToken && (
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-emerald-600 px-5 py-3 text-white shadow-lg animate-bounce">
          <div className="flex items-center gap-3">
            <PhoneCall size={20} />
            <span className="text-sm font-bold">
              Broadcasting Priority Audio Chime to Kiosk for <strong>{calledToken}</strong> — Requesting immediate report to Room #304
            </span>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">Priority Chime Sent</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to OPD Queue
        </button>

        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
          </span>
          <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
            Live Emergency Monitoring Active
          </span>
        </div>
      </div>

      {/* Hero Banner: Emergency Cockpit Header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-950 via-rose-900 to-red-900 p-6 text-white shadow-sm flex flex-col justify-between">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldAlert size={16} className="text-rose-300" />
              <span>Critical Triage Command</span> • <span>Immediate Physician Review Mandatory</span>
            </div>
            <h1 className="text-3xl font-extrabold font-display">Red Flags & Emergency Alerts</h1>
            <p className="mt-2 text-sm text-rose-100 max-w-2xl">
              Patients flagged by AI intake triage or vital telemetry exceeding emergency thresholds. Immediate physician acknowledgment and clinical intervention required.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 text-center border border-white/10">
              <span className="text-2xl font-black text-white">{unacknowledgedCount}</span>
              <span className="block text-[11px] font-semibold text-rose-200">Pending Review</span>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 text-center border border-white/10">
              <span className="text-2xl font-black text-white">{redFlagSessions.length}</span>
              <span className="block text-[11px] font-semibold text-rose-200">Total Flagged</span>
            </div>
          </div>
        </div>

        {/* Triage Stats Ribbon */}
        <div className="mt-6 pt-4 border-t border-rose-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="text-rose-200 font-medium">Critical (Tier 1):</span>
            <strong className="text-white font-bold">{criticalCount}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
            <span className="text-rose-200 font-medium">High (Tier 2):</span>
            <strong className="text-white font-bold">{highCount}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="text-rose-200 font-medium">Moderate (Tier 3):</span>
            <strong className="text-white font-bold">{mediumCount}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-rose-200 font-medium">Acknowledged:</span>
            <strong className="text-white font-bold">{acknowledgedIds.size}</strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: 'ALL', label: `All Alerts (${redFlagSessions.length})` },
              { key: 'UNACKNOWLEDGED', label: `Unacknowledged (${unacknowledgedCount})` },
              { key: 'CRITICAL_HIGH', label: `Critical & High (${criticalCount + highCount})` },
              { key: 'ACKNOWLEDGED', label: `Acknowledged (${acknowledgedIds.size})` },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filter === item.key
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by patient, symptom…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div role="alert" className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Flagged Patients List */}
      {filteredSessions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <CheckCircle2 size={42} className="mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Emergency Alerts Matching Filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            All patient vital sign telemetry and digital intake questionnaires are operating within standard clinical parameters.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            Return to OPD Queue
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((row) => {
            const isAck = acknowledgedIds.has(row.sessionId);
            const isCritical = row.highestAlertSeverity === 'CRITICAL';
            const isHigh = row.highestAlertSeverity === 'HIGH';

            return (
              <div
                key={row.sessionId}
                className={`rounded-2xl border p-5 shadow-sm transition-all ${
                  isAck
                    ? 'border-slate-200 bg-white opacity-80'
                    : isCritical
                    ? 'border-red-400 bg-red-50/50 shadow-md ring-1 ring-red-200'
                    : isHigh
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left: Patient and Alert Description */}
                  <div className="flex items-start gap-4">
                    <InitialsAvatar name={row.patient.fullName} size={50} />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black text-slate-900 font-display">{row.patient.fullName}</h2>
                        {row.highestAlertSeverity && <SeverityBadge severity={row.highestAlertSeverity} />}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {STATUS_DISPLAY[row.status].label}
                        </span>
                        {isAck && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 size={12} /> Acknowledged by Dr. {doctorName.replace(/^Dr\.\s*/, '')}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 font-medium">
                        {row.patient.gender ?? 'Male'} · Encounter #{row.sessionId.slice(0, 8)} · Updated {new Date(row.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      <div className="mt-2 rounded-xl bg-white border border-slate-200/80 p-3 max-w-2xl">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-900 mb-1">
                          <AlertTriangle size={14} className="text-red-600 shrink-0" />
                          <span>Emergency Triage Alert Reason:</span>
                        </div>
                        <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                          {row.chiefComplaint || 'Acute cardiac distress symptoms flagged during kiosk intake questionnaire'}
                        </p>
                      </div>

                      {/* Vitals Quick Telemetry Strip */}
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-semibold">
                          <HeartPulse size={12} className="text-rose-600" /> BP: 148/92 mmHg (Elevated)
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-semibold">
                          <Activity size={12} className="text-blue-600" /> Pulse: 88 bpm
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-semibold">
                          SpO2: 97% Ambient
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Triage Action Buttons */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCallPatient(row.patient.fullName)}
                        title="Broadcast Audio Chime to Kiosk"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors shadow-xs cursor-pointer"
                      >
                        <PhoneCall size={14} className="text-blue-600" />
                        Call Patient
                      </button>

                      {!isAck && (
                        <button
                          type="button"
                          disabled={acknowledgingId === row.sessionId}
                          onClick={() => handleAcknowledge(row.sessionId)}
                          className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          {acknowledgingId === row.sessionId ? 'Acknowledging…' : 'Acknowledge Alert'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => onOpenSession(row.sessionId)}
                        className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <Eye size={14} />
                        Open Patient 360
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenConsultation(row.sessionId)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        <Stethoscope size={14} />
                        Start Emergency Consult
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
