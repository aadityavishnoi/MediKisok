import type { AlertSeverity, ConsentStatus, DeviceStatus, DoctorRole, DocumentType, IdentificationMethod, Language, Mode, QuestionType } from './enums.js';
import type {
  Alert,
  AISummary,
  ClinicalAnswer,
  ClinicalHistory,
  Consent,
  Consultation,
  ExtractedMedicalData,
  HardwareDeviceState,
  LocalizedText,
  MedicalDocument,
  MedicalTimelineEvent,
  Patient,
  PatientSession,
} from './entities.js';

/** Uniform envelope for every REST error response. Never includes a stack trace. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

// ---------------------------------------------------------------------------
// RFID / identification
// ---------------------------------------------------------------------------

export interface RfidScanRequest {
  deviceCode: string;
  uid: string;
  timestamp: string;
}

export interface RfidScanResponse {
  sessionId: string;
  patientId: string | null;
  isNewPatient: boolean;
  status: 'IDENTIFIED' | 'NEW_PATIENT';
  ledColor: 'GREEN' | 'YELLOW' | 'RED';
  buzz: boolean;
}

export interface RfidSimulateRequest {
  uid?: string;
}

export interface PatientRegisterRequest {
  sessionId: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
}

export interface PatientRegisterResponse {
  patientId: string;
  sessionId: string;
}

// ---------------------------------------------------------------------------
// OTP & First-Time Kiosk Registration
// ---------------------------------------------------------------------------

export interface SendOtpRequest {
  phone: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  /** For dev/demo convenience only */
  devOtp?: string;
  expiresInSeconds: number;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  message: string;
}

export interface RegisterKioskPatientRequest {
  fullName: string;
  phone: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  abhaId?: string;
  rfidUid?: string;
  deviceCode?: string;
}

export interface RegisterKioskPatientResponse {
  patient: Patient;
  sessionId: string;
  rfidUid: string;
  status: 'IDENTIFIED';
}

export interface SessionCreateRequest {
  mode?: Mode;
  language?: Language;
  deviceCode?: string;
}

export interface SessionCreateResponse {
  sessionId: string;
  status: PatientSession['status'];
}

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

export interface ConsentRequest {
  sessionId: string;
  granted: boolean;
  language: Language;
}

export interface ConsentResponse {
  consentId: string;
  status: ConsentStatus;
}

// ---------------------------------------------------------------------------
// Clinical history
// ---------------------------------------------------------------------------

export interface HistoryStartRequest {
  sessionId: string;
  mode: Mode;
  chiefComplaintCategory: string;
}

export interface QuestionOption {
  value: string;
  label: LocalizedText;
}

export interface HistoryQuestion {
  nodeId: string;
  section: string;
  type: QuestionType;
  questionText: LocalizedText;
  options: QuestionOption[] | null;
}

export interface RedFlagNotice {
  severity: AlertSeverity;
  message: LocalizedText;
}

export interface HistoryStartResponse {
  clinicalHistoryId: string;
  question: HistoryQuestion | null;
}

export interface HistoryAnswerRequest {
  sessionId: string;
  nodeId: string;
  answerValue: unknown;
}

