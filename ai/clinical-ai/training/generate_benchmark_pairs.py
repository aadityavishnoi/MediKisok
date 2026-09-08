#!/usr/bin/env python3
"""
MediKiosk Clinical AI - Benchmark Pairs Generator
Generates clinical benchmark trajectories grounded in DDXPlus evidence distributions
and verified clinical triage protocols for quantitative evaluation.
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
EVAL_DIR = BASE_DIR / "evaluation"
OUTPUT_DATASET = EVAL_DIR / "benchmark_dataset.json"

BENCHMARK_TRAJECTORIES = [
    {
        "id": "BENCH_01_FEVER_SOLO",
        "description": "Patient presenting with acute fever only; expected next question is fever chronometry/rigors",
        "patient": {"age": 28, "gender": "M"},
        "symptoms": ["fever"],
        "answers": {},
        "regionalSignals": [],
        "expected_top1": "FEV_001",
        "acceptable_top3": ["FEV_001", "FEV_002", "RESP_001"],
        "is_red_flag_case": False
    },
    {
        "id": "BENCH_02_FEVER_COUGH",
        "description": "Patient presenting with fever and acute cough; expected next question is respiratory screening or sputum",
        "patient": {"age": 45, "gender": "F"},
        "symptoms": ["fever", "cough"],
        "answers": {},
        "regionalSignals": [],
        "expected_top1": "RESP_001",
        "acceptable_top3": ["RESP_001", "RESP_002", "FEV_001"],
        "is_red_flag_case": True
    },
    {
        "id": "BENCH_03_DYSPNEA_ACUTE",
        "description": "Patient presenting with acute dyspnea / shortness of breath; red-flag trigger",
        "patient": {"age": 60, "gender": "M"},
        "symptoms": ["shortness of breath", "fever"],
        "answers": {},
        "regionalSignals": [],
        "expected_top1": "RESP_001",
        "acceptable_top3": ["RESP_001"],
        "is_red_flag_case": True
    },
    {
        "id": "BENCH_04_CHEST_PAIN",
        "description": "Patient presenting with severe retrosternal chest discomfort; immediate cardiac escalation",
        "patient": {"age": 58, "gender": "M"},
        "symptoms": ["chest pain"],
        "answers": {},
        "regionalSignals": [],
        "expected_top1": "CARD_001",
        "acceptable_top3": ["CARD_001", "CARD_002"],
        "is_red_flag_case": True
    },
    {
        "id": "BENCH_05_COVID_REGIONAL_SURGE",
        "description": "Patient presenting with mild fever and sore throat during high-confidence COVID outbreak",
        "patient": {"age": 34, "gender": "F"},
        "symptoms": ["fever", "sore throat"],
        "answers": {},
        "regionalSignals": [
            {
                "regionId": "DISTRICT_LUCKNOW",
                "disease": "COVID-19",
                "riskLevel": "HIGH",
                "positivityRate": 0.18,
                "confidence": "HIGH_CONFIDENCE",
                "trend": "OUTBREAK_SURGE"
            }
        ],
        "expected_top1": "RESP_001",
        "acceptable_top3": ["RESP_001", "RESP_002", "RESP_003"],
        "is_red_flag_case": True
    },
    {
        "id": "BENCH_06_DENGUE_REGIONAL_SURGE",
        "description": "Patient presenting with high fever and body ache during Dengue surge",
        "patient": {"age": 22, "gender": "M"},
        "symptoms": ["fever", "joint pain"],
        "answers": {},
        "regionalSignals": [
            {
                "regionId": "DISTRICT_VARANASI",
                "disease": "Dengue",
                "riskLevel": "HIGH",
                "positivityRate": 0.14,
                "confidence": "HIGH_CONFIDENCE",
                "trend": "OUTBREAK_SURGE"
            }
        ],
        "expected_top1": "DENGUE_001",
        "acceptable_top3": ["DENGUE_001", "FEV_001", "FEV_002"],
        "is_red_flag_case": False
    },
    {
        "id": "BENCH_07_EXHAUSTED_INTAKE",
        "description": "Patient having answered all core screening questions; should cleanly conclude with nextQuestion: null",
        "patient": {"age": 30, "gender": "F"},
        "symptoms": ["routine checkup"],
        "answers": {
            "RESP_001": "no",
            "RESP_002": "no_cough",
            "RESP_003": "no",
            "CARD_001": "no_localized",
            "CARD_002": "no",
            "FEV_001": "acute_1_to_3_days",
            "FEV_002": "no",
            "DENGUE_001": "no",
            "GI_001": "able_to_hydrate",
            "GI_002": "no_diffuse_mild",
            "NEURO_001": "no"
        },
        "regionalSignals": [],
        "expected_top1": None,
        "acceptable_top3": [],
        "is_red_flag_case": False
    }
]

def main():
    EVAL_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_DATASET, "w", encoding="utf-8") as f:
        json.dump(BENCHMARK_TRAJECTORIES, f, indent=2)
    print(f"[OK] Generated {len(BENCHMARK_TRAJECTORIES)} benchmark evaluation trajectories -> {OUTPUT_DATASET}")

if __name__ == "__main__":
    main()
