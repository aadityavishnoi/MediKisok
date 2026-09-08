#!/usr/bin/env python3
"""
MediKiosk Clinical AI - Reproducible Clinical Trajectory Generator
Generates clinical intake trajectories grounded in DDXPlus pathology-evidence distributions,
clinical triage protocols, ICD-10 canonical symptoms, and regional outbreak signals.

Each clinical case generates a sequential multi-step questioning trajectory:
State(t) -> Target Question(t) + Hard Negatives(t) -> Answer(t) -> State(t+1)
"""

import json
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_FILE = BASE_DIR / "datasets" / "training_trajectories.json"

# All Canonical Questions in the Clinical Knowledge Graph
ALL_QUESTIONS = [
    {
        "id": "RESP_001",
        "category": "RESPIRATORY",
        "redFlag": True,
        "baseScore": 0.95,
        "relevantSymptoms": ["DYSPNEA_ACUTE", "COUGH_ACUTE", "FEVER_ACUTE", "PHARYNGITIS_ACUTE"],
        "outbreakDisease": "COVID-19",
        "typicalAnswers": ["yes", "no"]
    },
    {
        "id": "RESP_002",
        "category": "RESPIRATORY",
        "redFlag": False,
        "baseScore": 0.80,
        "relevantSymptoms": ["COUGH_ACUTE", "FEVER_ACUTE", "PHARYNGITIS_ACUTE"],
        "outbreakDisease": "COVID-19",
        "typicalAnswers": ["dry_under_week", "productive_phlegm", "no_cough"]
    },
    {
        "id": "RESP_003",
        "category": "RESPIRATORY",
        "redFlag": False,
        "baseScore": 0.75,
        "relevantSymptoms": ["FEVER_ACUTE", "COUGH_ACUTE", "PHARYNGITIS_ACUTE", "LOSS_OF_SMELL", "LOSS_OF_TASTE"],
        "outbreakDisease": "COVID-19",
        "typicalAnswers": ["yes", "no"]
    },
    {
        "id": "CARD_001",
        "category": "CARDIOVASCULAR",
        "redFlag": True,
        "baseScore": 0.99,
        "relevantSymptoms": ["PRECORDIAL_CHEST_PAIN", "CARDIAC_PALPITATIONS", "DYSPNEA_ACUTE"],
        "outbreakDisease": None,
        "typicalAnswers": ["yes_radiating", "no_localized"]
    },
    {
        "id": "CARD_002",
        "category": "CARDIOVASCULAR",
        "redFlag": True,
        "baseScore": 0.96,
        "relevantSymptoms": ["PRECORDIAL_CHEST_PAIN"],
        "outbreakDisease": None,
        "typicalAnswers": ["yes_pressure_sweating", "no"]
    },
    {
        "id": "FEV_001",
        "category": "CONSTITUTIONAL",
        "redFlag": False,
        "baseScore": 0.88,
        "relevantSymptoms": ["FEVER_ACUTE", "RIGORS_CHILLS", "MALAISE_FATIGUE"],
        "outbreakDisease": "Dengue",
        "typicalAnswers": ["acute_1_to_3_days", "subacute_4_to_7_days"]
    },
    {
        "id": "FEV_002",
        "category": "CONSTITUTIONAL",
        "redFlag": False,
        "baseScore": 0.82,
        "relevantSymptoms": ["FEVER_ACUTE", "RIGORS_CHILLS"],
        "outbreakDisease": "Dengue",
        "typicalAnswers": ["yes", "no"]
    },
    {
        "id": "DENGUE_001",
        "category": "CONSTITUTIONAL",
        "redFlag": False,
        "baseScore": 0.85,
        "relevantSymptoms": ["FEVER_ACUTE", "RIGORS_CHILLS", "JOINT_PAIN", "CEPHALEA_HEADACHE"],
        "outbreakDisease": "Dengue",
        "typicalAnswers": ["yes", "no"]
    },
    {
        "id": "GI_001",
        "category": "GASTROINTESTINAL",
        "redFlag": True,
        "baseScore": 0.84,
        "relevantSymptoms": ["EMESIS_VOMITING", "DIARRHEA_ACUTE", "ABDOMINAL_PAIN_UNSPECIFIED"],
        "outbreakDisease": "Cholera",
        "typicalAnswers": ["unable_to_drink", "able_to_hydrate"]
    },
    {
        "id": "GI_002",
        "category": "GASTROINTESTINAL",
        "redFlag": True,
        "baseScore": 0.86,
        "relevantSymptoms": ["ABDOMINAL_PAIN_UNSPECIFIED", "EMESIS_VOMITING"],
        "outbreakDisease": None,
        "typicalAnswers": ["yes_severe_rlq", "no_diffuse_mild"]
    },
    {
        "id": "NEURO_001",
        "category": "NEUROLOGICAL",
        "redFlag": True,
        "baseScore": 0.94,
        "relevantSymptoms": ["CEPHALEA_HEADACHE", "FEVER_ACUTE"],
        "outbreakDisease": None,
        "typicalAnswers": ["yes_stiff_neck", "no"]
    }
]