export interface HistoryAnswerResponse {
  nextQuestion: HistoryQuestion | null;
  sectionComplete: boolean;
  historyComplete: boolean;
  redFlag: RedFlagNotice | null;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface DocumentUploadResponse {
  documentId: string;
  status: 'UPLOADED';
}

export interface DocumentProcessRequest {
  documentId: string;
}

export interface DocumentProcessResponse {
  documentId: string;
  ocrOrigin: 'REAL' | 'DEMO';
  ocrConfidence: number;
  extractedFields: ExtractedMedicalData[];
  timelineEventsCreated: number;
}

// ---------------------------------------------------------------------------
// Patient read views (doctor-facing)
// ---------------------------------------------------------------------------

export interface PatientTimelineResponse {
  events: MedicalTimelineEvent[];
}

export interface PatientHistoryResponse {
  history: ClinicalHistory | null;
}

export interface PatientSummaryResponse {
  summary: AISummary | null;
}

// ---------------------------------------------------------------------------
// Doctor dashboard
// ---------------------------------------------------------------------------

export interface DoctorDashboardSessionRow {
  sessionId: string;
  patient: Pick<Patient, 'id' | 'fullName' | 'dateOfBirth' | 'gender'>;
  status: PatientSession['status'];
  chiefComplaint: string | null;
  highestAlertSeverity: AlertSeverity | null;
  updatedAt: string;
}

export interface DoctorDashboardResponse {
  sessions: DoctorDashboardSessionRow[];
}

export interface SessionDetailResponse {
  sessionId: string;
  status: PatientSession['status'];
  mode: PatientSession['mode'];
  language: PatientSession['language'];
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  patient: Pick<Patient, 'id' | 'fullName' | 'dateOfBirth' | 'gender' | 'phone'>;
  consent: Pick<Consent, 'status' | 'language' | 'grantedAt'> | null;
  history: (ClinicalHistory & { answers: ClinicalAnswer[] }) | null;
  summary?: AISummary | null;
  documents?: (MedicalDocument & { extractedData: ExtractedMedicalData[] })[];
  timelineEvents?: MedicalTimelineEvent[];
  consultation?: Consultation | null;
  alerts: Alert[];
}

export interface PrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface ConsultationStartResponse {
  consultationId: string;
  status: 'IN_PROGRESS';
  startedAt: string;
}

export interface ConsultationCompleteRequest {
  notes?: string;
  prescriptions: PrescriptionItem[];
  labOrders: string[];
  followUpDate?: string;
}

export interface ConsultationCompleteResponse {
  consultationId: string;
  status: 'COMPLETED';
  completedAt: string;
  prescriptionSummary?: string;
}

export interface AISummaryReviewRequest {
  action: 'ACCEPT' | 'EDIT' | 'REJECT';
  editedContent?: string;
}

export interface AISummaryReviewResponse {
  summaryId: string;
  status: 'CONFIRMED' | 'DRAFT';
  content: string;
}

export interface CopilotChatRequest {
  patientId: string;
  sessionId?: string;
  query: string;
}

export interface CopilotChatResponse {
  reply: string;
  sources: Array<{ title: string; type: string; snippet?: string }>;
}

export interface SummaryConfirmRequest {
  sessionId: string;
  editedContent: string;
}

export interface SummaryConfirmResponse {
  aiSummaryId: string;
  status: 'CONFIRMED';
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export interface AlertCreateRequest {
  sessionId: string;
  severity: AlertSeverity;
  message: string;
  triggerType: string;
  triggeredByAnswerId?: string;
}

export interface AlertCreateResponse {
  alertId: string;
}

export interface AlertAcknowledgeRequest {
  alertId: string;
}

export interface AlertAcknowledgeResponse {
  alertId: string;
  acknowledged: true;
  acknowledgedAt: string;
}

// ---------------------------------------------------------------------------
// Hardware
// ---------------------------------------------------------------------------

export interface HardwareStatusResponse {
  devices: HardwareDeviceState[];
  demoModeEnabled: boolean;
  /** True only when every device is OFFLINE and demoModeEnabled - never overrides a real CONNECTED/STALE device. */
  showDemoModeBadge: boolean;
}

export interface HardwareHeartbeatRequest {
  deviceCode: string;
  uptimeMs: number;
  firmwareVersion: string;
  status: string;
}

export interface HardwareHeartbeatResponse {
  ack: true;
  serverTime: string;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthLoginResponse {
  token: string;
  role: DoctorRole | string;
  name: string;
}

export type { DocumentType, IdentificationMethod, DeviceStatus };

// ---------------------------------------------------------------------------
// Clinical AI / Dynamic Questioning
// ---------------------------------------------------------------------------

export type QuestionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SurveillanceRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type SurveillanceConfidence =
  | 'INSUFFICIENT_SAMPLE'
  | 'LOW_CONFIDENCE'
  | 'MODERATE_CONFIDENCE'
  | 'ADEQUATE_SAMPLE'
  | 'HIGH_CONFIDENCE'
  | 'VERY_HIGH';

export interface RegionalSignal {
  regionId?: string;
  disease: string;
  riskLevel: SurveillanceRiskLevel;
  positivityRate: number;
  sampleSize?: number;
  trend?: string;
  confidence: SurveillanceConfidence;
  generatedAt?: string;
}

export interface NextQuestionApiRequest {
  sessionId?: string;
  patient: {
    age: number;
    gender: string;
  };
  symptoms: string[];
  answers: Record<string, string | boolean | number>;
  regionalSignals?: RegionalSignal[];
}

export interface NextQuestionApiResponse {
  nextQuestion: {
    id: string;
    text: string;
    priority: QuestionPriority;
  } | null;
  reason: string;
  safetyFlags: string[];
  requiresDoctorReview: true;
}
