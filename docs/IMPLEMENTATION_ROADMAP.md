# MediKiosk — Comprehensive Phased Implementation Roadmap

## Phase 1: Foundation & Shared Packages
- [x] Complete architecture audit and gap analysis documentation.
- [ ] Upgrade `packages/shared-types` with full DTOs, Enums, and WebSocket contracts.
- [ ] Enhance `packages/clinical-engine` with AYUSH modules & deterministic red-flag engine.
- [ ] Build `packages/ai-service` evidence citation & document OCR parser abstraction.
- [ ] Expand `packages/ui` with shared design components.

## Phase 2: Database Schema & Backend APIs
- [ ] Upgrade Prisma schema in `apps/backend/prisma/schema.prisma` for multi-tenancy, RFID lifecycle, granular consent, documents, AI citations, and audit logging.
- [ ] Run Prisma migration and seed 8 comprehensive synthetic patient cases.
- [ ] Implement backend REST routes & Socket.IO real-time event handlers.

## Phase 3: Application Surface Implementation
- [ ] **Patient Kiosk (`apps/patient-kiosk` - Port 5173)**: RFID tap, multilingual consent, adaptive interview, voice/touch input, red flag alert, document OCR review.
- [ ] **Doctor Web (`apps/doctor-dashboard` - Port 5174)**: Live Queue, Patient 360, AI Copilot with evidence chips, SOAP/HPI draft generation, consultation completion.
- [ ] **RFID Enrollment Portal (`apps/rfid-portal` - Port 5175)**: Batch UID registration, enrollment, card lifecycle state management (Active/Stolen/Lost/Deactivated), audit logs.
- [ ] **Hospital Admin (`apps/hospital-admin` - Port 5176)**: Facility operations, doctor schedules, OPD queue control, hardware reader/kiosk health monitor.
- [ ] **Central Admin (`apps/central-admin` - Port 5177)**: National command center, state/district hierarchy metrics, AI model registry governance.

## Phase 4: Verification & SIH Demo Story
- [ ] Execute full end-to-end integration tests (`pnpm test`, `pnpm typecheck`, `pnpm build`).
- [ ] Validate complete SIH patient intake flow from RFID scan to physician consultation.
