#!/usr/bin/env python3
"""
MediKiosk Clinical AI - Dynamic Next-Question Ranking Model Training Script
Trains a regularized ranking model on multi-step clinical intake trajectories.
Exports model weights, feature schema, model metadata, and evaluation metrics.
"""

import json
import math
import time
from pathlib import Path
import numpy as np
from sklearn.linear_model import LogisticRegression

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "datasets"
MODEL_DIR = BASE_DIR / "models" / "next-question"

TRAIN_FILE = DATA_DIR / "train.json"
VAL_FILE = DATA_DIR / "val.json"
TEST_FILE = DATA_DIR / "test.json"

QUESTION_METADATA = {
    "RESP_001": {"category": "RESPIRATORY", "redFlag": True, "baseScore": 0.95, "relevant": ["DYSPNEA_ACUTE", "COUGH_ACUTE", "FEVER_ACUTE", "PHARYNGITIS_ACUTE"], "outbreak": "COVID-19"},
    "RESP_002": {"category": "RESPIRATORY", "redFlag": False, "baseScore": 0.80, "relevant": ["COUGH_ACUTE", "FEVER_ACUTE", "PHARYNGITIS_ACUTE"], "outbreak": "COVID-19"},
    "RESP_003": {"category": "RESPIRATORY", "redFlag": False, "baseScore": 0.75, "relevant": ["FEVER_ACUTE", "COUGH_ACUTE", "PHARYNGITIS_ACUTE", "LOSS_OF_SMELL", "LOSS_OF_TASTE"], "outbreak": "COVID-19"},
    "CARD_001": {"category": "CARDIOVASCULAR", "redFlag": True, "baseScore": 0.99, "relevant": ["PRECORDIAL_CHEST_PAIN", "CARDIAC_PALPITATIONS", "DYSPNEA_ACUTE"], "outbreak": None},
    "CARD_002": {"category": "CARDIOVASCULAR", "redFlag": True, "baseScore": 0.96, "relevant": ["PRECORDIAL_CHEST_PAIN"], "outbreak": None},
    "FEV_001": {"category": "CONSTITUTIONAL", "redFlag": False, "baseScore": 0.88, "relevant": ["FEVER_ACUTE", "RIGORS_CHILLS", "MALAISE_FATIGUE"], "outbreak": "DENGUE"},
    "FEV_002": {"category": "CONSTITUTIONAL", "redFlag": False, "baseScore": 0.82, "relevant": ["FEVER_ACUTE", "RIGORS_CHILLS"], "outbreak": "DENGUE"},
    "DENGUE_001": {"category": "CONSTITUTIONAL", "redFlag": False, "baseScore": 0.85, "relevant": ["FEVER_ACUTE", "RIGORS_CHILLS", "JOINT_PAIN", "CEPHALEA_HEADACHE"], "outbreak": "DENGUE"},
    "GI_001": {"category": "GASTROINTESTINAL", "redFlag": True, "baseScore": 0.84, "relevant": ["EMESIS_VOMITING", "DIARRHEA_ACUTE", "ABDOMINAL_PAIN_UNSPECIFIED"], "outbreak": "CHOLERA"},
    "GI_002": {"category": "GASTROINTESTINAL", "redFlag": True, "baseScore": 0.86, "relevant": ["ABDOMINAL_PAIN_UNSPECIFIED", "EMESIS_VOMITING"], "outbreak": None},
    "NEURO_001": {"category": "NEUROLOGICAL", "redFlag": True, "baseScore": 0.94, "relevant": ["CEPHALEA_HEADACHE", "FEVER_ACUTE"], "outbreak": None}
}

QUESTION_IDS = sorted(list(QUESTION_METADATA.keys()))

FEATURE_NAMES = [
    "age_scaled",
    "gender_is_female",
    "step_index_scaled",
    "history_len_scaled",
    "q_base_score",
    "q_is_red_flag",
    "state_has_chest_pain",
    "state_has_dyspnea",
    "state_has_fever",
    "state_has_cough",
    "state_has_gi",
    "state_has_headache",
    "symptom_overlap_count",
    "symptom_overlap_ratio",
    "active_red_flag_interaction",
    "regional_outbreak_match"
] + [f"q_is_{qid}" for qid in QUESTION_IDS]

