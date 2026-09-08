import type {
  AlertSeverity,
  ConsentStatus,
  DeviceStatus,
  DoctorRole,
  DocumentType,
  IdentificationMethod,
  Language,
  Mode,
  QuestionType,
  AppointmentType,
  AppointmentStatus,
  PaymentMethod,
  PatientNotificationType,
} from './enums.js';
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
  PatientPortalProfile,
  AppointmentEntity,
  BillingInvoiceEntity,
  PatientNotificationEntity,
  PrescriptionEntity,
  LabReportEntity,
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

// ---------------------------------------------------------------------------
// Hospital Governance & Onboarding
// ---------------------------------------------------------------------------

export interface HospitalCreateRequest {
  code: string;
  name: string;
  type?: string;
  state: string;
  district: string;
  city: string;
  pinCode?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  totalBeds?: number;
  availableBeds?: number;
  totalKiosks?: number;
  activeKiosks?: number;
  abdmFacilityId?: string;
  facilityStatus?: string;
}

export interface HospitalStatusUpdateRequest {
  status: 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'INACTIVE';
  reason?: string;
}

export interface HospitalListResponse {
  total: number;
  page: number;
  limit: number;
  facilities: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    state: string;
    district: string;
    city: string;
    facilityStatus: string;
    contactPhone?: string | null;
    contactEmail?: string | null;
    totalBeds: number;
    availableBeds: number;
    totalKiosks: number;
    activeKiosks: number;
    abdmFacilityId?: string | null;
    createdAt: string | Date;
    _count?: {
      doctors: number;
      departments: number;
      kiosks: number;
      sessions: number;
    };
  }>;
}

// ---------------------------------------------------------------------------
// Departments & Staff
// ---------------------------------------------------------------------------

export interface DepartmentCreateRequest {
  name: string;
  code: string;
  floor?: string;
  roomNumber?: string;
  headOfDepartment?: string;
}

export interface DoctorCreateRequest {
  name: string;
  email: string;
  password?: string;
  departmentId?: string;
  department?: string;
  roomNumber?: string;
  qualification?: string;
  registrationNumber?: string;
  avgConsultMinutes?: number;
}

export interface DoctorStatusUpdateRequest {
  status: 'AVAILABLE' | 'IN_CONSULTATION' | 'ON_BREAK' | 'OFF_DUTY';
}

// ---------------------------------------------------------------------------
// Queue Management
// ---------------------------------------------------------------------------

export interface QueueCallNextRequest {
  doctorId: string;
  departmentId?: string;
  hospitalId: string;
  roomNumber?: string;
}

export interface QueueReprioritizeRequest {
  queueId: string;
  priority: 'CRITICAL' | 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  reason?: string;
}

export interface QueueNoShowRequest {
  queueId: string;
  reason?: string;
}

export interface QueueTicketRequest {
  sessionId: string;
  patientId: string;
  hospitalId?: string;
  departmentCode?: string;
  priority?: 'NORMAL' | 'URGENT' | 'EMERGENCY';
}

export interface QueueTicketResponse {
  ticket: {
    id: string;
    sessionId: string;
    patientId: string;
    hospitalId: string;
    departmentId?: string | null;
    tokenNumber: string;
    priority: string;
    status: string;
    estimatedWaitMins: number;
    queuedAt: string | Date;
  };
  tokenNumber: string;
  estimatedWaitMins: number;
}

