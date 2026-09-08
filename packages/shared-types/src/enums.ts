export const ConsentStatus = {
  PENDING: 'PENDING',
  GRANTED: 'GRANTED',
  DECLINED: 'DECLINED',
} as const;
export type ConsentStatus = (typeof ConsentStatus)[keyof typeof ConsentStatus];

export const ConsentScope = {
  HISTORY: 'HISTORY',
  DOCUMENTS: 'DOCUMENTS',
  AI_SUMMARY: 'AI_SUMMARY',
  ABDM: 'ABDM',
  RESEARCH: 'RESEARCH',
} as const;
export type ConsentScope = (typeof ConsentScope)[keyof typeof ConsentScope];

export const DocumentType = {
  PRESCRIPTION: 'PRESCRIPTION',
  LAB_REPORT: 'LAB_REPORT',
  DISCHARGE_SUMMARY: 'DISCHARGE_SUMMARY',
  OTHER: 'OTHER',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const AlertSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

export const SessionStatus = {
  CREATED: 'CREATED',
  IDENTIFIED: 'IDENTIFIED',
  CONSENTED: 'CONSENTED',
  IN_HISTORY: 'IN_HISTORY',
  DOCUMENTS: 'DOCUMENTS',
  SUMMARY_READY: 'SUMMARY_READY',
  ROUTED: 'ROUTED',
  IN_CONSULT: 'IN_CONSULT',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const Mode = {
  GENERAL: 'GENERAL',
  AYUSH: 'AYUSH',
} as const;
export type Mode = (typeof Mode)[keyof typeof Mode];

export const Language = {
  EN: 'EN',
  HI: 'HI',
  BN: 'BN',
  MR: 'MR',
  TE: 'TE',
  TA: 'TA',
  GU: 'GU',
  KN: 'KN',
  ML: 'ML',
  PA: 'PA',
  OR: 'OR',
  AS: 'AS',
  UR: 'UR',
} as const;
export type Language = (typeof Language)[keyof typeof Language];


export const RFIDCardStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  LOST: 'LOST',
  STOLEN: 'STOLEN',
  DEACTIVATED: 'DEACTIVATED',
  EXPIRED: 'EXPIRED',
} as const;
export type RFIDCardStatus = (typeof RFIDCardStatus)[keyof typeof RFIDCardStatus];

export const DeviceStatus = {
  CONNECTED: 'CONNECTED',
  STALE: 'STALE',
  OFFLINE: 'OFFLINE',
  DEGRADED: 'DEGRADED',
} as const;
export type DeviceStatus = (typeof DeviceStatus)[keyof typeof DeviceStatus];

export const ExtractionFieldStatus = {
  VERIFIED: 'VERIFIED',
  NEEDS_VERIFICATION: 'NEEDS_VERIFICATION',
} as const;
export type ExtractionFieldStatus = (typeof ExtractionFieldStatus)[keyof typeof ExtractionFieldStatus];

export const TimelineEventType = {
  DIAGNOSIS: 'DIAGNOSIS',
  MEDICATION: 'MEDICATION',
  INVESTIGATION: 'INVESTIGATION',
  PROCEDURE: 'PROCEDURE',
  VISIT: 'VISIT',
} as const;
export type TimelineEventType = (typeof TimelineEventType)[keyof typeof TimelineEventType];

export const ActorType = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  SYSTEM: 'SYSTEM',
  DEVICE: 'DEVICE',
} as const;
export type ActorType = (typeof ActorType)[keyof typeof ActorType] | string;


export const IdentificationMethod = {
  RFID: 'RFID',
  QR: 'QR',
  MANUAL: 'MANUAL',
  DEMO: 'DEMO',
} as const;
export type IdentificationMethod = (typeof IdentificationMethod)[keyof typeof IdentificationMethod];

export const QuestionType = {
  SINGLE_SELECT: 'SINGLE_SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  TEXT: 'TEXT',
  SCALE: 'SCALE',
  BOOLEAN: 'BOOLEAN',
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const AISummaryStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  EDITED: 'EDITED',
  REJECTED: 'REJECTED',
} as const;
export type AISummaryStatus = (typeof AISummaryStatus)[keyof typeof AISummaryStatus];

export const ConsultationStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type ConsultationStatus = (typeof ConsultationStatus)[keyof typeof ConsultationStatus];

