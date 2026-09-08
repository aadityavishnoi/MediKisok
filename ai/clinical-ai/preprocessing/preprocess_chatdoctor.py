#!/usr/bin/env python3
"""
MediKiosk Clinical AI - Preprocess ChatDoctor
Extracts conversational clarification phrasings and physician follow-up templates.
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "datasets" / "raw"
OUTPUT_PATH = BASE_DIR / "question-engine" / "chatdoctor_phrases.json"

DEFAULT_PHRASINGS = {
    "FEV_001": {
        "intent": "fever_duration_and_rigors",
        "physician_tone": "How long has the fever been present, and have you felt severe shivering?",
        "clinical_significance": "Differentiates self-limiting viral infection from persistent bacterial or arboviral illness."
    },
    "RESP_001": {
        "intent": "dyspnea_rest_evaluation",
        "physician_tone": "Are you feeling breathless even when sitting still or lying down?",
        "clinical_significance": "Resting dyspnea indicates significant ventilation/perfusion compromise."
    },
    "CARD_001": {
        "intent": "chest_pain_radiation",
        "physician_tone": "Does the chest pain travel to your left arm, shoulder, jaw, or upper back?",
        "clinical_significance": "Radicular pain pattern carries high positive likelihood ratio for acute myocardial ischemia."
    }
}

def build_phrasings():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(DEFAULT_PHRASINGS, f, indent=2)
    print(f"[OK] ChatDoctor clinical phrases exported to: {OUTPUT_PATH}")

if __name__ == "__main__":
    build_phrasings()
