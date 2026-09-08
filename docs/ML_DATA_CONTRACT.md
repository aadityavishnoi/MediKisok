# MediKiosk — Machine Learning (ML) Data Contract

**Status:** `ACTIVE / ML-READY`  
**Governing Standard:** SIH-PS-26047 National Scale AI Intake Platform  
**Target Upstream Database:** CockroachDB Cloud (`prisma/schema.prisma`)  
**AI Governance Entities:** `AIModel`, `AIModelVersion`, `AIModelDeployment`, `AIAssistance`  

---

## 1. Executive Intent & Architecture Boundary

The purpose of this contract is to define the exact data representations, extraction boundaries, and operational interfaces between the **MediKiosk Canonical Clinical Database** and all downstream **Machine Learning / Deep Learning Models**.

```text
+-------------------------------------------------------------------------+
|                  OPERATIONAL CLINICAL DATABASE                          |
|  CockroachDB Cloud (Patient, Session, History, Answers, Documents, Rx)  |
+-------------------------------------------------------------------------+
                                     |
                                     | (1) Read-only ETL / Snapshot
                                     v
+-------------------------------------------------------------------------+
|                       DE-IDENTIFICATION GATEWAY                         |
|   HIPAA / DPDP Safe Harbor: Strip Direct Identifiers (ABHA, Phone, UID) |
|   Salted Hashing of Patient IDs & Date Jittering (+/- 14 days)          |
+-------------------------------------------------------------------------+
                                     |
                                     | (2) Normalized Feature Generation
                                     v
+-------------------------------------------------------------------------+
|                       ML FEATURE STORE & DATASETS                       |
|   Versioned Datasets (HDF5 / Parquet) with Fixed Train / Val / Test     |
+-------------------------------------------------------------------------+
                                     |
                                     | (3) Model Training / Validation
                                     v
+-------------------------------------------------------------------------+
|                     AI GOVERNANCE & MODEL REGISTRY                      |
|   AIModel -> AIModelVersion -> AIModelDeployment (CER, F1, Latency)     |
+-------------------------------------------------------------------------+
                                     |
                                     | (4) Controlled Inference Serving
                                     v
+-------------------------------------------------------------------------+
|                     CLINICAL INFERENCE CONSUMERS                        |
|   Patient Kiosk (STT/TTS), Doctor Dashboard (Summary/Rx Suggestion)     |
|   Persisted to `AIAssistance` with Provenance References                |
+-------------------------------------------------------------------------+
```

> [!CAUTION]
> **STRICT ML RULES:**  
> 1. **Zero Direct Training on Production Tables:** Models must NEVER train directly against mutable CockroachDB production tables.  
> 2. **No Data Leakage:** Train/Val/Test splits must partition on `patientId`, never on `sessionId`, preventing patient leakage across folds.  
> 3. **Non-Destructive Overrides:** ML predictions must NEVER overwrite raw patient input. Predictions write exclusively to `AIAssistance`, `ExtractedMedicalData`, or `AISummary.content`.  
> 4. **Safety Separation:** Deterministic clinical red flags (`Alert`) take legal precedence over probabilistic model inferences.

---

## 2. Available Feature Domains & Raw Modalities

### 2.1 Multimodal Input Modalities
MediKiosk captures raw intake data across 5 distinct modalities:

| Modality | Ingestion Point | DB Source Table & Column | Raw Artifact Storage |
|---|---|---|---|
| **Voice / Speech** | Patient Kiosk Microphone | `ClinicalAnswer.answerValue` (JSON payload) | WebRTC audio buffers / Whisper stream |
| **Touch / Choice** | Patient Kiosk Touchscreen | `ClinicalAnswer.answerValue` (Selected option IDs) | Direct structured values |
| **Vision / Image** | Kiosk Scanner / Camera | `MedicalDocument.storagePath` | ImageKit CDN / Object Storage |
| **Text / Freeform** | Kiosk Onscreen Keyboard / Doctor | `ClinicalHistory.chiefComplaint`, `DoctorNote.content` | UTF-8 Relational Text |
| **IoT Telemetry** | Kiosk Vitals Peripherals | `PatientVitals` (systolicBp, pulse, spo2, temp) | Relational Numeric Fields |

