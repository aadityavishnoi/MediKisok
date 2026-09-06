# MediKiosk — Feature Registry & System Capability Catalog

## 1. Overview

The Feature Registry manages all modular capabilities, permissions, roles, and feature flags in MediKiosk. This capability architecture ensures that features can be toggled per facility, state, or deployment tier.

---

## 2. System Capabilities & Feature Flags

| Feature ID | Feature Name | Domain | Applicable Roles | Default Status | Feature Flag Key |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FEAT_RFID_ENROLL` | RFID Card Enrollment | Identity | RFID Officer, Admin | ACTIVE | `ENABLE_RFID` |
| `FEAT_VOICE_INTAKE` | Multilingual Voice Intake | Kiosk | Patient | ACTIVE | `ENABLE_VOICE` |
| `FEAT_AYUSH_MODE` | AYUSH History Assessment | Clinical | Patient, Doctor | ACTIVE | `ENABLE_AYUSH_MODE` |
| `FEAT_RED_FLAG` | Emergency Red-Flag Triage | Safety | System, Doctor | MANDATORY | `ENABLE_RED_FLAG` |
| `FEAT_DOC_OCR` | Document Intelligence OCR | Ingestion | Patient, Doctor | ACTIVE | `ENABLE_OCR` |
| `FEAT_AI_COPILOT` | AI Clinical Copilot & Summary | Clinical | Doctor | ACTIVE | `ENABLE_AI_SUMMARY` |
| `FEAT_RAG_CITATIONS` | Evidence Source Citations | Intelligence | Doctor | ACTIVE | `ENABLE_RAG` |
| `FEAT_ABDM_SYNC` | ABDM / FHIR Interoperability | Integration | System, Admin | DEMO | `ENABLE_ABDM` |
| `FEAT_FLEET_MONITOR` | Hardware Device Monitoring | Infrastructure | Hospital Admin | ACTIVE | `ENABLE_FLEET_MONITOR` |
| `FEAT_MODEL_REGISTRY` | AI Model Performance Registry | Governance | Central Admin | ACTIVE | `ENABLE_MODEL_REGISTRY` |

---

## 3. Role-Based Permission Matrix

- **PATIENT**: RFID identification, Consent grant/revoke, Audio/Touch history entry, Document scan, Summary preview.
- **DOCTOR**: Live Queue review, Patient 360 inspection, AI Copilot query, Summary edit/accept/reject, Consultation complete.
- **RFID_OFFICER**: Card batch import, Card assignment, Status modification (Lost/Stolen/Replaced), Scan audit log.
- **HOSPITAL_ADMIN**: Facility details, Doctor rosters, Kiosk & Reader device health, OPD throughput metrics.
- **CENTRAL_ADMIN**: Multi-tenant national overview, State/District metrics, Model registry, System log inspection.
