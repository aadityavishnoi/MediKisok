# MediKiosk Surveillance Data Management

This directory manages historical, sentinel, and benchmark epidemiological datasets used by the MediKiosk Outbreak Intelligence subsystem.

## Directory Structure

```text
ai/surveillance/data/
├── raw/            # Raw external inputs (ignored by Git, never committed)
├── processed/      # Validated canonical surveillance records
├── metadata/       # Source provenance, schemas, and catalog metadata
│   └── sources.json
├── README.md       # Acquisition instructions & data policies
└── .gitignore      # Prevents committing bulk raw datasets
```

## Data Acquisition Instructions

### 1. Integrated Disease Surveillance Programme (IDSP)
- **Portal:** [IDSP Reports](https://idsp.mohfw.gov.in)
- **Format:** Weekly Outbreak Bulletins (Epi Weeks 1 to 52).
- **Ingestion Script:** Run `npx tsx ai/surveillance/scripts/ingest-idsp.ts` to validate and ingest raw tabular records into canonical form.
- **Fields:** State, District, Disease Illness, Number of Cases, Deaths, Date of Start, Current Status.

### 2. Hospital Sentinel Telemetry
- **Source:** CockroachDB `DiseaseOutbreakSignal` table.
- **Access:** Loaded via backend service adapters and mapped through `SurveillanceNormalizer`.

## Absolute Data Integrity Mandate
1. **Zero Fabrication:** Never invent case numbers, denominators, or dates.
2. **Missing Denominator Policy:** If screening/testing volume is absent, `positivityRate` is preserved as `undefined`. Denominators are NEVER synthesized.
3. **Clinical Non-Diagnostic Separation:** Surveillance signals represent population viral circulation pressure and must never be interpreted as individual patient diagnostic probabilities.
