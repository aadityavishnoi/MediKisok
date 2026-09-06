import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Users } from 'lucide-react';
import { ApiClientError, connectWs, getDoctorDashboard, type WsConnectionState } from '@medikiosk/api-client';
import type { DoctorDashboardSessionRow } from '@medikiosk/shared-types';
import { SeverityBadge } from '@medikiosk/ui';
import { clearSession, getDoctorName } from '../lib/authStore.js';
import { isActiveStatus, STATUS_DISPLAY } from '../lib/sessionStatus.js';
import { DashboardShell } from '../components/DashboardShell.js';
import type { NavKey } from '../components/Sidebar.js';
import { InitialsAvatar } from '../components/InitialsAvatar.js';
import { MiniBarChart } from '../components/MiniBarChart.js';

export interface DashboardScreenProps {
  onLoggedOut: () => void;
  onOpenSession: (sessionId: string) => void;
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone: 'primary' | 'secondary' | 'danger' | 'success';
}) {
  const toneClasses = {
    primary: 'bg-primary-50 text-primary-700',
    secondary: 'bg-secondary-50 text-secondary-700',
    danger: 'bg-danger-50 text-danger-700',
    success: 'bg-success-50 text-success-700',
  }[tone];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold text-neutral-900">{value}</p>
    </div>
  );
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
    // Re-fetch on relevant real-time events rather than polling - the dashboard reflects
    // new alerts and session progress without a manual refresh.
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

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of sessions ?? []) counts[s.status] = (counts[s.status] ?? 0) + 1;
    return Object.entries(counts).map(([status, value]) => ({
      label: STATUS_DISPLAY[status as keyof typeof STATUS_DISPLAY]?.label.split(' ')[0] ?? status,
      value,
    }));
  }, [sessions]);

  const visibleSessions = useMemo(() => {
    let list = sessions ?? [];
    if (nav === 'alerts') list = list.filter((s) => s.highestAlertSeverity === 'HIGH' || s.highestAlertSeverity === 'CRITICAL');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.patient.fullName.toLowerCase().includes(q) || (s.chiefComplaint ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [sessions, nav, search]);

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
      subtitle="Clinical Intake Dashboard"
      search={search}
      onSearchChange={setSearch}
      wsState={wsState}
      doctorName={getDoctorName() ?? 'Doctor'}
    >
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Sessions" value={activeCount} icon={Users} tone="primary" />
        <StatCard label="Waiting for Doctor" value={waitingCount} icon={Clock} tone="secondary" />
        <StatCard label="Red Flags" value={redFlagRows.length} icon={AlertTriangle} tone="danger" />
        <StatCard label="Completed Today" value={completedTodayCount} icon={CheckCircle2} tone="success" />
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-800">{error}</div>}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-1 text-sm font-semibold text-neutral-800">Sessions by Status</h2>
          <p className="mb-3 text-xs text-neutral-400">Live breakdown of every session currently on record</p>
          {statusBreakdown.length > 0 ? (
            <MiniBarChart data={statusBreakdown} />
          ) : (
            <p className="py-6 text-center text-sm text-neutral-400">No sessions yet</p>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">Recent Red Flags</h2>
          {redFlagRows.length === 0 ? (
            <p className="text-sm text-neutral-400">No active red flags.</p>
          ) : (
            <ul className="space-y-3">
              {redFlagRows.slice(0, 4).map((row) => (
                <li key={row.sessionId}>
                  <button
                    type="button"
                    onClick={() => onOpenSession(row.sessionId)}
                    className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left hover:bg-danger-50/50"
                  >
                    <InitialsAvatar name={row.patient.fullName} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-neutral-800">{row.patient.fullName}</span>
                      <span className="block truncate text-xs text-neutral-400">{row.chiefComplaint ?? '—'}</span>
                    </span>
                    {row.highestAlertSeverity && <SeverityBadge severity={row.highestAlertSeverity} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-neutral-800">
            {nav === 'alerts' ? 'Sessions with Red Flags' : 'Patient Sessions'}
          </h2>
          <span className="text-xs text-neutral-400">{visibleSessions.length} shown</span>
        </div>

        {sessions === null ? (
          <p className="px-5 py-8 text-center text-neutral-400">Loading…</p>
        ) : visibleSessions.length === 0 ? (
          <p className="px-5 py-8 text-center text-neutral-400">No matching sessions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-neutral-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Chief Complaint</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Alert</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {visibleSessions.map((row) => (
                  <tr
                    key={row.sessionId}
                    onClick={() => onOpenSession(row.sessionId)}
                    className="cursor-pointer border-t border-neutral-100 hover:bg-primary-50/40"
                  >
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <InitialsAvatar name={row.patient.fullName} size={32} />
                        <span className="font-medium text-neutral-900">{row.patient.fullName}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{row.chiefComplaint ?? '—'}</td>
                    <td className="px-5 py-3 text-neutral-600">
                      {STATUS_DISPLAY[row.status].dot} {STATUS_DISPLAY[row.status].label}
                    </td>
                    <td className="px-5 py-3">
                      {row.highestAlertSeverity ? <SeverityBadge severity={row.highestAlertSeverity} /> : <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-neutral-400">{new Date(row.updatedAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
