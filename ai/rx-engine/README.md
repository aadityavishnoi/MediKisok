# MediKiosk Prescription & Medication Safety Engine (`ai/rx-engine`)

A deterministic, evidence-backed medication safety and prescription decision support engine for the MediKiosk healthcare platform.

---

## Overview

The `ai/rx-engine` package provides clinical decision support during outpatient (OPD) prescription writing. It parses raw prescription entries into structured chemical entities, checks for severe drug-drug interactions, screens for duplicate therapeutic regimens, identifies potential drug-allergy cross-reactivities, and recommends affordable Jan Aushadhi generic equivalents.

### Core Principles
1. **Zero Hallucination:** Rules and mappings derive directly from NLEM 2022, CDSCO schedules, and peer-reviewed pharmacology.
2. **Never Prescribe Autonomously:** The engine only provides assistive alerts. The prescribing physician retains 100% legal and clinical authority.
3. **Fail-Safe Behavior:** When an unfamiliar brand or interaction is queried, the engine returns `UNKNOWN` or `REVIEW_REQUIRED` — it never claims an uncatalogued pair is "SAFE".

---

## Directory Structure

```text
ai/rx-engine/
├── DATA_SOURCES.md          # Provenance, NLEM/CDSCO regulatory documentation
├── MODEL_CARD.md            # Engine scope, safety bounds, duplicate classifications
├── README.md                # This documentation
├── package.json             # NPM package definition
├── tsconfig.json            # TypeScript configuration
├── src/
│   ├── index.ts             # Public module exports
│   ├── DrugSafetyEngine.ts  # Primary interaction, duplicate, and allergy screening engine
│   ├── data/
│   │   └── nlemCatalog.ts   # Authoritative NLEM 2022 entities, DDIs, and Jan Aushadhi master
│   └── normalization/
│       └── MedicineNormalizer.ts # Dosage, formulation, brand, and ingredient normalizer
└── tests/
    └── rxSafety.test.ts     # 18 comprehensive safety and contract tests
```

---

## Key Components

### 1. `MedicineNormalizer`
- Extracts active generic ingredient, brand name, numeric strength, unit (`mg`, `mcg`, `g`, `ml`, `IU`), formulation (`tablet`, `syrup`, `injection`, `inhaler`), route of administration, and frequency.
- Resolves Indian commercial brands (e.g. *Dolo 650*, *Augmentin 625*, *Pantocid 40*, *Glycomet 500*) to standard generic compounds.
- Unknown brands return `status: "UNKNOWN"` and `requiresDoctorVerification: true`.

### 2. `DrugSafetyEngine`
- **Drug-Drug Interactions:** Screened across catalog pairs with severity ratings (`CONTRAINDICATED`, `HIGH`, `MODERATE`, `LOW`), pathophysiological mechanism, clinical effect, management suggestions, and evidence sources.
- **Duplicate Therapy:**
  - `EXACT_DUPLICATE`: Same active ingredient prescribed multiple times (e.g. Calpol + Dolo).
  - `POTENTIAL_DUPLICATE`: Redundant pharmacological class (e.g. two ACE inhibitors or two proton-pump inhibitors).
  - `INTENTIONAL_COMBINATION`: Clinically validated combination therapies (e.g. Amoxicillin + Clavulanic acid).
- **Allergy Cross-Reactivity:** Matches patient reported allergies against active ingredients and known class cross-reactivities (e.g. Penicillin allergy cross-reacting with Cephalosporins; Aspirin allergy cross-reacting with Ibuprofen).
- **Jan Aushadhi Substitution:** Identifies equivalent Pradhan Mantri Bhartiya Janaushadhi Pariyojana generic formulations with indicative pricing for cost reduction.

---

## API Specification

### `POST /api/rx/check`

**Request Body:**
```json
{
  "medications": [
    "Dolo 650 mg Tablet",
    "Calpol 500 mg Tablet",
    "Warfarin 5 mg"
  ],
  "allergies": ["penicillin"],
  "patientContext": {
    "age": 58,
    "gender": "male"
  }
}
```

**Response Body:**
```json
{
  "status": "REVIEW_REQUIRED",
  "normalizedMedications": [
    {
      "genericName": "acetaminophen",
      "brandName": "Dolo",
      "strength": 650,
      "unit": "mg",
      "form": "tablet",
      "status": "NORMALIZED"
    }
  ],
  "interactions": [
    {
      "drugA": "acetaminophen",
      "drugB": "warfarin",
      "severity": "MODERATE",
      "mechanism": "Prolonged high-dose acetaminophen inhibits warfarin metabolism",
      "effect": "Elevated INR and increased risk of bleeding",
      "management": "Monitor INR closely if high-dose acetaminophen is taken for >3 consecutive days",
      "evidence": [
        {
          "source": "FDA Prescribing Information / Stockley's Drug Interactions",
          "sourceVersion": "2024.1",
          "retrievedAt": "2026-09-08T00:00:00Z",
          "evidenceType": "CLINICAL_STUDY",
          "confidence": "HIGH"
        }
      ]
    }
  ],
  "allergyFlags": [],
  "duplicateTherapy": [
    {
      "type": "EXACT_DUPLICATE",
      "medications": ["Dolo 650 mg Tablet", "Calpol 500 mg Tablet"],
      "sharedEntity": "acetaminophen",
      "severity": "HIGH",
      "clinicalAdvice": "Duplicate active ingredient acetaminophen detected. Risk of cumulative toxicity."
    }
  ],
  "unknowns": [],
  "evidence": [...],
  "doctorReviewRequired": true,
  "versions": {
    "ruleVersion": "rx-rules-v2.1",
    "dictionaryVersion": "medicine-dictionary-v2.1"
  }
}
```

---

## Testing & Verification

Run the test suite using Vitest:

```bash
# Run Rx engine tests
npm --prefix apps/backend run test -- ai/rx-engine/tests/rxSafety.test.ts
```

All 18 safety tests cover:
- Exact active ingredient duplicate detection
- Brand normalization and unknown brand guard
- Contradicted & severe pairwise interactions (e.g. Methotrexate + NSAIDs, ACEi + Potassium)
- Drug-allergy cross-reactivity
- Fail-safe UNKNOWN handling
- Evidence provenance completeness
