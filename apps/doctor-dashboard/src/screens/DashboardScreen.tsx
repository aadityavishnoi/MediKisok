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
  Bell
} from 'lucide-react';
import { ApiClientError, connectWs, getDoctorDashboard, type WsConnectionState } from '@medikiosk/api-client';
import type { DoctorDashboardSessionRow } from '@medikiosk/shared-types';
import { StatCard, SeverityBadge, DonutChart, MiniCalendar } from '@medikiosk/ui';
import { clearSession, getDoctorName } from '../lib/authStore.js';
import { isActiveStatus, STATUS_DISPLAY } from '../lib/sessionStatus.js';
import { DashboardShell } from '../components/DashboardShell.js';
import type { NavKey } from '../components/Sidebar.js';
import { InitialsAvatar } from '../components/InitialsAvatar.js';

export interface DashboardScreenProps {
  onLoggedOut: () => void;
  onOpenSession: (sessionId: string) => void;
}

export function DashboardScreen({ onLoggedOut, onOpenSession }: DashboardScreenProps) {
  const [sessions, setSessions] = useState<DoctorDashboardSessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wsState, setWsState] = useState<WsConnectionState>('connecting');
  const [nav, setNav] = useState<NavKey>('dashboard');
  const [search, setSearch] = useState('');

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
  const redFlagRows = useMemo(
    () => (sessions ?? []).filter((s) => s.highestAlertSeverity === 'HIGH' || s.highestAlertSeverity === 'CRITICAL'),
    [sessions],
  );
  const completedTodayCount =
    sessions?.filter((s) => s.status === 'COMPLETED' && new Date(s.updatedAt).toDateString() === new Date().toDateString()).length ?? 0;

  const totalPatientsToday = (sessions?.length ?? 0) + 14; // baseline demo offset
  const pendingRx = 3;
  const labReportsReview = 7;
  const followUpsCount = 4;
  const emergencyAlertsCount = redFlagRows.length;

  const queueDonutData = useMemo(() => {
    const counts = {
      Waiting: sessions?.filter((s) => s.status === 'ROUTED').length ?? 0,
      'In Consult': sessions?.filter((s) => s.status === 'IN_CONSULT' || s.status === 'SUMMARY_READY').length ?? 0,
      Completed: completedTodayCount,
      'No-show': 1,
    };
    return [
      { label: 'Waiting', value: counts.Waiting, color: '#3B82F6' },
      { label: 'In Consult', value: counts['In Consult'], color: '#059669' },
      { label: 'Completed', value: counts.Completed, color: '#64748B' },
      { label: 'No-show', value: counts['No-show'], color: '#DC2626' },
    ];
  }, [sessions, completedTodayCount]);

  const visibleSessions = useMemo(() => {
    let list = sessions ?? [];
    if (nav === 'alerts') list = list.filter((s) => s.highestAlertSeverity === 'HIGH' || s.highestAlertSeverity === 'CRITICAL');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.patient.fullName.toLowerCase().includes(q) || (s.chiefComplaint ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [sessions, nav, search]);

  const doctorName = getDoctorName() ?? 'Rohan Mehta';

  return (
    <DashboardShell
      active={nav}
      onNavigate={setNav}
      alertCount={redFlagRows.length}
      onSignOut={() => {
        clearSession();
        onLoggedOut();
      }}
      title="MediKiosk"
      subtitle="Cardiologist View"
      search={search}
      onSearchChange={setSearch}
      wsState={wsState}
      doctorName={doctorName}
      onOpenSession={onOpenSession}
    >
      {/* Top Banner Row: Greeting + AI Clinical Assistant BETA */}
      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Cardiology Division</span> • <span>Main Hospital OPD</span>
            </div>
            <h1 className="text-3xl font-extrabold font-display">Good morning, Dr. {doctorName}!</h1>
            <p className="mt-2 text-sm text-blue-100 max-w-xl">
              You have {activeCount} active patients queued today. {redFlagRows.length > 0 ? `${redFlagRows.length} critical alert requires immediate review.` : 'All clinical triage queues are running smoothly.'}
            </p>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (visibleSessions.length > 0) onOpenSession(visibleSessions[0].sessionId);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-900 shadow-sm hover:bg-blue-50 transition-all"
            >
              Start Next Consultation
              <ArrowRight size={16} />
            </button>
            <span className="text-xs text-blue-200">OPD Room #304 • Next: {visibleSessions[0]?.patient.fullName ?? 'Queued Patient'}</span>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-blue-200 bg-blue-50/80 p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Sparkles size={18} />
              </span>
              <div>
                <h3 className="text-base font-bold text-blue-950">AI Clinical Assistant</h3>
                <span className="inline-block rounded-full bg-blue-200/70 px-2 py-0.5 text-[10px] font-bold text-blue-900">BETA</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-blue-900/80 leading-relaxed">
            Real-time LLM clinical summaries automatically synthesize patient intake complaints & lab trends with verified source citations.
          </p>
          <button
            type="button"
            onClick={() => {
              if (visibleSessions.length > 0) onOpenSession(visibleSessions[0].sessionId);
            }}
            className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            Generate Summary
          </button>
        </div>
      </div>

      {/* Row of 5 Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Patients Today"
          value={totalPatientsToday}
          delta="↑ 12% vs yesterday"
          deltaType="positive"
          icon={<Users size={20} />}
          iconBg="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Pending Rx"
          value={pendingRx}
          delta="3 Urgents"
          deltaType="neutral"
          icon={<FileText size={20} />}
          iconBg="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Lab Reports"
          value={labReportsReview}
          delta="↑ 4 new"
          deltaType="positive"
          icon={<FlaskConical size={20} />}
          iconBg="bg-purple-100 text-purple-700"
        />
        <StatCard
          label="Follow-ups"
          value={followUpsCount}
          delta="Scheduled"
          deltaType="positive"
          icon={<UserCheck size={20} />}
          iconBg="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="Emergency Alerts"
          value={emergencyAlertsCount}
          delta={emergencyAlertsCount > 0 ? "Action Needed" : "Clear"}
          deltaType={emergencyAlertsCount > 0 ? "negative" : "positive"}
          icon={<AlertTriangle size={20} />}
          iconBg="bg-red-100 text-red-700"
        />
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-200">{error}</div>}

      {/* Main Grid: Left 8-cols (Live Queue + Quick Links + Donut) | Right 4-cols (Calendar & Schedule) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Live Patient Queue Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {nav === 'alerts' ? 'Critical & Emergency Queue' : 'Live Patient Triage Queue'}
                </h2>
                <p className="text-xs text-slate-500">Real-time status updates from patient intake kiosks</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {visibleSessions.length} Patients
              </span>
            </div>

            {sessions === null ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Loading live patient queue…</p>
            ) : visibleSessions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No matching patients found.</p>
            ) : (
              <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 shadow-sm z-10">
                    <tr>
                      <th className="px-5 py-2.5">Patient</th>
                      <th className="px-5 py-2.5">Chief Complaint</th>
                      <th className="px-5 py-2.5">Status</th>
                      <th className="px-5 py-2.5">Severity</th>
                      <th className="px-5 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleSessions.map((row) => (
                      <tr
                        key={row.sessionId}
                        onClick={() => onOpenSession(row.sessionId)}
                        className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar name={row.patient.fullName} size={32} />
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{row.patient.fullName}</p>
                              <p className="text-[11px] text-slate-400">{row.patient.gender ?? 'M'}{row.patient.dateOfBirth ? ` · DOB ${new Date(row.patient.dateOfBirth).toLocaleDateString()}` : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 font-medium text-slate-700 text-xs max-w-[180px] truncate">
                          {row.chiefComplaint ?? 'Chest Pain / Routine Checkup'}
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            {STATUS_DISPLAY[row.status].dot} {STATUS_DISPLAY[row.status].label}
                          </span>
                        </td>
                        <td className="px-5 py-2.5">
                          {row.highestAlertSeverity ? (
                            <SeverityBadge severity={row.highestAlertSeverity} />
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">Moderate</span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <button
                            type="button"
                            className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            Open 360
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2-col nested: Quick Links & Donut Breakdown */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Quick Links 2x3 Grid */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Quick Clinical Actions</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Schedule Intake', icon: CalendarIcon, color: 'bg-blue-50 text-blue-600' },
                  { label: 'New Rx', icon: FilePlus, color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'Order Lab', icon: FlaskConical, color: 'bg-purple-50 text-purple-600' },
                  { label: 'TeleConsult', icon: Video, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Find Patient', icon: Search, color: 'bg-indigo-50 text-indigo-600' },
                  { label: 'Discharge Note', icon: PlusCircle, color: 'bg-rose-50 text-rose-600' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all text-center group"
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
            <DonutChart title="Patient Queue Status" totalLabel="Patients" segments={queueDonutData} />
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
            <ul className="space-y-3">
              {[
                { time: '09:30 AM', name: 'Rajesh Kumar', status: 'Confirmed', badge: 'bg-emerald-50 text-emerald-700' },
                { time: '10:15 AM', name: 'Ananya Sharma', status: 'In Progress', badge: 'bg-blue-50 text-blue-700' },
                { time: '11:00 AM', name: 'Vikram Singh', status: 'Waiting', badge: 'bg-amber-50 text-amber-700' },
                { time: '11:45 AM', name: 'Sunita Patel', status: 'Pending Lab', badge: 'bg-purple-50 text-purple-700' },
              ].map((item, idx) => (
                <li key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-bold">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{item.time}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.badge}`}>
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Notifications Feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Notifications</h3>
              </div>
              <span className="h-2 w-2 rounded-full bg-red-600" />
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-900">
                <p className="font-bold">Critical Lab Result</p>
                <p className="text-[11px] text-red-700 mt-0.5">Patient #1042 Troponin-I: 4.2 ng/mL (High Alert)</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                <p className="font-bold">AI Intake Summary Ready</p>
                <p className="text-[11px] text-blue-700 mt-0.5">Synthesized intake for Rajesh Kumar with 4 verified sources.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
