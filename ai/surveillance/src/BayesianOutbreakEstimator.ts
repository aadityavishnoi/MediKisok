/**
 * Developer 2: Bayesian Outbreak Estimator & Regional Surveillance Statistics
 *
 * Implements rigorous small-sample epidemiological statistics:
 * 1. Observed Positivity Rate (Screening circulation pressure)
 * 2. Wilson Score 95% Confidence Interval (Quantifying binomial sampling uncertainty)
 * 3. Empirical Bayes / Laplace Beta-Binomial Smoothing (Mitigating small-sample variance e.g. 8/10 or 1/1)
 * 4. Sample Size Confidence Classification (INSUFFICIENT_SAMPLE, LOW_SAMPLE, ADEQUATE_SAMPLE, HIGH_CONFIDENCE)
 * 5. Multi-disease outbreak triage (COVID-19, Dengue, Malaria, Chikungunya, Influenza, Measles, Cholera)
 */

export type OutbreakRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type OutbreakTrend = 'FALLING' | 'STABLE' | 'RISING' | 'OUTBREAK_SURGE';
export type OutbreakConfidence = 'INSUFFICIENT_SAMPLE' | 'LOW_SAMPLE' | 'ADEQUATE_SAMPLE' | 'HIGH_CONFIDENCE';

export interface OutbreakCalculationInput {
  regionId: string;
  disease: string;
  testedCount: number;
  positiveCount: number;
  previousPeriodTested?: number;
  previousPeriodPositive?: number;
  baselinePrevalence?: number; // e.g. 0.03 (3% baseline endemic rate)
  priorAlpha?: number;        // Beta prior alpha (default: 2)
  priorBeta?: number;         // Beta prior beta (default: 48, prior mean = 4%)
}

export interface OutbreakCalculationResult {
  regionId: string;
  disease: string;
  sampleSize: number;
  positiveCount: number;
  positivityRate: number;
  bayesSmoothedRate: number;
  wilsonInterval: {
    lower: number;
    upper: number;
  };
  trend: OutbreakTrend;
  riskLevel: OutbreakRiskLevel;
  confidence: OutbreakConfidence;
  epidemiologicalNote: string;
  methodology: string;
  generatedAt: string;
}

export class BayesianOutbreakEstimator {
  private static readonly Z_95 = 1.95996; // 95% two-sided normal quantile

