# MediKiosk Regional Outbreak Intelligence Model Card

**Model Family:** MediKiosk Epidemiological Surveillance & Outbreak Decision Support  
**Model Version:** `surveillance-model-v2.1`  
**Forecast Engine Version:** `forecast-model-v2.1`  
**Evaluation Status:** Benchmark Complete (Statistical Baseline Promoted; ML Benchmark Evaluated & Not Promoted)  
**Owners:** MediKiosk Engineering & Clinical AI Pair  
**License:** Apache 2.0 / Open Government Data (OGD) Platform India  
**Detailed Evaluation:** See [MODEL_EVALUATION.md](file:///c:/Users/vishn/SIH-PS-26047/ai/surveillance/MODEL_EVALUATION.md)  
**Data Sources:** See [DATA_SOURCES.md](file:///c:/Users/vishn/SIH-PS-26047/ai/surveillance/DATA_SOURCES.md)  

---

## 1. Intended Use
- **Primary Purpose:** Autonomous population-level disease surveillance aggregation, rolling trend detection, early outbreak anomaly alerts, and 7-day / 14-day case forecasting for public health officers and hospital OPD clinicians.
- **Intended Users:** Hospital Medical Superintendents, Central Admin Epidemiological Surveillance Officers, Consulting OPD Physicians.
- **Output Signals:** Localized risk level (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`), rolling growth trajectory (`FALLING`, `STABLE`, `RISING`), Wilson 95% confidence interval, Bayesian smoothed rate, sentinel facility clustering metrics, and forward 7d / 14d projections with confidence bands.

---

## 2. Non-Intended Use & Clinical Safety Mandate
> [!IMPORTANT]
> **CRITICAL EPIDEMIOLOGICAL ETHICS & NON-INTENDED USE:**
> 1. **No Individual Diagnosis:** This model predicts population circulation pressure and viral density in a geographic district. It must **NEVER** be interpreted as an individual patient's diagnostic probability (e.g. an observed 80% positivity rate in 10 screened subjects does **NOT** mean the next patient has an 80% chance of having the disease).
> 2. **No Autonomous Prescribing:** Outbreak signals must never independently initiate or override pharmacotherapy.
> 3. **Physician Supremacy:** The consulting doctor remains the sole legal and clinical authority for all patient diagnoses and prescriptions.
> 4. `individualDiagnosis: false` is strictly encoded in all API contracts.
> 5. `enhancedScreeningRecommended: true` and `doctorReviewRequired: true` are always returned for elevated signals.

---

## 3. Data Sources & Integrity Safeguards
1. **Integrated Disease Surveillance Programme (IDSP) / NCDC:** Weekly epidemiological notifications across Indian states and union territories (Varanasi, Lucknow, Pune, Delhi).
2. **Sentinel Kiosk & Emergency Triage Streams:** Real-time pre-consultation fever and symptom screening records.
3. **Canonical Data Pipeline:** Raw IDSP notifications ingested via `ai/surveillance/scripts/ingest-idsp.ts`, producing canonical structured records in `ai/surveillance/data/processed/idsp_canonical.json`.
4. **Anti-Fabrication Policy:** Missing counts or denominators are strictly preserved as `undefined`. Denominators are never synthetic or inferred. Corrupt records ($k > n$, $n < 0$, or impossible future timestamps) are rejected immediately by `SurveillanceQualityValidator`.

---

## 4. Modeling & Algorithmic Methodology

### 4.1 Statistical Outbreak Detection Baselines
- **Statistical Baseline Mean & Standard Deviation:** Historical 12-week rolling baseline (excluding current 7d window).
- **Z-Score Anomaly Trigger:** $z = \frac{x_{7\text{d}} - \mu}{\sigma} \ge 2.0$ or baseline deviation ratio $\ge 1.60$.
- **Wilson Score 95% Confidence Interval:** Quantifies binomial sampling variance for proportions near 0 or 1.
- **Empirical Bayes Laplace Smoothing:** $\hat{\theta}_{\text{Bayes}} = \frac{k + \alpha}{n + \alpha + \beta}$ with empirical district prior $\text{Beta}(\alpha=2, \beta=48)$.

### 4.2 Multi-Horizon Time-Series Forecasting
Evaluated across 7-day and 14-day horizons using strict chronological splits (70% Train, 15% Validation, 15% Test):
- **Naive Persistence Baseline:** $\hat{y}_{t+h} = y_t$
- **Moving Average Baseline (MA7):** $\hat{y}_{t+h} = \frac{1}{7}\sum_{i=0}^6 y_{t-i}$
- **Seasonal Naive Baseline:** $\hat{y}_{t+h} = y_{t+h-7}$
- **Holt's Linear Exponential Smoothing (Production Promoted):** Level + trend recursive smoothing with expanding $95\%$ forecast intervals $\pm 1.96 \cdot \hat{\sigma} \cdot \sqrt{h}$.
- **Tabular ML Ridge Regression (Benchmark):** L2-regularized multi-lag model trained on 1d, 3d, 7d, 14d, 28d lags and moving statistics.

---

## 5. Model Promotion Decision & Benchmark Metrics

Chronological out-of-sample backtest results on District Dengue surveillance data (100 daily observations, split 70/15/15):

| Horizon | Model | MAE | RMSE | MAPE | Production Status |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **7-Day** | **Holt Linear Smoothing** | **2.33** | **2.95** | **6.45%** | **PROMOTED** |
| 7-Day | Moving Average (MA7) | 4.86 | 5.37 | 13.88% | Baseline |
| 7-Day | Naive Persistence | 3.53 | 4.24 | 9.94% | Baseline |
| 7-Day | Seasonal Naive | 5.20 | 6.08 | 14.62% | Baseline |
| 7-Day | ML Tabular Ridge Regressor | 2.80 | 3.40 | 7.82% | Evaluated (Benchmark) |
| **14-Day** | **Holt Linear Smoothing** | **3.82** | **4.72** | **10.60%** | **PROMOTED** |
| 14-Day | Moving Average (MA7) | 7.93 | 8.64 | 22.45% | Baseline |
| 14-Day | Naive Persistence | 6.07 | 7.10 | 17.02% | Baseline |
| 14-Day | Seasonal Naive | 8.40 | 9.68 | 23.51% | Baseline |
| 14-Day | ML Tabular Ridge Regressor | 4.25 | 5.25 | 11.85% | Evaluated (Benchmark) |

### Decision Rationale
> **Decision: STATISTICAL BASELINE (HOLT LINEAR) PROMOTED. ML NOT PROMOTED.**  
> Holt Linear Exponential Smoothing achieved lower out-of-sample error across both 7-day and 14-day horizons without the parameter volatility or potential overfitting risk of tabular regression models on epidemiological time series with seasonal transitions. In accordance with Section 15 of the specification, ML was not forced into production.

---

## 6. Small-Sample Behavior & Uncertainty Safeguards

| Scenario | Screened | Positive | Raw Rate | Wilson 95% CI | Bayesian Smoothed | Confidence | Risk Level |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Region X Demo Cluster** | 10 | 8 | 80.0% | [49.0%, 94.3%] | 16.7% | `LOW_SAMPLE` | `CRITICAL` |
| **Single Observation** | 1 | 1 | 100.0% | [20.7%, 100.0%] | 5.9% | `INSUFFICIENT_SAMPLE` | `MODERATE` |
| **Adequate District Sample** | 1,000 | 20 | 2.0% | [1.3%, 3.1%] | 2.1% | `ADEQUATE_SAMPLE` | `LOW` |

*Gating Mechanism:* A single positive ($1/1$) can never trigger a `CRITICAL` outbreak alert.

---

## 7. Operational & Ingestion Limitations
1. **Reporting Lag:** IDSP state weekly bulletin summaries have a typical 7-14 day reporting latency; real-time kiosk streams help bridge this latency window.
2. **Missing Denominators:** District municipal reports frequently omit total screened or tested individuals. In such cases, `positivity` remains `undefined` rather than assumed zero.
3. **Sentinel Bias:** Kiosk data reflects help-seeking OPD patients rather than a random population sample.
