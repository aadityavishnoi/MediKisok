# MediKiosk Regional Disease Surveillance & Medicine Intelligence Data Sources

This document describes the regulatory, governmental, and epidemiological data sources integrated into the MediKiosk AI Decision-Support Subsystem.

---

## 1. Disease Surveillance & Outbreak Intelligence

### Primary Governmental Sources
1. **Integrated Disease Surveillance Programme (IDSP)**
   - **Authority:** National Centre for Disease Control (NCDC), Directorate General of Health Services (DGHS), Ministry of Health & Family Welfare (MoHFW), Government of India.
   - **Scope:** Weekly epidemiological reports on S (suspect), P (presumptive), and L (laboratory confirmed) outbreak surveillance across all 36 Indian States and Union Territories.
   - **Priority Syndromes:**
     - Acute Respiratory Infections / Influenza-like Illness (COVID-19, H1N1, Seasonal Influenza)
     - Vector-Borne Diseases (Dengue, Malaria, Chikungunya, Japanese Encephalitis)
     - Water-Borne & Enteric Diseases (Acute Diarrheal Disease, Cholera, Typhoid)
     - Vaccine-Preventable Diseases (Measles, Rubella, Diphtheria)
   - **Temporal Granularity:** Weekly aggregate reporting + real-time hospital sentinel surveillance alerts.

2. **CockroachDB Enterprise Surveillance Ledger**
   - **Table:** `DiseaseOutbreakSignal`
   - **Schema Constraints:** Hospital ID, Disease Name, ICD-10 code, category, case count, alert severity, district, state, reported timestamp.
   - **Aggregation:** Moving 7-day and 14-day rolling incident case counts and screening throughput.

---

## 2. Statistical Outbreak & Bayesian Methodology

### Observed Positivity vs. Individual Diagnostic Probability
> **CRITICAL EPIDEMIOLOGICAL PRINCIPLE:**
> Observed positivity rate in a testing facility or kiosk $\frac{\text{Positives}}{\text{Total Screened}}$ measures **population viral circulation pressure**, NOT an individual patient's diagnostic likelihood.
> The system strictly flags `riskLevel` and `confidence` rather than attributing certainty to an unexamined patient.

### Small-Sample Smoothing (Laplace / Beta-Binomial Empirical Bayes)
When sample size $n < 30$ (such as 8 positive out of 10 screened in a demo cluster):
- Unsmoothed rate: $8 / 10 = 80\%$
- Smoothed Regional Posterior Rate:
  $$\hat{\theta}_{\text{Bayes}} = \frac{k + \alpha}{n + \alpha + \beta}$$
  With default district prior parameters $\alpha = 2, \beta = 48$ (baseline prevalence prior $\approx 4\%$):
  $$\hat{\theta}_{\text{Bayes}} = \frac{8 + 2}{10 + 2 + 48} = \frac{10}{60} = 16.67\%$$
- **Wilson Score 95% Confidence Interval:**
  $$\tilde{p} \pm \frac{z}{1 + \frac{z^2}{n}} \sqrt{\frac{\hat{p}(1-\hat{p})}{n} + \frac{z^2}{4n^2}}$$
  For $n=10, k=8$: CI spans $[49.0\%, 94.3\%]$ (indicates severe variance).
- **Confidence Rating:**
  - $n < 15$: `LOW_SAMPLE` / `INSUFFICIENT_SAMPLE`
  - $15 \le n < 100$: `ADEQUATE_SAMPLE`
  - $n \ge 100$: `HIGH_CONFIDENCE`

---

## 3. Medicine Intelligence & Rx Safety Data Sources

### 1. National List of Essential Medicines (NLEM 2022)
- **Authority:** Standing National Committee on Medicines, Ministry of Health and Family Welfare, Govt of India.
- **Coverage:** 384 essential active pharmaceutical ingredients spanning 27 therapeutic categories.
- **Role:** Ensures cost-effective, clinically validated generic medicines are prioritized in physician decision support.

