# MediKiosk — Security, Privacy & Compliance Model

## 1. Core Principles

1. **Patient Data Isolation**: PHI (Protected Health Information) is accessible strictly based on role, active patient encounter, and explicit consent.
2. **Physical Token Separation**: RFID Card UIDs store zero medical or personal demographic data. RFID UIDs are arbitrary hardware tokens mapped to internal database IDs on the backend.
3. **Server-Enforced Consent**: API endpoints verify active consent before granting access to clinical history or document endpoints.
4. **Immutable Audit Trails**: Every clinical access, AI generation, summary edit, and status change is recorded in an immutable audit ledger.

---

## 2. Authentication & Authorization (RBAC)

- **JWT Token Management**: Signed with RS256 / HS256, HTTP-only secure cookies for web applications.
- **Role Scoping**:
  - `DOCTOR`: Scoped to facility and assigned queue patients.
  - `RFID_OFFICER`: Restricted to card inventory and enrollment endpoints; zero access to clinical text or AI copilot.
  - `HOSPITAL_ADMIN`: Scoped to operational metrics, device health, and doctor rosters.
  - `CENTRAL_ADMIN`: Scoped to aggregated non-PHI national analytics and model registry.

---

## 3. Hardware & API Security

- **ESP32 Reader Authentication**: Readers authenticate using pre-shared HMAC keys and signed heartbeat requests to prevent hardware spoofing.
- **Kiosk Session Hygiene**: Session tokens automatically expire after 2 minutes of inactivity. Local kiosk state is completely wiped upon session reset.
- **Input Sanitization & Rate Limiting**: All REST inputs are validated using Zod schemas; rate limiting enforced on RFID scan and upload endpoints.
