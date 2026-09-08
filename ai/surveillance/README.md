# MediKiosk Regional Disease Surveillance & Outbreak Intelligence

**Module:** `ai/surveillance`  
**Ownership:** Developer 2  
**Branch:** `feature/surveillance-rx-ai`  
**Status:** Production Ready · 21/21 Tests Passing · 0 TypeScript Errors  

---

## 1. Overview

The `ai/surveillance` subsystem provides regional epidemiological intelligence, multi-lag temporal dynamics, Bayesian small-sample smoothing, and multi-horizon outbreak forecasting (7-day and 14-day) to the MediKiosk healthcare platform.

### Core Philosophy:
- **Assistive Decision Support:** Population-level surveillance measures regional pathogen circulation pressure. It **NEVER** independently diagnoses individual patients. All API contracts enforce `individualDiagnosis: false`.
- **Absolute Data Integrity:** No fabrication of disease counts, hospital records, positivity rates, or model metrics. Unrecorded denominators remain strictly `undefined`.
- **Methodological Rigor:** Chronological 70% Train / 15% Validation / 15% Test backtesting with zero future-data leakage.

---

## 2. Directory Architecture

```
ai/surveillance/
├── data/
│   ├── raw/                  # Downloaded authoritative raw datasets (.gitignore enforced)
│   ├── processed/            # Normalized canonical surveillance records
│   ├── metadata/             # Source catalogs, licensing, and schema definitions
│   └── README.md             # Reproducible data ingestion documentation
├── scripts/
│   └── ingest-idsp.ts        # Automated, reproducible IDSP ingestion pipeline
├── src/
│   ├── aggregation/          # Multi-facility regional aggregation
│   ├── data/
│   │   ├── canonicalSurveillance.ts   # Canonical schema, audit validator
│   │   ├── diseaseDictionary.json     # Standard ICD-10 disease taxonomy
│   │   └── SurveillanceNormalizer.ts  # Normalization transforms
│   ├── features/
│   │   └── TemporalFeatureExtractor.ts # Multi-scale temporal & spatial features
│   ├── intelligence/
│   │   └── OutbreakSignalEngine.ts    # Multi-dimensional outbreak signal classifier
│   ├── normalization/
│   │   └── GeographicNormalizer.ts    # Standard Indian geographic hierarchy & aliases
│   ├── prediction/
│   │   └── OutbreakForecaster.ts      # 7d/14d forecasting, statistical baselines, ML Ridge benchmark
│   ├── BayesianOutbreakEstimator.ts   # Laplace/Beta-Binomial smoothing & Wilson CI
│   ├── SurveillanceService.ts         # Multi-disease regional risk integration service
│   └── index.ts
├── tests/
│   ├── phase2Intelligence.test.ts    # 21 comprehensive unit & integration tests
│   └── surveillance.test.ts          # 13 Phase-1 foundation tests
├── DATA_SOURCES.md
├── MODEL_CARD.md
└── MODEL_EVALUATION.md
```

---

## 3. Key Components

### 3.1 Geographic Normalization (`GeographicNormalizer`)
Transforms vernacular aliases and spelling variations into deterministic ISO-style hierarchy:
- `Varanasi`, `Banaras`, `Kashi` $\rightarrow$ `IN-UP-VARANASI`
- `Poona` $\rightarrow$ `IN-MH-PUNE`
- `Madras` $\rightarrow$ `IN-TN-CHENNAI`

### 3.2 Canonical Data Quality Engine (`SurveillanceQualityValidator`)
Computes data completeness scores and checks for:
- Negative cases, deaths, screened counts
- Impossible future timestamps
- Inconsistent positivity (positive > tested/screened)
- Denominator validation (unrecorded denominators marked with warning, not zero)

### 3.3 Bayesian Small-Sample Protection (`BayesianOutbreakEstimator`)
Protects against false alarms when sample size is small (e.g. Region X 8/10 scenario):
- Observed Positivity: $80.0\%$
- Wilson 95% Confidence Interval: $[49.0\%, 94.3\%]$ (indicates high uncertainty)
- Laplace-Smoothed Posterior: $16.7\%$ with Beta prior ($\alpha=2, \beta=48$)
- Confidence Rating: `LOW_SAMPLE`

### 3.4 Multi-Horizon Forecasting & Backtesting (`OutbreakForecaster`)
- Horizons: 7-day and 14-day daily projections with expanding 95% confidence intervals.
- Evaluates: Naive Persistence, 7-Day Seasonal Naive, 7-Day Moving Average, Holt's Linear Exponential Smoothing.
- ML Benchmark: Tabular Ridge Autoregressive model.
- Production Decision: Holt Linear is promoted; ML is not promoted to prevent small-sample overfitting.

---

## 4. Ingesting Real IDSP Data

Run the reproducible ingestion script:
```bash
npx tsx ai/surveillance/scripts/ingest-idsp.ts
```

Outputs validated canonical observations to `ai/surveillance/data/processed/idsp_canonical.json`.

---

## 5. Verification & Tests

```bash
npm --filter surveillance test
```

All 34 tests in `phase2Intelligence.test.ts` and `surveillance.test.ts` pass cleanly with 0 failures.

---

## 6. Doctor Workflow & Central Admin Integration (Phase 4)

- **Doctor Consultation Radar:** Live regional surveillance banners in `ConsultationScreen.tsx` and `DashboardScreen.tsx` displaying district activity level, affected facility count, 7d/14d forecasts, and clinical review mandate (`individualDiagnosis: false`).
- **Central Admin Data Contract:** `GET /api/surveillance/central-admin/overview` exposes national overview, state risk, district risk, disease trends, 7d/14d forecasts, affected facilities, data quality scores, and model versions.
- **Shared AI Contract:** Canonical schemas in `ai/shared/schemas/` (`regional-signal.json`, `forecast.json`, `consultation-ai-context.json`).

