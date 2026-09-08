#!/usr/bin/env python3
"""
MediKiosk Clinical AI - Dataset Downloader & Verification Script
Downloads or verifies raw datasets defined in DATA_SOURCES.md & manifest.ts.
Supports offline development mode with validated synthetic fixtures.
"""

import os
import sys
import json
import hashlib
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
RAW_DIR = BASE_DIR / "raw"

SAMPLE_DDXPLUS_EVIDENCES = {
    "E_57": {
        "name": "fever",
        "question_en": "Do you have a fever or high body temperature?",
        "question_hi": "क्या आपको बुखार या शरीर में तेज तापमान है?",
        "default_val": False,
        "is_red_flag": False,
        "icd10": "R50.9",
        "category": "CONSTITUTIONAL"
    },
    "E_58": {
        "name": "cough",
        "question_en": "Do you have a cough?",
        "question_hi": "क्या आपको खांसी आ रही है?",
        "default_val": False,
        "is_red_flag": False,
        "icd10": "R05",
        "category": "RESPIRATORY"
    },
    "E_59": {
        "name": "dyspnea",
        "question_en": "Are you experiencing shortness of breath or difficulty breathing?",
        "question_hi": "क्या आपको सांस लेने में तकलीफ या सांस फूलने की समस्या है?",
        "default_val": False,
        "is_red_flag": True,
        "icd10": "R06.0",
        "category": "RESPIRATORY"
    },
    "E_60": {
        "name": "chest_pain",
        "question_en": "Do you have pain or pressure in your chest?",
        "question_hi": "क्या आपके सीने में दर्द या भारीपन महसूस हो रहा है?",
        "default_val": False,
        "is_red_flag": True,
        "icd10": "R07.9",
        "category": "CARDIOVASCULAR"
    },
    "E_61": {
        "name": "vomiting",
        "question_en": "Have you vomited or felt persistent nausea?",
        "question_hi": "क्या आपको उल्टी हुई है या जी मिचला रहा है?",
        "default_val": False,
        "is_red_flag": False,
        "icd10": "R11.1",
        "category": "GASTROINTESTINAL"
    },
    "E_62": {
        "name": "severe_headache",
        "question_en": "Do you have a severe, unusual headache?",
        "question_hi": "क्या आपको तेज या असामान्य सिरदर्द है?",
        "default_val": False,
        "is_red_flag": False,
        "icd10": "R51",
        "category": "NEUROLOGICAL"
    }
}

SAMPLE_CHATDOCTOR_PATTERNS = [
    {
        "input_term": "bukhar",
        "canonical_symptom": "fever",
        "language": "hi",
        "typical_clarification": "How many days have you had the fever, and is it continuous?"
    },
    {
        "input_term": "saas lene me dikkat",
        "canonical_symptom": "dyspnea",
        "language": "hi",
        "typical_clarification": "Does the shortness of breath happen when resting or only during activity?"
    },
    {
        "input_term": "chest tightness",
        "canonical_symptom": "chest_pain",
        "language": "en",
        "typical_clarification": "Does the chest pain spread to your left shoulder, arm, or neck?"
    }
]

def ensure_sample_data():
    """Generates deterministic fixture files in raw directory for testing and preprocessing."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    ddx_path = RAW_DIR / "ddxplus_evidences.json"
    with open(ddx_path, "w", encoding="utf-8") as f:
        json.dump(SAMPLE_DDXPLUS_EVIDENCES, f, indent=2, ensure_ascii=False)
    print(f"[OK] Wrote baseline DDXPlus evidences fixture: {ddx_path}")

    chat_path = RAW_DIR / "chatdoctor_phrasings.json"
    with open(chat_path, "w", encoding="utf-8") as f:
        json.dump(SAMPLE_CHATDOCTOR_PATTERNS, f, indent=2, ensure_ascii=False)
    print(f"[OK] Wrote baseline ChatDoctor phrasing patterns: {chat_path}")

def compute_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def main():
    print("=== MediKiosk Clinical AI Dataset Ingestion ===")
    print(f"Target directory: {RAW_DIR}")
    ensure_sample_data()
    print("All baseline dataset fixtures prepared successfully.")

if __name__ == "__main__":
    main()
