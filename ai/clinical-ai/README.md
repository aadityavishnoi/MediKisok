# MediKiosk Dynamic Clinical Cross-Questioning & Clinical AI Engine

Production-oriented clinical AI questioning engine for the MediKiosk platform (`feature/clinical-ai`). Dynamically optimizes next clinical intake questions using normalized clinical concepts, Information Gain, Red-Flag Safety Rules, and Regional Outbreak Signals.

> **CRITICAL CLINICAL BOUNDARY**: This system is non-diagnostic. It NEVER independently diagnoses patients or outputs automated disease labels. All clinical findings require licensed medical officer review (`requiresDoctorReview: true`).

---

## 1. Architecture & Core Pipeline

```
Patient Intake (Kiosk)
   │
   ├─► Chief Complaint (e.g. "fever", "chest pain")
   │
   ▼
POST /api/ai/next-question ◄─── Regional Surveillance Outbreak Signals (Developer 2)
   │
   ├── 1. Zod Schema Validation (`NextQuestionApiRequestSchema`)
   ├── 2. Concept Normalization (`SymptomNormalizer`)
   ├── 3. Red-Flag Evaluation (`RedFlagDetector`)
   ├── 4. Regional Modifier Weighting (`RegionalModifier`)
   ├── 5. Question Prioritization (`QuestionPrioritizer` + `ClinicalQuestionGraph`)
   │
   ▼
Response (`NextQuestionApiResponse`)
   ├── `nextQuestion: { id, text, priority } | null`
   ├── `reason: string`
   ├── `safetyFlags: string[]`
   └── `requiresDoctorReview: true` (strictly enforced invariant)
   │
   ▼
Patient Kiosk Frontend (`DynamicHistoryScreen`)
   ├── Renders touch-friendly cards (Yes / No / Custom Voice/Text)
   ├── Text-to-Speech audio question playback
   ├── Duplicate-submission guard (`inFlightRef`)
   ├── Red-flag escalation alert banner
   └── Non-diagnostic handoff screen -> Doctor Consultation Queue
```

---

## 2. API Contract

### Endpoint
`POST /api/ai/next-question`

### Request Payload
```json
{
  "sessionId": "clx...",
  "patient": {
    "age": 34,
    "gender": "male"
  },
  "symptoms": ["fever", "cough"],
  "answers": {
    "Q_FEVER_DAYS": "3",
    "Q_HIGH_TEMP": true
  },
  "regionalSignals": [
    {
      "regionId": "DEL-NORTH",
      "disease": "Dengue Fever",
      "riskLevel": "HIGH",
      "positivityRate": 0.38,
      "confidence": "HIGH_CONFIDENCE"
    }
  ]
}
```

### Response Payload
```json
{
  "nextQuestion": {
    "id": "Q_RASH_PETECHIAE",
    "text": "Have you noticed any tiny red spots, rashes, or unusual bleeding on your skin?",
    "priority": "HIGH"
  },
  "reason": "regional_outbreak_escalation",
  "safetyFlags": [],
  "requiresDoctorReview": true
}
```

---

## 3. Safety Invariants

1. **Non-Diagnostic Policy**: Under no circumstances does the engine or frontend display "You have Condition X". The output is strictly clinical decision-support triage questions.
2. **Immutable Doctor Review Flag**: Every API response unconditionally carries `requiresDoctorReview: true`.
3. **Escalation Trigger**: When red-flag symptoms (e.g., severe dyspnea, crushing chest pain, altered mental status) are identified, the question priority escalates to `CRITICAL` and triggers immediate real-time kiosk alerts and database alert logging.
4. **Resilient Regional Handling**: If regional surveillance signals are missing or tagged `INSUFFICIENT_SAMPLE`/`LOW_CONFIDENCE`, the engine falls back to standard baseline information gain without degrading intake stability.

---

## 4. Verification & Testing

### Vitest Unit Suites
```bash
# Clinical AI Engine Unit & Scenario Tests (14 tests)
pnpm --filter @medikiosk/clinical-ai test

# Backend API Endpoint & Safety Boundary Tests (4 tests)
pnpm --filter backend exec vitest run src/routes/aiNextQuestion.test.ts

# Patient Kiosk Frontend Dynamic History & E2E Intake Cycle (24 tests)
pnpm --filter patient-kiosk exec vitest run
```

### Benchmark Evaluation
Evaluates held-out patient trajectories across diverse diagnostic paths:
```bash
python ai/clinical-ai/evaluation/evaluate_benchmark.py
```
- **Top-1 Accuracy**: 100.0% (target >= 85%)
- **Top-3 Recall**: 100.0% (target >= 95%)
- **Red-Flag Recall**: 100.0% (target 100%)
- **Unnecessary Question Rate**: 4.0% (target <= 10%)
- **Mean Questions per Session**: 4.1 questions
