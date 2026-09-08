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
  FacilityType,
  DepartmentLoadStatus,
  ShiftType,
  DoctorDutyStatus,
  QueuePriority,
  QueueStatus,
  KioskOperationalMode,
  ComponentHealthStatus,
  PrinterHealthStatus,
  RfidCardType,
  RfidCardStockStatus,
  HisSystemType,
  IntegrationHealthStatus,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
  HospitalStaffRole,
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

// ---------------------------------------------------------------------------
// Hospital Admin Domain Entities
// ---------------------------------------------------------------------------

export interface HospitalFacility {
  id: string;
  facilityCode: string;
  name: string;
  type: FacilityType;
  abdmFacilityId: string | null;
  address: string | null;
  city: string;
  state: string;
  pincode: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Department {
  id: string;
  facilityId: string;
  name: string;
  code: string;
  wingOrBlock: string | null;
  floor: string | null;
  dailyCapacity: number;
  currentLoadStatus: DepartmentLoadStatus;
  mode: Mode;
  isActive: boolean;
  headDoctorId: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ConsultationRoom {
  id: string;
  facilityId: string;
  departmentId: string;
  roomNumber: string;
  roomName: string;
  floor: string | null;
  isActive: boolean;
  currentDoctorId: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface DoctorRoster {
  id: string;
  facilityId: string;
  doctorId: string;
  departmentId: string;
  roomId: string | null;
  shiftDate: ISODateString;
  shiftType: ShiftType;
  status: DoctorDutyStatus;
  patientsWaitingCount: number;
  patientsServedCount: number;
  avgConsultTimeMinutes: number;
  aiVerificationRate: number;
  checkInTime: ISODateString | null;
  checkOutTime: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PatientQueueEntry {
  id: string;
  facilityId: string;
  departmentId: string;
  sessionId: string;
  patientId: string;
  rosterId: string | null;
  doctorId: string | null;
  tokenNumber: string;
  priority: QueuePriority;
  status: QueueStatus;
  queuePosition: number;
  estimatedWaitMinutes: number;
  calledAt: ISODateString | null;
  consultationStartedAt: ISODateString | null;
  completedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface KioskTerminalProfile {
  id: string;
  facilityId: string;
  deviceId: string;
  assignedDepartmentId: string | null;
  terminalCode: string;
  mode: KioskOperationalMode;
  rfidReaderStatus: ComponentHealthStatus;
  ocrCameraStatus: ComponentHealthStatus;
  printerStatus: PrinterHealthStatus;
  printerPaperLevel: number;
  touchscreenStatus: ComponentHealthStatus;
  batteryBackupPercentage: number | null;
  lastSelfTestAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface RfidInventoryBatch {
  id: string;
  facilityId: string;
  batchNumber: string;
  cardType: RfidCardType;
  totalAllocated: number;
  availableStock: number;
  issuedCount: number;
  damagedReturnedCount: number;
  reorderThreshold: number;
  unitCost: number | null;
  receivedDate: ISODateString;
  supplier: string | null;
  notes: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface HospitalIntegrationConfig {
  id: string;
  facilityId: string;
  hisType: HisSystemType;
  fhirGatewayUrl: string;
  hfrFacilityId: string | null;
  isLinkedHfr: boolean;
  syncEnabled: boolean;
  syncIntervalSeconds: number;
  lastSyncAt: ISODateString | null;
  syncHealthStatus: IntegrationHealthStatus;
  uptimePercentage: number;
  abdmMilestone1: boolean;
  abdmMilestone2: boolean;
  abdmMilestone3: boolean;
  authClientId: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface MaintenanceIncident {
  id: string;
  facilityId: string;
  kioskProfileId: string | null;
  deviceId: string | null;
  title: string;
  description: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedStaff: string | null;
  dispatchedAt: ISODateString | null;
  resolvedAt: ISODateString | null;
  resolutionNotes: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface HospitalStaff {
  id: string;
  facilityId: string;
  name: string;
  email: string;
  role: HospitalStaffRole;
  designation: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OpdMetricSnapshot {
  id: string;
  facilityId: string;
  snapshotDate: ISODateString;
  hour: number | null;
  totalPatientIntake: number;
  generalOpdIntake: number;
  ayushIntake: number;
  emergencyIntake: number;
  doctorsOnDuty: number;
  avgTriageMinutes: number;
  redFlagAlerts: number;
  kioskOffloadPercentage: number;
  createdAt: ISODateString;
}