QUESTION_MAP = {q["id"]: q for q in ALL_QUESTIONS}

# Clinical Case Archetypes based on DDXPlus conditions and verified triage paths
CASE_ARCHETYPES = [
    # 1. Acute Cardiac / Chest Pain Presentations
    {
        "syndrome": "ACUTE_CORONARY_SYNDROME",
        "symptoms": ["PRECORDIAL_CHEST_PAIN", "DYSPNEA_ACUTE"],
        "targetSequence": ["CARD_001", "CARD_002", "RESP_001"],
        "preferredAnswers": {"CARD_001": "yes_radiating", "CARD_002": "yes_pressure_sweating", "RESP_001": "yes"},
        "ageRange": (45, 78),
        "isRedFlag": True,
        "regionalOutbreak": None
    },
    {
        "syndrome": "NON_CARDIAC_CHEST_DISCOMFORT",
        "symptoms": ["PRECORDIAL_CHEST_PAIN"],
        "targetSequence": ["CARD_001", "CARD_002"],
        "preferredAnswers": {"CARD_001": "no_localized", "CARD_002": "no"},
        "ageRange": (20, 45),
        "isRedFlag": True,
        "regionalOutbreak": None
    },
    # 2. Acute Respiratory Presentations
    {
        "syndrome": "VIRAL_RESPIRATORY_COVID",
        "symptoms": ["FEVER_ACUTE", "COUGH_ACUTE", "PHARYNGITIS_ACUTE"],
        "targetSequence": ["RESP_001", "RESP_002", "RESP_003", "FEV_001"],
        "preferredAnswers": {"RESP_001": "no", "RESP_002": "dry_under_week", "RESP_003": "yes", "FEV_001": "acute_1_to_3_days"},
        "ageRange": (18, 65),
        "isRedFlag": False,
        "regionalOutbreak": "COVID-19"
    },
    {
        "syndrome": "COMMUNITY_ACQUIRED_PNEUMONIA",
        "symptoms": ["FEVER_ACUTE", "COUGH_ACUTE", "DYSPNEA_ACUTE"],
        "targetSequence": ["RESP_001", "RESP_002", "FEV_001", "FEV_002"],
        "preferredAnswers": {"RESP_001": "yes", "RESP_002": "productive_phlegm", "FEV_001": "subacute_4_to_7_days", "FEV_002": "yes"},
        "ageRange": (30, 75),
        "isRedFlag": True,
        "regionalOutbreak": None
    },
    {
        "syndrome": "ACUTE_BRONCHITIS",
        "symptoms": ["COUGH_ACUTE"],
        "targetSequence": ["RESP_001", "RESP_002"],
        "preferredAnswers": {"RESP_001": "no", "RESP_002": "productive_phlegm"},
        "ageRange": (16, 55),
        "isRedFlag": False,
        "regionalOutbreak": None
    },
    # 3. Tropical Febrile Syndromes
    {
        "syndrome": "DENGUE_FEVER",
        "symptoms": ["FEVER_ACUTE", "JOINT_PAIN", "CEPHALEA_HEADACHE", "MALAISE_FATIGUE"],
        "targetSequence": ["DENGUE_001", "FEV_001", "FEV_002"],
        "preferredAnswers": {"DENGUE_001": "yes", "FEV_001": "acute_1_to_3_days", "FEV_002": "no"},
        "ageRange": (14, 60),
        "isRedFlag": False,
        "regionalOutbreak": "DENGUE"
    },
    {
        "syndrome": "MALARIA_FEBRILE",
        "symptoms": ["FEVER_ACUTE", "RIGORS_CHILLS"],
        "targetSequence": ["FEV_001", "FEV_002", "DENGUE_001"],
        "preferredAnswers": {"FEV_001": "acute_1_to_3_days", "FEV_002": "yes", "DENGUE_001": "no"},
        "ageRange": (12, 68),
        "isRedFlag": False,
        "regionalOutbreak": None
    },
    {
        "syndrome": "ACUTE_FEVER_UNDIFFERENTIATED",
        "symptoms": ["FEVER_ACUTE"],
        "targetSequence": ["FEV_001", "FEV_002"],
        "preferredAnswers": {"FEV_001": "acute_1_to_3_days", "FEV_002": "no"},
        "ageRange": (18, 50),
        "isRedFlag": False,
        "regionalOutbreak": None
    },
    # 4. Gastrointestinal Presentations
    {
        "syndrome": "ACUTE_GASTROENTERITIS_DEHYDRATION",
        "symptoms": ["EMESIS_VOMITING", "DIARRHEA_ACUTE"],
        "targetSequence": ["GI_001", "GI_002"],
        "preferredAnswers": {"GI_001": "unable_to_drink", "GI_002": "no_diffuse_mild"},
        "ageRange": (10, 70),
        "isRedFlag": True,
        "regionalOutbreak": "CHOLERA"
    },
    {
        "syndrome": "ACUTE_APPENDICITIS",
        "symptoms": ["ABDOMINAL_PAIN_UNSPECIFIED", "EMESIS_VOMITING"],
        "targetSequence": ["GI_002", "GI_001"],
        "preferredAnswers": {"GI_002": "yes_severe_rlq", "GI_001": "able_to_hydrate"},
        "ageRange": (14, 45),
        "isRedFlag": True,
        "regionalOutbreak": None
    },
    # 5. Neurological Presentations
    {
        "syndrome": "ACUTE_MENINGISMUS_EMERGENCY",
        "symptoms": ["CEPHALEA_HEADACHE", "FEVER_ACUTE"],
        "targetSequence": ["NEURO_001", "FEV_001"],
        "preferredAnswers": {"NEURO_001": "yes_stiff_neck", "FEV_001": "acute_1_to_3_days"},
        "ageRange": (15, 65),
        "isRedFlag": True,
        "regionalOutbreak": None
    },
    {
        "syndrome": "BENIGN_HEADACHE",
        "symptoms": ["CEPHALEA_HEADACHE"],
        "targetSequence": ["NEURO_001"],
        "preferredAnswers": {"NEURO_001": "no"},
        "ageRange": (20, 55),
        "isRedFlag": True,
        "regionalOutbreak": None
    }
]

