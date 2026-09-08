# Clinical AI Data Sources & Knowledge Graph Specifications

This document outlines the data sources, academic citations, licensing terms, schema transformation pipelines, and clinical safety boundaries used by the **MediKiosk Dynamic Clinical AI Engine** (`@medikiosk/clinical-ai`).

---

## 1. Primary Dataset: DDXPlus

- **Dataset Name**: DDXPlus (Synthetic Medical Diagnostic Dataset with Evidence Graph)
- **Reference**: Tchango et al., *"DDXPlus: A New Dataset For The Evaluation Of Machine Learning In Differential Diagnosis"*, NeurIPS 2022 (Datasets and Benchmarks Track).
- **Source Repository**: [https://github.com/vith/ddxplus](https://github.com/vith/ddxplus)
- **License**: Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
- **Dataset Scale**: ~1.3 million synthetic patient trajectories across 49 common clinical conditions and 223 distinct clinical findings/evidences (symptoms, antecedents, physical signs).
- **Role in MediKiosk**:
  - Powers the **Evidence-Symptom Conditional Probability Graph** for symptom-directed cross-questioning.
  - Provides empirical conditional likelihood $P(\text{Finding} \mid \text{Pathology})$ used in calculating Mutual Information and Shannon Entropy reduction during intake.
  - Informs red-flag finding associations for acute conditions (e.g., Acute Coronary Syndrome, Pulmonary Embolism, Acute Appendicitis).
- **Schema Transformation**:
  - DDXPlus evidence tokens (e.g., `E_57`, `E_124`) are extracted and mapped to canonical clinical symptom keys (`FEVER_ACUTE`, `DYSPNEA_REST`, `CHEST_PAIN_RADIATING`) and standard ICD-10 symptom codes (`R50.9`, `R06.0`, `R07.9`).
  - Binary and categorical multi-choice responses are standardized into `BOOLEAN`, `SINGLE_SELECT`, and `MULTI_SELECT` kiosk-friendly questions.

---

## 2. Secondary Datasets: Clinical Phrasing & Medical QA

### 2.1 ChatDoctor
- **Reference**: Li et al., *"ChatDoctor: A Medical Chat Model Fine-Tuned on LLaMA Using HealthCare Records"*, Cureus 2023.
- **Source**: [https://github.com/Kent0n-Li/ChatDoctor](https://github.com/Kent0n-Li/ChatDoctor)
- **License**: MIT License (for open academic weights/datasets) / HealthCareMagic dataset (CC-BY).
- **Role in MediKiosk**:
  - Provides vernacular conversational phrasings and patient-friendly symptom descriptions.
  - Informs Hindi and colloquial English synonym dictionaries (e.g., "khansi", "saas lene me takleef", "sar dard", "bukhar") mapped to clinical concepts.
  - Used in few-shot validation of physician-style empathetic clarification questions.

### 2.2 PubMedQA
- **Reference**: Jin et al., *"PubMedQA: A Dataset for Biomedical Research Question Answering"*, EMNLP 2019.
- **Source**: [https://pubmedqa.github.io/](https://pubmedqa.github.io/)
- **License**: MIT License
- **Role in MediKiosk**:
  - Provides peer-reviewed biomedical rationale snippets linking symptom presentations to clinical significance.
  - Powers the `reason` field in question selection (e.g., why chronometry of fever or radiation of chest pain matters clinically).

### 2.3 MedQuad
- **Reference**: Abacha et al., *"A Question-Answering System for Medical Questions"*, NIH U.S. National Library of Medicine.
- **Source**: [https://github.com/abachaa/MedQuAD](https://github.com/abachaa/MedQuAD)
- **License**: Open access for educational and scientific research (NIH/NLM).
- **Role in MediKiosk**:
  - Guides structure of secondary review-of-systems questions (gastrointestinal tolerance, neurological focal signs, systemic signs).

---

## 3. Clinical Concept & ICD-10 Mapping Strategy

To prevent hallucinations and diagnostic drift:
1. **Zero Invented Codes**: All symptom codes adhere strictly to WHO ICD-10-CM standards (Chapter XVIII: Symptoms, signs and abnormal clinical and laboratory findings, `R00–R99`).
2. **Canonical Identifiers**: Every symptom and finding is given an internal immutable identifier (e.g., `FEV_001`, `RESP_001`, `CARD_001`) with clear clinical categories (`CONSTITUTIONAL`, `RESPIRATORY`, `CARDIOVASCULAR`, `GASTROINTESTINAL`, `NEUROLOGICAL`).
3. **Multilingual Localized Prompts**: Questions are structured with standard English (`en`) and Hindi (`hi`) text representations tailored for rural and suburban outpatient kiosk kiosks.

---

## 4. Medical Limitations, Disclaimers & Safety Invariants

> [!CAUTION]
> **Strict Non-Diagnostic Boundary**
> 1. The clinical AI engine is an **intake triage optimization tool**, NOT an automated physician or diagnostic agent.
> 2. The engine **NEVER** outputs a definitive patient diagnosis.
> 3. Every engine evaluation returns `requiresDoctorReview: true`.
> 4. Red-flag triggers (e.g., resting dyspnea, crushing retrosternal chest pain, acute abdominal rigidity) generate immediate safety escalation alerts (`AlertSeverity.CRITICAL` / `AlertSeverity.WARNING`) to notify clinic staff.
> 5. Regional surveillance signals from Developer 2 are consumed strictly as probabilistic prior modifiers (e.g., up-weighting respiratory questions during an active influenza or COVID-19 surge); they do NOT establish etiology without confirmatory diagnostic tests.
