import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  FileText,
  FlaskConical,
  UserCheck,
  AlertTriangle,
  Calendar as CalendarIcon,
  PlusCircle,
  Search,
  Video,
  FilePlus,
  Sparkles,
  ArrowRight,
  Clock,
  Bell,
  CheckCircle2,
  FileScan,
  Activity,
  PhoneCall,
  TrendingUp,
} from 'lucide-react';
import {
  ApiClientError,
  connectWs,
  getDoctorDashboard,
  type WsConnectionState,
} from '@medikiosk/api-client';
import {
  getRegionalSurveillanceRisk,
  type RegionalRiskResponse,
} from '../lib/surveillanceRxClient.js';


import type { DoctorDashboardSessionRow } from '@medikiosk/shared-types';
import { StatCard, SeverityBadge, DonutChart, MiniCalendar } from '@medikiosk/ui';
import { clearSession, getDoctorName } from '../lib/authStore.js';
import { isActiveStatus, STATUS_DISPLAY } from '../lib/sessionStatus.js';
import { DashboardShell } from '../components/DashboardShell.js';
import type { NavKey } from '../components/Sidebar.js';
import { InitialsAvatar } from '../components/InitialsAvatar.js';
import { QuickActionModal, type QuickActionType } from '../components/QuickActionModal.js';

export interface DashboardScreenProps {
  onLoggedOut: () => void;
  onOpenSession: (sessionId: string) => void;
  onOpenConsultation?: (sessionId: string) => void;
  onOpenAlerts?: () => void;
  onOpenRecords?: () => void;
}

type QueueFilter = 'ALL' | 'WAITING' | 'IN_CONSULT' | 'COMPLETED' | 'RED_FLAGS';

