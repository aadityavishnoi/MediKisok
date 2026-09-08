# MediKiosk Clinical AI — Next-Question Ranking Model & Training Pipeline

> **CLINICAL SAFETY MANDATE**:
> "This model performs clinical decision support for question prioritization and does not provide diagnosis or treatment recommendations."
> The system **NEVER** independently diagnoses a patient. The attending physician remains the sole diagnostic authority. All evaluations strictly mandate `requiresDoctorReview: true`.

---

## 1. Machine Learning Objective

The supervised learning objective is formulated as **candidate question ranking**:

$$\hat{Q}^* = \operatorname{argmax}_{Q \in \mathcal{C}_{\text{allowed}}} S(Q \mid \text{PatientState})$$

where $\mathcal{C}_{\text{allowed}}$ is the set of eligible, unanswered questions validated by the deterministic clinical eligibility layer.

### Inputs
- **Patient Demographics**: Normalized age ($\text{age} / 100$), gender.
- **Normalized Symptoms**: Multihot ICD-10 canonical symptom concepts (e.g., `FEVER_ACUTE`, `COUGH_ACUTE`, `PRECORDIAL_CHEST_PAIN`, `DYSPNEA_ACUTE`).
- **Interaction History**: Sequence of previously asked question IDs and patient responses.
- **Current Clinical State**: Active acute red-flag indicators (chest pain, acute dyspnea, acute surgical abdomen, meningismus).
- **Candidate Questions**: All eligible candidate questions from the `ClinicalQuestionGraph`.
- **Regional Surveillance Signals**: Outbreak disease, risk level, confidence rating supplied by Developer 2.

### Output
A calibrated real-valued relevance score $S(Q \mid \text{State}) \in [0, 1]$ indicating the clinical information yield of asking question $Q$ at the current step.

---

## 2. Training Dataset & Trajectory Generation

Primary source: **DDXPlus** (NeurIPS 2022) evidence-disease conditional probability distributions paired with verified outpatient emergency triage protocols.

### Trajectory Progression
Rather than training on static final diagnoses, training instances are generated sequentially from complete clinical trajectories:
1. **State $t=0$**: Patient presents with initial chief complaint symptoms (e.g. fever, cough). The model evaluates candidate questions and selects the primary screening question (Target: $y=1$, non-target candidates: $y=0$).
2. **State $t=1$**: Patient answer is recorded. State is updated. The model evaluates remaining candidates and selects the next clinical question.
3. **State $t=K$**: The intake reaches sufficient diagnostic evidence or red-flag escalation, cleanly concluding.

### Hard Negative Sampling
For every step, the positive target question is contrasted against all other eligible unanswered questions from the `ClinicalQuestionGraph`. Ineligible or already-answered questions are strictly excluded to mirror real kiosk interaction.

---

## 3. Dataset Splitting & Quality Assurance (Phase 14)

To prevent data leakage, instances are partitioned strictly by `caseId` / `trajectoryId`:
- **Train Set (70%)**: 100 cases, 252 step examples (2,542 candidate pairs).
- **Validation Set (15%)**: 21 cases, 57 step examples (571 candidate pairs).
- **Test Set (15%)**: 23 cases, 51 step examples (523 candidate pairs).

