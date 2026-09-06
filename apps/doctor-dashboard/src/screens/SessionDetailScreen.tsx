import { useCallback, useEffect, useState } from 'react';
import { acknowledgeAlert, ApiClientError, connectWs, getSessionDetail } from '@medikiosk/api-client';
import type { ClinicalHistory, HistorySectionEntry, SessionDetailResponse } from '@medikiosk/shared-types';
import { SeverityBadge } from '@medikiosk/ui';
import { clearSession } from '../lib/authStore.js';
import { STATUS_DISPLAY } from '../lib/sessionStatus.js';

export interface SessionDetailScreenProps {
  sessionId: string;
  onBack: () => void;
  onLoggedOut: () => void;
}

const SECTION_LABELS: { key: keyof ClinicalHistory; label: string }[] = [
  { key: 'pastMedicalHistory', label: 'Past Medical History' },
  { key: 'pastSurgicalHistory', label: 'Past Surgical History' },
  { key: 'currentMedications', label: 'Current Medications' },
  { key: 'drugAllergies', label: 'Drug Allergies' },
  { key: 'familyHistory', label: 'Family History' },
  { key: 'personalHistory', label: 'Personal History' },
  { key: 'reviewOfSystems', label: 'Review of Systems' },
  { key: 'previousInvestigations', label: 'Previous Investigations' },
];

function EntryList({ entries }: { entries: HistorySectionEntry[] }) {
  if (entries.length === 0) return <p className="text-sm italic text-neutral-400">Not yet collected</p>;
  return (
    <ul className="space-y-1.5">
      {entries.map((e, i) => (
        <li key={i} className="text-sm text-neutral-700">
          <span className="text-neutral-400">{e.label}:</span> {e.value}
        </li>
      ))}
    </ul>
  );
}

export function SessionDetailScreen({ sessionId, onBack, onLoggedOut }: SessionDetailScreenProps) {
  const [detail, setDetail] = useState<SessionDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await getSessionDetail(sessionId);
      setDetail(result);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        clearSession();
        onLoggedOut();
        return;
      }
      setError(err instanceof ApiClientError && err.status < 500 ? err.message : 'Connection temporarily unavailable.');
    }
  }, [sessionId, onLoggedOut]);

  useEffect(() => {
    refresh();
    const disconnect = connectWs({
      onEvent: (event) => {
        if (
          ('payload' in event && 'sessionId' in event.payload && event.payload.sessionId === sessionId) ||
          event.type === 'ALERT_ACKNOWLEDGED'
        ) {
          refresh();
        }
      },
    });
    return disconnect;
  }, [refresh, sessionId]);

  async function handleAcknowledge(alertId: string) {
    setAcknowledging(alertId);
    try {
      await acknowledgeAlert(alertId);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError && err.status < 500 ? err.message : 'Could not acknowledge - please retry.');
    } finally {
      setAcknowledging(null);
    }
  }

  if (error && !detail) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-primary-700">
          ← Back to dashboard
        </button>
        <div role="alert" className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-800">{error}</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-neutral-500">Loading…</p>
      </div>
    );
  }

  const unacknowledged = detail.alerts.filter((a) => !a.acknowledged);
  const acknowledged = detail.alerts.filter((a) => a.acknowledged);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-primary-700">
        ← Back to dashboard
      </button>

      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{detail.patient.fullName}</h1>
            <p className="text-sm text-neutral-500">
              {detail.patient.gender ?? 'Gender unknown'}
              {detail.patient.dateOfBirth ? ` · DOB ${new Date(detail.patient.dateOfBirth).toLocaleDateString()}` : ''}
              {detail.isDemo ? ' · Demo Patient' : ''}
            </p>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
            {STATUS_DISPLAY[detail.status].dot} {STATUS_DISPLAY[detail.status].label}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-400">
          <span>Language: {detail.language}</span>
          <span>Mode: {detail.mode}</span>
          <span>Consent: {detail.consent?.status ?? 'PENDING'}</span>
          <span>Started: {new Date(detail.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {unacknowledged.length > 0 && (
        <div className="mb-6 space-y-3">
          {unacknowledged.map((alert) => (
            <div key={alert.id} className="rounded-xl border-2 border-danger-600 bg-danger-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <SeverityBadge severity={alert.severity} />
                <span className="text-xs text-neutral-400">{new Date(alert.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="mb-3 text-sm text-danger-800">{alert.message}</p>
              <button
                type="button"
                disabled={acknowledging === alert.id}
                onClick={() => handleAcknowledge(alert.id)}
                className="rounded-lg bg-danger-700 px-4 py-2 text-sm font-semibold text-white hover:bg-danger-800 disabled:opacity-50"
              >
                {acknowledging === alert.id ? 'Acknowledging…' : 'Acknowledge'}
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div role="alert" className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-800">{error}</div>}

      {detail.history ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">Chief Complaint</h2>
            <p className="text-lg text-neutral-900">{detail.history.chiefComplaint ?? 'Not recorded'}</p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              History of Present Illness
            </h2>
            <EntryList entries={detail.history.hpi} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SECTION_LABELS.map(({ key, label }) => (
              <div key={key} className="rounded-xl border border-neutral-200 bg-white p-5">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">{label}</h2>
                <EntryList entries={(detail.history![key] as HistorySectionEntry[]) ?? []} />
              </div>
            ))}
          </div>

          {detail.history.ayushFields && (
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">AYUSH Assessment</h2>
              <ul className="grid grid-cols-2 gap-2 text-sm text-neutral-700">
                {Object.entries(detail.history.ayushFields).map(([field, value]) => (
                  <li key={field}>
                    <span className="text-neutral-400">{field}:</span> {value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-neutral-500">The patient has not started their clinical history yet.</p>
      )}

      {acknowledged.length > 0 && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">Acknowledged Alerts</h2>
          <ul className="space-y-2">
            {acknowledged.map((alert) => (
              <li key={alert.id} className="flex items-center gap-2 text-sm text-neutral-600">
                <SeverityBadge severity={alert.severity} />
                {alert.message}
                <span className="text-xs text-neutral-400">· acknowledged {new Date(alert.acknowledgedAt!).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
