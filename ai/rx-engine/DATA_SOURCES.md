# MediKiosk Rx Safety Engine — Authoritative Data Sources & Regulatory Compendia

**Module:** `ai/rx-engine`  
**Ownership:** Developer 2  
**Evaluation Standard:** Zero Clinical Hallucinations · Authoritative Compendia Only  

---

## 1. Authoritative Medical Sources

The MediKiosk Rx Safety Engine relies exclusively on authoritative regulatory compendia, official pharmacopeias, and verified clinical guidelines. It strictly forbids scraping arbitrary internet blogs or allowing unconstrained LLM outputs to invent drug interactions.

### 1. National List of Essential Medicines (NLEM 2022)
- **Issuing Body:** Standing National Committee on Medicines, Ministry of Health & Family Welfare (MoHFW), Government of India.
- **Scope:** 384 essential medicines across 27 therapeutic categories covering primary, secondary, and tertiary healthcare.
- **Application in MediKiosk:** Standardizes active pharmaceutical ingredients, ensures essential drug prioritization, and verifies standard dosage forms.
- **License / Access:** Official Government Document (Public Domain / OGD Platform India).

### 2. Central Drugs Standard Control Organization (CDSCO) & National Formulary of India (NFI)
- **Issuing Body:** Directorate General of Health Services (DGHS), Ministry of Health & Family Welfare, Government of India.
- **Key Resources:**
  - **National Formulary of India (NFI 6th Edition):** Comprehensive guidance on drug-drug interactions, contraindications, adverse drug reactions, and renal/hepatic dose adjustments.
  - **CDSCO Drug Regulatory Schedules:**
    - **Schedule H:** Prescription drugs mandating physician oversight.
    - **Schedule H1:** Restricted reserve antibiotics and fluoroquinolones subject to strict dispensing registers to curtail Antimicrobial Resistance (AMR).
    - **Schedule X:** Psychotropics and narcotics.
    - **Schedule G:** Hormonal and specialized agents requiring medical supervision.
- **Application in MediKiosk:** Defines canonical drug interaction severity, mechanisms, clinical effects, and management recommendations.

### 3. Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)
- **Issuing Body:** Pharmaceuticals & Medical Devices Bureau of India (PMBI), Department of Pharmaceuticals, Ministry of Chemicals & Fertilizers, Government of India.
- **Scope:** Over 1,800 generic medicines and surgical products available at Jan Aushadhi Kendras across India.
- **Application in MediKiosk:** Suggests high-quality, bioequivalent generic alternatives yielding 50% to 90% cost savings for outpatient prescriptions.

### 4. British National Formulary (BNF 84) & US FDA Safety Communications
- **Role:** Supplementary authoritative secondary reference for pharmacokinetic mechanisms (CYP450 enzyme inhibition/induction) and critical pharmacovigilance alerts (e.g., dual RAAS blockade warnings, clopidogrel-omeprazole CYP2C19 interactions).

---

## 2. Drug-Drug Interaction Matrix Standards

Every interaction entry in the canonical matrix requires:
- **`drugA` & `drugB`:** Standardized generic names and concept IDs.
- **`severity`:**
  - `CONTRAINDICATED`: Never prescribe together in routine outpatient practice (e.g., Aspirin + Warfarin, Enalapril + Telmisartan).
  - `HIGH`: Major interaction requiring proactive dosage adjustment or monitoring (e.g., Ciprofloxacin + Warfarin, Ibuprofen + Aspirin).
  - `MODERATE`: Documented interaction of moderate clinical significance (e.g., Paracetamol + Warfarin prolonged use).
  - `LOW`: Minor pharmacodynamic effect.
- **`mechanism`:** Exact biochemical or physiological mechanism (e.g., competitive COX-1 inhibition, CYP2C19 suppression).
- **`effect`:** Clinical consequence (e.g., major GI hemorrhage, loss of antiplatelet protection, hyperkalemia).
- **`management`:** Concrete action recommendation for the physician.
- **`evidence`:** Citations to published compendia and regulatory safety alerts.
- **`sourceVersion`:** Regulatory version identifier.

---

## 3. Duplicate Therapy Categories

1. **`EXACT_DUPLICATE`:** Co-prescription of different brand names possessing the identical active ingredient (e.g., `Dolo 650` + `Calpol 500` = both Paracetamol).
2. **`POTENTIAL_DUPLICATE`:** Co-prescription of two different molecules sharing the identical pharmacological class (e.g., `Ibuprofen` + `Diclofenac` = two systemic NSAIDs; `Atorvastatin` + `Rosuvastatin` = two statins).
3. **`INTENTIONAL_COMBINATION`:** Fixed-dose combinations recognized in NLEM (e.g., Amoxicillin + Potassium Clavulanate).
4. **`UNKNOWN`:** Inability to rule out duplication due to uncatalogued substances.

---

## 4. Fail-Safe Principle: The UNKNOWN Guard

If a prescribed substance is not present in the canonical NLEM/CDSCO database:
- It is assigned `status: "UNKNOWN"`.
- It triggers `requiresDoctorVerification: true` and `doctorReviewRequired: true`.
- The engine **NEVER** declares an uncatalogued substance as `SAFE` simply because an interaction rule does not exist.
