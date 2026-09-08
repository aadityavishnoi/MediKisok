# MediKiosk AI Integration Architecture & Clinical Workflow

**Version:** 2.1  
**Module Ownership:** Developer 2 (Surveillance Intelligence + Rx Safety + Clinical AI Integration)  
**Target Branch:** `feature/surveillance-rx-ai`  
**Compliance Standards:** NLEM 2022, CDSCO Good Prescribing Practice, IDSP/NCDC Epidemiological Standards, ABDM / FHIR Data Privacy  

---

## 1. Executive Summary & Core Mandate

The MediKiosk platform connects hardware patient intake kiosks, dynamic clinical decision trees, district epidemiological surveillance, and digital prescription safety into a single, unified outpatient (OPD) consultation workflow.

### Non-Negotiable Safety Principles
1. **Assistive Decision Support Only:** AI modules provide high-information-gain questions, epidemiological priors, explainable risk alerts, and drug interaction warnings.
2. **Never Autonomously Diagnose or Prescribe:** The AI NEVER generates an autonomous patient diagnosis, NEVER issues or modifies a prescription autonomously, and NEVER overrides physician discretion.
3. **Regional Surveillance is Population-Level Intelligence:** An observed 80% positivity rate in a 10-person district sample is an elevated epidemiological signal (`CRITICAL`), but it must NEVER be translated into an individual patient diagnosis probability. `individualDiagnosis: false` is strictly encoded in all surveillance payloads.
4. **Physician Supremacy:** The consulting Registered Medical Practitioner (RMP) is the sole legal and clinical authority for all patient diagnoses, therapeutic regimens, and encounter completions.

---

## 2. End-to-End Workflow & Data Flow

```text
PATIENT
  │
  ▼
[Patient Kiosk Intake]
  ├── Demographics & ABHA / RFID Identity
  ├── Chief Complaint & Initial Symptoms
  └── Physical Telemetry (BP, HR, SpO2, Temp)
  │
  ▼
[Consultation AI Service: POST /api/ai/consultation/start]
  ├── Resolves Stable Region ID (e.g. IN-UP-VARANASI) via GeographicNormalizer
  ├── Ingests Regional Surveillance Risk & 7d/14d Forecasts via SurveillanceService
  └── Initial Question & Differential Ranking via NextBestQuestionRanker
  │
  ▼
[Interactive Patient History Graph: POST /api/ai/consultation/answer]
  ├── Dynamic Question Traversal & Red Flag Tripping
  ├── Re-ranking of Candidate Questions (Information Gain + Outbreak Prior Boost)
  └── On Intake Completion (6 questions or tree termination):
      └── Generates Structured AI History Summary with Evidence Citations
  │
  ▼
[Doctor Dashboard: OPD Consultation Cockpit]
  ├── Section 1: Patient Demographic & Triage Acuity Brief
  ├── Section 2: AI Intake History (Confirmed Symptoms & Red Flags)
  ├── Section 3: Regional Health Intelligence Radar (Risk, Trend, 7d/14d Forecasts)
  └── Section 4: Consultation & Rx Writer
  │
  ▼
[Prescription & Rx Safety Check: POST /api/rx/check]
  ├── Brand & Active Molecule Normalization (NLEM 2022 / CDSCO)
  ├── Pairwise Drug-Drug Interaction Matrix (Mechanism, Effect, Actionable Management)
  ├── Duplicate Therapy Screener (EXACT, POTENTIAL, INTENTIONAL)
  ├── Drug-Allergy Cross-Reactivity Screening (Beta-Lactams, NSAIDs)
  ├── Jan Aushadhi Affordable Generic Alternatives Finder
  └── Fail-Safe: Unknown substances marked UNKNOWN, never declared SAFE
  │
  ▼
[Doctor Final Decision & Encounter Completion: POST /api/consultations/:id/complete]
  ├── Doctor selects diagnosis, confirms notes, signs digital prescription
  ├── Doctor acknowledges or overrides advisory alerts
  └── Marks Consultation & PatientSession COMPLETED (Broadcasting via WebSocket)
```

---

## 3. Consultation AI Lifecycle State Machine

The server-side `ConsultationAiContext` tracks the patient session through six deterministic states:

```
[CREATED] ──(Kiosk Tap)──> [IN_PROGRESS]
                               │
                      (Answering Questions)
                               │
                               ▼
                     [AI_HISTORY_COMPLETE]
                               │
                      (Doctor Opens Cockpit)
                               │
                               ▼
                        [DOCTOR_REVIEW]
                               │
                    (Doctor Writes Rx / Checks Safety)
                               │
                               ▼
                    [PRESCRIPTION_REVIEW]
                               │
                 (Doctor Submits Diagnosis & Signs Rx)
                               │
                               ▼
                          [COMPLETED]
```

| State | Trigger | System Behavior |
| :--- | :--- | :--- |
| `IN_PROGRESS` | `POST /api/ai/consultation/start` | Region mapped, regional surveillance retrieved, initial Clinical AI question ranked. |
| `AI_HISTORY_COMPLETE` | `POST /api/ai/consultation/answer` (terminal) | All candidate questions answered; structured evidence summary generated and persisted. |
| `DOCTOR_REVIEW` | Doctor enters consultation room | Physician reviews chief complaint, vitals, AI answers, red flags, and regional risk. |
| `PRESCRIPTION_REVIEW` | `POST /api/rx/check` | Rx safety alerts displayed; Jan Aushadhi generic options presented to doctor. |
| `COMPLETED` | `POST /api/consultations/:id/complete` | Doctor final decision recorded (`doctorFinalDecision: true`); prescription persisted. |
| `CANCELLED` | Session abandoned / timeout | Encounter archived without clinical disposition. |

