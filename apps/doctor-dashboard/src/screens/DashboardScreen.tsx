import { useCallback, useEffect, useState } from 'react';
import { ApiClientError, connectWs, getDoctorDashboard } from '@medikiosk/api-client';
import type { DoctorDashboardSessionRow } from '@medikiosk/shared-types';
import { SeverityBadge } from '@medikiosk/ui';
import { clearSession, getDoctorName } from '../lib/authStore.js';

export interface DashboardScreenProps {
  onLoggedOut: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Created',
  IDENTIFIED: 'Identified',
  CONSENTED: 'Consented',
  IN_HISTORY: 'Taking history',
  DOCUMENTS: 'Awaiting documents',
  SUMMARY_READY: 'Summary ready',
  ROUTED: 'Routed to doctor',
  IN_CONSULT: 'In consultation',
  COMPLETED: 'Completed',
  ABANDONED: 'Abandoned',
};

export function DashboardScreen({ onLoggedOut }: DashboardScreenProps) {
  const [sessions, setSessions] = useState<DoctorDashboardSessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof ApiClientError ? err.message : 'Failed to load dashboard.');
    }
  }, [onLoggedOut]);

  useEffect(() => {
    refresh();
    // Re-fetch on relevant real-time events rather than polling - the dashboard reflects
    // new alerts and session progress without a manual refresh.
    const disconnect = connectWs({
      onEvent: (event) => {
        if (event.type === 'ALERT_RAISED' || event.type === 'SESSION_UPDATED' || event.type === 'SUMMARY_READY') {
          refresh();
        }
      },
    });
    return disconnect;
  }, [refresh]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">MediKiosk</h1>
          <p className="text-xs text-slate-500">Doctor Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{getDoctorName()}</span>
          <button
            type="button"
            className="text-sm font-medium text-blue-700 hover:underline"
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
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Patient Sessions</h2>

        {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

        {sessions === null ? (
          <p className="text-slate-500">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="text-slate-500">No patient sessions yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
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
                  <tr key={row.sessionId} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.patient.fullName}</td>
                    <td className="px-4 py-3 text-slate-700">{row.chiefComplaint ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{STATUS_LABELS[row.status] ?? row.status}</td>
                    <td className="px-4 py-3">
                      {row.highestAlertSeverity ? <SeverityBadge severity={row.highestAlertSeverity} /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(row.updatedAt).toLocaleTimeString()}</td>
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
