# MediKiosk — Comprehensive Architecture Audit

## 1. Executive Summary

This document presents a full technical audit of the MediKiosk repository as of September 2026. MediKiosk is designed as an AI-powered, multilingual digital clinical intake and patient intelligence platform addressing **SIH 2026 Problem Statement SIH26047 (Patient Case-Taking Software)** under the MedTech / BioTech / HealthTech domain.

---

## 2. Monorepo Repository Structure

The codebase is organized as a pnpm monorepo using TypeScript, Vite, React, Express/Fastify, and Prisma with PostgreSQL.

```
medikiosk/
├── apps/
│   ├── backend/             # Express API + Socket.IO Server + Prisma ORM
│   ├── doctor-dashboard/    # Doctor Web EHR & Clinical Copilot (Vite + React)
│   └── patient-kiosk/       # Patient-facing Kiosk app (Vite + React)
├── packages/
│   ├── ai-service/          # Mock & LLM AI Provider Abstraction
│   ├── api-client/          # Shared HTTP client SDK
│   ├── clinical-engine/     # Clinical question trees & red-flag detection rules
│   ├── shared-types/        # DTOs, Enums, and WebSocket payload typings
│   └── ui/                  # Shared React UI components & tailwind design tokens
└── docs/                    # Architectural and technical documentation
```

---

## 3. System Component Analysis

### 3.1 Backend Service (`apps/backend`)
- **Framework**: Express.js with TypeScript and Socket.IO for real-time WebSocket communication.
- **ORM / Database**: Prisma Client configured for PostgreSQL database.
- **Authentication**: JWT-based authentication for doctor accounts; session-token based identity for kiosk encounters.
- **Routes Identified**:
  - `/api/auth` (Login, session validation)
  - `/api/rfid` (Card detection, UID lookup, hardware event dispatching)
  - `/api/session` (Patient session state machine initialization & progression)
  - `/api/consent` (Consent status, language recording, timestamp audit)
  - `/api/history` (Chief complaint selection, adaptive interview steps, red-flag check)
  - `/api/doctor` (Doctor live queue, consultation status, Patient 360 overview)

### 3.2 Clinical Engine (`packages/clinical-engine`)
- Contains decision-tree JSON schemas for complaints: `chest-pain`, `breathing-difficulty`, `abdominal-pain`, `fever`, `headache`, `general-fallback`, `common-sections`, `ayush-assessment`.
- Includes deterministic `redFlags.ts` safety engine evaluating critical symptom responses (e.g. chest pain with radiation or dyspnea) without LLM dependency.

### 3.3 AI Service Layer (`packages/ai-service`)
- Implements an AI Provider interface with mock fallbacks.
- Contains stubs for clinical summarization, SOAP generation, OCR text extraction, and evidence citation linking.

### 3.4 Frontend Applications (`apps/patient-kiosk` & `apps/doctor-dashboard`)
- **Patient Kiosk (Port 5173)**: React app with step-by-step touch UI for patient identification, consent, chief complaint selection, questionnaire, and summary preview.
- **Doctor Dashboard (Port 5174)**: React app with patient queue, consultation state, and AI summary display.

---

## 4. Technical Debt & Gaps Identified

1. **Missing Application Surfaces**:
   - `apps/rfid-portal` (Port 5175): Needed for card manufacturing, enrollment, UID mapping, lost/stolen card lifecycle.
   - `apps/hospital-admin` (Port 5176): Needed for facility queue control, doctor schedules, kiosk & reader device fleet monitoring.
   - `apps/central-admin` (Port 5177): Needed for national/state/district multi-tenant command center and AI model governance.
2. **Database Schema Gaps**:
   - Lacks tenant hierarchy (`Organization`, `State`, `District`, `Facility`, `Department`).
   - Lacks granular consent versioning and scope tracking.
   - Lacks AI Evidence citation mapping tables to trace summary sentences to raw source inputs.
   - Lacks RFID Card batch tracking and device heartbeat security tokens.
3. **Document Intelligence Pipeline**:
   - Requires multi-page OCR document ingestion, key-value entity extraction, and confidence review workflows.
4. **Interoperability & Standards**:
   - ABDM/FHIR resource mapping layer needs explicit adapter definitions (Patient, Encounter, Observation, Condition, MedicationRequest).