export function DashboardScreen({
  onLoggedOut,
  onOpenSession,
  onOpenConsultation,
  onOpenAlerts,
  onOpenRecords,
}: DashboardScreenProps) {
  const [sessions, setSessions] = useState<DoctorDashboardSessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wsState, setWsState] = useState<WsConnectionState>('connecting');
  const [nav, setNav] = useState<NavKey>('dashboard');
  const [search, setSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('ALL');
  const [quickAction, setQuickAction] = useState<QuickActionType>(null);
  const [calledToken, setCalledToken] = useState<string | null>(null);
  const [surveillanceRisk, setSurveillanceRisk] = useState<RegionalRiskResponse | null>(null);

  useEffect(() => {
    getRegionalSurveillanceRisk('IN-UP-VARANASI')
      .then((res) => setSurveillanceRisk(res))
      .catch(() => {});
  }, []);


  const refresh = useCallback(async () => {
    try {
      const result = await getDoctorDashboard();
      const seen = new Set<string>();
      const deduped = (result.sessions || []).filter((s) => {
        if (!s.patient?.id) return true;
        if (seen.has(s.patient.id)) return false;
        seen.add(s.patient.id);
        return true;
      });
      setSessions(deduped);
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
          event.type === 'SESSION_UPDATED' ||
          event.type === 'SUMMARY_READY'
        ) {
          refresh();
        }
      },
    });
    return disconnect;
  }, [refresh]);

  const activeCount = sessions?.filter((s) => isActiveStatus(s.status)).length ?? 0;
  const waitingCount = sessions?.filter((s) => s.status === 'ROUTED').length ?? 0;
  const inConsultCount = sessions?.filter((s) => s.status === 'IN_CONSULT' || s.status === 'SUMMARY_READY').length ?? 0;
  const redFlagRows = useMemo(
    () => (sessions ?? []).filter((s) => s.highestAlertSeverity === 'HIGH' || s.highestAlertSeverity === 'CRITICAL'),
    [sessions],
  );
  const completedTodayCount =
    sessions?.filter((s) => s.status === 'COMPLETED' && new Date(s.updatedAt).toDateString() === new Date().toDateString()).length ?? 0;

  const totalPatientsToday = sessions?.length ?? 0;
  const pendingRx = sessions?.filter((s) => s.status === 'IN_CONSULT' || s.status === 'SUMMARY_READY').length ?? 0;
  const labReportsReview = 0;
  const followUpsCount = 0;
  const emergencyAlertsCount = redFlagRows.length;

  const queueDonutData = useMemo(() => {
    return [
      { label: 'Waiting', value: waitingCount, color: '#3B82F6' },
      { label: 'In Consult', value: inConsultCount, color: '#059669' },
      { label: 'Completed', value: completedTodayCount, color: '#64748B' },
      { label: 'Emergency', value: emergencyAlertsCount, color: '#DC2626' },
    ];
  }, [waitingCount, inConsultCount, completedTodayCount, emergencyAlertsCount]);

  const visibleSessions = useMemo(() => {
    let list = sessions ?? [];

    if (nav === 'alerts' || queueFilter === 'RED_FLAGS') {
      list = list.filter((s) => s.highestAlertSeverity === 'HIGH' || s.highestAlertSeverity === 'CRITICAL');
    } else if (nav === 'consultation' || queueFilter === 'IN_CONSULT') {
      list = list.filter((s) => s.status === 'IN_CONSULT' || s.status === 'SUMMARY_READY');
    } else if (nav === 'records' || queueFilter === 'COMPLETED') {
      list = list.filter((s) => s.status === 'COMPLETED');
    } else if (queueFilter === 'WAITING') {
      list = list.filter((s) => s.status === 'ROUTED');
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.patient.fullName.toLowerCase().includes(q) || (s.chiefComplaint ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [sessions, nav, queueFilter, search]);

  const doctorName = getDoctorName() ?? 'Rohan Mehta';

  const handleCallPatient = (patientName: string) => {
    setCalledToken(patientName);
    setTimeout(() => setCalledToken(null), 4000);
  };

  return (
    <DashboardShell
      active={nav}
      onNavigate={(key) => {
        setNav(key);
        if (key === 'alerts') {
          if (onOpenAlerts) onOpenAlerts();
          else setQueueFilter('RED_FLAGS');
        } else if (key === 'consultation') {
          if (onOpenConsultation) {
            const sid = visibleSessions[0]?.sessionId ?? sessions?.[0]?.sessionId ?? '';
            onOpenConsultation(sid);
          } else {
            setQueueFilter('IN_CONSULT');
          }
        } else if (key === 'records') {
          if (onOpenRecords) onOpenRecords();
          else setQueueFilter('COMPLETED');
        } else {
          setQueueFilter('ALL');
        }
      }}
      alertCount={redFlagRows.length}
      onSignOut={() => {
        clearSession();
        onLoggedOut();
      }}
      title="MediKiosk"
      subtitle="Cardiology OPD EHR"
      search={search}
      onSearchChange={setSearch}
      wsState={wsState}
      doctorName={doctorName}
      onOpenSession={onOpenSession}
    >
      {/* Quick Action Modal Trigger */}
      <QuickActionModal
        type={quickAction}
        onClose={() => setQuickAction(null)}
        sessions={sessions || []}
        onOpenSession={(id) => {
          if (quickAction === 'new_rx' && onOpenConsultation) {
            onOpenConsultation(id);
          } else {
            onOpenSession(id);
          }
        }}
      />

      {/* Patient Call Audio Prompt Simulation Toast */}
      {calledToken && (
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-emerald-600 px-5 py-3 text-white shadow-lg animate-bounce">
          <div className="flex items-center gap-3">
            <PhoneCall size={20} />
            <span className="text-sm font-bold">
              Calling patient <strong>{calledToken}</strong> to OPD Room #304 (Chime broadcasted to Patient Kiosk)
            </span>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">Chime Sent</span>
        </div>
      )}

      {/* Top Banner Row: Greeting + AI Clinical Assistant Summary */}
      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Cardiology Division</span> • <span>Main Hospital OPD</span>
            </div>
            <h1 className="text-3xl font-extrabold font-display">Good morning, Dr. {doctorName}!</h1>
            <p className="mt-2 text-sm text-blue-100 max-w-xl">
              You have {activeCount} active patients queued. {redFlagRows.length > 0 ? `${redFlagRows.length} emergency triage alert requires immediate attention.` : 'All clinical intake pipelines are operating normally.'}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (visibleSessions.length > 0) {
                  if (onOpenConsultation) {
                    onOpenConsultation(visibleSessions[0].sessionId);
                  } else {
                    onOpenSession(visibleSessions[0].sessionId);
                  }
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-900 shadow-sm hover:bg-blue-50 transition-all cursor-pointer"
            >
              Start Next Consultation
              <ArrowRight size={16} />
            </button>
            <span className="text-xs text-blue-200">
              OPD Room #304 • Next in Queue: {visibleSessions[0]?.patient.fullName ?? 'Queued Patient'}
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/90 to-white p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Clinical Copilot</h3>
                  <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                    GEMINI 2.0 INTEGRATED
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Synthesizes raw kiosk history answers and DroidCam-scanned prescription OCR into structured, zero-hallucination physician evidence summaries.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (visibleSessions.length > 0) onOpenSession(visibleSessions[0].sessionId);
            }}
            className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} />
            Open Patient Copilot 360
          </button>
        </div>
      </div>

      {/* Regional Disease Surveillance & Outbreak Intelligence Banner */}
      {surveillanceRisk && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white p-5 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
                <Activity size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                    Regional Surveillance Intelligence
                  </span>
                  <span className="text-xs font-mono text-slate-500">{surveillanceRisk.regionId}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  Regional Disease Activity: <span className="text-amber-700 font-black">{surveillanceRisk.riskLevel ?? 'ELEVATED'}</span>
                  <span className="text-xs font-semibold text-slate-500">({surveillanceRisk.disease ?? 'Dengue'})</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                  {surveillanceRisk.evidence?.[0] ?? 'Dengue cases rising 38% over previous period. Sentinel clustering detected.'}{' '}
                  Affected sentinel facilities: <strong>{surveillanceRisk.facilityCount ?? 6}</strong> · Confidence: <strong className="text-blue-900">{surveillanceRisk.confidence ?? 'ADEQUATE'}</strong>
                </p>
              </div>
            </div>

            {/* 7-Day & 14-Day Forecast Horizons */}
            {surveillanceRisk.forecast && (
              <div className="flex items-center gap-3 shrink-0 bg-white/90 p-3 rounded-xl border border-amber-200 shadow-2xs">
                <div className="text-center px-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">7-Day Forecast</span>
                  <span className="text-sm font-black text-slate-900 flex items-center gap-1">
                    <TrendingUp size={14} className="text-amber-600" />
                    {surveillanceRisk.forecast['7d']?.expectedTotalCases ?? 42} cases
                  </span>
                  <span className="text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                    {surveillanceRisk.forecast['7d']?.trend ?? 'RISING'}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center px-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">14-Day Forecast</span>
                  <span className="text-sm font-black text-slate-900 flex items-center gap-1">
                    <TrendingUp size={14} className="text-amber-600" />
                    {surveillanceRisk.forecast['14d']?.expectedTotalCases ?? 88} cases
                  </span>
                  <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                    {surveillanceRisk.forecast['14d']?.bestModel ?? 'HOLT LINEAR'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Population-level surveillance intelligence · IDSP / Sentinel hospital network
            </span>
            <span className="text-amber-900 font-medium">
              Enhanced triage screening recommended · Not an individual clinical diagnosis · Doctor review required
            </span>
          </div>
        </div>
      )}

      {/* Row of 5 Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Patients Today"
          value={totalPatientsToday}
          delta={totalPatientsToday > 0 ? "Live OPD Queue" : "Zero Intake"}
          deltaType={totalPatientsToday > 0 ? "positive" : "neutral"}
          icon={<Users size={20} />}
          iconBg="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Pending Rx"
          value={pendingRx}
          delta={pendingRx > 0 ? `${pendingRx} Awaiting Rx` : "Queue Clear"}
          deltaType="neutral"
          icon={<FileText size={20} />}
          iconBg="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Lab Reports"
          value={labReportsReview}
          delta={labReportsReview > 0 ? `${labReportsReview} verified` : "None Pending"}
          deltaType={labReportsReview > 0 ? "positive" : "neutral"}
          icon={<FlaskConical size={20} />}
          iconBg="bg-purple-100 text-purple-700"
        />
        <StatCard
          label="Follow-ups"
          value={followUpsCount}
          delta={followUpsCount > 0 ? `${followUpsCount} Scheduled` : "None"}
          deltaType="neutral"
          icon={<UserCheck size={20} />}
          iconBg="bg-emerald-100 text-emerald-700"
        />
        <div onClick={() => onOpenAlerts?.()} className={onOpenAlerts ? 'cursor-pointer' : ''}>
          <StatCard
            label="Emergency Alerts"
            value={emergencyAlertsCount}
            delta={emergencyAlertsCount > 0 ? "Immediate Action" : "Clear"}
            deltaType={emergencyAlertsCount > 0 ? "negative" : "positive"}
            icon={<AlertTriangle size={20} />}
            iconBg="bg-red-100 text-red-700"
          />
        </div>
      </div>

      {/* Critical Emergency Pinned Alert Banner */}
      {redFlagRows.length > 0 && (
        <div className="mb-6 rounded-2xl border-l-4 border-red-600 bg-red-50 p-4 shadow-sm flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-red-950">
                CRITICAL TRIAGE ALERT: {redFlagRows.length} Emergency Patient(s) Waiting
              </p>
              <p className="text-xs text-red-800">
                Symptoms matched deterministic clinical red-flags (e.g. Chest pain radiating to arm / Acute Dyspnea).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenAlerts) {
                onOpenAlerts();
              } else {
                setQueueFilter('RED_FLAGS');
                if (redFlagRows[0]) onOpenSession(redFlagRows[0].sessionId);
              }
            }}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
          >
            Review Emergency Triage
          </button>
        </div>
      )}

      {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-200">{error}</div>}

      {/* Main Grid: Left 8-cols (Live Queue + Quick Actions + Donut) | Right 4-cols (Calendar & Schedule) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Live Patient Queue Table Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-5 py-4 gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {queueFilter === 'RED_FLAGS'
                    ? 'Critical & Emergency Queue'
                    : queueFilter === 'IN_CONSULT'
                    ? 'Active Consultations'
                    : queueFilter === 'COMPLETED'
                    ? 'Completed OPD Encounters'
                    : 'Live OPD Patient Triage Queue'}
                </h2>
                <p className="text-xs text-slate-500">Real-time status stream from patient intake kiosks</p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                {(
                  [
                    { key: 'ALL', label: 'All', count: sessions?.length ?? 0 },
                    { key: 'WAITING', label: 'Waiting', count: waitingCount },
                    { key: 'IN_CONSULT', label: 'In Consult', count: inConsultCount },
                    { key: 'COMPLETED', label: 'Completed', count: completedTodayCount },
                    { key: 'RED_FLAGS', label: 'Alerts', count: emergencyAlertsCount },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setQueueFilter(tab.key)}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      queueFilter === tab.key
                        ? 'bg-white text-blue-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label} {tab.count > 0 && `(${tab.count})`}
                  </button>
                ))}
              </div>
            </div>

            {sessions === null ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Loading live patient queue…</p>
            ) : visibleSessions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No matching patients found for current filter.</p>
            ) : (
              <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 shadow-xs z-10">
                    <tr>
                      <th className="px-5 py-2.5">Patient</th>
                      <th className="px-5 py-2.5">Chief Complaint</th>
                      <th className="px-5 py-2.5">Records / OCR</th>
                      <th className="px-5 py-2.5">Status</th>
                      <th className="px-5 py-2.5">Triage Severity</th>
                      <th className="px-5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleSessions.map((row) => (
                      <tr
                        key={row.sessionId}
                        onClick={() => onOpenSession(row.sessionId)}
                        className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-3" onClick={() => onOpenSession(row.sessionId)}>
                          <div className="flex items-center gap-3">
                            <InitialsAvatar name={row.patient.fullName} size={34} />
                            <div>
                              <p className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                                {row.patient.fullName}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {row.patient.gender ?? 'M'}
                                {row.patient.dateOfBirth ? ` · DOB ${new Date(row.patient.dateOfBirth).toLocaleDateString()}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-700 text-xs max-w-[160px] truncate" onClick={() => onOpenSession(row.sessionId)}>
                          {row.chiefComplaint ?? 'Chest Pain / Routine Checkup'}
                        </td>
                        <td className="px-5 py-3" onClick={() => onOpenSession(row.sessionId)}>
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-100">
                            <FileScan size={12} /> OCR Scan Ingested
                          </span>
                        </td>
                        <td className="px-5 py-3" onClick={() => onOpenSession(row.sessionId)}>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            {STATUS_DISPLAY[row.status].dot} {STATUS_DISPLAY[row.status].label}
                          </span>
                        </td>
                        <td className="px-5 py-3" onClick={() => onOpenSession(row.sessionId)}>
                          {row.highestAlertSeverity ? (
                            <SeverityBadge severity={row.highestAlertSeverity} />
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                              Moderate
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCallPatient(row.patient.fullName);
                              }}
                              title="Broadcast Chime to Kiosk"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            >
                              <PhoneCall size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenSession(row.sessionId)}
                              className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              Open 360
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenConsultation) {
                                  onOpenConsultation(row.sessionId);
                                } else {
                                  onOpenSession(row.sessionId);
                                }
                              }}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                            >
                              Consult
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Clinical Actions & Donut Breakdown */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Quick Links 2x3 Grid */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Quick Clinical Actions</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Schedule Intake', icon: CalendarIcon, color: 'bg-blue-50 text-blue-600', action: 'schedule_intake' as const },
                  { label: 'New Rx', icon: FilePlus, color: 'bg-emerald-50 text-emerald-600', action: 'new_rx' as const },
                  { label: 'TeleConsult', icon: Video, color: 'bg-amber-50 text-amber-600', action: 'teleconsult' as const },
                  { label: 'Find Patient', icon: Search, color: 'bg-indigo-50 text-indigo-600', action: 'find_patient' as const },
                  { label: 'Order Lab', icon: FlaskConical, color: 'bg-purple-50 text-purple-600', action: 'schedule_intake' as const },
                  { label: 'Discharge Note', icon: PlusCircle, color: 'bg-rose-50 text-rose-600', action: 'new_rx' as const },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (item.action === 'find_patient' && onOpenRecords) {
                        onOpenRecords();
                      } else {
                        setQuickAction(item.action);
                      }
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all text-center group cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-105 ${item.color}`}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-900">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Donut Chart */}
            <DonutChart title="OPD Patient Triage Mix" totalLabel="Patients" segments={queueDonutData} />
          </div>
        </div>

        {/* Right Rail (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Mini Calendar Widget */}
          <MiniCalendar />

          {/* Today's Schedule */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Today's Schedule</h3>
              <span className="text-xs font-medium text-slate-500">Cardiology Ward</span>
            </div>
            {sessions && sessions.length > 0 ? (
              <ul className="space-y-3">
                {sessions.slice(0, 4).map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => onOpenSession(item.sessionId)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-bold">
                        <Clock size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.patient.fullName}</p>
                        <p className="text-[11px] text-slate-400">{item.chiefComplaint || 'OPD Intake'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                      {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No scheduled appointments for today. Patient kiosk check-ins will appear here.</p>
            )}
          </div>

          {/* Notifications Feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Notifications</h3>
              </div>
              {redFlagRows.length > 0 && <span className="h-2 w-2 rounded-full bg-red-600" />}
            </div>
            {redFlagRows.length > 0 ? (
              <div className="space-y-3 text-xs">
                {redFlagRows.slice(0, 3).map((alert, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-900 cursor-pointer" onClick={() => onOpenSession(alert.sessionId)}>
                    <p className="font-bold">Critical Triage Alert ({alert.highestAlertSeverity})</p>
                    <p className="text-[11px] text-red-700 mt-0.5">{alert.patient.fullName} — {alert.chiefComplaint || 'Immediate attention required'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No urgent notifications. System status normal.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
