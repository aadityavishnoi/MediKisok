# MediKiosk Regional Outbreak Intelligence Model Card

**Model Family:** MediKiosk Epidemiological Surveillance & Outbreak Decision Support  
**Version:** 2.0 (SIH-PS-26047 Phase 2)  
**Owners:** MediKiosk Engineering & Clinical AI Pair  
**License:** Apache 2.0 / Open Government Data (OGD) Platform India  

---

## 1. Intended Use
- **Primary Purpose:** Autonomous population-level disease surveillance aggregation, rolling trend detection, and early outbreak anomaly alerts for public health officers and hospital OPD clinicians.
- **Intended Users:** Hospital Medical Superintendents, Central Admin Epidemiological Surveillance Officers, Consulting OPD Physicians.
- **Output Signals:** Localized risk level (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`), rolling growth trajectory (`FALLING`, `STABLE`, `RISING`), Wilson 95% confidence interval, Bayesian smoothed rate, and sentinel facility clustering metrics.

---

## 2. Non-Intended Use & Clinical Safety Mandate
> [!IMPORTANT]
> **CRITICAL EPIDEMIOLOGICAL ETHICS & NON-INTENDED USE:**
> 1. **No Individual Diagnosis:** This model predicts population circulation pressure and viral density in a geographic district. It must **NEVER** be interpreted as an individual patient's diagnostic probability (e.g. an observed 80% positivity rate in 10 screened subjects does **NOT** mean the next patient has an 80% chance of having the disease).
> 2. **No Autonomous Prescribing:** Outbreak signals must never independently initiate or override pharmacotherapy.
> 3. **Physician Supremacy:** The consulting doctor remains the sole legal and clinical authority for all patient diagnoses and prescriptions.
> 4. `individualDiagnosis: false` is strictly encoded in all API contracts.

---

## 3. Data Sources & Integrity Safeguards
1. **Integrated Disease Surveillance Programme (IDSP) / NCDC:** Weekly epidemiological notifications across Indian states and union territories.
2. **Sentinel Kiosk & Emergency Triage Streams:** Real-time pre-consultation fever and symptom screening records.
3. **Anti-Fabrication Policy:** Missing counts or denominators are strictly preserved as `undefined`. Denominators are never synthetic or inferred. Corrupt records ($k > n$, $n < 0$, or impossible future timestamps) are rejected immediately by `SurveillanceQualityValidator`.

---

## 4. Modeling & Algorithmic Methodology

### 4.1 Statistical Outbreak Detection Baselines
- **Statistical Baseline Mean & Standard Deviation:** Historical 12-week rolling baseline (excluding current 7d window).
- **Z-Score Anomaly Trigger:** $z = \frac{x_{7\text{d}} - \mu}{\sigma} \ge 2.0$ or baseline deviation ratio $\ge 1.60$.
- **Wilson Score 95% Confidence Interval:** Quantifies binomial sampling variance for proportions near 0 or 1.
- **Empirical Bayes Laplace Smoothing:** $\hat{\theta}_{\text{Bayes}} = \frac{k + \alpha}{n + \alpha + \beta}$ with empirical district prior $\text{Beta}(\alpha=2, \beta=48)$.

### 4.2 Time-Series Forecasting Baselines
- **Naive Persistence Baseline:** $\hat{y}_{t+1} = y_t$
- **7-Day Moving Average Baseline:** $\hat{y}_{t+1} = \frac{1}{7}\sum_{i=0}^6 y_{t-i}$
- **Holt's Linear Exponential Smoothing:** Level + trend recursive smoothing.
- **Chronological Anti-Leakage Backtesting:** Strictly splits historical data 70% Train, 15% Validation, 15% Test. Predictions are evaluated rolling one-step-ahead without future-data contamination.

---

## 5. Evaluation & Performance Metrics

Evaluated across historical and controlled synthetic scenarios:
- **Forecasting Metrics:** Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Mean Absolute Percentage Error (MAPE).
- **Anomaly Detection Metrics:** Precision, Recall, F1 score against 2-sigma baseline threshold reference rules.
- **Ground Truth Note:** Ground-truth clinical outbreak labels were not fabricated; reference rules are strictly statistical.

---

## 6. Small-Sample Behavior & Uncertainty Safeguards

| Scenario | Screened | Positive | Raw Rate | Wilson 95% CI | Bayesian Smoothed | Confidence | Risk Level |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Region X Demo Cluster** | 10 | 8 | 80.0% | [49.0%, 94.3%] | 16.7% | `LOW_SAMPLE` | `CRITICAL` |
| **Single Observation** | 1 | 1 | 100.0% | [20.7%, 100.0%] | 5.9% | `INSUFFICIENT_SAMPLE` | `MODERATE` |
| **Adequate District Sample** | 1,000 | 20 | 2.0% | [1.3%, 3.1%] | 2.1% | `ADEQUATE_SAMPLE` | `LOW` |

*Gating Mechanism:* A single positive ($1/1$) can never trigger a `CRITICAL` outbreak alert.