### 2.2 Multilingual Scope
The system explicitly persists the interaction language (`Language` enum) at session and question levels. The supported languages are:
- `EN` (English)
- `HI` (Hindi)
- `BN` (Bengali)
- `MR` (Marathi)
- `TE` (Telugu)
- `TA` (Tamil)
- `GU` (Gujarati)
- `KN` (Kannada)
- `ML` (Malayalam)
- `PA` (Punjabi)
- `OR` (Odia)
- `AS` (Assamese)
- `UR` (Urdu)

---

## 3. Targeted AI / ML Tasks & Contract Schemas

### 3.1 Task 1: Speech-to-Text (STT) & Multilingual Acoustic Intake
* **Task Type:** Automatic Speech Recognition & Transliteration
* **Target Model:** Indic-Whisper / Conformer fine-tuned on clinical terms
* **Input:** Raw audio PCM/WAV (16kHz, mono) + Session `Language`
* **Output:**
  ```json
  {
    "transcript": "पिछले तीन दिनों से सीने में तेज दर्द हो रहा है",
    "languageDetected": "HI",
    "confidence": 0.942,
    "wordTimestamps": []
  }
  ```
* **Storage Target:** `ClinicalAnswer.answerValue` (`{ "rawTranscript": "...", "confidence": 0.942 }`)

---

### 3.2 Task 2: Multimodal Vision OCR (Prescriptions & Lab Reports)
* **Task Type:** Document Layout Analysis & Key-Information Extraction (KIE)
* **Target Model:** Donut / LayoutLMv3 / Gemini Vision OCR fallback
* **Input:** Image URL (`MedicalDocument.storagePath`) + `DocumentType`
* **Output:**
  ```json
  {
    "documentType": "PRESCRIPTION",
    "confidence": 0.915,
    "medications": [
      { "name": "Pantoprazole", "dosage": "40mg", "frequency": "OD", "duration": "10 days" },
      { "name": "Paracetamol", "dosage": "650mg", "frequency": "SOS", "duration": "3 days" }
    ],
    "diagnoses": ["Acute Gastritis"],
    "rawText": "Rx\nTab Pantop 40mg 1 tab OD before breakfast x 10d..."
  }
  ```
* **Storage Target:** `OCRJob.structuredData` & `ExtractedMedicalData` rows.

---

### 3.3 Task 3: Adaptive Clinical History & Chief Complaint Routing
* **Task Type:** Hierarchical Multi-Class Intent Classification
* **Target Model:** Clinical-BioBERT / DeBERTa-v3
* **Input:** `chiefComplaint` text + `Patient.age` + `Patient.gender` + `PatientVitals`
* **Output:**
  ```json
  {
    "targetDepartment": "CARD",
    "recommendedQuestionnaireId": "CARD_V1",
    "initialNodeId": "node_chest_pain_onset",
    "urgencyScore": 0.88
  }
  ```
* **Storage Target:** `ClinicalHistory.currentTreeId`, `TriageQueue.priority`

---

### 3.4 Task 4: Clinical Summarization & SOAP Note Generation
* **Task Type:** Abstractive Clinical Dialogue Summarization
* **Target Model:** Fine-tuned Med-Llama / Clinical Mistral
* **Input:**
  - Aggregated `ClinicalAnswer` array
  - `SessionSymptom` records
  - `PatientVitals`
  - Verified `ExtractedMedicalData`
* **Output Schema:**
  ```markdown
  ### Subjective
  45yo male presents with severe crushing retrosternal chest pain radiating to left arm for 3 days. Dyspnea present on exertion.

  ### Objective
  BP: 145/95 mmHg, Pulse: 96 bpm, SpO2: 95% on room air. Afebrile.

  ### Assessment
  Suspected Acute Coronary Syndrome (ACS) vs Severe GERD. High risk.

  ### Plan
  Urgent ECG, Serum Troponin-T, Cardiology consult stat.
  ```
