import { describe, it, expect } from 'vitest';
import {
  SurveillanceQualityValidator,
  type SurveillanceObservation,
} from '../src/data/canonicalSurveillance';
import { TemporalFeatureExtractor } from '../src/features/TemporalFeatureExtractor';
import { OutbreakSignalEngine } from '../src/intelligence/OutbreakSignalEngine';
import {
  OutbreakForecaster,
  type TimeSeriesPoint,
} from '../src/prediction/OutbreakForecaster';
import { GeographicNormalizer } from '../src/normalization/GeographicNormalizer';

describe('Developer 2 — Phase 2: Historical Surveillance → Outbreak Intelligence → Prediction', () => {

  // 1. Canonical Ingestion
  it('1. successfully ingests canonical surveillance observation', () => {
    const obs = SurveillanceQualityValidator.validateObservation({
      regionId: 'DISTRICT_VARANASI',
      diseaseCode: 'A90',
      diseaseName: 'Dengue Fever',
      observationDate: '2026-09-01',
      cases: 15,
      screened: 100,
      positive: 15,
      source: 'IDSP_BULLETIN',
    });

    expect(obs.isValid).toBe(true);
    expect(obs.regionId).toBe('DISTRICT_VARANASI');
    expect(obs.diseaseCode).toBe('A90');
    expect(obs.cases).toBe(15);
  });

  // 2. Invalid Records (Negative counts & impossible dates)
  it('2. rejects negative counts and impossible future dates', () => {
    const negObs = SurveillanceQualityValidator.validateObservation({
      regionId: 'DIST_A',
      diseaseCode: 'U07.1',
      observationDate: '2026-09-01',
      cases: -5,
    });
    expect(negObs.isValid).toBe(false);
    expect(negObs.validationReasons?.some((r) => r.includes('Negative'))).toBe(true);

    const futureObs = SurveillanceQualityValidator.validateObservation({
      regionId: 'DIST_A',
      diseaseCode: 'U07.1',
      observationDate: '2030-01-01',
      cases: 10,
    });
    expect(futureObs.isValid).toBe(false);
    expect(futureObs.validationReasons?.some((r) => r.includes('Impossible future'))).toBe(true);
  });

  // 3. Duplicate Detection
  it('3. detects and flags duplicate observation events in a batch', () => {
    const batch = [
      {
        regionId: 'VARANASI',
        diseaseCode: 'A90',
        observationDate: '2026-09-01',
        cases: 10,
        source: 'SENTINEL_A',
      },
      {
        regionId: 'VARANASI',
        diseaseCode: 'A90',
        observationDate: '2026-09-01',
        cases: 10,
        source: 'SENTINEL_A', // Exact duplicate
      },
    ];

    const result = SurveillanceQualityValidator.validateBatch(batch);
    expect(result.duplicateRecords).toBe(1);
    expect(result.records[1].isDuplicate).toBe(true);
    expect(result.records[1].isValid).toBe(false);
  });

  // 4. Missing Denominator Policy (Never infer or fabricate)
  it('4. preserves missing denominator without artificial fabrication', () => {
    const obs = SurveillanceQualityValidator.validateObservation({
      regionId: 'VARANASI',
      diseaseCode: 'A90',
      observationDate: '2026-09-01',
      cases: 25,
      // screened denominator absent
    });

    expect(obs.isValid).toBe(true);
    expect(obs.screened).toBeUndefined();

    const features = TemporalFeatureExtractor.extractFeatures([obs]);
    expect(features?.hasValidDenominator).toBe(false);
    expect(features?.positivityRate7d).toBeUndefined();
  });

  // 5. Temporal Features (7d, 14d, 28d growth rates)
  it('5. computes multi-window temporal features and growth rates', () => {
    const observations: SurveillanceObservation[] = [
      // Prior 7-day window [7 days ago]
      SurveillanceQualityValidator.validateObservation({
        regionId: 'VARANASI',
        diseaseCode: 'COVID-19',
        observationDate: '2026-08-25',
        cases: 20,
      }),
      // Current 7-day window [today]
      SurveillanceQualityValidator.validateObservation({
        regionId: 'VARANASI',
        diseaseCode: 'COVID-19',
        observationDate: '2026-09-01',
        cases: 40,
      }),
    ];

    const features = TemporalFeatureExtractor.extractFeatures(observations, '2026-09-01');
    expect(features?.cases7d).toBe(40);
    expect(features?.growthRate7d).toBe(1.0); // +100% growth from 20 to 40
  });

  // 6. Baseline Deviation & Z-Score
  it('6. calculates baseline deviation ratio and z-score against historical history', () => {
    const obsList: SurveillanceObservation[] = [];
    // Generate 8 historical weeks with baseline ~10 cases/week
    for (let w = 8; w >= 1; w--) {
      const d = new Date('2026-09-01');
      d.setDate(d.getDate() - w * 7);
      obsList.push(
        SurveillanceQualityValidator.validateObservation({
          regionId: 'DIST_X',
          diseaseCode: 'DENGUE',
          observationDate: d.toISOString().slice(0, 10),
          cases: 10 + (w % 2),
        }),
      );
    }
    // Current week surges to 35 cases
    obsList.push(
      SurveillanceQualityValidator.validateObservation({
        regionId: 'DIST_X',
        diseaseCode: 'DENGUE',
        observationDate: '2026-09-01',
        cases: 35,
      }),
    );

    const features = TemporalFeatureExtractor.extractFeatures(obsList, '2026-09-01')!;
    expect(features.baselineDeviationRatio).toBeGreaterThan(3.0);
    expect(features.zScore).toBeGreaterThan(2.0);
    expect(features.isAnomalousVsBaseline).toBe(true);
  });

  // 7. Small Sample Protection (Region X 8/10)
  it('7. enforces small sample protection for 8/10 cluster (CRITICAL risk, LOW_SAMPLE confidence)', () => {
    const obs = SurveillanceQualityValidator.validateObservation({
      regionId: 'REGION_X',
      diseaseCode: 'COVID-19',
      observationDate: '2026-09-01',
      cases: 8,
      screened: 10,
      positive: 8,
      source: 'SENTINEL_KIOSK',
    });

    const features = TemporalFeatureExtractor.extractFeatures([obs], '2026-09-01')!;
    const signal = OutbreakSignalEngine.evaluateSignal(features);

    expect(signal.riskLevel).toBe('CRITICAL');
    expect(signal.confidence).toBe('LOW_SAMPLE');
    expect(signal.sampleSize).toBe(10);
    expect(signal.positivityRate).toBe(0.80);
    expect(signal.clinicalUse.individualDiagnosis).toBe(false);
  });

  // 8. Multi-Facility Clustering
  it('8. distinguishes multi-facility clusters from isolated single-facility events', () => {
    const obsList: SurveillanceObservation[] = [
      SurveillanceQualityValidator.validateObservation({
        regionId: 'DIST_K',
        diseaseCode: 'CHOLERA',
        observationDate: '2026-09-01',
        cases: 5,
        facilityIds: ['HOSP_NORTH', 'HOSP_CENTRAL'],
      }),
    ];

    const features = TemporalFeatureExtractor.extractFeatures(obsList, '2026-09-01')!;
    expect(features.reportingFacilitiesCount).toBe(2);
    expect(features.isMultiFacilitySignal).toBe(true);

    const signal = OutbreakSignalEngine.evaluateSignal(features);
    expect(signal.evidence.some((e) => e.includes('across 2 independent facilities'))).toBe(true);
  });

  // 9. Rising Trend Evaluation
  it('9. identifies elevated risk when activity shows a strong rising trend', () => {
    const obsList: SurveillanceObservation[] = [
      SurveillanceQualityValidator.validateObservation({
        regionId: 'DIST_R',
        diseaseCode: 'INFLUENZA',
        observationDate: '2026-08-25',
        cases: 10,
      }),
      SurveillanceQualityValidator.validateObservation({
        regionId: 'DIST_R',
        diseaseCode: 'INFLUENZA',
        observationDate: '2026-09-01',
        cases: 25,
      }),
    ];

    const features = TemporalFeatureExtractor.extractFeatures(obsList, '2026-09-01')!;
    const signal = OutbreakSignalEngine.evaluateSignal(features);
    expect(signal.trend).toBe('RISING');
  });

  // 10. Falling Trend Evaluation
  it('10. identifies declining activity trend', () => {
    const obsList: SurveillanceObservation[] = [
      SurveillanceQualityValidator.validateObservation({
        regionId: 'DIST_F',
        diseaseCode: 'INFLUENZA',
        observationDate: '2026-08-25',
        cases: 40,
      }),
      SurveillanceQualityValidator.validateObservation({
        regionId: 'DIST_F',
        diseaseCode: 'INFLUENZA',
        observationDate: '2026-09-01',
        cases: 15,
      }),
    ];

    const features = TemporalFeatureExtractor.extractFeatures(obsList, '2026-09-01')!;
    const signal = OutbreakSignalEngine.evaluateSignal(features);
    expect(signal.trend).toBe('FALLING');
  });

  // 11. Insufficient Historical Data
  it('11. flags confidence as INSUFFICIENT_HISTORY when temporal history is sparse', () => {
    const singleObs = SurveillanceQualityValidator.validateObservation({
      regionId: 'REMOTE_DIST',
      diseaseCode: 'MEASLES',
      observationDate: '2026-09-01',
      cases: 2,
    });

    const features = TemporalFeatureExtractor.extractFeatures([singleObs], '2026-09-01')!;
    const signal = OutbreakSignalEngine.evaluateSignal(features);
    expect(signal.confidence).toBe('INSUFFICIENT_HISTORY');
  });

  // 12. Chronological Train / Validation / Test Splitting
  it('12. enforces chronological splitting without random shuffling', () => {
    const series: TimeSeriesPoint[] = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-08-${String(i + 1).padStart(2, '0')}`,
      value: 10 + i * 2,
    }));

    const report = OutbreakForecaster.evaluateChronological(series, 'REGION_X', 'COVID-19');
    expect(report.totalObservations).toBe(20);
    expect(report.trainCount).toBe(14); // 70%
    expect(report.validationCount).toBe(3); // 15%
    expect(report.testCount).toBe(3); // 15%
  });

  // 13. No Future-Data Leakage
  it('13. prevents future observations from leaking into past predictions', () => {
    const history = [10, 12, 14, 16, 18];
    // Next step prediction
    const naiveNext = OutbreakForecaster.predictNaive(history);
    expect(naiveNext).toBe(18); // strictly based on current step, does not know step 6

    const maNext = OutbreakForecaster.predictMovingAverage(history, 3);
    expect(maNext).toBe(16); // (14+16+18)/3
  });

  // 14. Forecasting Baselines (Naive vs MA vs Holt)
  it('14. evaluates all three statistical forecasting baselines', () => {
    const series: TimeSeriesPoint[] = [
      { date: '2026-08-01', value: 12 },
      { date: '2026-08-02', value: 15 },
      { date: '2026-08-03', value: 18 },
      { date: '2026-08-04', value: 22 },
      { date: '2026-08-05', value: 26 },
      { date: '2026-08-06', value: 30 },
      { date: '2026-08-07', value: 35 },
      { date: '2026-08-08', value: 41 },
      { date: '2026-08-09', value: 48 },
      { date: '2026-08-10', value: 55 },
      { date: '2026-08-11', value: 62 },
      { date: '2026-08-12', value: 70 },
    ];

    const report = OutbreakForecaster.evaluateChronological(series);
    expect(report.models.length).toBe(3);
    const modelNames = report.models.map((m) => m.modelName);
    expect(modelNames).toContain('NAIVE_PERSISTENCE');
    expect(modelNames).toContain('MOVING_AVERAGE_7D');
    expect(modelNames).toContain('HOLT_EXPONENTIAL_SMOOTHING');
    expect(report.bestModel).toBeDefined();
  });

  // 15. Evaluation Metrics (MAE, RMSE, Precision, Recall, F1)
  it('15. reports MAE, RMSE, and anomaly detection metrics without fabricating labels', () => {
    const actuals = [10, 20, 30];
    const preds = [12, 18, 33];
    const metrics = OutbreakForecaster.computeMetrics(actuals, preds);

    expect(metrics.mae).toBeCloseTo(2.33, 1);
    expect(metrics.rmse).toBeGreaterThan(0);
    expect(metrics.sampleCount).toBe(3);
  });

  // 16. Controlled Synthetic Scenario A vs B vs F
  it('16. tests controlled synthetic scenarios A (8/10), B (20/1000), and F (missing denominator)', () => {
    // Scenario A: 8/10
    const scA = OutbreakSignalEngine.evaluateSignal({
      regionId: 'SCENARIO_A',
      diseaseCode: 'COVID-19',
      asOfDate: '2026-09-01',
      cases7d: 8,
      growthRate7d: 0,
      cases14d: 8,
      growthRate14d: 0,
      cases28d: 8,
      growthRate28d: 0,
      totalScreened7d: 10,
      totalPositive7d: 8,
      positivityRate7d: 0.80,
      hasValidDenominator: true,
      historicalBaselineMean7d: 2,
      historicalBaselineStd7d: 1,
      baselineDeviationRatio: 4,
      zScore: 6,
      isAnomalousVsBaseline: true,
      reportingFacilitiesCount: 1,
      facilityIds: ['KIOSK_1'],
      isMultiFacilitySignal: false,
      observationCount: 1,
    });
    expect(scA.riskLevel).toBe('CRITICAL');
    expect(scA.confidence).toBe('LOW_SAMPLE');

    // Scenario B: 20/1000
    const scB = OutbreakSignalEngine.evaluateSignal({
      regionId: 'SCENARIO_B',
      diseaseCode: 'COVID-19',
      asOfDate: '2026-09-01',
      cases7d: 20,
      growthRate7d: -0.05,
      cases14d: 40,
      growthRate14d: -0.05,
      cases28d: 80,
      growthRate28d: 0,
      totalScreened7d: 1000,
      totalPositive7d: 20,
      positivityRate7d: 0.02,
      hasValidDenominator: true,
      historicalBaselineMean7d: 22,
      historicalBaselineStd7d: 4,
      baselineDeviationRatio: 0.9,
      zScore: -0.5,
      isAnomalousVsBaseline: false,
      reportingFacilitiesCount: 5,
      facilityIds: ['H1', 'H2', 'H3', 'H4', 'H5'],
      isMultiFacilitySignal: true,
      observationCount: 10,
    });
    expect(scB.riskLevel).toBe('LOW');
    expect(scB.confidence).toBe('ADEQUATE_SAMPLE');

    // Scenario F: Missing denominator
    const scF = OutbreakSignalEngine.evaluateSignal({
      regionId: 'SCENARIO_F',
      diseaseCode: 'DENGUE',
      asOfDate: '2026-09-01',
      cases7d: 12,
      growthRate7d: 0.1,
      cases14d: 20,
      growthRate14d: 0.1,
      cases28d: 35,
      growthRate28d: 0,
      hasValidDenominator: false,
      historicalBaselineMean7d: 10,
      historicalBaselineStd7d: 3,
      baselineDeviationRatio: 1.2,
      zScore: 0.67,
      isAnomalousVsBaseline: false,
      reportingFacilitiesCount: 1,
      facilityIds: ['PHC_1'],
      isMultiFacilitySignal: false,
      observationCount: 4,
    });
    expect(scF.positivityRate).toBeUndefined();
    expect(scF.evidence.some((e) => e.includes('denominator unrecorded'))).toBe(true);
  });

  // 17. 7-Day and 14-Day Forward Multi-Horizon Forecasting
  it('17. generates 7-day and 14-day forward outbreak projections with confidence intervals', () => {
    const history = [10, 12, 14, 15, 18, 22, 28, 35, 42, 50];
    const forecast7d = OutbreakForecaster.forecastHorizon(history, 7);
    expect(forecast7d.horizonDays).toBe(7);
    expect(forecast7d.dailyProjections.length).toBe(7);
    expect(forecast7d.expectedTotalCases).toBeGreaterThan(0);
    expect(forecast7d.trend).toBe('RISING');

    // First and last projections
    const day1 = forecast7d.dailyProjections[0];
    const day7 = forecast7d.dailyProjections[6];
    expect(day1.lowerCi95).toBeLessThanOrEqual(day1.predictedCases);
    expect(day1.upperCi95).toBeGreaterThanOrEqual(day1.predictedCases);
    expect(day7.upperCi95).toBeGreaterThan(day1.upperCi95); // Confidence interval widens with horizon

    const forecast14d = OutbreakForecaster.forecastHorizon(history, 14);
    expect(forecast14d.horizonDays).toBe(14);
    expect(forecast14d.dailyProjections.length).toBe(14);
    expect(forecast14d.expectedTotalCases).toBeGreaterThan(forecast7d.expectedTotalCases);
  });

  // 18. Tabular ML Autoregressive Benchmark & Promotion Decision
  it('18. evaluates Tabular ML Ridge model against baselines and records transparent promotion decision', () => {
    // 25 time steps for train (17) / val (4) / test (4)
    const series: TimeSeriesPoint[] = Array.from({ length: 25 }, (_, i) => ({
      date: `2026-08-${String(i + 1).padStart(2, '0')}`,
      value: 10 + i * 2 + (i % 3 === 0 ? 3 : 0),
    }));

    const report = OutbreakForecaster.evaluateChronological(series, 'IN-UP-VARANASI', 'A90', { includeML: true });
    expect(report.mlBenchmark).toBeDefined();
    expect(report.mlBenchmark?.modelName).toBe('ML_TABULAR_AUTOREGRESSIVE');
    expect(['PROMOTED', 'NOT_PROMOTED']).toContain(report.mlBenchmark?.promotionStatus);
    expect(report.mlBenchmark?.decisionReason.length).toBeGreaterThan(10);
    expect(report.mlBenchmark?.featuresUsed).toContain('cases1d');
    expect(report.mlBenchmark?.featuresUsed).toContain('ma7');
    expect(report.forecastHorizons?.['7d']).toBeDefined();
    expect(report.forecastHorizons?.['14d']).toBeDefined();
  });

  // 19. Geographic Normalization & Stable Region Hierarchy
  it('19. normalizes vernacular aliases and spelling variants into canonical hierarchical region IDs', () => {
    // Alias Varanasi
    const v1 = GeographicNormalizer.normalizeRegion('Varanasi');
    const v2 = GeographicNormalizer.normalizeRegion('Banaras');
    const v3 = GeographicNormalizer.normalizeRegion('Kashi');
    expect(v1?.regionId).toBe('IN-UP-VARANASI');
    expect(v2?.regionId).toBe('IN-UP-VARANASI');
    expect(v3?.regionId).toBe('IN-UP-VARANASI');
    expect(v1?.state).toBe('Uttar Pradesh');

    // Alias Pune
    const p1 = GeographicNormalizer.normalizeRegion('Poona');
    expect(p1?.regionId).toBe('IN-MH-PUNE');

    // State code resolution
    expect(GeographicNormalizer.getStateCode('Uttar Pradesh')).toBe('UP');
    expect(GeographicNormalizer.getStateCode('Maharashtra')).toBe('MH');
    expect(GeographicNormalizer.getStateCode('Tamil Nadu')).toBe('TN');

    // Unknown geography
    expect(GeographicNormalizer.normalizeRegion('FictionalAtlantisDistrict')).toBeNull();
  });

  // 20. Surveillance Data Quality Engine Audit
  it('20. audits observations for data quality, malformed records, and missing denominators', () => {
    // Valid record
    const validAudit = SurveillanceQualityValidator.auditObservation({
      regionId: 'IN-UP-VARANASI',
      diseaseCode: 'A90',
      observationDate: '2026-08-10',
      cases: 25,
      screened: 250,
      positive: 25,
      source: 'IDSP',
    });
    expect(validAudit.valid).toBe(true);
    expect(validAudit.qualityScore).toBeGreaterThanOrEqual(0.9);
    expect(validAudit.errors.length).toBe(0);

    // Negative counts error
    const negAudit = SurveillanceQualityValidator.auditObservation({
      regionId: 'IN-UP-VARANASI',
      diseaseCode: 'A90',
      observationDate: '2026-08-10',
      cases: -5,
    });
    expect(negAudit.valid).toBe(false);
    expect(negAudit.errors.some((e) => e.toLowerCase().includes('negative'))).toBe(true);

    // Future timestamp error
    const futureAudit = SurveillanceQualityValidator.auditObservation({
      regionId: 'IN-UP-VARANASI',
      diseaseCode: 'A90',
      observationDate: '2099-01-01',
      cases: 10,
    });
    expect(futureAudit.valid).toBe(false);
    expect(futureAudit.errors.some((e) => e.toLowerCase().includes('future'))).toBe(true);

    // Positive > tested error
    const mismatchAudit = SurveillanceQualityValidator.auditObservation({
      regionId: 'IN-UP-VARANASI',
      diseaseCode: 'A90',
      observationDate: '2026-08-10',
      cases: 10,
      tested: 5,
      positive: 10,
    });
    expect(mismatchAudit.valid).toBe(false);
    expect(mismatchAudit.errors.some((e) => e.toLowerCase().includes('exceeds tested'))).toBe(true);

    // Missing denominator warning (NOT error — official bulletins often omit tested volume)
    const noDenomAudit = SurveillanceQualityValidator.auditObservation({
      regionId: 'IN-UP-VARANASI',
      diseaseCode: 'A90',
      observationDate: '2026-08-10',
      cases: 15,
    });
    expect(noDenomAudit.valid).toBe(true);
    expect(noDenomAudit.warnings.some((w) => w.toLowerCase().includes('denominator'))).toBe(true);
  });

  // 21. Multi-lag Temporal Features, Volatility, & Facility Clustering
  it('21. extracts multi-scale moving averages, volatility metrics, and Herfindahl facility clustering', () => {
    const dates = Array.from({ length: 30 }, (_, i) => `2026-08-${String(i + 1).padStart(2, '0')}`);
    const obs: SurveillanceObservation[] = dates.map((d, i) => ({
      id: `OBS_${i}`,
      regionId: 'IN-UP-VARANASI',
      diseaseCode: 'A90',
      diseaseName: 'Dengue',
      observationDate: d,
      cases: 5 + i,
      deaths: 0,
      reportingFacilityId: `PHC_${i % 4}`,
      source: 'IDSP',
      isValid: true,
    }));

    const features = TemporalFeatureExtractor.extractFeatures(obs, '2026-08-30');
    expect(features.cases1d).toBeDefined();
    expect(features.cases3d).toBeGreaterThan(0);
    expect(features.cases7d).toBeGreaterThan(0);
    expect(features.cases14d).toBeGreaterThan(features.cases7d);
    expect(features.cases28d).toBeGreaterThan(features.cases14d);
    expect(features.growthRate7d).toBeDefined();
    expect(features.ma3).toBeGreaterThan(0);
    expect(features.ma7).toBeGreaterThan(0);
    expect(features.rollingStd).toBeDefined();
    expect(features.baseline4wMean).toBeGreaterThan(0);
    expect(features.facilityConcentrationHHI).toBeDefined();
    expect(features.facilityConcentrationHHI).toBeGreaterThan(0);
    expect(features.facilityConcentrationHHI).toBeLessThanOrEqual(1.0);
  });

});

