# MediKiosk — AI/ML Roadmap, Training Strategy & Model Governance

## 1. Architectural Principles

1. **No Foundation Training from Scratch**: Leverage pre-trained multimodal models and fine-tuned domain adapter heads.
2. **Deterministic Emergency Overrides**: LLMs are strictly forbidden from deciding emergency status. Hardcoded clinical safety rules take absolute priority.
3. **Traceable Evidence Citations**: Every AI-generated clinical statement must link directly to source inputs (`[Answer #ID]`, `[Doc #ID]`).
4. **Physician Final Authority**: AI outputs remain in `DRAFT` state until reviewed, edited, or accepted by the consulting physician.

---

## 2. 3-Stage AI/ML Evolution Roadmap

```
Level 1: Foundation (Current)
├── Multilingual STT & Text Normalization
├── Document Layout Analysis & OCR (Tesseract / Vision LLM)
├── Clinical Entity Extraction (Symptoms, Meds, Labs)
├── Deterministic Structured Summarization
└── Evidence Citation Linking

Level 2: Clinical Intelligence (Phase 2)
├── Adaptive Information-Gain Question Selection
├── Contradiction Detection Engine (Medication/Allergy mismatch)
├── Longitudinal Medical Timeline Reconstruction
└── Lab Anomaly Trend Highlighting

Level 3: Advanced ML Infrastructure (Phase 3)
├── OPD Load Forecasting & Queue Prioritization
├── Local Model Fine-Tuning & Evaluation Pipeline
├── Model Drift & Fairness Monitoring
└── Offline Edge Inference Support
```

---

## 3. NLP Annotation & Dataset Pipeline

```
datasets/
├── raw/           # Scanned reports & raw speech transcripts
├── processed/     # De-identified clinical tokens
├── annotations/   # BioBERT / SpaCy NER tagged entities
└── splits/        # Train / Validation / Test datasets
```

### Entity Categories Tagged
`SYMPTOM`, `DISEASE`, `MEDICATION`, `DOSAGE`, `FREQUENCY`, `ALLERGY`, `PROCEDURE`, `LAB_VALUE`, `LAB_UNIT`, `BODY_PART`, `SEVERITY`, `DURATION`, `TEMPORAL`, `NEGATION`, `AYUSH_PRAKRITI`.

---

## 4. Model Evaluation Metrics & Safety Benchmarks

| Task | Metric | Target Score |
| :--- | :--- | :--- |
| **OCR Field Extraction** | Character Error Rate (CER) / Word Error Rate (WER) | CER < 2.5%, WER < 5% |
| **Clinical NER** | Precision / Recall / F1 Score | F1 > 0.94 |
| **Negation Detection** | Accuracy on Negated Symptoms | Accuracy > 0.98 |
| **Evidence Linking** | Unsupported Claim Rate (Hallucination) | 0.0% (Zero unbacked statements) |
| **Red Flag Detection** | False Negative Rate (Safety Critical) | 0.0% (Zero missed emergencies) |