### 2. Central Drugs Standard Control Organization (CDSCO)
- **Authority:** Directorate General of Health Services, Government of India.
- **Regulatory Schedules:**
  - **Schedule H:** Prescription-only medicines (must not be dispensed without a registered medical practitioner's Rx).
  - **Schedule H1:** Restricted antibiotics and 3rd/4th generation cephalosporins/fluoroquinolones to combat Antimicrobial Resistance (AMR).
  - **Schedule X:** Narcotics and psychotropic substances requiring duplicate records for two years.
  - **Schedule G:** Drugs requiring medical supervision.

### 3. Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)
- **Authority:** Pharmaceuticals & Medical Devices Bureau of India (PMBI), Department of Pharmaceuticals, Ministry of Chemicals & Fertilizers.
- **Data:** Generic drug equivalents available at Jan Aushadhi Kendras, providing 50%–90% cost savings compared to branded counterparts.

---

## 4. Clinical Safety Non-Negotiables

1. **Zero Hallucinations:** The Rx engine relies on deterministic relational matrices and evidence citations from NLEM, CDSCO, and British National Formulary (BNF). Unknown drugs return `UNKNOWN` status and mandate doctor review.
2. **Physician Supremacy:** MediKiosk is exclusively a Clinical Decision-Support System (CDSS). AI never dispenses or prescribes autonomously.

---

## 5. Raw Source Record Schemas & Formats

### 5.1 IDSP Weekly Outbreak Notification Schema (Governmental PDF/CSV)
```json
{
  "reportingWeek": 36,
  "reportingYear": 2026,
  "state": "Uttar Pradesh",
  "district": "Varanasi",
  "diseaseIllness": "Dengue Fever",
  "numberOfCases": 28,
  "numberOfDeaths": 0,
  "dateOfStartOfOutbreak": "2026-08-28",
  "dateOfReporting": "2026-09-04",
  "currentStatus": "Under Surveillance",
  "commentsActionTaken": "Source reduction, fogging and larval search initiated by District Malaria Officer."
}
```

### 5.2 Sentinel Hospital / Kiosk Stream Ingestion Schema
```json
{
  "source": "KIOSK_TRIAGE_FEED",
  "hospitalId": "HOSP_AIIMS_DELHI",
  "facilityType": "TERTIARY_HOSPITAL",
  "state": "Delhi",
  "district": "New Delhi",
  "diseaseName": "COVID-19",
  "category": "RESPIRATORY",
  "icd10": "U07.1",
  "screenedCount": 10,
  "positiveCount": 8,
  "observationWindow": "24H",
  "timestamp": "2026-09-08T10:00:00.000Z"
}
```

### 5.3 NLEM 2022 Gazette Record Schema
```json
{
  "nlemSection": "2.1",
  "category": "Analgesics, Antipyretics and NSAIDs",
  "medicine": "Paracetamol",
  "levelOfHealthcare": "P, S, T",
  "dosageFormAndStrength": "Tablets 500mg, 650mg; Oral liquid 120mg/5ml; IV Infusion 10mg/ml",
  "cdscoRegulatorySchedule": "OTC",
  "gazetteNotificationDate": "2022-09-13"
}
```

### 5.4 PMBJP Jan Aushadhi Product Schema
```json
{
  "genericProductCode": "PMBJP-GEN-0042",
  "genericName": "Paracetamol Tablets IP 650mg",
  "unitPack": "10x10 Tablets",
  "mrpINR": 18.50,
  "equivalentBrandedMRP": 78.00,
  "savingsPercent": 76.28
}
```

---

## 6. Licensing, Regulatory Compliance & Ethics

1. **National Data Sharing and Accessibility Policy (NDSAP):** Government of India epidemiological bulletins published under Open Government Data (OGD) license (https://data.gov.in).
2. **NLEM & CDSCO Publications:** Public regulatory gazette notices released under the authority of Ministry of Health and Family Welfare (MoHFW) and Central Drugs Standard Control Organization (CDSCO).
3. **Privacy by Design:** Zero Personally Identifiable Information (PII) or Protected Health Information (PHI) is ingested into the surveillance aggregation layer. All surveillance inputs are strictly de-identified aggregate cohorts.

