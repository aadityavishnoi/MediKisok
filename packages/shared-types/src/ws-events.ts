import type { AlertSeverity, DeviceStatus, SessionStatus } from './enums.js';

export interface RfidScannedEvent {
  type: 'RFID_SCANNED';
  payload: {
    sessionId: string;
    uid: string;
    patientId: string | null;
    isNewPatient: boolean;
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

export type WsEvent =
  | RfidScannedEvent
  | AlertRaisedEvent
  | AlertAcknowledgedEvent
  | SessionUpdatedEvent
  | SummaryReadyEvent
  | HardwareStatusChangedEvent;

export type WsEventType = WsEvent['type'];
