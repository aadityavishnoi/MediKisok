import type { AlertSeverity, DeviceStatus, SessionStatus } from './enums.js';

export interface RfidScannedEvent {
  type: 'RFID_SCANNED';
  payload: {
    sessionId: string;
    uid: string;
    patientId: string | null;
    isNewPatient: boolean;
    isRegistered?: boolean;
    message?: string;
    patient?: {
      id: string;
      fullName: string;
      dateOfBirth?: Date | string | null;
      gender?: string | null;
      phone?: string | null;
      bloodGroup?: string | null;
      abhaId?: string | null;
    };
    timestamp: string;
  };
}

export interface AlertRaisedEvent {
  type: 'ALERT_RAISED';
  payload: {
    alertId: string;
    sessionId: string;
    patientId: string;
    severity: AlertSeverity;
    message: string;
    timestamp: string;
  };
}

export interface AlertAcknowledgedEvent {
  type: 'ALERT_ACKNOWLEDGED';
  payload: {
    alertId: string;
    sessionId: string;
    timestamp: string;
  };
}

export interface SessionUpdatedEvent {
  type: 'SESSION_UPDATED';
  payload: {
    sessionId: string;
    status: SessionStatus;
    timestamp: string;
  };
}

export interface SummaryReadyEvent {
  type: 'SUMMARY_READY';
  payload: {
    sessionId: string;
    patientId: string;
    timestamp: string;
  };
}

export interface HardwareStatusChangedEvent {
  type: 'HARDWARE_STATUS_CHANGED';
  payload: {
    deviceCode: string;
    status: DeviceStatus;
    timestamp: string;
  };
}

export interface HospitalStatusChangedEvent {
  type: 'HOSPITAL_STATUS_CHANGED';
  payload: {
    hospitalId: string;
    code?: string;
    name?: string;
    status: string;
    reason?: string;
    timestamp: string;
  };
}

export interface DoctorStatusChangedEvent {
  type: 'DOCTOR_STATUS_CHANGED';
  payload: {
    doctorId: string;
    doctorName?: string;
    hospitalId?: string;
    status: string;
    timestamp: string;
  };
}

export interface KioskStatusChangedEvent {
  type: 'KIOSK_STATUS_CHANGED';
  payload: {
    deviceId?: string;
    deviceCode: string;
    hospitalId?: string;
    status: string;
    location?: string;
    timestamp: string;
  };
}

export interface RfidTappedEvent {
  type: 'RFID_TAPPED';
  payload: {
    uid: string;
    patientId?: string | null;
    patientName?: string | null;
    facilityId?: string | null;
    timestamp: string;
  };
}

export interface RfidAssignedEvent {
  type: 'RFID_ASSIGNED';
  payload: {
    uid: string;
    patientId: string;
    patientName?: string;
    status: string;
    timestamp: string;
  };
}

export interface RfidStatusChangedEvent {
  type: 'RFID_STATUS_CHANGED';
  payload: {
    uid: string;
    status: string;
    reason?: string;
    timestamp: string;
  };
}

export interface PatientRegisteredEvent {
  type: 'PATIENT_REGISTERED';
  payload: {
    patientId: string;
    fullName: string;
    phone?: string | null;
    rfidUid?: string | null;
    timestamp: string;
  };
}

export interface PatientQueueAddedEvent {
  type: 'PATIENT_QUEUE_ADDED';
  payload: {
    queueId: string;
    tokenNumber: string;
    hospitalId: string;
    patientId: string;
    patientName?: string;
    departmentId?: string | null;
    priority: string;
    status: string;
    estimatedWaitMins: number;
    timestamp: string;
  };
}

export interface KioskModeChangedEvent {
  type: 'KIOSK_MODE_CHANGED';
  payload: {
    terminalCode: string;
    mode: string;
    timestamp: string;
  };
}

export interface HospitalIncidentUpdatedEvent {
  type: 'HOSPITAL_INCIDENT_UPDATED';
  payload: {
    incidentId: string;
    status: string;
    assignedStaff: string | null;
    timestamp: string;
  };
}

export interface QueueUpdatedEvent {
  type: 'QUEUE_UPDATED';
  payload: {
    queueId: string;
    hospitalId: string;
    status: string;
    doctorId?: string | null;
    tokenNumber?: string;
    timestamp: string;
  };
}

export interface QueueCalledEvent {
  type: 'QUEUE_CALLED';
  payload: {
    queueId: string;
    tokenNumber: string;
    doctorId: string;
    doctorName?: string;
    roomNumber?: string;
    hospitalId: string;
    timestamp: string;
  };
}

export interface RedFlagCreatedEvent {
  type: 'RED_FLAG_CREATED';
  payload: {
    alertId: string;
    sessionId: string;
    patientId: string;
    patientName?: string;
    severity: string;
    message: string;
    hospitalId?: string;
    timestamp: string;
  };
}

export interface RedFlagUpdatedEvent {
  type: 'RED_FLAG_UPDATED';
  payload: {
    alertId: string;
    acknowledged: boolean;
    acknowledgedByDoctorId?: string;
    timestamp: string;
  };
}

export interface ConsultationCompletedEvent {
  type: 'CONSULTATION_COMPLETED';
  payload: {
    consultationId: string;
    sessionId: string;
    patientId: string;
    doctorId: string;
    prescriptionId?: string;
    timestamp: string;
  };
}

export interface PrescriptionFinalizedEvent {
  type: 'PRESCRIPTION_FINALIZED';
  payload: {
    prescriptionId: string;
    consultationId: string;
    patientId: string;
    doctorId: string;
    diagnosis: string;
    itemsCount: number;
    timestamp: string;
  };
}

export interface SurveillanceAlertCreatedEvent {
  type: 'SURVEILLANCE_ALERT_CREATED';
  payload: {
    signalId: string;
    diseaseName: string;
    district: string;
    state: string;
    severity: string;
    caseCount: number;
    timestamp: string;
  };
}

export interface SurveillanceAlertUpdatedEvent {
  type: 'SURVEILLANCE_ALERT_UPDATED';
  payload: {
    signalId: string;
    status: string;
    timestamp: string;
  };
}

export type WsEvent =
  | RfidScannedEvent
  | AlertRaisedEvent
  | AlertAcknowledgedEvent
  | SessionUpdatedEvent
  | SummaryReadyEvent
  | HardwareStatusChangedEvent
  | HospitalStatusChangedEvent
  | DoctorStatusChangedEvent
  | KioskStatusChangedEvent
  | RfidTappedEvent
  | RfidAssignedEvent
  | RfidStatusChangedEvent
  | PatientRegisteredEvent
  | PatientQueueAddedEvent
  | QueueUpdatedEvent
  | QueueCalledEvent
  | RedFlagCreatedEvent
  | RedFlagUpdatedEvent
  | ConsultationCompletedEvent
  | PrescriptionFinalizedEvent
  | SurveillanceAlertCreatedEvent
  | SurveillanceAlertUpdatedEvent
  | KioskModeChangedEvent
  | HospitalIncidentUpdatedEvent;

export type WsEventType = WsEvent['type'];

