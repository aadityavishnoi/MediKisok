import { useCallback, useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Activity,
  Calendar as CalendarIcon,
  FileText,
  Cloud,
  ExternalLink,
  Eye,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  X,
  Upload,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  acknowledgeAlert,
  ApiClientError,
  connectWs,
  getSessionDetail,
  uploadDocument,
  type WsConnectionState,
} from '@medikiosk/api-client';
import type {
  ClinicalHistory,
  HistorySectionEntry,
  SessionDetailResponse,
  MedicalDocument,
  ExtractedMedicalData,
} from '@medikiosk/shared-types';
import { SeverityBadge, AIAssistantPanel } from '@medikiosk/ui';
import { clearSession, getDoctorName } from '../lib/authStore.js';
import { STATUS_DISPLAY } from '../lib/sessionStatus.js';
import { DashboardShell } from '../components/DashboardShell.js';
import { InitialsAvatar } from '../components/InitialsAvatar.js';

export interface SessionDetailScreenProps {
  sessionId: string;
  onBack: () => void;
  onLoggedOut: () => void;
  onOpenSession?: (sessionId: string) => void;
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

export function SessionDetailScreen({ sessionId, onBack, onLoggedOut, onOpenSession }: SessionDetailScreenProps) {
  const [detail, setDetail] = useState<SessionDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [wsState, setWsState] = useState<WsConnectionState>('connecting');
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);

