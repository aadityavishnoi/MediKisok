#!/usr/bin/env python3
"""
MediKiosk Clinical AI - Model Comparison & Benchmark Evaluator
Compares Rule Engine, Standalone ML Model, and Hybrid Inference Engine
across Top-1 Accuracy, Top-3 Recall, Red-Flag Recall, Unnecessary Q Rate,
Mean Questions, MRR, NDCG@3, and Latency.
"""

import json
import math
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "datasets"
TEST_FILE = DATA_DIR / "test.json"
MODEL_WEIGHTS_FILE = BASE_DIR / "models" / "next-question" / "model_weights.json"
COMPARISON_REPORT_FILE = BASE_DIR / "evaluation" / "model_comparison_report.json"

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

with open(MODEL_WEIGHTS_FILE, "r", encoding="utf-8") as f:
    MODEL_WEIGHTS = json.load(f)

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

    patient_has_acute_rf = (has_cp > 0 or has_dyspnea > 0 or (has_gi > 0 and candidate_qid in ["GI_001", "GI_002"]) or (has_headache > 0 and candidate_qid == "NEURO_001"))
    rf_interaction = 1.0 if (patient_has_acute_rf and q_is_rf > 0) else 0.0

    outbreak_target = q_meta.get("outbreak")
    outbreak_match = 0.0
    if outbreak_target:
        for r in regional:
            if r.get("disease", "").upper() == outbreak_target.upper() and r.get("riskLevel") in ["HIGH", "CRITICAL"] and r.get("confidence") != "LOW_CONFIDENCE":
                outbreak_match = 1.0
                break

    feats = {
        "age_scaled": age_scaled,
        "gender_is_female": gender_is_female,
        "step_index_scaled": step_index_scaled,
        "history_len_scaled": history_len_scaled,
        "q_base_score": q_base,
        "q_is_red_flag": q_is_rf,
        "state_has_chest_pain": has_cp,
        "state_has_dyspnea": has_dyspnea,
        "state_has_fever": has_fever,
        "state_has_cough": has_cough,
        "state_has_gi": has_gi,
        "state_has_headache": has_headache,
        "symptom_overlap_count": float(overlap_count),
        "symptom_overlap_ratio": overlap_ratio,
        "active_red_flag_interaction": rf_interaction,
        "regional_outbreak_match": outbreak_match
    }
    for qid in QUESTION_IDS:
        feats[f"q_is_{qid}"] = 1.0 if candidate_qid == qid else 0.0

    return feats

def compute_ml_score(feats):
    w = MODEL_WEIGHTS["weights"]
    bias = MODEL_WEIGHTS["bias"]
    logit = bias + sum(feats[k] * w.get(k, 0.0) for k in feats)
    return 1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, logit))))

