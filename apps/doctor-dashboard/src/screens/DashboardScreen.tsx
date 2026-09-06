import { useCallback, useEffect, useState } from 'react';
import { ApiClientError, connectWs, getDoctorDashboard, type WsConnectionState } from '@medikiosk/api-client';
import type { DoctorDashboardSessionRow } from '@medikiosk/shared-types';
import { SeverityBadge } from '@medikiosk/ui';
import { clearSession, getDoctorName } from '../lib/authStore.js';
import { isActiveStatus, STATUS_DISPLAY } from '../lib/sessionStatus.js';

export interface DashboardScreenProps {
  onLoggedOut: () => void;
  onOpenSession: (sessionId: string) => void;
}

const CONNECTION_DOT: Record<WsConnectionState, string> = {
  open: 'bg-success-500',
  connecting: 'bg-warning-400',
  closed: 'bg-danger-500',
};

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'danger' }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${tone === 'danger' && value > 0 ? 'text-danger-600' : 'text-neutral-900'}`}>{value}</p>
    </div>
  );
}

export function DashboardScreen({ onLoggedOut, onOpenSession }: DashboardScreenProps) {
  const [sessions, setSessions] = useState<DoctorDashboardSessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wsState, setWsState] = useState<WsConnectionState>('connecting');

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
  const redFlagCount = sessions?.filter((s) => s.highestAlertSeverity === 'HIGH' || s.highestAlertSeverity === 'CRITICAL').length ?? 0;
  const completedTodayCount =
    sessions?.filter((s) => s.status === 'COMPLETED' && new Date(s.updatedAt).toDateString() === new Date().toDateString()).length ?? 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">MediKiosk</h1>
          <p className="text-xs text-neutral-500">Clinical Intake Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <span className={`h-2 w-2 rounded-full ${CONNECTION_DOT[wsState]} ${wsState !== 'open' ? 'motion-safe:animate-pulse' : ''}`} />
            {wsState === 'open' ? 'Live' : wsState === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
          </span>
          <span className="text-sm text-neutral-600">{getDoctorName()}</span>
          <button
            type="button"
            className="text-sm font-medium text-primary-700 hover:underline"
            onClick={() => {
              clearSession();
              onLoggedOut();
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Active Sessions" value={activeCount} />
          <StatCard label="Waiting for Doctor" value={waitingCount} />
          <StatCard label="Red Flags" value={redFlagCount} tone="danger" />
          <StatCard label="Completed Today" value={completedTodayCount} />
        </div>

        <h2 className="mb-4 text-xl font-semibold text-neutral-900">Patient Sessions</h2>

        {error && <div role="alert" className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-800">{error}</div>}

        {sessions === null ? (
          <p className="text-neutral-500">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="text-neutral-500">No patient sessions yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Chief Complaint</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Alert</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((row) => (
                  <tr
                    key={row.sessionId}
                    onClick={() => onOpenSession(row.sessionId)}
                    className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-primary-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">{row.patient.fullName}</td>
                    <td className="px-4 py-3 text-neutral-700">{row.chiefComplaint ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {STATUS_DISPLAY[row.status].dot} {STATUS_DISPLAY[row.status].label}
                    </td>
                    <td className="px-4 py-3">
                      {row.highestAlertSeverity ? <SeverityBadge severity={row.highestAlertSeverity} /> : <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{new Date(row.updatedAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
