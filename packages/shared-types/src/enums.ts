export const ConsentStatus = {
  PENDING: 'PENDING',
  GRANTED: 'GRANTED',
  DECLINED: 'DECLINED',
} as const;
export type ConsentStatus = (typeof ConsentStatus)[keyof typeof ConsentStatus];

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
} as const;
export type Language = (typeof Language)[keyof typeof Language];

/**
 * Real, heartbeat-derived hardware connectivity state. CONNECTED/STALE/OFFLINE are
 * computed purely from RFIDDevice.lastHeartbeatAt - never set directly, and never
 * overridden by DEMO_MODE. See packages/shared-types/src/api.ts HardwareStatusResponse
 * for how "Demo Mode" is layered on top of this without faking it.
 */
export const DeviceStatus = {
  CONNECTED: 'CONNECTED',
  STALE: 'STALE',
  OFFLINE: 'OFFLINE',
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
export type ActorType = (typeof ActorType)[keyof typeof ActorType];

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
} as const;
export type AISummaryStatus = (typeof AISummaryStatus)[keyof typeof AISummaryStatus];

export const ConsultationStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type ConsultationStatus = (typeof ConsultationStatus)[keyof typeof ConsultationStatus];

/** How a given AI sub-service actually produced its result - always shown to users, never hidden. */
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
  ADMIN: 'ADMIN',
} as const;
export type DoctorRole = (typeof DoctorRole)[keyof typeof DoctorRole];
