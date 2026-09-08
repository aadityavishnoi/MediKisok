import { describe, it, expect } from 'vitest';
import { BayesianOutbreakEstimator } from '../src/BayesianOutbreakEstimator';
import { SurveillanceService } from '../src/SurveillanceService';

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
});
