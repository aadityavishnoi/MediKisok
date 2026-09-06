# MediKiosk — Realtime WebSocket Event Contracts

## 1. WebSocket Infrastructure

Realtime bidirectional communication is established using Socket.IO on the backend server (`apps/backend`). Clients (Kiosks, Doctor Dashboard, RFID Readers, Admin Consoles) connect and subscribe to specific channels/rooms:
- `facility:{facilityId}`
- `session:{sessionId}`
- `device:{deviceId}`
- `doctor:{doctorId}`

---

## 2. Event Specifications

### 2.1 RFID & Device Events
- `rfid.card.detected`: Broadcast when an RFID card is tapped on an ESP32 reader.
  - Payload: `{ deviceId: string, uid: string, timestamp: string }`
- `rfid.card.enrolled`: Broadcast when a card is mapped to a patient.
- `device.heartbeat`: Emitted by ESP32 devices every 30 seconds.
  - Payload: `{ deviceId: string, status: 'ONLINE' | 'DEGRADED', firmwareVersion: string }`
- `device.status_changed`: Broadcast when a device goes offline or comes back online.

### 2.2 Patient Session & Triage Events
- `patient.session.created`: Emitted when a new kiosk encounter begins.
- `patient.identified`: Emitted when patient is matched via RFID or ABHA.
- `consent.granted`: Broadcast when patient accepts intake terms.
- `history.updated`: Emitted on each answered question.
- `redflag.detected`: **HIGH PRIORITY**. Broadcast instantly when deterministic emergency criteria met.
  - Payload: `{ sessionId: string, patientName: string, severity: 'CRITICAL', trigger: string, timestamp: string }`

### 2.3 Document & AI Events
- `document.processing`: Emitted when OCR extraction starts on an uploaded report.
- `document.completed`: Emitted when OCR text and key-value entities are ready.
- `summary.generated`: Broadcast when AI draft summary is created with evidence citations.

### 2.4 Doctor Queue Events
- `queue.updated`: Broadcast when patient order or consultation status changes.
- `consultation.started`: Doctor calls patient into consultation room.
- `consultation.completed`: Consultation finished and session archived.