export const AIResultOrigin = {
  REAL: 'REAL',
  LOCAL: 'LOCAL',
  MOCK: 'MOCK',
  DEMO: 'DEMO',
} as const;
export type AIResultOrigin = (typeof AIResultOrigin)[keyof typeof AIResultOrigin];

export const AIProviderMode = {
  LOCAL: 'LOCAL',
  MOCK: 'MOCK',
  REAL: 'REAL',
} as const;
export type AIProviderMode = (typeof AIProviderMode)[keyof typeof AIProviderMode];

export const DoctorRole = {
  DOCTOR: 'DOCTOR',
  RFID_OFFICER: 'RFID_OFFICER',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  CENTRAL_ADMIN: 'CENTRAL_ADMIN',
  ADMIN: 'ADMIN',
} as const;
export type DoctorRole = (typeof DoctorRole)[keyof typeof DoctorRole];

// ---------------------------------------------------------------------------
// Hospital Admin Domain Enums
// ---------------------------------------------------------------------------

export const FacilityType = {
  GOVERNMENT_HOSPITAL: 'GOVERNMENT_HOSPITAL',
  AIIMS: 'AIIMS',
  PRIMARY_HEALTH_CENTRE: 'PRIMARY_HEALTH_CENTRE',
  COMMUNITY_HEALTH_CENTRE: 'COMMUNITY_HEALTH_CENTRE',
  DISTRICT_HOSPITAL: 'DISTRICT_HOSPITAL',
  PRIVATE_HOSPITAL: 'PRIVATE_HOSPITAL',
} as const;
export type FacilityType = (typeof FacilityType)[keyof typeof FacilityType];

export const DepartmentLoadStatus = {
  OPTIMAL: 'OPTIMAL',
  HIGH_LOAD: 'HIGH_LOAD',
  OVER_CAPACITY: 'OVER_CAPACITY',
} as const;
export type DepartmentLoadStatus = (typeof DepartmentLoadStatus)[keyof typeof DepartmentLoadStatus];

export const ShiftType = {
  MORNING: 'MORNING',
  EVENING: 'EVENING',
  NIGHT: 'NIGHT',
  FULL_DAY: 'FULL_DAY',
} as const;
export type ShiftType = (typeof ShiftType)[keyof typeof ShiftType];

export const DoctorDutyStatus = {
  AVAILABLE: 'AVAILABLE',
  IN_CONSULTATION: 'IN_CONSULTATION',
  ON_BREAK: 'ON_BREAK',
  OFF_DUTY: 'OFF_DUTY',
} as const;
export type DoctorDutyStatus = (typeof DoctorDutyStatus)[keyof typeof DoctorDutyStatus];

export const QueuePriority = {
  NORMAL: 'NORMAL',
  SENIOR_CITIZEN: 'SENIOR_CITIZEN',
  EMERGENCY_RED_FLAG: 'EMERGENCY_RED_FLAG',
} as const;
export type QueuePriority = (typeof QueuePriority)[keyof typeof QueuePriority];

export const QueueStatus = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_CONSULTATION: 'IN_CONSULTATION',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  TRANSFERRED: 'TRANSFERRED',
} as const;
export type QueueStatus = (typeof QueueStatus)[keyof typeof QueueStatus];

export const KioskOperationalMode = {
  GENERAL_OPD: 'GENERAL_OPD',
  AYUSH_MODE: 'AYUSH_MODE',
  EMERGENCY_PRIORITY: 'EMERGENCY_PRIORITY',
} as const;
export type KioskOperationalMode = (typeof KioskOperationalMode)[keyof typeof KioskOperationalMode];

export const ComponentHealthStatus = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  FAULTY: 'FAULTY',
  OFFLINE: 'OFFLINE',
} as const;
export type ComponentHealthStatus = (typeof ComponentHealthStatus)[keyof typeof ComponentHealthStatus];

export const PrinterHealthStatus = {
  HEALTHY: 'HEALTHY',
  PAPER_LOW: 'PAPER_LOW',
  PAPER_OUT: 'PAPER_OUT',
  JAMMED: 'JAMMED',
  OFFLINE: 'OFFLINE',
} as const;
export type PrinterHealthStatus = (typeof PrinterHealthStatus)[keyof typeof PrinterHealthStatus];

