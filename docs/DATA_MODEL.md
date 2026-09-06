# MediKiosk — Relational Database Schema & Data Architecture

## 1. Domain Entities & Relationships

The relational database architecture is built using PostgreSQL and Prisma ORM, supporting multi-tenancy, physical RFID card mapping, consent management, adaptive clinical history taking, document OCR extraction, AI runs with evidence citations, and immutable audit logs.

---

## 2. Model Structure

### 2.1 Multi-Tenancy Hierarchy
- `Organization`: Top-level healthcare network (e.g. National Health Authority / Hospital System).
- `State` -> `District` -> `Facility` -> `Department`: Hierarchical tenant scoping for users, kiosks, queues, and analytics.

### 2.2 Patient Identity & RFID Physical Tokens
- `Patient`: Demographics, ABHA ID, primary language, contact info.
- `RFIDCard`: Stores non-sensitive UID string, status (`ACTIVE`, `SUSPENDED`, `LOST`, `STOLEN`, `DEACTIVATED`, `EXPIRED`), issuance metadata, facility link, and patient mapping.
- `RFIDDevice`: Hardware reader registration (`deviceCode`, `location`, `ipAddress`, status: `ONLINE`/`OFFLINE`/`DEGRADED`, `lastHeartbeatAt`).

### 2.3 Intake Session & Consent
- `PatientSession`: Current encounter state machine (`CREATED`, `IDENTIFIED`, `CONSENTED`, `IN_HISTORY`, `DOCUMENTS`, `SUMMARY_READY`, `ROUTED`, `IN_CONSULT`, `COMPLETED`, `ABANDONED`).
- `Consent`: Explicit consent version, language, IP address, granted timestamp, and granular scopes (`HISTORY`, `DOCUMENTS`, `AI_SUMMARY`, `ABDM`, `RESEARCH`).

### 2.4 Clinical History & AYUSH
- `ClinicalHistory`: Associated with session and patient. Stores HPI, past history, medications, allergies, family history, and structured `ayushFields` (Prakriti, Vikriti, Agni, Dhatu).
- `ClinicalAnswer`: Answers to individual tree nodes with localization, timestamp, and `isRedFlagTrigger` flag.

### 2.5 Documents & OCR Extraction
- `MedicalDocument`: Ingested file metadata, mime type, raw `ocrText`, and confidence score.
- `ExtractedMedicalData`: Normalized key-value pairs (fieldType, fieldValue, confidence, verificationStatus: `VERIFIED`/`NEEDS_VERIFICATION`).
- `MedicalTimelineEvent`: Chronological timeline events extracted from history or past documents.

### 2.6 AI Copilot & Evidence Citations
- `AISummary`: Summary content, generator type, status (`DRAFT`, `CONFIRMED`, `EDITED`), confirmed doctor ID.
- `AISummaryEvidence`: Mapping table connecting individual summary sentences/statements to `sourceAnswerId` or `sourceDocumentId` with confidence metrics.

### 2.7 Observability & Model Registry
- `AIModelRegistry`: Active AI models, versions, tasks, CER/F1 evaluation metrics, latency, deployment status.
- `AuditLog`: Immutable logs tracking actor, role, action, entity ID, metadata, timestamp, IP.
- `SystemConfig` & `FeatureFlag`: Dynamic key-value configuration and feature flags.
