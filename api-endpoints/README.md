# 🌐 MediKiosk Master API Endpoints Directory

This folder contains the complete reference guide and automated test suites for every API endpoint in the MediKiosk platform, covering all 5 portals and AI services.

---

## 📁 Endpoints Overview by Subsystem

### 1. Central Administration & Governance
| Method | Endpoint | Description | Auth / Scope |
|---|---|---|---|
| `GET` | `/api/admin/metrics` | National KPI rollup (hospitals, kiosks, patients, sessions, uptime) | `CENTRAL_ADMIN` / Demo |
| `GET` | `/api/admin/devices` | All hardware kiosks across all states & facilities | `CENTRAL_ADMIN` / Demo |
| `GET` | `/api/admin/ai-models` | Registered AI model versions, F1 scores, and deployments | `CENTRAL_ADMIN` / Demo |
| `POST` | `/api/admin/ai-models` | Register / deploy a new clinical or surveillance AI model | `CENTRAL_ADMIN` / Demo |
| `GET` | `/api/admin/analytics/national` | Aggregated breakdown by session status, severity, document type | `CENTRAL_ADMIN` / Demo |
| `GET` | `/api/admin/analytics/by-state` | State-by-state hospital and patient session rollups | `CENTRAL_ADMIN` / Demo |

### 2. Hospital Administration & Fleet Command
| Method | Endpoint | Description | Auth / Scope |
|---|---|---|---|
| `GET` | `/api/hospitals` | List all registered health facilities with OPD stats | `HOSPITAL_ADMIN` / Demo |
| `GET` | `/api/hospitals/doctors` | Active doctor roster with OPD rooms & patient queue | `HOSPITAL_ADMIN` / Demo |
| `PATCH` | `/api/hospitals/doctors/:id/status` | Real-time toggle doctor availability (`Available` / `Off Duty`) | `HOSPITAL_ADMIN` / Demo |
| `GET` | `/api/hospitals/kiosks` | Kiosk terminals telemetry, paper level & hardware health | `HOSPITAL_ADMIN` / Demo |
| `GET` | `/api/hospitals/:id/overview` | Executive facility overview metrics | Hospital-scoped |

### 3. Smart Card Authority (RFID Token Management)
| Method | Endpoint | Description | Auth / Scope |
|---|---|---|---|
| `GET` | `/api/rfid/cards` | Full card inventory list with patient & facility links | `RFID_OFFICER` / Demo |
| `GET` | `/api/rfid/cards/:uid` | Query single card details, linked ABHA & audit history | `RFID_OFFICER` / Demo |
| `POST` | `/api/rfid/cards` | Manufacture / register new RFID card blank UID | `RFID_OFFICER` / Demo |
| `POST` | `/api/rfid/cards/:uid/assign` | Assign card UID to a registered patient | `RFID_OFFICER` / Demo |
| `POST` | `/api/rfid/cards/:uid/activate` | Activate assigned card for kiosk tap | `RFID_OFFICER` / Demo |
| `POST` | `/api/rfid/simulate` | Simulate physical 13.56MHz card tap on reader | Public / Demo |

### 4. Patient Intake Kiosk
| Method | Endpoint | Description | Auth / Scope |
|---|---|---|---|
| `POST` | `/api/patients/register-kiosk` | 1-Click patient registration & RFID card binding | Public / Kiosk |
| `POST` | `/api/history/consent` | DPDP 2023 patient consent recording | Session-scoped |
| `POST` | `/api/history/start` | Begin multilingual anamnesis interview | Session-scoped |
| `POST` | `/api/history/answer` | Submit patient symptoms & update triage score | Session-scoped |
| `POST` | `/api/documents/scan` | OCR scan uploaded prescription, lab report, or ABHA card | Session-scoped |

### 5. Doctor Clinical Dashboard
| Method | Endpoint | Description | Auth / Scope |
|---|---|---|---|
| `POST` | `/api/auth/login` | Doctor / Admin credentials authentication (JWT) | Public |
| `GET` | `/api/doctor/dashboard` | List waiting patients, complaints, and alert severity | `DOCTOR` |
| `GET` | `/api/doctor/sessions/:id` | Full clinical anamnesis history, alerts, and OCR documents | `DOCTOR` |
| `POST` | `/api/doctor/alerts/:id/acknowledge` | Mark red-flag alert acknowledged with audit logging | `DOCTOR` |
| `POST` | `/api/doctor/consultations` | Finalize consultation, write Rx, and dispatch digital prescription | `DOCTOR` |

### 6. AI Surveillance & Prescription Intelligence
| Method | Endpoint | Description | Auth / Scope |
|---|---|---|---|
| `GET` | `/api/surveillance/central-admin/overview` | Bayesian smoothed outbreak rates, Wilson CI, Holt forecast | Public / Demo |
| `POST` | `/api/surveillance/signal` | Dispatch syndromic outbreak alert signal | `CENTRAL_ADMIN` / Demo |
| `POST` | `/api/clinical/rx-safety-check` | Drug-drug interaction & allergy safety cross-check | Clinical AI |

---

## 🚀 How to Run the Master Endpoint Test

### Option 1: Using the package.json script
```bash
pnpm test:api
```

### Option 2: Running directly with tsx
```bash
npx tsx api-endpoints/test-all-endpoints.ts
```

Ensure the backend server is running:
```bash
pnpm --filter backend dev
```
