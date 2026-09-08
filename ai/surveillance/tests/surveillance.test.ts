import { describe, it, expect } from 'vitest';
import { BayesianOutbreakEstimator } from '../src/BayesianOutbreakEstimator';
import { SurveillanceService } from '../src/SurveillanceService';
import { SurveillanceNormalizer } from '../src/data/SurveillanceNormalizer';
import { RegionalAggregator } from '../src/aggregation/RegionalAggregator';
import { DemoSeedManager } from '../src/data/demoSeed';

describe('Developer 2: Regional Disease Surveillance & Outbreak Intelligence', () => {
  // Test 1: 8/10 DEMO Cluster
  it('correctly assesses the controlled 8/10 small-sample demo cluster', () => {
    const result = BayesianOutbreakEstimator.assessRegionalRisk({
      regionId: 'REGION_X',
      disease: 'COVID-19',
      testedCount: 10,
      positiveCount: 8,
      baselinePrevalence: 0.04,
      priorAlpha: 2,
      priorBeta: 48,
    });

    expect(result.regionId).toBe('REGION_X');
    expect(result.disease).toBe('COVID-19');
    expect(result.sampleSize).toBe(10);
    expect(result.positiveCount).toBe(8);
    expect(result.positivityRate).toBe(0.8);
    expect(result.riskLevel).toBe('CRITICAL');
    expect(result.confidence).toBe('LOW_SAMPLE');

    // Bayesian smoothed estimate should temper the 80% raw figure
    expect(result.bayesSmoothedRate).toBeLessThan(0.8);
    expect(result.bayesSmoothedRate).toBeCloseTo(0.1667, 2);

    // Wilson confidence interval should be bounded in [0, 1]
    expect(result.wilsonInterval.lower).toBeGreaterThan(0.4);
    expect(result.wilsonInterval.upper).toBeLessThan(1.0);
  });

  // Test 2: 0/10 Cluster
  it('correctly handles 0 positives out of 10 tested', () => {
    const result = BayesianOutbreakEstimator.assessRegionalRisk({
      regionId: 'REGION_Y',
      disease: 'COVID-19',
      testedCount: 10,
      positiveCount: 0,
    });

    expect(result.positivityRate).toBe(0);
    expect(result.riskLevel).toBe('LOW');
    expect(result.confidence).toBe('LOW_SAMPLE');
    expect(result.wilsonInterval.lower).toBe(0);
  });

  // Test 3: 1/1 Single observation
  it('verifies that 1/1 positive does NOT automatically become reliable outbreak evidence', () => {
    const result = BayesianOutbreakEstimator.assessRegionalRisk({
      regionId: 'CLINIC_Z',
      disease: 'COVID-19',
      testedCount: 1,
      positiveCount: 1,
    });

    expect(result.sampleSize).toBe(1);
    expect(result.positiveCount).toBe(1);
    expect(result.confidence).toBe('INSUFFICIENT_SAMPLE');
    // Crucial safety check: Single positive must never declare a CRITICAL outbreak
    expect(result.riskLevel).not.toBe('CRITICAL');
  });

  // Test 4: 8/100 Adequate sample size
  it('handles 8 positive out of 100 tested with ADEQUATE_SAMPLE confidence', () => {
    const result = BayesianOutbreakEstimator.assessRegionalRisk({
      regionId: 'DISTRICT_NORTH',
      disease: 'COVID-19',
      testedCount: 100,
      positiveCount: 8,
    });

    expect(result.sampleSize).toBe(100);
    expect(result.positivityRate).toBe(0.08);
    expect(result.confidence).toBe('ADEQUATE_SAMPLE');
    expect(result.riskLevel).toBe('HIGH');
  });

  // Test 5: Rising Trend
  it('detects a rising trend between consecutive observation periods', () => {
    const trend = BayesianOutbreakEstimator.evaluateTrend(0.12, 100, 0.05, 100);
    expect(['RISING', 'OUTBREAK_SURGE']).toContain(trend);
  });

  // Test 6: Falling Trend
  it('detects a falling trend between consecutive observation periods', () => {
    const trend = BayesianOutbreakEstimator.evaluateTrend(0.04, 100, 0.10, 100);
    expect(trend).toBe('FALLING');
  });

  // Test 7: Insufficient Data Handling
  it('flags zero or negative tests as insufficient sample', () => {
    const result = BayesianOutbreakEstimator.assessRegionalRisk({
      regionId: 'REMOTE_PHC',
      disease: 'Dengue',
      testedCount: 0,
      positiveCount: 0,
    });

    expect(result.confidence).toBe('INSUFFICIENT_SAMPLE');
    expect(result.riskLevel).toBe('LOW');
  });

  // Test 8: Multiple Diseases via SurveillanceService
  it('provides multi-disease surveillance signals', () => {
    const response = SurveillanceService.getRegionalRisk('REGION_X');
    expect(response.regionId).toBe('REGION_X');
    expect(response.signals.length).toBeGreaterThanOrEqual(2);

    const diseases = response.signals.map((s) => s.disease);
    expect(diseases).toContain('COVID-19');
    expect(diseases).toContain('Dengue');
  });

  // Test 9: Surveillance Normalization & ICD-10 Mapping
  it('normalizes raw surveillance reports to canonical ICD-10 and categories', () => {
    const normDengue = SurveillanceNormalizer.normalizeRecord({
      source: 'IDSP_BULLETIN',
      regionId: 'DISTRICT_VARANASI',
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      diseaseRaw: 'Dengue Hemorrhagic Fever',
      screenedCount: 50,
      positiveCount: 12,
    });

    expect(normDengue.isValid).toBe(true);
    expect(normDengue.disease).toBe('Dengue Fever');
    expect(normDengue.icd10Code).toBe('A90');
    expect(normDengue.category).toBe('VECTOR_BORNE');
    expect(normDengue.positivityRate).toBe(0.24);
  });

  // Test 10: Validation Rejection of Impossible Surveillance Data
  it('rejects corrupt surveillance records (positive > screened or negative counts)', () => {
    const invalidExceed = SurveillanceNormalizer.normalizeRecord({
      source: 'HOSPITAL_SENTINEL',
      regionId: 'HOSP_01',
      state: 'Delhi',
      district: 'Central',
      diseaseRaw: 'COVID-19',
      screenedCount: 10,
      positiveCount: 15, // Impossible
    });
    expect(invalidExceed.isValid).toBe(false);
    expect(invalidExceed.validationError).toContain('exceeds');

    const invalidNegative = SurveillanceNormalizer.normalizeRecord({
      source: 'HOSPITAL_SENTINEL',
      regionId: 'HOSP_02',
      state: 'Delhi',
      district: 'Central',
      diseaseRaw: 'COVID-19',
      screenedCount: -5,
      positiveCount: 2,
    });
    expect(invalidNegative.isValid).toBe(false);
  });

  // Test 11: Non-Fabrication of Missing Surveillance Fields
  it('prevents fabrication when screenedCount or positiveCount is absent', () => {
    const missing = SurveillanceNormalizer.normalizeRecord({
      source: 'IDSP_BULLETIN',
      regionId: 'DISTRICT_KANPUR',
      state: 'Uttar Pradesh',
      district: 'Kanpur',
      diseaseRaw: 'Cholera',
      // Missing counts
    });
    expect(missing.isValid).toBe(false);
    expect(missing.validationError).toContain('fabrication prevented');
  });

  // Test 12: Regional Aggregator Multi-Facility Clustering
  it('aggregates signals across multiple facilities within a district', () => {
    const signals = [
      SurveillanceNormalizer.normalizeRecord({
        source: 'KIOSK_TRIAGE',
        regionId: 'VARANASI',
        state: 'Uttar Pradesh',
        district: 'Varanasi',
        hospitalId: 'HOSP_BHU',
        diseaseRaw: 'COVID-19',
        screenedCount: 20,
        positiveCount: 4,
      }),
      SurveillanceNormalizer.normalizeRecord({
        source: 'HOSPITAL_SENTINEL',
        regionId: 'VARANASI',
        state: 'Uttar Pradesh',
        district: 'Varanasi',
        hospitalId: 'HOSP_CIVIL',
        diseaseRaw: 'COVID-19',
        screenedCount: 30,
        positiveCount: 6,
      }),
    ];

    const aggregated = RegionalAggregator.aggregateCohort(signals);
    expect(aggregated.length).toBe(1);
    expect(aggregated[0].regionId).toBe('VARANASI');
    expect(aggregated[0].reportingFacilitiesCount).toBe(2);
    expect(aggregated[0].totalScreened).toBe(50);
    expect(aggregated[0].totalPositives).toBe(10);
    expect(aggregated[0].observedPositivityRate).toBe(0.20);
    expect(aggregated[0].bayesianEstimate.riskLevel).toBe('CRITICAL');
  });

  // Test 13: Controlled Region X 8/10 Demo Seed
  it('correctly validates the canonical Region X 8/10 Demo Seed', () => {
    const rawDemo = DemoSeedManager.getRawDemoRecords();
    expect(rawDemo.length).toBe(2);

    const assessment = DemoSeedManager.getRegionXDemoAssessment();
    expect(assessment.regionId).toBe('REGION_X');
    expect(assessment.disease).toBe('COVID-19');
    expect(assessment.sampleSize).toBe(10);
    expect(assessment.positiveCount).toBe(8);
    expect(assessment.positivityRate).toBe(0.80);
    expect(assessment.riskLevel).toBe('CRITICAL');
    expect(assessment.confidence).toBe('LOW_SAMPLE');
    expect(assessment.wilsonInterval.lower).toBeCloseTo(0.49, 2);
  });
});

