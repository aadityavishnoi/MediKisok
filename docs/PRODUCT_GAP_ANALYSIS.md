# MediKiosk — Product Gap Analysis & SIH 26047 Transformation

## 1. Context & Objective

This document analyzes the gap between the initial prototype and the production-grade requirements of **SIH 2026 Problem Statement SIH26047 (Patient Case-Taking Software)**.

The core problem in Indian OPDs is that doctors spend 60-80% of consultation time asking repetitive history questions and flipping through fragmented paper records. MediKiosk shifts clinical history acquisition, document OCR digitization, and evidence-linked summarization **BEFORE** the patient enters the consultation room.

---

## 2. Capability Gap Matrix

| Feature Domain | Initial Prototype State | Required Production Target | Gap & Action Plan |
| :--- | :--- | :--- | :--- |
| **Application Surfaces** | Kiosk (5173) & Doctor Web (5174) | 5 Distinct Apps (Kiosk, Doctor, RFID Portal, Hospital Admin, Central Admin) | Create `apps/rfid-portal`, `apps/hospital-admin`, `apps/central-admin`. |
| **RFID Lifecycle** | Mock UID scan button | Complete lifecycle: Batch issuance, enrollment, activation, lost/stolen reporting, device heartbeat | Build RFID Portal & hardware authentication API. |
| **Clinical Intake** | Standard Allopathic question tree | Allopathic + AYUSH (Prakriti, Vikriti, Agni, Dhatu) + Adaptive skip logic | Expand `packages/clinical-engine` with AYUSH modules & adaptive branching. |
| **Emergency Red Flags** | Basic UI alert banner | Deterministic safety rules (Chest pain, dyspnea, syncope) with zero LLM dependency & instant WS alert | Implement deterministic triage rules with real-time websocket broadcasting. |
| **Document Intelligence** | Stub OCR upload | OCR pipeline with document classification, entity extraction (meds, labs), confidence review | Ingest OCR results, create extracted key-value records, allow manual verification. |
| **AI Summarization** | Fixed text output | Evidence-linked AI Copilot with source chips (`[Answer #ID]`, `[Doc #ID]`) and edit/accept workflow | Implement Evidence Citation Engine and Doctor Copilot UI. |
| **Multilingual Support** | English & Hindi strings | 13 Indian languages (EN, HI, BN, MR, TA, TE, GU, KN, ML, PA, OR, AS, UR) + Voice prompts | Build comprehensive `i18n` dictionary and speech synthesis integration. |
| **Multi-Tenancy** | Single hospital model | National -> State -> District -> Facility -> Department hierarchy | Upgrade Prisma schema & tenant authorization middleware. |
| **Interoperability** | No FHIR/ABDM layer | ABDM/FHIR resource mapping adapters (Patient, Encounter, Observation, Condition) | Create FHIR transformation package & mock adapters. |
