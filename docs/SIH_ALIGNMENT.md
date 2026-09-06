# MediKiosk — SIH 2026 Problem Statement 26047 Alignment Matrix

## 1. Problem Statement Summary

**SIH26047 — Patient Case-Taking Software** (MedTech / BioTech / HealthTech domain).
*Problem*: Indian hospital OPDs suffer from high patient volume and severe consultation time constraints. Fragmented paper records and repetitive history-taking reduce care quality.
*Solution Requirement*: Move clinical history acquisition, document OCR digitization, structuring, and physician-ready summarization BEFORE consultation.

---

## 2. Capability Mapping Matrix

| SIH Requirement | MediKiosk Solution Architecture | Implementation Location | Demo Verification |
| :--- | :--- | :--- | :--- |
| **1. Pre-Consultation History Acquisition** | Self-service touch & voice kiosk capturing chief complaint, HPI, past history, and review of systems. | `apps/patient-kiosk` | Kiosk intake workflow step 1-12 |
| **2. Multilingual & Low Literacy Support** | 13 Indian languages supported with voice audio prompts and simple touch options. | `packages/ui/i18n`, `apps/patient-kiosk` | Language selection & voice playback |
| **3. Medical Document Ingestion & OCR** | Multi-page document scanner uploading prescriptions & lab reports, OCR parsing, key-value extraction. | `packages/ai-service`, `apps/backend` | Document upload & verification screen |
| **4. Physician-Ready Evidence Summary** | Structured clinical summary generated for doctor with clickable evidence source chips (`[Answer #ID]`, `[Doc #ID]`). | `apps/doctor-dashboard`, `packages/ai-service` | Doctor Patient 360 & Copilot view |
| **5. AYUSH Clinical Support** | Configurable AYUSH clinical history module (Prakriti, Vikriti, Agni, Dhatu) alongside allopathic flows. | `packages/clinical-engine` | Kiosk AYUSH mode selection |
| **6. Instant RFID Patient Retrieval** | RFID card tapping maps to patient encounter instantly without typing. | `apps/rfid-portal`, ESP32 API | RFID hardware scan simulator widget |
| **7. Emergency Safety Protection** | Deterministic red-flag safety engine triggers immediate hospital queue priority alerts for chest pain/dyspnea. | `packages/clinical-engine/redFlags.ts` | Immediate Red Flag alert broadcast |
| **8. ABDM / FHIR Readiness** | Data model and interoperability adapters prepared for ABDM health records and FHIR resources. | `packages/shared-types`, `apps/backend` | Interoperability adapter schema |
