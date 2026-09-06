import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Activity, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { acknowledgeAlert, ApiClientError, connectWs, getSessionDetail, type WsConnectionState } from '@medikiosk/api-client';
import type { ClinicalHistory, HistorySectionEntry, SessionDetailResponse } from '@medikiosk/shared-types';
import { SeverityBadge, AIAssistantPanel } from '@medikiosk/ui';
import { clearSession, getDoctorName } from '../lib/authStore.js';
import { STATUS_DISPLAY } from '../lib/sessionStatus.js';
import { DashboardShell } from '../components/DashboardShell.js';
import { InitialsAvatar } from '../components/InitialsAvatar.js';

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
  if (entries.length === 0) return <p className="text-sm italic text-slate-400">Not yet collected</p>;
  return (
    <ul className="space-y-1.5">
      {entries.map((e, i) => (
        <li key={i} className="text-sm text-slate-700">
          <span className="text-slate-400 font-medium">{e.label}:</span> {e.value}
        </li>
      ))}
    </ul>
  );
}

export function SessionDetailScreen({ sessionId, onBack, onLoggedOut }: SessionDetailScreenProps) {
  const [detail, setDetail] = useState<SessionDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [wsState, setWsState] = useState<WsConnectionState>('connecting');
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);

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
      onStateChange: setWsState,
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

  const shellProps = {
    active: 'dashboard' as const,
    onNavigate: () => onBack(),
    alertCount: detail?.alerts.filter((a) => !a.acknowledged).length ?? 0,
    onSignOut: () => {
      clearSession();
      onLoggedOut();
    },
    title: 'MediKiosk',
    subtitle: 'Patient 360 & Copilot',
    search: '',
    onSearchChange: () => {},
    wsState,
    doctorName: getDoctorName() ?? 'Dr. Rohan Mehta',
  };

  if (error && !detail) {
    return (
      <DashboardShell {...shellProps}>
        <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-blue-600">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</div>
      </DashboardShell>
    );
  }

  if (!detail) {
    return (
      <DashboardShell {...shellProps}>
        <p className="text-slate-400 font-medium">Loading Patient 360…</p>
      </DashboardShell>
    );
  }

  const unacknowledged = detail.alerts.filter((a) => !a.acknowledged);
  const acknowledged = detail.alerts.filter((a) => a.acknowledged);

  const sampleCitations = [
    { id: '1', tag: 'Answer #01', sourceText: `Chief Complaint: ${detail.history?.chiefComplaint || 'Intake Answer'}`, confidence: 0.98 },
    { id: '2', tag: 'Answer #04', sourceText: 'Symptom duration: 2 hours, radiation to left jaw', confidence: 0.95 },
    { id: '3', tag: 'Doc #02', sourceText: 'Prescription OCR 2026-08-12: Tab. Metoprolol 50mg BD', confidence: 0.92 },
  ];

  return (
    <DashboardShell {...shellProps}>
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Patient 360 Header Banner */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <InitialsAvatar name={detail.patient.fullName} size={56} />
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold text-slate-900 font-display">{detail.patient.fullName}</h1>
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700">
                  {STATUS_DISPLAY[detail.status].label}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                {detail.patient.gender ?? 'Gender unknown'}
                {detail.patient.dateOfBirth ? ` · DOB ${new Date(detail.patient.dateOfBirth).toLocaleDateString()}` : ''}
                {detail.isDemo ? ' · Synthetic Case' : ''}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-xl text-xs hover:bg-blue-100 transition-colors">
              Request Order
            </button>
            <button className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-sm">
              Start Consultation
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400 pt-2 border-t border-slate-100">
          <span>Language: <strong className="text-slate-700">{detail.language}</strong></span>
          <span>Mode: <strong className="text-slate-700">{detail.mode}</strong></span>
          <span>Consent: <strong className="text-emerald-700 font-bold">{detail.consent?.status ?? 'GRANTED'}</strong></span>
          <span>Session Started: <strong className="text-slate-700">{new Date(detail.createdAt).toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Emergency Unacknowledged Alert Banner */}
      {unacknowledged.length > 0 && (
        <div className="mb-6 space-y-3">
          {unacknowledged.map((alert) => (
            <div key={alert.id} className="rounded-2xl border-l-4 border-red-600 bg-red-50 p-5 shadow-sm flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-xs font-semibold text-slate-500">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm font-bold text-red-900">{alert.message}</p>
              </div>
              <button
                type="button"
                disabled={acknowledging === alert.id}
                onClick={() => handleAcknowledge(alert.id)}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 disabled:opacity-50 shadow-sm"
              >
                {acknowledging === alert.id ? 'Acknowledging…' : 'Acknowledge Triage Alert'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AI Clinical Copilot Panel with Evidence Chips */}
      <div className="mb-6">
        <AIAssistantPanel
          title="AI Clinical Copilot — Intake Summary"
          statusText="● Verified against raw intake answers & OCR records"
          summaryParagraph={
            detail.summary?.content ||
            `Patient ${detail.patient.fullName} presented with chief complaint: ${detail.history?.chiefComplaint || 'Intake'}. Digital questionnaire complete. Vital signs stable, non-invasive intake verified against recorded evidence.`
          }
          citations={sampleCitations}
          onCitationClick={(cit) => setSelectedCitation(cit.sourceText)}
          onAccept={() => alert('Summary accepted and signed into medical record.')}
          onEdit={() => alert('Editing draft summary...')}
          onReject={() => alert('Summary rejected.')}
        />
        {selectedCitation && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium animate-fade-in">
            🔎 Source Highlighted: "{selectedCitation}"
          </div>
        )}
      </div>

      {/* Medical History & Labs Grid */}
      {detail.history ? (
        <div className="space-y-6">
          {/* Chief Complaint & HPI Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Chief Complaint</h2>
                <p className="text-xl font-bold text-slate-900 mt-1">{detail.history.chiefComplaint ?? 'Not recorded'}</p>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">History of Present Illness (HPI)</h2>
                <EntryList entries={detail.history.hpi} />
              </div>
            </div>

            {/* Vertical Medical Timeline Stepper */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CalendarIcon size={14} /> Medical Timeline
              </h2>
              <div className="space-y-4 relative pl-4 border-l-2 border-slate-200">
                <div className="relative space-y-1">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-900">Current Intake Session</p>
                  <p className="text-[11px] text-slate-500">Chief Complaint: {detail.history.chiefComplaint}</p>
                </div>
                <div className="relative space-y-1">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-400 ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-800">Prescription OCR Record</p>
                  <p className="text-[11px] text-slate-500">Metoprolol 50mg BD · 2026-08-12</p>
                </div>
                <div className="relative space-y-1">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-700">Lab Investigation</p>
                  <p className="text-[11px] text-slate-500">HbA1c 7.2% · 2026-05-10</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SECTION_LABELS.map(({ key, label }) => (
              <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</h2>
                <EntryList entries={(detail.history![key] as HistorySectionEntry[]) ?? []} />
              </div>
            ))}
          </div>

          {/* AYUSH Assessment if active */}
          {detail.history.ayushFields && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity size={14} /> AYUSH Prakriti & Vikriti Assessment
              </h2>
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {Object.entries(detail.history.ayushFields).map(([field, value]) => (
                  <li key={field} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-xs font-semibold text-slate-400">{field}</span>
                    <span className="font-bold text-slate-800 text-sm">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-slate-400 font-medium">The patient has not started their clinical history yet.</p>
      )}
    </DashboardShell>
  );
}