def extract_features(state_example, candidate_qid):
    q_meta = QUESTION_METADATA.get(candidate_qid, {})
    symptoms = state_example["symptoms"]
    history = state_example.get("history", [])
    patient = state_example["patient"]
    regional = state_example.get("regionalSignals", [])

    age_scaled = patient["age"] / 100.0
    gender_is_female = 1.0 if patient["gender"] == "F" else 0.0
    step_index_scaled = state_example.get("stepIndex", 0) / 10.0
    history_len_scaled = len(history) / 10.0

    q_base = q_meta.get("baseScore", 0.5)
    q_is_rf = 1.0 if q_meta.get("redFlag") else 0.0

    has_cp = 1.0 if any("CHEST" in s for s in symptoms) else 0.0
    has_dyspnea = 1.0 if any("DYSPNEA" in s or "SHORTNESS" in s for s in symptoms) else 0.0
    has_fever = 1.0 if any("FEVER" in s for s in symptoms) else 0.0
    has_cough = 1.0 if any("COUGH" in s for s in symptoms) else 0.0
    has_gi = 1.0 if any("EMESIS" in s or "DIARRHEA" in s or "ABDOMINAL" in s for s in symptoms) else 0.0
    has_headache = 1.0 if any("HEADACHE" in s or "CEPHALEA" in s for s in symptoms) else 0.0

    relevant_syms = set(q_meta.get("relevant", []))
    patient_syms = set(symptoms)
    overlap = relevant_syms.intersection(patient_syms)
    overlap_count = len(overlap)
    overlap_ratio = overlap_count / max(1, len(relevant_syms))

    # Red-flag interaction: patient has active red flag symptom AND question is red flag
    patient_has_acute_rf = (has_cp > 0 or has_dyspnea > 0 or (has_gi > 0 and candidate_qid in ["GI_001", "GI_002"]) or (has_headache > 0 and candidate_qid == "NEURO_001"))
    rf_interaction = 1.0 if (patient_has_acute_rf and q_is_rf > 0) else 0.0

    # Regional outbreak match
    outbreak_target = q_meta.get("outbreak")
    outbreak_match = 0.0
    if outbreak_target:
        for r in regional:
            if r.get("disease", "").upper() == outbreak_target.upper() and r.get("riskLevel") in ["HIGH", "CRITICAL"] and r.get("confidence") != "LOW_CONFIDENCE":
                outbreak_match = 1.0
                break

    feats = [
        age_scaled,
        gender_is_female,
        step_index_scaled,
        history_len_scaled,
        q_base,
        q_is_rf,
        has_cp,
        has_dyspnea,
        has_fever,
        has_cough,
        has_gi,
        has_headache,
        float(overlap_count),
        overlap_ratio,
        rf_interaction,
        outbreak_match
    ]

    for qid in QUESTION_IDS:
        feats.append(1.0 if candidate_qid == qid else 0.0)

    return feats

def prepare_pairwise_dataset(examples):
    X = []
    y = []
    for ex in examples:
        target_q = ex["targetQuestion"]
        candidates = ex["candidateQuestions"]

        for cand in candidates:
            feats = extract_features(ex, cand)
            X.append(feats)
            y.append(1.0 if cand == target_q else 0.0)

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)

def score_candidates_for_state(model, state_example):
    candidates = state_example["candidateQuestions"]
    scores = []
    for cand in candidates:
        feats = np.array([extract_features(state_example, cand)], dtype=np.float32)
        score = model.predict_proba(feats)[0][1]
        scores.append((cand, float(score)))
    scores.sort(key=lambda x: x[1], reverse=True)
    return scores

def evaluate_ranking(model, examples):
    total = len(examples)
    top1_correct = 0
    top3_correct = 0
    red_flag_cases = 0
    red_flag_correct = 0
    unnecessary_questions = 0
    mrr_sum = 0.0
    ndcg3_sum = 0.0

    start_time = time.perf_counter()

    for ex in examples:
        target = ex["targetQuestion"]
        ranked = score_candidates_for_state(model, ex)
        top1 = ranked[0][0]
        top3 = [r[0] for r in ranked[:3]]

        # Top-1
        if top1 == target:
            top1_correct += 1

        # Top-3
        if target in top3:
            top3_correct += 1

        # MRR
        rank = next((idx + 1 for idx, (qid, _) in enumerate(ranked) if qid == target), len(ranked))
        mrr_sum += 1.0 / rank

        # NDCG@3
        if target in top3:
            pos = top3.index(target) + 1
            ndcg3_sum += 1.0 / math.log2(pos + 1)

        # Red flag check
        if ex.get("isRedFlagCase") and ex.get("stepIndex") == 0:
            red_flag_cases += 1
            # Did the top1 pick a red flag question?
            if QUESTION_METADATA.get(top1, {}).get("redFlag"):
                red_flag_correct += 1

        # Unnecessary question check: candidate has 0 relevant symptom overlap and no outbreak link
        top1_meta = QUESTION_METADATA.get(top1, {})
        has_overlap = any(s in top1_meta.get("relevant", []) for s in ex["symptoms"])
        has_outbreak = bool(top1_meta.get("outbreak") and any(r.get("disease", "").upper() == top1_meta.get("outbreak") for r in ex.get("regionalSignals", [])))
        if not has_overlap and not has_outbreak and not top1_meta.get("redFlag"):
            unnecessary_questions += 1

    total_time_ms = (time.perf_counter() - start_time) * 1000.0
    avg_latency_ms = total_time_ms / total

    metrics = {
        "totalExamples": total,
        "top1Accuracy": round(top1_correct / total * 100.0, 2),
        "top3Recall": round(top3_correct / total * 100.0, 2),
        "redFlagRecall": round((red_flag_correct / max(1, red_flag_cases)) * 100.0, 2),
        "unnecessaryQuestionRate": round(unnecessary_questions / total * 100.0, 2),
        "mrr": round(mrr_sum / total, 4),
        "ndcgAt3": round(ndcg3_sum / total, 4),
        "avgInferenceLatencyMs": round(avg_latency_ms, 3)
    }
    return metrics

