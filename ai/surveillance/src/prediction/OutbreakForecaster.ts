/**
 * Developer 2: Outbreak Forecasting & Chronological Evaluation Pipeline
 *
 * Implements rigorous, explainable time-series baselines:
 * 1. Naive Persistence Baseline (y_{t+1} = y_t)
 * 2. 7-Day Moving Average Baseline
 * 3. Holt's Linear Exponential Smoothing (Level + Trend)
 * 4. Chronological Train (70%) / Validation (15%) / Test (15%) Evaluation
 * 5. Anti-Leakage Causal Windows (No future data visible to past steps)
 * 6. Error Metrics: MAE, RMSE, MAPE
 */

export interface TimeSeriesPoint {
  date: string;
  value: number; // Daily incidence or weekly case volume
}

export interface ForecastMetrics {
  mae: number;
  rmse: number;
  mapePercent?: number;
  sampleCount: number;
}

export interface ModelComparisonResult {
  modelName: 'NAIVE_PERSISTENCE' | 'MOVING_AVERAGE_7D' | 'HOLT_EXPONENTIAL_SMOOTHING';
  validationMetrics: ForecastMetrics;
  testMetrics: ForecastMetrics;
  predictedValues: number[];
  actualValues: number[];
}

export interface ChronologicalEvaluationReport {
  regionId: string;
  diseaseCode: string;
  totalObservations: number;
  trainCount: number;
  validationCount: number;
  testCount: number;
  bestModel: string;
  models: ModelComparisonResult[];
  anomalyDetectionMetrics: {
    precision: number;
    recall: number;
    f1Score: number;
    truePositives: number;
    falsePositives: number;
    falseNegatives: number;
    notes: string;
  };
  clinicalDisclaimer: string;
}

export class OutbreakForecaster {
  /**
   * Naive Persistence Model: predicts tomorrow's value as today's value
   */
  static predictNaive(history: number[]): number {
    if (history.length === 0) return 0;
    return history[history.length - 1];
  }

  /**
   * 7-Day Moving Average Model: predicts tomorrow's value as mean of last 7 observations
   */
  static predictMovingAverage(history: number[], window = 7): number {
    if (history.length === 0) return 0;
    const slice = history.slice(-Math.min(window, history.length));
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    return Number(mean.toFixed(2));
  }