export const RfidCardType = {
  MIFARE_CLASSIC_1K: 'MIFARE_CLASSIC_1K',
  NTAG215: 'NTAG215',
  DESFIRE_EV1: 'DESFIRE_EV1',
  OTHER: 'OTHER',
} as const;
export type RfidCardType = (typeof RfidCardType)[keyof typeof RfidCardType];

export const RfidCardStockStatus = {
  IN_STOCK: 'IN_STOCK',
  ACTIVE_ISSUED: 'ACTIVE_ISSUED',
  DAMAGED: 'DAMAGED',
  BLOCKED: 'BLOCKED',
  RETURNED: 'RETURNED',
} as const;
export type RfidCardStockStatus = (typeof RfidCardStockStatus)[keyof typeof RfidCardStockStatus];

export const HisSystemType = {
  NIC_E_HOSPITAL: 'NIC_E_HOSPITAL',
  CUSTOM_FHIR_R4: 'CUSTOM_FHIR_R4',
  OPEN_MRS: 'OPEN_MRS',
  BAHMNI: 'BAHMNI',
  MEDIKIOSK_STANDALONE: 'MEDIKIOSK_STANDALONE',
} as const;
export type HisSystemType = (typeof HisSystemType)[keyof typeof HisSystemType];

export const IntegrationHealthStatus = {
  HEALTHY: 'HEALTHY',
  SYNCING: 'SYNCING',
  DEGRADED: 'DEGRADED',
  DISCONNECTED: 'DISCONNECTED',
} as const;
export type IntegrationHealthStatus = (typeof IntegrationHealthStatus)[keyof typeof IntegrationHealthStatus];

export const IncidentType = {
  PRINTER_PAPER_LOW: 'PRINTER_PAPER_LOW',
  RFID_MODULE_FAULT: 'RFID_MODULE_FAULT',
  OCR_CAMERA_DEGRADED: 'OCR_CAMERA_DEGRADED',
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  RED_FLAG_OVERFLOW: 'RED_FLAG_OVERFLOW',
  GENERAL_MAINTENANCE: 'GENERAL_MAINTENANCE',
} as const;
export type IncidentType = (typeof IncidentType)[keyof typeof IncidentType];

export const IncidentSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type IncidentSeverity = (typeof IncidentSeverity)[keyof typeof IncidentSeverity];

export const IncidentStatus = {
  OPEN: 'OPEN',
  DISPATCHED: 'DISPATCHED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;
export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus];

export const HospitalStaffRole = {
  MEDICAL_SUPERINTENDENT: 'MEDICAL_SUPERINTENDENT',
  OPERATIONS_ADMIN: 'OPERATIONS_ADMIN',
  OPD_SUPERVISOR: 'OPD_SUPERVISOR',
  KIOSK_TECHNICIAN: 'KIOSK_TECHNICIAN',
  REGISTRATION_CLERK: 'REGISTRATION_CLERK',
} as const;
export type HospitalStaffRole = (typeof HospitalStaffRole)[keyof typeof HospitalStaffRole];

// Patient Portal Enums
export const AppointmentType = {
  IN_PERSON: 'IN_PERSON',
  VIDEO_CONSULT: 'VIDEO_CONSULT',
  FOLLOW_UP: 'FOLLOW_UP',
  EMERGENCY: 'EMERGENCY',
} as const;
export type AppointmentType = (typeof AppointmentType)[keyof typeof AppointmentType];

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  RESCHEDULED: 'RESCHEDULED',
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const BillingStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;
export type BillingStatus = (typeof BillingStatus)[keyof typeof BillingStatus];

export const PaymentMethod = {
  UPI: 'UPI',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  NET_BANKING: 'NET_BANKING',
  CASH: 'CASH',
  ABDM_INSURANCE: 'ABDM_INSURANCE',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PatientNotificationType = {
  APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
  PRESCRIPTION_ISSUED: 'PRESCRIPTION_ISSUED',
  LAB_REPORT_READY: 'LAB_REPORT_READY',
  BILL_GENERATED: 'BILL_GENERATED',
  BILL_PAID: 'BILL_PAID',
  HEALTH_ALERT: 'HEALTH_ALERT',
} as const;
export type PatientNotificationType = (typeof PatientNotificationType)[keyof typeof PatientNotificationType];


