# MediKiosk — REST API Specification & Endpoint Contracts

## 1. Overview

The MediKiosk Backend API (`apps/backend`) exposes standard JSON REST endpoints over HTTPS. Authentication is managed via HTTP-only JWT cookies or bearer tokens for administrative/doctor roles, and session tokens for kiosk interactions.

---

## 2. API Endpoints

### 2.1 Authentication & User Management
- `POST /api/auth/login`: Doctor/Admin authentication. Returns JWT and user profile.
- `POST /api/auth/logout`: Revokes active session token.
- `GET /api/auth/me`: Validates session and returns current user details.

### 2.2 RFID & Hardware Device Management
- `POST /api/rfid/scan`: Ingests hardware scan event from ESP32 reader or simulator.
- `POST /api/rfid/register-batch`: Registers batch of newly manufactured RFID card UIDs.
- `GET /api/rfid/cards`: Queries RFID cards with filters (status, facility, search).
- `PUT /api/rfid/cards/:id/status`: Updates card status (`ACTIVE`, `LOST`, `STOLEN`, `DEACTIVATED`).
- `POST /api/rfid/cards/enroll`: Maps an active RFID card UID to a Patient ID.
- `POST /api/rfid/devices/heartbeat`: Receives ESP32 device heartbeat to update online status.
- `GET /api/rfid/devices`: Lists registered RFID hardware readers and kiosks.

### 2.3 Patient Session & Consent
- `POST /api/session/start`: Initializes new kiosk session (RFID, ABHA, or manual).
- `GET /api/session/:id`: Retrieves current session state.
- `POST /api/consent/record`: Records patient consent with language and explicit scopes.

### 2.4 Clinical History Engine
- `GET /api/history/start`: Returns initial question node for chief complaint & mode.
- `POST /api/history/advance`: Submits answer, evaluates red flags, and returns next question node.
- `GET /api/history/:sessionId`: Fetches full structured clinical history for a session.

### 2.5 Document Intelligence & OCR
- `POST /api/documents/upload`: Uploads prescription/lab report image or PDF.
- `POST /api/documents/:id/ocr`: Triggers layout parsing and entity extraction.
- `PUT /api/documents/extracted/:id`: Updates/verifies extracted key-value fields.

### 2.6 AI Copilot & Summary
- `POST /api/ai/summarize`: Generates structured clinical summary with evidence citations.
- `POST /api/ai/copilot-chat`: Interactively queries patient context with source references.
- `PUT /api/ai/summary/:id/review`: Doctor accepts, edits, or rejects draft AI summary.

### 2.7 Doctor Dashboard & Queue
- `GET /api/doctor/queue`: Returns live patient consultation queue with risk badges.
- `GET /api/doctor/patient-360/:patientId`: Comprehensive Patient 360 view.
- `POST /api/doctor/consultation/:id/complete`: Finalizes consultation.

### 2.8 Administration & Governance
- `GET /api/admin/metrics`: Aggregated OPD volume, intake duration, and queue metrics.
- `GET /api/admin/model-registry`: Performance metrics of active AI models.
- `GET /api/admin/audit-logs`: Immutable system audit logs.