  /**
   * Computes the Wilson score interval for binomial proportions.
   * Particularly essential when sample size is small or proportion is near 0 or 1.
   */
  static calculateWilsonInterval(k: number, n: number): { lower: number; upper: number } {
    if (n <= 0) return { lower: 0, upper: 0 };
    const p = Math.max(0, Math.min(1, k / n));
    const z = this.Z_95;
    const z2 = z * z;

    const denominator = 1 + z2 / n;
    const center = p + z2 / (2 * n);
    const spread = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));

    const lower = Math.max(0, (center - spread) / denominator);
    const upper = Math.min(1, (center + spread) / denominator);

    return {
      lower: Number(lower.toFixed(4)),
      upper: Number(upper.toFixed(4)),
    };
  }

  /**
   * Empirical Bayes smoothing using Beta(alpha, beta) conjugate prior.
   * Smooths high-variance small sample rates toward district baseline.
   */
  static calculateSmoothedRate(k: number, n: number, alpha = 2, beta = 48): number {
    if (n <= 0) return Number((alpha / (alpha + beta)).toFixed(4));
    const posterior = (k + alpha) / (n + alpha + beta);
    return Number(posterior.toFixed(4));
  }

  /**
   * Evaluates rolling temporal trend between successive observation windows.
   */
  static evaluateTrend(
    currPosRate: number,
    currTested: number,
    prevPosRate?: number,
    prevTested?: number,
  ): OutbreakTrend {
    if (!prevTested || prevTested < 5 || prevPosRate === undefined || currTested < 5) {
      return 'STABLE';
    }

    const delta = currPosRate - prevPosRate;
    const relativeChange = prevPosRate > 0 ? delta / prevPosRate : delta;

    if (relativeChange >= 0.50 || (delta >= 0.15 && currPosRate >= 0.20)) {
      return 'OUTBREAK_SURGE';
    }
    if (relativeChange >= 0.20 || delta >= 0.05) {
      return 'RISING';
    }
    if (relativeChange <= -0.20 || delta <= -0.05) {
      return 'FALLING';
    }
    return 'STABLE';
  }

  /**
   * Assigns confidence tier based on testing volume and variance.
   */
  static evaluateConfidence(tested: number): OutbreakConfidence {
    if (tested <= 2) return 'INSUFFICIENT_SAMPLE';
    if (tested < 25) return 'LOW_SAMPLE';
    if (tested <= 1000) return 'ADEQUATE_SAMPLE';
    return 'HIGH_CONFIDENCE';
  }

  /**
   * Master Risk Calculation Engine incorporating sample size, positivity rate,
   * trend, and Bayesian priors.
   */
  static assessRegionalRisk(input: OutbreakCalculationInput): OutbreakCalculationResult {
    const {
      regionId,
      disease,
      testedCount,
      positiveCount,
      previousPeriodTested,
      previousPeriodPositive,
      baselinePrevalence = 0.03,
      priorAlpha = 2,
      priorBeta = 48,
    } = input;

    const n = Math.max(0, testedCount);
    const k = Math.min(n, Math.max(0, positiveCount));
    const positivityRate = n > 0 ? Number((k / n).toFixed(4)) : 0;

    // Small sample CI & Bayesian smoothing
    const wilsonInterval = this.calculateWilsonInterval(k, n);
    const bayesSmoothedRate = this.calculateSmoothedRate(k, n, priorAlpha, priorBeta);
    const confidence = this.evaluateConfidence(n);

    // Trend calculation
    let prevRate: number | undefined;
    if (previousPeriodTested && previousPeriodTested > 0 && previousPeriodPositive !== undefined) {
      prevRate = previousPeriodPositive / previousPeriodTested;
    }
    const trend = this.evaluateTrend(positivityRate, n, prevRate, previousPeriodTested);

    // Assign Risk Level
    let riskLevel: OutbreakRiskLevel = 'LOW';

    // SPECIAL RULE: 1/1 or n <= 2 observations CANNOT trigger CRITICAL or HIGH outbreak
    if (n <= 2) {
      riskLevel = k > 0 ? 'MODERATE' : 'LOW';
    } else if (n < 25) {
      // Small sample cluster (e.g. 8/10 DEMO cluster)
      if (positivityRate >= 0.50 && k >= 4) {
        riskLevel = 'CRITICAL';
      } else if (positivityRate >= 0.25 || trend === 'OUTBREAK_SURGE') {
        riskLevel = 'HIGH';
      } else if (positivityRate >= 0.10 || k >= 2) {
        riskLevel = 'MODERATE';
      } else {
        riskLevel = 'LOW';
      }
    } else {
      // Robust sample size (n >= 25)
      if (positivityRate >= 0.20 || (positivityRate >= 0.12 && trend === 'OUTBREAK_SURGE')) {
        riskLevel = 'CRITICAL';
      } else if (positivityRate >= 0.08 || (positivityRate >= 0.05 && trend === 'RISING')) {
        riskLevel = 'HIGH';
      } else if (positivityRate >= 0.04 || positivityRate > baselinePrevalence * 1.5) {
        riskLevel = 'MODERATE';
      } else {
        riskLevel = 'LOW';
      }
    }

    // Explanatory note avoiding false diagnostic certainty
    let epidemiologicalNote = '';
    if (confidence === 'INSUFFICIENT_SAMPLE') {
      epidemiologicalNote = `Extremely limited sample (${k}/${n}). Insufficient statistical power to conclude regional surge. Continued monitoring required.`;
    } else if (confidence === 'LOW_SAMPLE') {
      epidemiologicalNote = `Elevated observed positivity of ${Math.round(positivityRate * 100)}% (${k}/${n}) in ${regionId}. Marked as ${riskLevel} due to localized cluster; Wilson 95% CI spans [${Math.round(wilsonInterval.lower * 100)}% - ${Math.round(wilsonInterval.upper * 100)}%]. Treat as screening surveillance signal, NOT individual diagnosis.`;
    } else {
      epidemiologicalNote = `Regional screening surveillance indicates ${riskLevel} circulation for ${disease} with ${trend.toLowerCase()} trend across ${n} screened subjects.`;
    }

    return {
      regionId,
      disease,
      sampleSize: n,
      positiveCount: k,
      positivityRate,
      bayesSmoothedRate,
      wilsonInterval,
      trend,
      riskLevel,
      confidence,
      epidemiologicalNote,
      methodology: `Wilson-score interval with Beta(alpha=${priorAlpha}, beta=${priorBeta}) empirical Bayes smoothing. Baseline prevalence: ${Math.round(baselinePrevalence * 100)}%.`,
      generatedAt: new Date().toISOString(),
    };
  }
}