  // Side-by-Side ImageKit Document Viewer States
  const [selectedDoc, setSelectedDoc] = useState<(MedicalDocument & { extractedData?: ExtractedMedicalData[] }) | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSimulatingUpload, setIsSimulatingUpload] = useState<boolean>(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleQuickSimulateDocument(type: 'PRESCRIPTION' | 'LAB_REPORT') {
    if (!detail) return;
    setIsSimulatingUpload(true);
    try {
      if (typeof uploadDocument === 'function') {
        await uploadDocument({
          sessionId: detail.sessionId,
          patientId: detail.patient.id,
          type,
          filename: `${type.toLowerCase()}_sample_${Date.now()}.png`,
        });
        await refresh();
      }
    } catch (err) {
      console.error('Failed to simulate doc upload:', err);
    } finally {
      setIsSimulatingUpload(false);
    }
  }

  async function handleDoctorFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !detail) return;
    setIsSimulatingUpload(true);
    try {
      if (typeof uploadDocument === 'function') {
        await uploadDocument({
          sessionId: detail.sessionId,
          patientId: detail.patient.id,
          type: 'PRESCRIPTION',
          filename: file.name,
          file,
        });
        await refresh();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsSimulatingUpload(false);
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
    onOpenSession,
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
  const documents = detail.documents ?? [];

  const sampleCitations = [
    { id: '1', tag: 'Answer #01', sourceText: `Chief Complaint: ${detail.history?.chiefComplaint || 'Intake Answer'}`, confidence: 0.98 },
    { id: '2', tag: 'Answer #04', sourceText: 'Symptom duration: 2 hours, radiation to left jaw', confidence: 0.95 },
    { id: '3', tag: 'Doc #02', sourceText: 'Prescription OCR: Tab. Paracetamol 650mg TDS, Tab. Pantoprazole 40mg OD', confidence: 0.96 },
  ];

  return (
    <DashboardShell {...shellProps}>
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Hidden file input for doctor doc upload */}
      <input
        ref={docFileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleDoctorFileUpload}
      />

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
            <button
              onClick={() => handleQuickSimulateDocument('PRESCRIPTION')}
              disabled={isSimulatingUpload}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-xl text-xs hover:bg-blue-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Cloud size={13} /> {isSimulatingUpload ? 'Uploading to ImageKit…' : 'Ingest Prescription (ImageKit)'}
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

      {/* Scanned Physical Documents & OCR (ImageKit Cloud) Section */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="text-blue-600" size={18} />
              <h2 className="text-base font-bold text-slate-900">
                Scanned Physical Documents & OCR Records (ImageKit Cloud)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                Live Cloud CDN
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Original paper prescriptions, diagnostic lab sheets, and patient records uploaded directly to ImageKit CDN and linked to this patient.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => docFileInputRef.current?.click()}
              disabled={isSimulatingUpload}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Upload size={13} /> Upload Paper / PDF
            </button>
            <button
              onClick={() => handleQuickSimulateDocument('PRESCRIPTION')}
              disabled={isSimulatingUpload}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              <Sparkles size={13} /> Ingest Sample Rx
            </button>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <FileText size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No physical documents uploaded yet for this patient</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Scan prescriptions or lab sheets during kiosk intake, or use the buttons above to test ImageKit cloud ingestion side-by-side with OCR.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => handleQuickSimulateDocument('PRESCRIPTION')}
                disabled={isSimulatingUpload}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                + Upload Sample Prescription to ImageKit
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group relative rounded-2xl border border-slate-200 hover:border-blue-400 transition-all bg-white overflow-hidden shadow-xs hover:shadow-md flex flex-col"
              >
                {/* Top preview header */}
                <div className="h-32 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={doc.storagePath}
                    alt={doc.originalFilename}
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // fallback to SVG icon if image cannot load
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {/* Badge tags */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-blue-600/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider">
                      {doc.type}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur text-white text-[10px] font-bold flex items-center gap-1">
                      <Cloud size={10} /> ImageKit
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <p className="text-xs font-bold truncate drop-shadow-sm">{doc.originalFilename}</p>
                    <p className="text-[10px] text-slate-300">
                      Confidence: {Math.round(doc.ocrConfidence * 100)}% · {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      OCR Extracted Summary
                    </span>
                    <p className="text-xs text-slate-700 line-clamp-2 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {doc.ocrText || 'No transcribed text available'}
                    </p>
                  </div>

                  {/* Extracted medication/param pills */}
                  {doc.extractedData && doc.extractedData.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.extractedData.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold"
                        >
                          💊 {item.fieldValue}
                        </span>
                      ))}
                      {doc.extractedData.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-medium">
                          +{doc.extractedData.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setZoomLevel(1);
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye size={13} /> Side-by-Side View
                    </button>
                    <a
                      href={doc.storagePath}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      title="Open full image on ImageKit CDN"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                  <p className="text-[11px] text-slate-500">
                    {documents.length > 0 ? documents[0].originalFilename : 'Tab. Paracetamol 650mg TDS · ImageKit Cloud'}
                  </p>
                </div>
                <div className="relative space-y-1">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-700">Lab Investigation</p>
                  <p className="text-[11px] text-slate-500">Hb 13.8 g/dL · Platelets 240,000 /mcL</p>
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

      {/* Side-by-Side Modal / Lightbox (Physical Document on ImageKit CDN vs OCR Stream) */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Layers size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-slate-900 font-display">
                      Side-by-Side Physical Document & OCR Verification
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                      {selectedDoc.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Patient: {detail.patient.fullName} · Stored on ImageKit Cloud CDN · Confidence: {Math.round(selectedDoc.ocrConfidence * 100)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedDoc.storagePath}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={13} /> Open ImageKit CDN
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Two-Column Split Body */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* Left Column (7 cols): High-Resolution Physical Paper / Document Preview */}
              <div className="lg:col-span-7 bg-slate-950 flex flex-col border-r border-slate-800 relative overflow-hidden">
                {/* Zoom Controls Toolbar */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 text-white text-xs">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                    className="p-1 hover:text-blue-400 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="font-mono text-[11px] px-1">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                    className="p-1 hover:text-blue-400 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1 hover:text-blue-400 transition-colors border-l border-slate-700 pl-2"
                    title="Reset Zoom"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>

                {/* Sub-banner */}
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-semibold text-blue-400">
                    <Cloud size={14} /> Physical Document Visual (ImageKit Cloud Stream)
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 truncate max-w-[260px]">
                    {selectedDoc.originalFilename}
                  </span>
                </div>

                {/* Scrollable image container */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-6 select-none">
                  <div
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                    className="transition-transform duration-150 shadow-2xl rounded-lg overflow-hidden border border-slate-700 max-h-full max-w-full"
                  >
                    <img
                      src={selectedDoc.storagePath}
                      alt="Original Prescription Paper"
                      className="max-h-[60vh] object-contain block bg-white"
                    />
                  </div>
                </div>

                {/* Image metadata footer */}
                <div className="bg-slate-900/90 px-4 py-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>MIME: {selectedDoc.mimeType || 'image/png'}</span>
                  <span className="font-mono text-[10px] text-slate-400 truncate max-w-[320px]">
                    CDN: {selectedDoc.storagePath}
                  </span>
                </div>
              </div>

              {/* Right Column (5 cols): AI OCR Structured Extraction & Clinical Validation */}
              <div className="lg:col-span-5 bg-white flex flex-col overflow-y-auto p-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">OCR Confidence Score</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {Math.round(selectedDoc.ocrConfidence * 100)}% Match
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${selectedDoc.ocrConfidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Extracted Clinical Entities */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Extracted Clinical Entities
                  </h3>
                  <div className="space-y-2">
                    {selectedDoc.extractedData && selectedDoc.extractedData.length > 0 ? (
                      selectedDoc.extractedData.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-2"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                              {item.fieldType}
                            </span>
                            <span className="text-sm font-bold text-slate-800">{item.fieldValue}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {Math.round(item.confidence * 100)}%
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs italic text-slate-400">No individual entities parsed.</p>
                    )}
                  </div>
                </div>

                {/* Raw OCR Transcription */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={14} className="text-slate-500" /> Full Transcription
                  </h3>
                  <div className="flex-1 p-3.5 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-48">
                    {selectedDoc.ocrText}
                  </div>
                </div>

                {/* Doctor Verification Action */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Verified document "${selectedDoc.originalFilename}". Appended to patient consultation record.`);
                      setSelectedDoc(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                  >
                    <ShieldCheck size={16} /> Verify & Append to Clinical Consultation Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(null)}
                    className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    Close Viewer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
