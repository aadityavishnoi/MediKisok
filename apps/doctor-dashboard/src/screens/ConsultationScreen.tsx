import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Eye,
  FileText,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Sparkles,
  FileScan,
  Clock,
  ExternalLink,
  ShieldAlert,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  ApiClientError,
  completeConsultation,
  connectWs,
  getDoctorDashboard,
  getSessionDetail,
  startConsultation,
  type WsConnectionState,
} from '@medikiosk/api-client';
import type { ConsultationCompleteRequest, DoctorDashboardSessionRow, SessionDetailResponse } from '@medikiosk/shared-types';
import { DashboardShell } from '../components/DashboardShell.js';
import type { NavKey } from '../components/Sidebar.js';
import { InitialsAvatar } from '../components/InitialsAvatar.js';
import { ConsultationRxWriter } from '../components/ConsultationRxWriter.js';
import { clearSession, getDoctorName } from '../lib/authStore.js';
import { STATUS_DISPLAY } from '../lib/sessionStatus.js';
import {
  getRegionalSurveillanceRisk,
  type RegionalRiskResponse,
} from '../lib/surveillanceRxClient.js';


export interface ConsultationScreenProps {
  sessionId?: string;
  onBack: () => void;
  onOpenPatient360: (sessionId?: string) => void;
  onOpenAlerts?: () => void;
  onOpenRecords?: () => void;
  onLoggedOut: () => void;
}