---

## 4. Subsystem Integration Details

### 4.1 Regional Disease Surveillance & Forecasting
- **Geographic Normalizer:** Standardizes `Country (IN) -> State -> District -> Facility` hierarchy with stable IDs (`IN-UP-VARANASI`, `IN-MH-PUNE`). Resolves vernacular aliases (*Banaras*, *Kashi*, *Poona*).
- **Outbreak Detection:** Combines baseline deviation ($z \ge 2.0$), trajectory (`RISING`, `STABLE`, `FALLING`), multi-facility sentinel spread, and Wilson 95% confidence intervals.
- **Small-Sample Protection:** Region X 8/10 scenario safely preserved (`CRITICAL` risk, `LOW_SAMPLE` confidence, Wilson CI $[49\%, 94\%]$, smoothed rate $16.7\%$; `individualDiagnosis: false`).
- **Forecasting Engine:** Multi-horizon 7-day and 14-day projections with expanding 95% forecast intervals. Holt's Linear Exponential Smoothing promoted to production after chronological benchmarking against Naive, Moving Average, Seasonal Naive, and Tabular Ridge ML.
- **Surveillance Context Injection:** Injected into `ConsultationAiContext.regionalSignals` to dynamically adjust question ranking in `NextBestQuestionRanker` (e.g. elevating dengue / respiratory screening questions when district activity is high).

### 4.2 Prescription & Medication Safety Engine
- **Medicine Normalizer:** Normalizes active ingredient, commercial brand name, numeric strength, unit (`mg`, `mcg`, `g`, `ml`, `IU`), dosage form, route, and frequency.
- **Interaction Matrix:** Pairwise contraindications and major/moderate interactions citing authoritative pharmacopeias (NLEM 2022, CDSCO schedules, FDA DailyMed).
- **Duplicate Therapy Screening:**
  - `EXACT_DUPLICATE`: Identical active molecules (e.g. Dolo 650 + Calpol 500 $\rightarrow$ Acetaminophen toxicity warning).
  - `POTENTIAL_DUPLICATE`: Redundant pharmacological class (e.g. two ACE inhibitors or two PPIs).
  - `INTENTIONAL_COMBINATION`: Validated multi-agent combinations (e.g. Amoxicillin + Clavulanic acid).
- **Drug-Allergy Cross-Reactivity:** Screens documented patient allergies against active molecules, chemical classes, and known cross-reactivities (e.g. Penicillin $\leftrightarrow$ Cephalosporin, Aspirin $\leftrightarrow$ NSAIDs).
- **Jan Aushadhi Substitution:** Identifies equivalent Pradhan Mantri Bhartiya Janaushadhi Pariyojana generic formulations with indicative pricing for cost reduction.

---

## 5. Offline & Graceful Degradation Handling

The system strictly avoids "failing closed":

| Outage Scenario | Fallback Mechanism | Clinical Presentation |
| :--- | :--- | :--- |
| **Surveillance Service Offline** | Regional risk defaults to fallback; consultation context proceeds with `surveillanceStatus: "UNAVAILABLE"`. | *"Regional health intelligence temporarily unavailable. Proceeding with standard clinical intake."* |
| **Rx Engine Offline** | Prescription safety returns `status: "REVIEW_REQUIRED"` with `doctorReviewRequired: true`. Never claims "SAFE". | *"Medication safety review service temporarily unavailable — manual doctor verification required."* |
| **Clinical AI Offline** | Next question ranker falls back to standard chronological intake; differential generation marked unavailable. | Doctor proceeds with direct clinical examination and manual SOAP notes. |
| **Database Offline** | In-memory session cache maintains active consultation state; broadcast via WebSocket continues. | Data synchronized once database connectivity is re-established. |

---

## 6. Auditability & Observability

Every AI and clinical transaction generates an audit entry:
```json
{
  "requestId": "req_1725801234567",
  "timestamp": "2026-09-08T17:30:00.000Z",
  "module": "RX_ENGINE",
  "action": "CHECK_SAFETY",
  "modelVersion": "surveillance-model-v2.1",
  "ruleVersion": "rx-rules-v2.1",
  "flags": ["DDI_HIGH", "DUPLICATE_THERAPY"]
}
```
*Privacy Safeguard:* Audit logs omit raw Patient Identifiable Information (PII) such as full names, Aadhaar numbers, or phone numbers.

---

## 7. Versioning Matrix

| Component | Identifier | Regulatory Standard |
| :--- | :--- | :--- |
| **Surveillance Model** | `surveillance-model-v2.1` | IDSP Weekly Epidemiological Reporting Standards |
| **Forecasting Model** | `forecast-model-v2.1` | Holt's Linear Exponential Smoothing (7d & 14d horizons) |
| **Rx Safety Rules** | `rx-rules-v2.1` | NLEM 2022 / CDSCO National Formulary of India (NFI) |
| **Medicine Dictionary** | `medicine-dictionary-v2.1` | CDSCO Approved Drug List & PMBJP Jan Aushadhi Master |
| **Clinical Question Graph**| `clinical-graph-v2.0` | Standard Semi-Structured Primary Care History Protocol |
