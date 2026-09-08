# MediKiosk Prescription & Medication Safety Engine Model Card

**Model Family:** MediKiosk Evidence-Backed Medication Safety & Prescription Decision Support  
**Rule/Engine Version:** `rx-rules-v2.1`  
**Dictionary Version:** `medicine-dictionary-v2.1`  
**Owners:** MediKiosk Engineering & Clinical Safety Team  
**Regulatory Standards:** NLEM 2022 (MoHFW India), CDSCO Drugs & Cosmetics Act, PMBJP Jan Aushadhi  

---

## 1. Intended Use
- **Primary Purpose:** Assistive clinical decision-support for consulting OPD doctors and pharmacists during prescription generation.
- **Intended Users:** Registered Medical Practitioners (RMPs), hospital clinicians, OPD consulting doctors, and authorized clinical triage personnel.
- **Core Functionality:**
  1. **Dosage & Formulation Parsing:** Normalizes brand names, active ingredients, numeric dosage strengths, units (mg, mcg, g, ml, IU), dosage forms (tablet, syrup, injection, inhaler), routes of administration, and frequencies.
  2. **Drug-Drug Interaction (DDI) Matrix:** Pairwise screening for contraindications, major interactions, and moderate interactions with structured mechanism, clinical effect, actionable management guidance, and evidence citations.
  3. **Duplicate Therapy Detection:** Identifies exact active ingredient duplication, potential pharmacological class overlap, and intentional clinical combinations.
  4. **Drug-Allergy Cross-Reactivity:** Screens patient allergies against active ingredients, drug classes, and documented cross-reactivities (e.g. beta-lactams, NSAIDs).
  5. **Jan Aushadhi Substitution:** Recommends equivalent, quality-assured generic alternatives under PMBJP for affordable outpatient care.

---

## 2. Non-Intended Use & Clinical Safety Mandate
> [!IMPORTANT]
> **PHYSICIAN SUPREMACY & NON-AUTONOMOUS MANDATE:**
> 1. **No Autonomous Prescribing:** The engine NEVER initiates, modifies, or cancels a prescription autonomously.
> 2. **No Independent Dosing Recommendation:** Does not compute or prescribe dosages without physician authorization.
> 3. **Never Claim "SAFE" on Missing Data:** If a drug or interaction pair is missing from authoritative catalogs, the engine returns `UNKNOWN` or `REVIEW_REQUIRED`, never falsely asserting a regimen is "SAFE".
> 4. **Assistive Warning Only:** All severity flags (`CONTRAINDICATED`, `HIGH`, `MODERATE`, `LOW`) are advisory alerts requiring doctor clinical review.
> 5. **Physician Discretion:** The physician possesses patient-specific context (e.g. renal function, hemodynamic stability, benefit-risk calculus) and retains sole legal authority.

---

## 3. Authoritative Evidence Sources & Provenance
Every rule and interaction in the engine cites authoritative regulatory and clinical pharmacopeial sources:
- **NLEM 2022:** MoHFW Government of India National List of Essential Medicines.
- **CDSCO:** Central Drugs Standard Control Organization (Schedule H, H1, X regulatory schedules).
- **PMBJP:** Pradhan Mantri Bhartiya Janaushadhi Pariyojana generic product master.
- **Pharmacopeial References:** British National Formulary (BNF), US FDA Prescribing Information, and Stockley's Drug Interactions.

All clinically meaningful warnings include evidence provenance metadata:
```json
{
  "source": "NLEM 2022 / CDSCO / FDA Prescribing Information",
  "sourceVersion": "2024.1",
  "retrievedAt": "2026-09-08T00:00:00Z",
  "evidenceType": "REGULATORY_LABEL",
  "confidence": "HIGH"
}
```

---

## 4. Normalization & Fail-Safe Architecture

```
Raw Prescription Line
       ↓
MedicineNormalizer (Regex + Catalog Match)
  ├── Active Ingredient & Strength Extracted
  └── Unknown Brand Guard: status="UNKNOWN", requiresDoctorVerification=true
       ↓
DrugSafetyEngine Evaluation
  ├── Drug-Drug Interaction Matrix
  ├── Duplicate Therapy Screener (EXACT, POTENTIAL, INTENTIONAL)
  ├── Allergy Cross-Reactivity Checker
  └── Jan Aushadhi Affordable Generic Finder
       ↓
Explainable Safety Output (Doctor Review Required)
```

### Fail-Safe Behavior
- **Unknown Brand Name:** Marked `status: "UNKNOWN"`, `requiresDoctorVerification: true`. The engine never hallucinates active ingredients.
- **Unverified Interaction Pair:** Returns `status: "REVIEW_REQUIRED"` with `evidence: []` rather than suppressing warnings.
- **Malformed Dosage Input:** Safely falls back to `form: "unknown"`, `unit: "unknown"`, flagging for manual review.

---

## 5. Duplicate Therapy Classification

| Classification | Definition | Example | Clinical Action |
| :--- | :--- | :--- | :--- |
| `EXACT_DUPLICATE` | Identical active ingredient prescribed multiple times | Calpol 500 mg + Dolo 650 mg (both acetaminophen) | Alert high risk of acute hepatic toxicity |
| `POTENTIAL_DUPLICATE` | Same pharmacological class with redundant mechanism | Lisinopril + Enalapril (both ACE inhibitors) | Alert redundant pathway, advise single agent |
| `INTENTIONAL_COMBINATION` | Clinically recognized guideline combination | Amoxicillin + Clavulanic acid | Informative note, non-blocking |
| `UNKNOWN` | Uncategorized multi-agent regimen | Unlisted agent combination | Flag for doctor verification |

---

## 6. Known Limitations
1. **Catalog Scope:** Curated to NLEM 2022 and high-frequency primary care / OPD medications (antibiotics, NSAIDs, antihypertensives, antidiabetics, statins, antiplatelets). Specialized tertiary oncology or biologic regimens require institutional tertiary references.
2. **Patient Physiological Parameters:** Engine does not calculate eGFR or hepatic Child-Pugh scores directly from laboratory feeds without explicit patient context inputs.
3. **Food-Drug Interactions:** Focuses on drug-drug, drug-allergy, and duplicate therapy. Food interactions are addressed in clinical counseling guidelines.
