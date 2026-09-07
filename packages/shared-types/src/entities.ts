import type {
  ActorType,
  AISummaryStatus,
  AlertSeverity,
  ConsentStatus,
  ConsultationStatus,
  DeviceStatus,
  DocumentType,
  ExtractionFieldStatus,
  IdentificationMethod,
  Language,
  Mode,
  SessionStatus,
  TimelineEventType,
} from './enums.js';

/** All timestamps are ISO-8601 strings as they cross the wire (API responses are JSON). */
export type ISODateString = string;

export interface LocalizedText {
  en: string;
  hi: string;
}

export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: ISODateString | null;
  gender: string | null;
  phone: string | null;
  abhaId: string | null;
  registrationSource: IdentificationMethod;
  isDemo: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OtpVerification {
  id: string;
  phone: string;
  code: string;
  expiresAt: ISODateString;
  verified: boolean;
  attempts: number;
  createdAt: ISODateString;
}

export interface RFIDDevice {
  id: string;
  deviceCode: string;
  location: string | null;
  lastHeartbeatAt: ISODateString | null;
  firmwareVersion: string | null;
  ipAddress: string | null;
  isDemo: boolean;
  createdAt: ISODateString;
}

export interface RFIDCard {
  id: string;
  uid: string;
  patientId: string | null;
  isDemo: boolean;
  active: boolean;
  issuedAt: ISODateString;
}

export interface PatientSession {
  id: string;
  patientId: string | null;
  deviceId: string | null;
  status: SessionStatus;
  mode: Mode;
  language: Language;
  isDemo: boolean;
  identifiedVia: IdentificationMethod | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Consent {
  id: string;
  sessionId: string;
  status: ConsentStatus;
  language: Language;
  consentTextVersion: string;
  grantedAt: ISODateString | null;
}

/** Free-text/structured sections are stored as JSON; each is an array of short entries. */
export interface HistorySectionEntry {
  label: string;
  value: string;
}

export interface ClinicalHistory {
  id: string;
  sessionId: string;
  patientId: string;
  mode: Mode;
  chiefComplaint: string | null;
  hpi: HistorySectionEntry[];
  pastMedicalHistory: HistorySectionEntry[];
  pastSurgicalHistory: HistorySectionEntry[];
  currentMedications: HistorySectionEntry[];
  drugAllergies: HistorySectionEntry[];
  familyHistory: HistorySectionEntry[];
  personalHistory: HistorySectionEntry[];
  reviewOfSystems: HistorySectionEntry[];
  previousInvestigations: HistorySectionEntry[];
  ayushFields: Record<string, string> | null;
  completedAt: ISODateString | null;
}

export interface ClinicalAnswer {
  id: string;
  clinicalHistoryId: string;
  nodeId: string;
  section: string;
  questionText: string;
  questionTextLocalized: LocalizedText | null;
  answerValue: unknown;
  isRedFlagTrigger: boolean;
  answeredAt: ISODateString;
}

export interface MedicalDocument {
  id: string;
  sessionId: string;
  patientId: string;
  type: DocumentType;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  ocrText: string | null;
  ocrConfidence: number | null;
  processedAt: ISODateString | null;
  createdAt: ISODateString;
}

export interface ExtractedMedicalData {
  id: string;
  documentId: string;
  fieldType: string;
  fieldValue: string;
  confidence: number;
  status: ExtractionFieldStatus;
  verifiedBy: string | null;
  verifiedAt: ISODateString | null;
}

export interface MedicalTimelineEvent {
  id: string;
  patientId: string;
  sourceDocumentId: string | null;
  eventType: TimelineEventType;
  eventDate: ISODateString | null;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AISummary {
  id: string;
  sessionId: string;
  patientId: string;
  content: string;
  generatorType: 'LOCAL_TEMPLATE' | 'LLM';
  status: AISummaryStatus;
  editedContent: string | null;
  confirmedByDoctorId: string | null;
  confirmedAt: ISODateString | null;
  createdAt: ISODateString;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  role: 'DOCTOR' | 'ADMIN';
  department: string | null;
}

export interface Consultation {
  id: string;
  sessionId: string;
  patientId: string;
  doctorId: string | null;
  status: ConsultationStatus;
  notes: string | null;
  startedAt: ISODateString | null;
  completedAt: ISODateString | null;
}

export interface Alert {
  id: string;
  sessionId: string;
  patientId: string;
  severity: AlertSeverity;
  triggerType: string;
  message: string;
  triggeredByAnswerId: string | null;
  acknowledged: boolean;
  acknowledgedByDoctorId: string | null;
  acknowledgedAt: ISODateString | null;
  createdAt: ISODateString;
}

export interface AuditLog {
  id: string;
  actorType: ActorType;
  actorId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: ISODateString;
}

/** Real, heartbeat-derived connectivity of one device - see enums.ts DeviceStatus. */
export interface HardwareDeviceState {
  deviceCode: string;
  location: string | null;
  status: DeviceStatus;
  lastHeartbeatAt: ISODateString | null;
  firmwareVersion: string | null;
  isDemo: boolean;
}