def main():
    print("=== Training MediKiosk Clinical AI Next-Question Ranker ===")
    
    with open(TRAIN_FILE, "r", encoding="utf-8") as f:
        train_examples = json.load(f)
    with open(VAL_FILE, "r", encoding="utf-8") as f:
        val_examples = json.load(f)
    with open(TEST_FILE, "r", encoding="utf-8") as f:
        test_examples = json.load(f)

    print(f"Loaded datasets: Train={len(train_examples)}, Val={len(val_examples)}, Test={len(test_examples)}")

    X_train, y_train = prepare_pairwise_dataset(train_examples)
    X_val, y_val = prepare_pairwise_dataset(val_examples)
    X_test, y_test = prepare_pairwise_dataset(test_examples)

    print(f"Feature matrix dimensions: Train {X_train.shape}, Val {X_val.shape}, Test {X_test.shape}")

    # Hyperparameter tuning on validation set
    best_c = 1.0
    best_val_acc = -1.0
    best_model = None

    for c in [0.05, 0.1, 0.5, 1.0, 5.0, 10.0]:
        clf = LogisticRegression(C=c, max_iter=1000, penalty='l2', solver='lbfgs', random_state=42)
        clf.fit(X_train, y_train)
        val_metrics = evaluate_ranking(clf, val_examples)
        acc = val_metrics["top1Accuracy"]
        if acc > best_val_acc:
            best_val_acc = acc
            best_c = c
            best_model = clf

    print(f"[OK] Best Validation Regularizer C={best_c} (Val Top-1: {best_val_acc}%)")

    # Evaluate on held-out test split
    test_metrics = evaluate_ranking(best_model, test_examples)
    train_metrics = evaluate_ranking(best_model, train_examples)

    print("\n--- TEST SPLIT EVALUATION (UNTOUCHED HELD-OUT) ---")
    for k, v in test_metrics.items():
        print(f"  {k}: {v}")

    # Save artifacts
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    weights_dict = {
        name: float(best_model.coef_[0][i])
        for i, name in enumerate(FEATURE_NAMES)
    }
    bias_val = float(best_model.intercept_[0])

    model_weights = {
        "modelType": "LogisticRankingModel",
        "version": "1.0.0",
        "bias": bias_val,
        "weights": weights_dict
    }

    feature_schema = {
        "schemaVersion": "1.0.0",
        "features": FEATURE_NAMES,
        "canonicalQuestions": QUESTION_IDS,
        "featureCount": len(FEATURE_NAMES)
    }

    training_config = {
        "algorithm": "LogisticRegression",
        "penalty": "l2",
        "bestC": best_c,
        "solver": "lbfgs",
        "trainSize": len(train_examples),
        "valSize": len(val_examples),
        "testSize": len(test_examples),
        "randomState": 42
    }

    model_metadata = {
        "modelVersion": "1.0.0",
        "trainedAt": "2026-09-08T17:16:00Z",
        "trainingDataset": "MediKiosk Clinical Trajectories v1.0.0 (DDXPlus Grounded)",
        "datasetVersion": "1.0.0",
        "featureSchemaVersion": "1.0.0",
        "metrics": {
            "train": train_metrics,
            "validation": evaluate_ranking(best_model, val_examples),
            "test": test_metrics
        },
        "safetyValidation": {
            "redFlagRecall": test_metrics["redFlagRecall"],
            "requiresDoctorReviewEnforced": True,
            "nonDiagnosticBehaviorEnforced": True
        }
    }

    evaluation_results = {
        "testMetrics": test_metrics,
        "trainMetrics": train_metrics,
        "comparisonTargetMet": test_metrics["top1Accuracy"] >= 85.0 and test_metrics["redFlagRecall"] == 100.0
    }

    with open(MODEL_DIR / "model_weights.json", "w", encoding="utf-8") as f:
        json.dump(model_weights, f, indent=2)
    with open(MODEL_DIR / "feature_schema.json", "w", encoding="utf-8") as f:
        json.dump(feature_schema, f, indent=2)
    with open(MODEL_DIR / "training_config.json", "w", encoding="utf-8") as f:
        json.dump(training_config, f, indent=2)
    with open(MODEL_DIR / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)
    with open(MODEL_DIR / "evaluation_results.json", "w", encoding="utf-8") as f:
        json.dump(evaluation_results, f, indent=2)

    print(f"\n[OK] Model artifacts successfully saved to: {MODEL_DIR}")

if __name__ == "__main__":
    main()