def generate_cases_and_trajectories(num_cases_per_archetype=12):
    """
    Generates realistic clinical trajectories with sequential state transitions and hard negative sampling.
    """
    random.seed(42)
    trajectories = []
    case_counter = 0

    for archetype in CASE_ARCHETYPES:
        for i in range(num_cases_per_archetype):
            case_counter += 1
            case_id = f"CASE_{archetype['syndrome'][:6]}_{case_counter:04d}"
            
            age = random.randint(*archetype["ageRange"])
            gender = random.choice(["M", "F"])
            
            # Regional signal simulation
            regional_signals = []
            if archetype["regionalOutbreak"] == "COVID-19":
                regional_signals.append({
                    "regionId": "DIST_NORTH_01",
                    "disease": "COVID-19",
                    "riskLevel": "HIGH",
                    "positivityRate": round(random.uniform(0.15, 0.28), 2),
                    "confidence": "HIGH_CONFIDENCE"
                })
            elif archetype["regionalOutbreak"] == "DENGUE":
                regional_signals.append({
                    "regionId": "DIST_SOUTH_02",
                    "disease": "Dengue",
                    "riskLevel": "HIGH",
                    "positivityRate": round(random.uniform(0.12, 0.22), 2),
                    "confidence": "HIGH_CONFIDENCE"
                })
            elif archetype["regionalOutbreak"] == "CHOLERA":
                regional_signals.append({
                    "regionId": "DIST_EAST_03",
                    "disease": "Cholera",
                    "riskLevel": "HIGH",
                    "positivityRate": round(random.uniform(0.08, 0.18), 2),
                    "confidence": "HIGH_CONFIDENCE"
                })
            
            # Step through trajectory sequentially
            history = []
            target_seq = archetype["targetSequence"]
            
            for step_idx, target_q in enumerate(target_seq):
                answered_ids = {h["questionId"] for h in history}
                
                # Eligible candidate questions are all questions not yet answered
                candidates = [q["id"] for q in ALL_QUESTIONS if q["id"] not in answered_ids]
                
                # Verify target is in candidates
                if target_q not in candidates:
                    candidates.append(target_q)
                
                # Hard negatives are the other eligible candidates
                negatives = [c for c in candidates if c != target_q]
                
                # Create training example
                example = {
                    "caseId": case_id,
                    "syndrome": archetype["syndrome"],
                    "stepIndex": step_idx,
                    "patient": {
                        "age": age,
                        "gender": gender
                    },
                    "symptoms": list(archetype["symptoms"]),
                    "history": list(history),
                    "regionalSignals": list(regional_signals),
                    "candidateQuestions": candidates,
                    "targetQuestion": target_q,
                    "negativeQuestions": negatives,
                    "isRedFlagCase": archetype["isRedFlag"]
                }
                trajectories.append(example)
                
                # Apply answer and transition to next state
                chosen_answer = archetype["preferredAnswers"].get(
                    target_q,
                    random.choice(QUESTION_MAP[target_q]["typicalAnswers"])
                )
                history.append({
                    "questionId": target_q,
                    "answer": chosen_answer
                })

    return trajectories

def main():
    print("=== MediKiosk Clinical AI Trajectory Generator ===")
    trajectories = generate_cases_and_trajectories(num_cases_per_archetype=12)
    
    unique_cases = len(set(t["caseId"] for t in trajectories))
    print(f"[OK] Generated {len(trajectories)} step examples across {unique_cases} clinical cases.")
    
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(trajectories, f, indent=2)
        
    print(f"[OK] Dataset exported to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