export interface QueueItemRow {
  id: string;
  sessionId: string;
  patientId: string;
  hospitalId: string;
  departmentId?: string | null;
  doctorId?: string | null;
  tokenNumber: string;
  priority: string;
  status: string;
  estimatedWaitMins: number;
  queuedAt: string | Date;
  calledAt?: string | Date | null;
  completedAt?: string | Date | null;
  patient?: {
    id: string;
    fullName: string;
    phone?: string | null;
    gender?: string | null;
    age?: number | null;
    abhaId?: string | null;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  doctor?: {
    id: string;
    name: string;
    roomNumber?: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Prescriptions
// ---------------------------------------------------------------------------

export interface PrescriptionCreateRequest {
  consultationId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  instructions?: string;
  items: Array<{
    medicationName: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    route?: string;
  }>;
}

// ---------------------------------------------------------------------------
// RFID Card Lifecycle
// ---------------------------------------------------------------------------

export interface RfidCardCreateRequest {
  uid: string;
  cardType?: string;
  hospitalId?: string;
}

export interface RfidCardAssignRequest {
  patientId: string;
}

export interface RfidCardActionRequest {
  reason?: string;
}

export interface RfidCardReplaceRequest {
  newUid: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// AI Model Registry & Surveillance
// ---------------------------------------------------------------------------

export interface AiModelCreateRequest {
  name: string;
  version: string;
  modelType: string;
  description?: string;
  owner?: string;
  metrics?: Record<string, unknown>;
}

export interface SurveillanceSignalCreateRequest {
  hospitalId: string;
  diseaseName: string;
  category?: string;
  icd10Code?: string;
  caseCount?: number;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  district: string;
  state: string;
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export interface AuditLogRow {
  id: string;
  actorType: string;
  actorId?: string | null;
  facilityId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string | Date;
}

// ---------------------------------------------------------------------------
// Hospital Admin Module
// ---------------------------------------------------------------------------

export interface HospitalDoctorItem {
  id: string;
  name: string;
  dept: string;
  room: string;
  patientsWaiting: number;
  status: 'Available' | 'In Consultation' | 'Off Duty';
  avgConsultTime: string;
  aiVerificationRate: string;
}

export interface HospitalKioskItem {
  code: string;
  location: string;
  firmware: string;
  heartbeat: string;
  status: 'Online' | 'Degraded' | 'Offline';
  rfidReader: 'Healthy' | 'Faulty';
  ocrCamera: 'Healthy' | 'Degraded';
  printerPaper: number;
  mode: 'General OPD' | 'AYUSH Mode' | 'Emergency Priority';
}

export interface HospitalDepartmentItem {
  id: string;
  name: string;
  code: string;
  wing: string;
  floor: string;
  capacity: string;
  doctors: string;
  status: 'Optimal' | 'High Load' | 'Over Capacity';
  mode: string;
}

export interface HospitalIncidentItem {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  assignedStaff: string | null;
  createdAt: string;
}

export interface HospitalOverviewResponse {
  facility: {
    id: string;
    code: string;
    name: string;
    type: string;
    abdmId: string;
  };
  metrics: {
    todayIntake: number;
    doctorsOnDuty: number;
    avgTriageMinutes: number;
    redFlagAlerts: number;
    kioskOffloadPercentage: number;
  };
  doctors: HospitalDoctorItem[];
  kiosks: HospitalKioskItem[];
  alerts: HospitalIncidentItem[];
}

export interface HospitalRfidInventoryResponse {
  totalAllocated: number;
  availableStock: number;
  issuedToPatients: number;
  damagedReturned: number;
  batches?: unknown[];
}

export interface HospitalHisIntegrationResponse {
  connected: boolean;
  adapter: string;
  fhirGateway: string;
  hfrFacilityId: string;
  isLinkedHfr: boolean;
  uptimePercentage: number;
  syncHealth: string;
  abdmMilestones: {
    m1: boolean;
    m2: boolean;
    m3: boolean;
  };
}

export interface KioskModeUpdateRequest {
  mode: string;
}

export interface KioskModeUpdateResponse {
  success: boolean;
  terminalCode: string;
  mode: string;
}

export interface HospitalIncidentDispatchRequest {
  staffName?: string;
}

export interface HospitalIncidentDispatchResponse {
  success: boolean;
  incidentId: string;
  status: string;
  assignedStaff: string;
}

// ---------------------------------------------------------------------------
// Patient Portal API DTOs
// ---------------------------------------------------------------------------

export interface PatientAuthResponse {
  token: string;
  role: 'PATIENT';
  patient: PatientPortalProfile;
}

export interface PatientRegisterDto {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  abhaId?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface PatientLoginDto {
  identifier: string; // email or phone
  password?: string;
  isDemo?: boolean;
}

export interface PatientDashboardDto {
  patient: PatientPortalProfile;
  upcomingAppointment: AppointmentEntity | null;
  counts: {
    appointments: number;
    prescriptions: number;
    labReports: number;
    pendingInvoices: number;
    unreadNotifications: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
    description?: string;
  }>;
  vitalsSummary: {
    bloodPressure?: string;
    heartRate?: string;
    spO2?: string;
    temperature?: string;
    lastRecordedAt?: string;
  };
}

export interface BookAppointmentDto {
  doctorId?: string;
  departmentId?: string;
  facilityId?: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string;
  type?: AppointmentType;
  reason: string;
  notes?: string;
}

export interface RescheduleAppointmentDto {
  appointmentDate: string;
  timeSlot: string;
  reason?: string;
}

export interface CancelAppointmentDto {
  reason: string;
}

export interface ProcessPaymentDto {
  paymentMethod: PaymentMethod;
  transactionReference?: string;
}

export interface UpdatePatientProfileDto {
  phone?: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface AvailableSlotsResponse {
  departments: Array<{ id: string; name: string; code: string }>;
  doctors: Array<{ id: string; name: string; departmentId: string | null; departmentName: string | null }>;
  slots: string[];
  bookedSlots?: string[];
}

export interface PatientMedicalRecordsResponse {
  timeline: MedicalTimelineEvent[];
  documents: Array<{
    id: string;
    type: DocumentType;
    originalFilename: string;
    processedAt: string | null;
    createdAt: string;
  }>;
  clinicalHistories: Array<{
    id: string;
    chiefComplaint: string | null;
    mode: Mode;
    createdAt: string;
    completedAt: string | null;
  }>;
  aiSummaries: AISummary[];
}

export type { DocumentType, IdentificationMethod, DeviceStatus };
