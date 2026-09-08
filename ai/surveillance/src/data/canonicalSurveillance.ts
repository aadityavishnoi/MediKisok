/**
 * Developer 2: Canonical Surveillance Dataset & Quality Validation
 *
 * Implements deterministic data quality enforcement:
 * 1. Schema standardization across municipal IDSP and hospital sentinel sources
 * 2. Strict validation (rejection of negative counts, positive > screened, impossible dates)
 * 3. Preservation of missing denominators (never fabricates screened counts)
 * 4. Duplicate observation detection
 */

export interface SurveillanceObservation {
  observationId?: string;
  regionId: string;
  district?: string;
  state?: string;
  diseaseCode: string;
  diseaseName: string;
  observationDate: string; // ISO format (YYYY-MM-DD)
  cases?: number;
  deaths?: number;
  screened?: number;
  positive?: number;
  reportingFacilities?: number;
  facilityIds?: string[];
  source: string;
  isValid: boolean;
  validationReasons?: string[];
  isDuplicate?: boolean;
}

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  missingDenominatorCount: number;
  records: SurveillanceObservation[];
}

export class SurveillanceQualityValidator {
  private static readonly MAX_FUTURE_DRIFT_HOURS = 24;

  /**
   * Validates a single surveillance observation according to epidemiological rules.
   */
  static validateObservation(raw: Partial<SurveillanceObservation>): SurveillanceObservation {
    const reasons: string[] = [];

    // 1. Geographic Identifier Requirement
    const regionId = (raw.regionId || raw.district || '').trim().toUpperCase();
    if (!regionId) {
      reasons.push('Missing required geographic identifier (regionId or district)');
    }

    // 2. Disease Identifier Requirement
    const diseaseCode = (raw.diseaseCode || '').trim().toUpperCase();
    const diseaseName = (raw.diseaseName || raw.diseaseCode || '').trim();
    if (!diseaseCode && !diseaseName) {
      reasons.push('Missing disease identifier (diseaseCode or diseaseName)');
    }

    // 3. Date Validation
    let dateStr = (raw.observationDate || '').trim();
    if (!dateStr) {
      reasons.push('Missing observationDate');
    } else {
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) {
        reasons.push(`Invalid observationDate format: '${dateStr}'`);
      } else {
        const now = Date.now();
        const maxFuture = now + this.MAX_FUTURE_DRIFT_HOURS * 3600 * 1000;
        if (parsedDate.getTime() > maxFuture) {
          reasons.push(`Impossible future observationDate: '${dateStr}'`);
        }
        dateStr = parsedDate.toISOString().slice(0, 10);
      }
    }

    // 4. Non-Negative Count Checks
    if (raw.cases !== undefined && raw.cases < 0) {
      reasons.push(`Negative cases count: ${raw.cases}`);
    }
    if (raw.deaths !== undefined && raw.deaths < 0) {
      reasons.push(`Negative deaths count: ${raw.deaths}`);
    }
    if (raw.screened !== undefined && raw.screened < 0) {
      reasons.push(`Negative screened count: ${raw.screened}`);
    }
    if (raw.positive !== undefined && raw.positive < 0) {
      reasons.push(`Negative positive count: ${raw.positive}`);
    }

    // 5. Positive vs Screened Constraint
    if (raw.screened !== undefined && raw.positive !== undefined) {
      if (raw.positive > raw.screened) {
        reasons.push(`Positive count (${raw.positive}) exceeds screened count (${raw.screened})`);
      }
    }

    const isValid = reasons.length === 0;

    return {
      observationId: raw.observationId || `OBS_${regionId}_${diseaseCode || 'DIS'}_${dateStr || 'DATE'}`,
      regionId,
      district: (raw.district || regionId).trim(),
      state: (raw.state || 'UNKNOWN').trim(),
      diseaseCode: diseaseCode || 'UNKNOWN',
      diseaseName: diseaseName || 'Unspecified Condition',
      observationDate: dateStr,
      cases: raw.cases !== undefined ? Math.max(0, raw.cases) : undefined,
      deaths: raw.deaths !== undefined ? Math.max(0, raw.deaths) : undefined,
      screened: raw.screened !== undefined ? Math.max(0, raw.screened) : undefined,
      positive: raw.positive !== undefined ? Math.max(0, raw.positive) : undefined,
      reportingFacilities: raw.reportingFacilities !== undefined ? Math.max(0, raw.reportingFacilities) : 1,
      facilityIds: raw.facilityIds || [],
      source: raw.source || 'CANONICAL_SURVEILLANCE',
      isValid,
      validationReasons: isValid ? undefined : reasons,
      isDuplicate: false,
    };
  }

  /**
   * Validates a batch of observations and flags exact duplicate observation events.
   */
  static validateBatch(records: Array<Partial<SurveillanceObservation>>): ValidationSummary {
    const validatedList: SurveillanceObservation[] = [];
    const seenSignatures = new Set<string>();

    let invalidRecords = 0;
    let duplicateRecords = 0;
    let missingDenominatorCount = 0;

    for (const r of records) {
      const validated = this.validateObservation(r);

      if (validated.screened === undefined) {
        missingDenominatorCount++;
      }

      if (!validated.isValid) {
        invalidRecords++;
      } else {
        // Check for duplicates (same region, disease, observationDate, and source)
        const signature = `${validated.regionId}::${validated.diseaseCode}::${validated.observationDate}::${validated.source}`;
        if (seenSignatures.has(signature)) {
          validated.isDuplicate = true;
          validated.isValid = false;
          validated.validationReasons = validated.validationReasons || [];
          validated.validationReasons.push(`Duplicate observation event detected for ${signature}`);
          duplicateRecords++;
          invalidRecords++;
        } else {
          seenSignatures.add(signature);
        }
      }

      validatedList.push(validated);
    }

    return {
      totalRecords: records.length,
      validRecords: records.length - invalidRecords,
      invalidRecords,
      duplicateRecords,
      missingDenominatorCount,
      records: validatedList,
    };
  }
}
