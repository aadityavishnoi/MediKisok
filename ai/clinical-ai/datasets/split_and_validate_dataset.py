#!/usr/bin/env python3
"""
MediKiosk Clinical AI - Trajectory Dataset Splitter & Quality Validator
Splits clinical trajectories by caseId (70% Train, 15% Val, 15% Test) with strict
leakage prevention and generates a comprehensive data quality report (Phase 14).
"""

import json
import random
from collections import Counter
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "datasets"
INPUT_FILE = DATA_DIR / "training_trajectories.json"

TRAIN_FILE = DATA_DIR / "train.json"
VAL_FILE = DATA_DIR / "val.json"
TEST_FILE = DATA_DIR / "test.json"
REPORT_FILE = DATA_DIR / "dataset_report.json"

def split_and_validate():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        all_examples = json.load(f)

    # 1. Group examples by caseId
    cases = {}
    for ex in all_examples:
        cid = ex["caseId"]
        if cid not in cases:
            cases[cid] = []
        cases[cid].append(ex)

    case_ids = list(cases.keys())
    random.seed(1337)
    random.shuffle(case_ids)

    n_cases = len(case_ids)
    n_train = int(n_cases * 0.70)
    n_val = int(n_cases * 0.15)
    n_test = n_cases - n_train - n_val

    train_cids = set(case_ids[:n_train])
    val_cids = set(case_ids[n_train:n_train + n_val])
    test_cids = set(case_ids[n_train + n_val:])

    # Strict leakage validation
    assert len(train_cids.intersection(val_cids)) == 0, "Leakage between Train and Val!"
    assert len(train_cids.intersection(test_cids)) == 0, "Leakage between Train and Test!"
    assert len(val_cids.intersection(test_cids)) == 0, "Leakage between Val and Test!"

    train_data = [ex for cid in train_cids for ex in cases[cid]]
    val_data = [ex for cid in val_cids for ex in cases[cid]]
    test_data = [ex for cid in test_cids for ex in cases[cid]]

    # 2. Check for missing values and duplicates
    missing_values = 0
    seen_signatures = set()
    duplicates = 0

    for ex in all_examples:
        if not ex.get("caseId") or not ex.get("patient") or not ex.get("targetQuestion"):
            missing_values += 1
        sig = (
            ex["patient"]["age"],
            ex["patient"]["gender"],
            tuple(sorted(ex["symptoms"])),
            tuple(sorted(h["questionId"] + ":" + str(h["answer"]) for h in ex["history"])),
            ex["targetQuestion"]
        )
        if sig in seen_signatures:
            duplicates += 1
        else:
            seen_signatures.add(sig)

    # 3. Class and Candidate distributions
    target_dist = dict(Counter(ex["targetQuestion"] for ex in all_examples))
    candidate_lengths = [len(ex["candidateQuestions"]) for ex in all_examples]

    report = {
        "datasetVersion": "1.0.0",
        "generatedAt": "2026-09-08T17:15:00Z",
        "sourceDataset": "DDXPlus-NeurIPS2022 + ChatDoctor + ClinicalTriageProtocols",
        "totalCases": n_cases,
        "totalExamples": len(all_examples),
        "splits": {
            "trainCases": len(train_cids),
            "trainExamples": len(train_data),
            "valCases": len(val_cids),
            "valExamples": len(val_data),
            "testCases": len(test_cids),
            "testExamples": len(test_data)
        },
        "leakageDetected": False,
        "missingValues": missing_values,
        "duplicateStateTransitions": duplicates,
        "uniqueQuestionsTargeted": len(target_dist),
        "targetQuestionDistribution": target_dist,
        "meanCandidatesPerStep": round(sum(candidate_lengths) / len(candidate_lengths), 2),
        "isRedFlagCaseCount": sum(1 for ex in all_examples if ex["isRedFlagCase"])
    }

    # 4. Save splits
    with open(TRAIN_FILE, "w", encoding="utf-8") as f:
        json.dump(train_data, f, indent=2)
    with open(VAL_FILE, "w", encoding="utf-8") as f:
        json.dump(val_data, f, indent=2)
    with open(TEST_FILE, "w", encoding="utf-8") as f:
        json.dump(test_data, f, indent=2)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("=== MediKiosk Dataset Splitting & Quality Report ===")
    print(f"Total Cases:     {n_cases} (Train: {len(train_cids)}, Val: {len(val_cids)}, Test: {len(test_cids)})")
    print(f"Total Examples:  {len(all_examples)} (Train: {len(train_data)}, Val: {len(val_data)}, Test: {len(test_data)})")
    print(f"Leakage Check:   PASSED (0 overlapping trajectories)")
    print(f"Missing Values:  {missing_values}")
    print(f"Report Artifact: {REPORT_FILE}")

if __name__ == "__main__":
    split_and_validate()