* **Storage Target:** `AISummary.content` (Status: `DRAFT` pending doctor review) and `AIAssistance` (`assistanceType: SUMMARY`).

---

### 3.5 Task 5: Disease Outbreak & Epidemic Signal Detection
* **Task Type:** Spatial-Temporal Anomaly Detection
* **Target Model:** Prophet / Isolation Forest on aggregate time-series
* **Input:** Aggregated weekly complaints grouped by `district`, `state`, and `symptomName`
* **Output:**
  ```json
  {
    "anomalyDetected": true,
    "syndrome": "Dengue Fever",
    "district": "South Delhi",
    "state": "Delhi",
    "expectedCases": 12,
    "observedCases": 48,
    "confidenceInterval": [8, 16],
    "signalSeverity": "HIGH"
  }
  ```
* **Storage Target:** `DiseaseOutbreakSignal` table.

---

## 4. Dataset Extraction & De-Identification Contract

When exporting datasets for offline training, the ETL script must strictly follow the de-identification policy:

```typescript
// ETL De-identification Transform Specification
export interface DeIdentifiedPatientFeatureRecord {
  // Pseudonymized surrogate key (Salted HMAC-SHA256 of Patient.id)
  anonSubjectId: string;
  
  // Demographics (Binned)
  ageGroup: '0-18' | '19-35' | '36-50' | '51-65' | '65+';
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  
  // Geographical granularity (District level only; PII pincode/address stripped)
  state: string;
  district: string;
  
  // Clinical Encounter Vitals
  vitals: {
    systolicBp?: number;
    diastolicBp?: number;
    pulse?: number;
    spo2?: number;
    temperatureF?: number;
    bmi?: number;
  };
  
  // Structured Clinical Features
  chiefComplaintCategory: string;
  symptoms: Array<{
    name: string;
    duration: string;
    severity: string;
    isRedFlag: boolean;
  }>;
  
  // QA Pairs (Localized text stripped of names/phone/dates)
  historyAnswers: Array<{
    nodeId: string;
    section: string;
    standardizedKey: string;
    normalizedValue: unknown;
  }>;
  
  // Target Labels for Supervised Learning
  labels: {
    triagePriority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
    assignedDepartment: string;
    verifiedDiagnoses: string[];
  };
}
```

---

## 5. Model Serving, Provenance & Inference Audit

Every clinically relevant AI inference must be registered in the database to answer:
1. *Which exact model and version generated this recommendation?*
2. *What was the input evidence?*
3. *Did the human doctor accept, reject, or modify the recommendation?*

### Database Ledger Mapping:
- **`AIModelDeployment`:** Verifies that inference is served by an authorized, actively deployed version (`status: DEPLOYED`).
- **`AIAssistance`:**
  - `modelVersion`: SemVer identifier (`AIModelVersion.versionNumber`).
  - `provenanceReferences`: JSON array linking the prediction back to exact input records:
    ```json
    {
      "sourceAnswerIds": ["ans_cuid1", "ans_cuid2"],
      "sourceDocumentIds": ["doc_cuid3"],
      "sourceVitalsId": "vit_cuid4"
    }
    ```
  - `feedback`: Tracks clinician interaction (`ACCEPTED`, `REJECTED`, `EDITED`).

---

## 6. Train / Validation / Test Separation Boundary

To maintain rigorous statistical validity and eliminate data contamination:

1. **Partition Unit:** Partitioning must be performed strictly on `anonSubjectId` (`Patient.id`).
2. **Split Ratio:**
   - **Train:** 70% of unique patients
   - **Validation:** 15% of unique patients
   - **Holdout Test:** 15% of unique patients
3. **Temporal Holdout:** For epidemic models, hold out the most recent 60 days of data across all facilities to evaluate future outbreak prediction performance.

---

## 7. Approval & Freezing

This ML Data Contract is **ACTIVE** and serves as the invariant specification for all model pipelines developed for MediKiosk.