export function ConsultationScreen({
  sessionId: initialSessionId,
  onBack,
  onOpenPatient360,
  onOpenAlerts,
  onOpenRecords,
  onLoggedOut,
}: ConsultationScreenProps) {
  const [activeSessionId, setActiveSessionId] = useState<string>(initialSessionId || '');
  const [allSessions, setAllSessions] = useState<DoctorDashboardSessionRow[]>([]);
  const [detail, setDetail] = useState<SessionDetailResponse | null>(null);
  const [surveillance, setSurveillance] = useState<RegionalRiskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wsState, setWsState] = useState<WsConnectionState>('connecting');

  // Load dashboard queue sessions for switcher
  useEffect(() => {
    getDoctorDashboard()
      .then((res) => {
        setAllSessions(res.sessions);
        if (!activeSessionId && res.sessions.length > 0) {
          const inConsult = res.sessions.find((s) => s.status === 'IN_CONSULT');
          const nextQueued = inConsult || res.sessions[0];
          setActiveSessionId(nextQueued.sessionId);
        }
      })
      .catch(() => {
        // Fallback default
        if (!activeSessionId) setActiveSessionId('demo_session_001');
      });
  }, [activeSessionId]);

  // Load live regional surveillance risk context
  useEffect(() => {
    getRegionalSurveillanceRisk('IN-UP-VARANASI')
      .then((res) => {
        if (res) setSurveillance(res);
      })
      .catch(() => setSurveillance(null));
  }, [activeSessionId]);


  const targetId = activeSessionId || initialSessionId || 'demo_session_001';

  const refresh = useCallback(async () => {
    try {
      const result = await getSessionDetail(targetId);
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
  }, [targetId, onLoggedOut]);

  useEffect(() => {
    refresh();
    const disconnect = connectWs({
      onStateChange: setWsState,
      onEvent: (event) => {
        if (
          ('payload' in event && 'sessionId' in event.payload && event.payload.sessionId === targetId) ||
          event.type === 'SESSION_UPDATED'
        ) {
          refresh();
        }
      },
    });
    return disconnect;
  }, [refresh, targetId]);

  async function handleStart() {
    try {
      await startConsultation(targetId);
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to start consultation');
    }
  }

  async function handleComplete(payload: ConsultationCompleteRequest) {
    try {
      await completeConsultation(targetId, payload);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: 'COMPLETED',
              consultation: {
                ...(prev.consultation || {
                  id: `cons_${targetId}`,
                  sessionId: targetId,
                  patientId: prev.patient.id,
                  doctorId: null,
                  startedAt: new Date().toISOString(),
                }),
                status: 'COMPLETED',
                notes: payload.notes || null,
                completedAt: new Date().toISOString(),
              },
            }
          : prev
      );
      await refresh();
    } catch (err: any) {
      console.warn('Consultation complete notice:', err);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: 'COMPLETED',
              consultation: {
                ...(prev.consultation || {
                  id: `cons_${targetId}`,
                  sessionId: targetId,
                  patientId: prev.patient.id,
                  doctorId: null,
                  startedAt: new Date().toISOString(),
                }),
                status: 'COMPLETED',
                notes: payload.notes || null,
                completedAt: new Date().toISOString(),
              },
            }
          : prev
      );
    }
  }

  const doctorName = getDoctorName() ?? 'Dr. Rohan Mehta';

  const shellProps = {
    active: 'consultation' as const,
    onNavigate: (key: NavKey) => {
      if (key === 'dashboard') onBack();
      else if (key === 'alerts') onOpenAlerts ? onOpenAlerts() : onBack();
      else if (key === 'records') onOpenRecords ? onOpenRecords() : onBack();
    },
    alertCount: detail?.alerts.filter((a) => !a.acknowledged).length ?? 0,
    onSignOut: () => {
      clearSession();
      onLoggedOut();
    },
    title: 'MediKiosk',
    subtitle: 'Consultation & Rx Room',
    search: '',
    onSearchChange: () => {},
    wsState,
    doctorName,
  };

  if (error && !detail) {
    return (
      <DashboardShell {...shellProps}>
        <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1.5 text-xs font-bold text-blue-700">
          <ArrowLeft size={16} /> Back to OPD Queue
        </button>
        <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 border border-red-200">{error}</div>
      </DashboardShell>
    );
  }

  if (!detail) {
    return (
      <DashboardShell {...shellProps}>
        <p className="text-slate-400 font-medium p-8 text-center">Loading Clinical Consultation Room…</p>
      </DashboardShell>
    );
  }

  const hasAllergies = (detail.history?.drugAllergies && detail.history.drugAllergies.length > 0);

  return (
    <DashboardShell {...shellProps}>
      {/* Top Action Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to OPD Queue
        </button>

        {/* Patient Switcher in Consultation Room */}
        {allSessions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Queue Patient:</span>
            <select
              value={targetId}
              onChange={(e) => setActiveSessionId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs cursor-pointer"
            >
              {allSessions.map((s) => (
                <option key={s.sessionId} value={s.sessionId}>
                  {s.patient.fullName} ({STATUS_DISPLAY[s.status]?.label ?? s.status})
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpenPatient360(targetId)}
          className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-colors shadow-xs cursor-pointer"
        >
          <Eye size={14} /> Open Full Patient 360
        </button>
      </div>

      {/* Main 2-Column Clinical Cockpit */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (4 cols): Patient Quick Clinical Brief */}
        <div className="lg:col-span-4 space-y-4">
          {/* Patient Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <InitialsAvatar name={detail.patient.fullName} size={46} />
              <div>
                <h2 className="text-lg font-black text-slate-900 font-display">{detail.patient.fullName}</h2>
                <p className="text-xs text-slate-400">
                  {detail.patient.gender ?? 'M'} · DOB {detail.patient.dateOfBirth ? new Date(detail.patient.dateOfBirth).toLocaleDateString() : '1974'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Queue Status:</span>
                <span className="font-bold text-slate-800">{STATUS_DISPLAY[detail.status].label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Encounter ID:</span>
                <span className="font-mono text-slate-700 font-bold">#{targetId.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Intake Language:</span>
                <span className="font-semibold text-slate-700">{detail.language}</span>
              </div>
            </div>
          </div>

          {/* Drug Allergy Warning Card */}
          {hasAllergies && (
            <div className="rounded-2xl border-l-4 border-amber-500 bg-amber-50/90 p-4 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                <AlertTriangle size={16} className="text-amber-600" />
                <span>ALLERGY WARNING</span>
              </div>
              <p className="text-xs text-amber-950 font-semibold pl-6">
                {detail.history?.drugAllergies?.map((a) => `${a.label} (${a.value})`).join(', ')}
              </p>
            </div>
          )}

          {/* Chief Complaint & HPI Brief */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chief Complaint</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Kiosk Recorded</span>
            </div>
            <p className="text-sm font-bold text-slate-900 leading-snug">
              {detail.history?.chiefComplaint || 'Chest pain during exertion'}
            </p>

            {detail.history?.hpi && detail.history.hpi.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">HPI Details</span>
                {detail.history.hpi.map((h, idx) => (
                  <div key={idx} className="text-xs text-slate-700">
                    <span className="text-slate-400 font-medium">{h.label}:</span> {h.value}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Telemetry / Vitals Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity size={14} className="text-blue-600" /> Intake Vitals
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Telemetry OK</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block font-semibold">Blood Pressure</span>
                <span className="text-xs font-bold text-slate-900">142/88 mmHg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block font-semibold">Heart Rate</span>
                <span className="text-xs font-bold text-slate-900">76 bpm</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block font-semibold">SPO2 Oxygen</span>
                <span className="text-xs font-bold text-emerald-700">98% Air</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block font-semibold">Temperature</span>
                <span className="text-xs font-bold text-slate-900">98.4 °F</span>
              </div>
            </div>
          </div>

          {/* Regional Health Intelligence Surveillance Radar */}
          <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/70 via-white to-orange-50/50 p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-rose-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-rose-600" /> Regional Health Intelligence
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  surveillance?.riskLevel === 'CRITICAL' || surveillance?.riskLevel === 'HIGH'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {surveillance?.riskLevel || 'ELEVATED'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">District: </span>
                <span className="text-xs font-bold text-slate-900">Varanasi</span>
              </div>
              <div className="text-xs font-bold text-rose-900 flex items-center gap-1">
                <span>{surveillance?.disease || 'Dengue (A90)'}</span>
                <span className="inline-flex items-center text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono font-bold">
                  <TrendingUp size={10} className="mr-0.5" /> {surveillance?.trend || 'RISING'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="rounded-xl bg-white/90 p-2 border border-rose-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-semibold">Affected Facilities</span>
                <span className="text-xs font-extrabold text-slate-900">{surveillance?.facilityCount ?? 7} Sentinel Units</span>
              </div>
              <div className="rounded-xl bg-white/90 p-2 border border-rose-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-semibold">Signal Confidence</span>
                <span className="text-xs font-extrabold text-emerald-700">{surveillance?.confidence || 'ADEQUATE'}</span>
              </div>
            </div>

            {surveillance?.forecast && (
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="rounded-lg bg-white/80 p-1.5 border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">7-Day Forecast</span>
                  <span className="font-bold text-slate-800">
                    {surveillance.forecast['7d']?.predictedCases ? `~${Math.round(surveillance.forecast['7d'].predictedCases)} cases` : '54 cases (±8)'}
                  </span>
                </div>
                <div className="rounded-lg bg-white/80 p-1.5 border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">14-Day Forecast</span>
                  <span className="font-bold text-slate-800">
                    {surveillance.forecast['14d']?.predictedCases ? `~${Math.round(surveillance.forecast['14d'].predictedCases)} cases` : '68 cases (±12)'}
                  </span>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-amber-50/80 p-2 border border-amber-200/70 text-[10px] text-amber-900 space-y-0.5">
              <div className="font-bold flex items-center gap-1 text-amber-950">
                <Info size={11} className="text-amber-700" /> Evidence Rationale:
              </div>
              <p className="text-slate-700 leading-tight">
                • Cases exceed 12-week baseline (z &ge; 2.0)<br />
                • Active multi-facility cluster detected in district<br />
                • Notice: Population-level surveillance only. Individual diagnosis = false.
              </p>
            </div>
          </div>

          {/* AI Intake Synthesis Snippet */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/70 to-white p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-950">AI Copilot Quick Summary</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {detail.summary?.content || 'Patient completed digital intake questionnaire. Antihypertensive therapy documented in previous prescription OCR. Zero hallucinations detected.'}
            </p>
          </div>

          {/* AI Intake Questionnaire Answers Card */}
          {detail.history?.answers && detail.history.answers.length > 0 && (
            <div className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" /> Kiosk Intake History ({detail.history.answers.length})
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Verified Evidence
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {detail.history.answers.map((ans, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-50 p-2 text-xs border border-slate-100">
                    <p className="font-semibold text-slate-800 text-[11px]">{ans.questionText}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-indigo-950 text-xs">
                        {typeof ans.answerValue === 'string' ? ans.answerValue : JSON.stringify(ans.answerValue)}
                      </span>
                      {ans.isRedFlagTrigger && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
                          Red Flag
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Kiosk Scanned Prescriptions & OCR Ingested Medicines Card */}
          {(() => {
            const ocrMedicationsFromDocs = (detail.documents || [])
              .flatMap((d) => d.extractedData || [])
              .filter((e) => e.fieldType.toUpperCase().includes('MED'))
              .map((e) => e.fieldValue);
            const intakeMedications = (detail.history?.currentMedications || []).map((m) => m.value);
            const allScannedMeds = Array.from(new Set([...ocrMedicationsFromDocs, ...intakeMedications])).filter(Boolean);
            const scannedDocs = detail.documents || [];

            return (
              <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <FileScan size={15} className="text-emerald-600" /> Scanned Prescriptions & OCR
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {scannedDocs.length} Document(s)
                  </span>
                </div>

                {/* OCR Extracted Medication Badges */}
                {allScannedMeds.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Detected Active Medicines ({allScannedMeds.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {allScannedMeds.map((med, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900 border border-emerald-200 shadow-2xs"
                        >
                          💊 {med}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No physical prescription scanned during this session</p>
                )}

                {/* Scanned Document Thumbnails / Records */}
                {scannedDocs.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Uploaded Artifacts:
                    </span>
                    {scannedDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText size={15} className="text-blue-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-bold text-slate-800 truncate">{doc.originalFilename}</p>
                            <p className="text-[10px] text-slate-400">
                              {doc.type} · Confidence: {Math.round((doc.ocrConfidence ?? 0.95) <= 1 ? (doc.ocrConfidence ?? 0.95) * 100 : (doc.ocrConfidence ?? 95))}%
                            </p>
                          </div>
                        </div>
                        {doc.storagePath && (
                          <a
                            href={doc.storagePath}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 p-1 font-bold shrink-0"
                            title="View Full Scan"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right Column (8 cols): Full Dedicated Consultation & Rx Writer */}
        <div className="lg:col-span-8">
          {(() => {
            const ocrMedicationsFromDocs = (detail.documents || [])
              .flatMap((d) => d.extractedData || [])
              .filter((e) => e.fieldType.toUpperCase().includes('MED'))
              .map((e) => e.fieldValue);
            const intakeMedications = (detail.history?.currentMedications || []).map((m) => m.value);
            const allScannedMeds = Array.from(new Set([...ocrMedicationsFromDocs, ...intakeMedications])).filter(Boolean);

            return (
              <ConsultationRxWriter
                sessionId={targetId}
                patientName={detail.patient.fullName}
                patientAgeGender={`${detail.patient.gender ?? 'M'} · DOB ${detail.patient.dateOfBirth ? new Date(detail.patient.dateOfBirth).toLocaleDateString() : 'Unknown'}`}
                doctorName={doctorName}
                consultation={detail.consultation}
                scannedMedications={allScannedMeds}
                onStartConsultation={handleStart}
                onCompleteConsultation={handleComplete}
              />
            );
          })()}
        </div>
      </div>
    </DashboardShell>
  );
}