### Leakage & Quality Validation
- **Trajectory Overlap**: 0 overlapping cases between Train, Validation, and Test sets (`assert len(train ∩ test) == 0`).
- **Missing Values**: 0 missing values across all demographic, symptom, history, and target fields.
- **Artifact**: [`ai/clinical-ai/datasets/dataset_report.json`](file:///c:/Users/raish/MediKisok/ai/clinical-ai/datasets/dataset_report.json).

---

## 4. Model Architecture & Training

We deploy an L2-regularized Logistic Ranking Model with cross-feature clinical interactions.

### Feature Space (27 Dimensions)
1. `age_scaled`: $\text{age} / 100.0$
2. `gender_is_female`: Indicator for female sex
3. `step_index_scaled`: Normalized step position in trajectory
4. `history_len_scaled`: Number of answered questions
5. `q_base_score`: Prior clinical yield from knowledge graph
6. `q_is_red_flag`: Question acute danger flag
7. `state_has_chest_pain`, `state_has_dyspnea`, `state_has_fever`, `state_has_cough`, `state_has_gi`, `state_has_headache`: Active symptom cluster indicators
8. `symptom_overlap_count` & `symptom_overlap_ratio`: Jaccard match between candidate relevant symptoms and patient presentation
9. `active_red_flag_interaction`: Interaction term between acute patient danger symptoms and candidate question red-flag status
10. `regional_outbreak_match`: High-confidence outbreak disease alignment
11. One-hot candidate question indicators: `q_is_CARD_001`, `q_is_RESP_001`, `q_is_FEV_001`, etc.

### Loss Function
Pointwise binary cross-entropy with L2 weight decay ($C=10.0$ selected via validation grid search):

$$\mathcal{L}(\mathbf{w}) = -\sum_{i} \left[ y_i \log \sigma(\mathbf{w}^T \mathbf{x}_i + b) + (1 - y_i) \log (1 - \sigma(\mathbf{w}^T \mathbf{x}_i + b)) \right] + \frac{1}{2C} \|\mathbf{w}\|_2^2$$

---

## 5. Model Evaluation & Head-to-Head Comparison

Evaluated on the **untouched held-out test split** (51 trajectory steps):

| Metric | Rule Engine | ML Model | Hybrid Engine (Production) | Production Target |
| :--- | :--- | :--- | :--- | :--- |
| **Top-1 Accuracy** | 37.25% | **96.08%** | **96.08%** | $\ge 85.0\%$ |
| **Top-3 Recall** | 78.43% | **100.0%** | **100.0%** | $\ge 95.0\%$ |
| **Red-Flag Recall** | **100.0%** | **100.0%** | **100.0%** | $100.0\%$ |
| **Unnecessary Question Rate** | **0.0%** | **0.0%** | **0.0%** | $\le 10.0\%$ |
| **Mean Reciprocal Rank (MRR)** | 0.5964 | **0.9804** | **0.9804** | $\ge 0.90$ |
| **NDCG@3** | 0.6067 | **0.9855** | **0.9855** | $\ge 0.90$ |
| **Inference Latency** | **0.011 ms** | **0.093 ms** | **0.075 ms** | $< 10.0 \text{ ms}$ |
| **Model Artifact Size** | 0 KB | 1.3 KB | 1.3 KB | $< 1.0 \text{ MB}$ |

---

## 6. Hybrid Architecture & Safety Fallbacks

```
Patient Intake (Age, Gender, Symptoms, Answers, Regional Outbreaks)
                     │
                     ▼
     Deterministic Question Eligibility Filter
   (Removes already-answered & clinically ineligible questions)
                     │
                     ▼
             Eligible Candidates
                     │
                     ▼
             MLQuestionRanker
      (Computes learned ranking scores)
                     │
                     ▼
      Deterministic Red-Flag Safety Override
   (Guarantees immediate elevation of red-flag screening)
                     │
                     ▼
         Selected Next Question
                     │
   ┌─────────────────┴─────────────────┐
   │ If ML inference fails / throws:   │
   │ Automatic safe fallback to        │
   │ deterministic QuestionPrioritizer │
   └─────────────────┬─────────────────┘
                     │
                     ▼
    Response with `requiresDoctorReview: true`
                     │
                     ▼
       Doctor Consultation Review
```

---

## 7. Model Versioning & Artifacts

All model artifacts are versioned in `ai/clinical-ai/models/next-question/`:
- `model_weights.json`: Compact JSON weights vector and bias for zero-dependency inference in Node.js/TypeScript.
- `model_metadata.json`: Model version (`1.0.0`), timestamp, source dataset provenance, and validation metrics.
- `feature_schema.json`: Complete 27-feature definition vector and bounds.
- `training_config.json`: Hyperparameters ($C=10.0$, solver, penalty).
- `evaluation_results.json`: Comprehensive train and test evaluation metrics.

---

## 8. Reproducibility Commands

```bash
# 1. Generate clinical trajectories
python ai/clinical-ai/datasets/generate_trajectories.py

# 2. Split and validate dataset quality (Train / Val / Test)
python ai/clinical-ai/datasets/split_and_validate_dataset.py

# 3. Train ML ranking model and export versioned artifacts
python ai/clinical-ai/training/train_next_question.py

# 4. Run head-to-head model comparison
python ai/clinical-ai/evaluation/evaluate_models.py

# 5. Run full automated test suite (52 tests)
pnpm --filter @medikiosk/clinical-ai test
pnpm --filter backend exec vitest run src/routes/aiNextQuestion.test.ts
pnpm --filter patient-kiosk exec vitest run
```