  /**
   * Holt's Linear Exponential Smoothing Model
   */
  static predictHoltSmoothing(history: number[], alpha = 0.4, beta = 0.2): number {
    if (history.length === 0) return 0;
    if (history.length === 1) return history[0];

    let level = history[0];
    let trend = history[1] - history[0];

    for (let i = 1; i < history.length; i++) {
      const val = history[i];
      const prevLevel = level;
      level = alpha * val + (1 - alpha) * (prevLevel + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    const nextVal = Math.max(0, level + trend);
    return Number(nextVal.toFixed(2));
  }

  /**
   * Calculates MAE, RMSE, and MAPE across predictions and ground truths.
   */
  static computeMetrics(actuals: number[], preds: number[]): ForecastMetrics {
    const n = Math.min(actuals.length, preds.length);
    if (n === 0) return { mae: 0, rmse: 0, sampleCount: 0 };

    let sumAbsErr = 0;
    let sumSqErr = 0;
    let sumApe = 0;
    let apeCount = 0;

    for (let i = 0; i < n; i++) {
      const y = actuals[i];
      const yHat = preds[i];
      const err = Math.abs(y - yHat);
      sumAbsErr += err;
      sumSqErr += err * err;

      if (y > 0) {
        sumApe += err / y;
        apeCount++;
      }
    }

    return {
      mae: Number((sumAbsErr / n).toFixed(2)),
      rmse: Number(Math.sqrt(sumSqErr / n).toFixed(2)),
      mapePercent: apeCount > 0 ? Number(((sumApe / apeCount) * 100).toFixed(1)) : undefined,
      sampleCount: n,
    };
  }

  /**
   * Performs Chronological Train / Validation / Test backtesting with zero future-data leakage.
   */
  static evaluateChronological(
    series: TimeSeriesPoint[],
    regionId = 'REGION_X',
    diseaseCode = 'COVID-19',
  ): ChronologicalEvaluationReport {
    // 1. Sort strictly chronologically
    const sorted = [...series].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const values = sorted.map((p) => p.value);
    const total = values.length;

    // Minimum 10 points required for 70/15/15 split
    const trainEnd = Math.max(5, Math.floor(total * 0.70));
    const valEnd = Math.max(trainEnd + 2, Math.floor(total * 0.85));

    const trainValues = values.slice(0, trainEnd);
    const valValues = values.slice(trainEnd, valEnd);
    const testValues = values.slice(valEnd);

    const modelNames: Array<'NAIVE_PERSISTENCE' | 'MOVING_AVERAGE_7D' | 'HOLT_EXPONENTIAL_SMOOTHING'> = [
      'NAIVE_PERSISTENCE',
      'MOVING_AVERAGE_7D',
      'HOLT_EXPONENTIAL_SMOOTHING',
    ];

    const modelResults: ModelComparisonResult[] = [];

    for (const model of modelNames) {
      // Validation rolling forecast (one-step ahead)
      const valPreds: number[] = [];
      const runningValHistory = [...trainValues];

      for (let i = 0; i < valValues.length; i++) {
        let pred = 0;
        if (model === 'NAIVE_PERSISTENCE') pred = this.predictNaive(runningValHistory);
        else if (model === 'MOVING_AVERAGE_7D') pred = this.predictMovingAverage(runningValHistory);
        else if (model === 'HOLT_EXPONENTIAL_SMOOTHING') pred = this.predictHoltSmoothing(runningValHistory);

        valPreds.push(pred);
        runningValHistory.push(valValues[i]); // Append current actual strictly after predicting it!
      }

      // Test rolling forecast (one-step ahead)
      const testPreds: number[] = [];
      const runningTestHistory = [...trainValues, ...valValues];

      for (let i = 0; i < testValues.length; i++) {
        let pred = 0;
        if (model === 'NAIVE_PERSISTENCE') pred = this.predictNaive(runningTestHistory);
        else if (model === 'MOVING_AVERAGE_7D') pred = this.predictMovingAverage(runningTestHistory);
        else if (model === 'HOLT_EXPONENTIAL_SMOOTHING') pred = this.predictHoltSmoothing(runningTestHistory);

        testPreds.push(pred);
        runningTestHistory.push(testValues[i]); // Append strictly after predicting!
      }

      modelResults.push({
        modelName: model,
        validationMetrics: this.computeMetrics(valValues, valPreds),
        testMetrics: this.computeMetrics(testValues, testPreds),
        predictedValues: testPreds,
        actualValues: testValues,
      });
    }

    // Best model selection based on Validation RMSE
    modelResults.sort((a, b) => a.validationMetrics.rmse - b.validationMetrics.rmse);
    const best = modelResults[0];

    // Evaluate statistical anomaly detection against a 2-sigma threshold
    const baselineMean = trainValues.reduce((a, b) => a + b, 0) / Math.max(1, trainValues.length);
    const variance =
      trainValues.reduce((acc, v) => acc + Math.pow(v - baselineMean, 2), 0) / Math.max(1, trainValues.length - 1);
    const baselineStd = Math.max(1, Math.sqrt(variance));
    const anomalyThreshold = baselineMean + 2 * baselineStd;

    let tp = 0;
    let fp = 0;
    let fn = 0;

    for (let i = 0; i < best.actualValues.length; i++) {
      const actualIsAnomaly = best.actualValues[i] > anomalyThreshold;
      const predictedIsAnomaly = best.predictedValues[i] > anomalyThreshold;

      if (actualIsAnomaly && predictedIsAnomaly) tp++;
      else if (!actualIsAnomaly && predictedIsAnomaly) fp++;
      else if (actualIsAnomaly && !predictedIsAnomaly) fn++;
    }

    const precision = tp + fp > 0 ? Number((tp / (tp + fp)).toFixed(3)) : 1.0;
    const recall = tp + fn > 0 ? Number((tp / (tp + fn)).toFixed(3)) : 1.0;
    const f1Score = precision + recall > 0 ? Number(((2 * precision * recall) / (precision + recall)).toFixed(3)) : 1.0;

    return {
      regionId,
      diseaseCode,
      totalObservations: total,
      trainCount: trainValues.length,
      validationCount: valValues.length,
      testCount: testValues.length,
      bestModel: best.modelName,
      models: modelResults,
      anomalyDetectionMetrics: {
        precision,
        recall,
        f1Score,
        truePositives: tp,
        falsePositives: fp,
        falseNegatives: fn,
        notes: `Statistical anomaly evaluated against 2-sigma baseline threshold (${Number(anomalyThreshold.toFixed(1))} cases). Ground-truth clinical outbreak labels were not fabricated.`,
      },
      clinicalDisclaimer:
        'Time-series outbreak forecasts are population-level statistical trend estimates. They do not substitute for sentinel laboratory confirmation or clinical case triage.',
    };
  }
}