# 1. Deterministic Rule Engine (Simulating QuestionPrioritizer)
def score_rule_engine(state_example):
    candidates = state_example["candidateQuestions"]
    symptoms = state_example["symptoms"]
    regional = state_example.get("regionalSignals", [])

    has_cp = any("CHEST" in s for s in symptoms)
    has_dyspnea = any("DYSPNEA" in s or "SHORTNESS" in s for s in symptoms)

    covid_surge = any(r.get("disease", "").upper() == "COVID-19" and r.get("riskLevel") in ["HIGH", "CRITICAL"] for r in regional)
    dengue_surge = any(r.get("disease", "").upper() == "DENGUE" and r.get("riskLevel") in ["HIGH", "CRITICAL"] for r in regional)

    scored = []
    for cand in candidates:
        meta = QUESTION_METADATA.get(cand, {})
        base = meta.get("baseScore", 0.5)
        is_rf = meta.get("redFlag", False)

        score = base
        if is_rf and ((cand in ["CARD_001", "CARD_002"] and has_cp) or (cand == "RESP_001" and has_dyspnea)):
            score += 1.50
        elif is_rf:
            score += 0.20

        # Relevance
        if any(s in meta.get("relevant", []) for s in symptoms):
            score += 0.45

        # Outbreak
        if cand.startswith("RESP") and covid_surge:
            score += 0.50
        elif (cand.startswith("FEV") or cand.startswith("DENGUE")) and dengue_surge:
            score += 0.50

        scored.append((cand, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored

# 2. Standalone ML Model
def score_ml_model(state_example):
    candidates = state_example["candidateQuestions"]
    scored = []
    for cand in candidates:
        feats = extract_features(state_example, cand)
        score = compute_ml_score(feats)
        scored.append((cand, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored

# 3. Hybrid Engine: ML Model + Deterministic Red-Flag Safety Override
def score_hybrid_engine(state_example):
    candidates = state_example["candidateQuestions"]
    symptoms = state_example["symptoms"]

    has_acute_rf = (
        any("CHEST" in s for s in symptoms) or
        any("DYSPNEA" in s or "SHORTNESS" in s for s in symptoms) or
        any("EMESIS" in s or "ABDOMINAL" in s for s in symptoms) or
        any("HEADACHE" in s or "CEPHALEA" in s for s in symptoms)
    )

    scored = []
    for cand in candidates:
        feats = extract_features(state_example, cand)
        ml_prob = compute_ml_score(feats)
        meta = QUESTION_METADATA.get(cand, {})

        # Strict safety override: if patient has acute red flag symptom and question is red flag
        safety_boost = 0.0
        if has_acute_rf and meta.get("redFlag"):
            if (cand in ["CARD_001", "CARD_002"] and any("CHEST" in s for s in symptoms)) or \
               (cand == "RESP_001" and any("DYSPNEA" in s or "SHORTNESS" in s for s in symptoms)) or \
               (cand == "NEURO_001" and any("HEADACHE" in s for s in symptoms)) or \
               (cand in ["GI_001", "GI_002"] and any("EMESIS" in s or "ABDOMINAL" in s for s in symptoms)):
                safety_boost = 5.0

        scored.append((cand, ml_prob + safety_boost))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored

def evaluate_system(system_fn, test_examples):
    total = len(test_examples)
    top1_correct = 0
    top3_correct = 0
    red_flag_cases = 0
    red_flag_correct = 0
    unnecessary = 0
    mrr_sum = 0.0
    ndcg3_sum = 0.0

    start = time.perf_counter()
    for ex in test_examples:
        target = ex["targetQuestion"]
        ranked = system_fn(ex)
        top1 = ranked[0][0]
        top3 = [r[0] for r in ranked[:3]]

        if top1 == target:
            top1_correct += 1
        if target in top3:
            top3_correct += 1

        rank = next((idx + 1 for idx, (qid, _) in enumerate(ranked) if qid == target), len(ranked))
        mrr_sum += 1.0 / rank

        if target in top3:
            pos = top3.index(target) + 1
            ndcg3_sum += 1.0 / math.log2(pos + 1)

        if ex.get("isRedFlagCase") and ex.get("stepIndex") == 0:
            red_flag_cases += 1
            if QUESTION_METADATA.get(top1, {}).get("redFlag"):
                red_flag_correct += 1

        top1_meta = QUESTION_METADATA.get(top1, {})
        has_overlap = any(s in top1_meta.get("relevant", []) for s in ex["symptoms"])
        has_outbreak = bool(top1_meta.get("outbreak") and any(r.get("disease", "").upper() == top1_meta.get("outbreak") for r in ex.get("regionalSignals", [])))
        if not has_overlap and not has_outbreak and not top1_meta.get("redFlag"):
            unnecessary += 1

    total_time_ms = (time.perf_counter() - start) * 1000.0
    latency_ms = total_time_ms / total

    return {
        "top1Accuracy": round(top1_correct / total * 100.0, 2),
        "top3Recall": round(top3_correct / total * 100.0, 2),
        "redFlagRecall": round((red_flag_correct / max(1, red_flag_cases)) * 100.0, 2),
        "unnecessaryQuestionRate": round(unnecessary / total * 100.0, 2),
        "mrr": round(mrr_sum / total, 4),
        "ndcgAt3": round(ndcg3_sum / total, 4),
        "latencyMs": round(latency_ms, 3)
    }

def main():
    with open(TEST_FILE, "r", encoding="utf-8") as f:
        test_examples = json.load(f)

    print("=== MediKiosk Head-to-Head Architecture Comparison ===")
    print(f"Evaluating on held-out test split: {len(test_examples)} examples\n")

    rule_metrics = evaluate_system(score_rule_engine, test_examples)
    ml_metrics = evaluate_system(score_ml_model, test_examples)
    hybrid_metrics = evaluate_system(score_hybrid_engine, test_examples)

    print(f"{'Metric':<25} | {'Rule Engine':<12} | {'ML Model':<12} | {'Hybrid Engine':<14}")
    print("-" * 72)
    print(f"{'Top-1 Accuracy':<25} | {str(rule_metrics['top1Accuracy'])+'%':<12} | {str(ml_metrics['top1Accuracy'])+'%':<12} | {str(hybrid_metrics['top1Accuracy'])+'%':<14}")
    print(f"{'Top-3 Recall':<25} | {str(rule_metrics['top3Recall'])+'%':<12} | {str(ml_metrics['top3Recall'])+'%':<12} | {str(hybrid_metrics['top3Recall'])+'%':<14}")
    print(f"{'Red-Flag Recall':<25} | {str(rule_metrics['redFlagRecall'])+'%':<12} | {str(ml_metrics['redFlagRecall'])+'%':<12} | {str(hybrid_metrics['redFlagRecall'])+'%':<14}")
    print(f"{'Unnecessary Q Rate':<25} | {str(rule_metrics['unnecessaryQuestionRate'])+'%':<12} | {str(ml_metrics['unnecessaryQuestionRate'])+'%':<12} | {str(hybrid_metrics['unnecessaryQuestionRate'])+'%':<14}")
    print(f"{'MRR':<25} | {rule_metrics['mrr']:<12} | {ml_metrics['mrr']:<12} | {hybrid_metrics['mrr']:<14}")
    print(f"{'NDCG@3':<25} | {rule_metrics['ndcgAt3']:<12} | {ml_metrics['ndcgAt3']:<12} | {hybrid_metrics['ndcgAt3']:<14}")
    print(f"{'Inference Latency':<25} | {str(rule_metrics['latencyMs'])+' ms':<12} | {str(ml_metrics['latencyMs'])+' ms':<12} | {str(hybrid_metrics['latencyMs'])+' ms':<14}")

    report = {
        "ruleEngine": rule_metrics,
        "mlModel": ml_metrics,
        "hybridEngine": hybrid_metrics,
        "evaluationDataset": "test.json",
        "exampleCount": len(test_examples),
        "evaluatedAt": "2026-09-08T17:18:00Z"
    }
    with open(COMPARISON_REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"\n[OK] Comparison report saved to: {COMPARISON_REPORT_FILE}")

if __name__ == "__main__":
    main()
