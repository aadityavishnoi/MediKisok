/**
 * Developer 2: Surveillance Data Normalizer
 * Ingests heterogeneous surveillance reports (IDSP bulletins, sentinel hospitals, kiosk triage)
 * and normalizes them into standardized epidemiological signals with validated ICD-10 codes.
 */

export interface RawSurveillanceRecord {
  source: 'IDSP_BULLETIN' | 'HOSPITAL_SENTINEL' | 'KIOSK_TRIAGE' | 'OTHER';
  regionId: string;
  state: string;
  district: string;
  hospitalId?: string;
  diseaseRaw: string;
  screenedCount?: number;
  positiveCount?: number;
  reportedDate?: string;
  notes?: string;
}

export interface NormalizedSurveillanceSignal {
  source: 'IDSP_BULLETIN' | 'HOSPITAL_SENTINEL' | 'KIOSK_TRIAGE' | 'OTHER';
  regionId: string;
  state: string;
  district: string;
  hospitalId?: string;
  disease: string;
  icd10Code: string;
  category: 'RESPIRATORY' | 'VECTOR_BORNE' | 'WATER_BORNE' | 'VACCINE_PREVENTABLE' | 'GENERAL_INFECTION';
  screenedCount: number;
  positiveCount: number;
  positivityRate: number;
  reportedDate: string;
  isValid: boolean;
  validationError?: string;
}

export const DISEASE_DICTIONARY: Record<
  string,
  {
    canonicalName: string;
    icd10Code: string;
    category: 'RESPIRATORY' | 'VECTOR_BORNE' | 'WATER_BORNE' | 'VACCINE_PREVENTABLE' | 'GENERAL_INFECTION';
    synonyms: string[];
  }
> = {
  COVID19: {
    canonicalName: 'COVID-19',
    icd10Code: 'U07.1',
    category: 'RESPIRATORY',
    synonyms: ['covid', 'covid-19', 'sars-cov-2', 'corona', 'novel coronavirus', 'coronavirus'],
  },
  DENGUE: {
    canonicalName: 'Dengue Fever',
    icd10Code: 'A90',
    category: 'VECTOR_BORNE',
    synonyms: ['dengue', 'dengue fever', 'breakbone fever', 'dhf', 'dengue hemorrhagic'],
  },
  MALARIA: {
    canonicalName: 'Malaria',
    icd10Code: 'B54',
    category: 'VECTOR_BORNE',
    synonyms: ['malaria', 'plasmodium vivax', 'plasmodium falciparum', 'p. vivax', 'p. falciparum'],
  },
  CHIKUNGUNYA: {
    canonicalName: 'Chikungunya',
    icd10Code: 'A92.0',
    category: 'VECTOR_BORNE',
    synonyms: ['chikungunya', 'chikungunya fever', 'chikv'],
  },
  INFLUENZA: {
    canonicalName: 'Influenza',
    icd10Code: 'J10.1',
    category: 'RESPIRATORY',
    synonyms: ['influenza', 'flu', 'h1n1', 'swine flu', 'seasonal flu', 'ili'],
  },
  MEASLES: {
    canonicalName: 'Measles',
    icd10Code: 'B05.9',
    category: 'VACCINE_PREVENTABLE',
    synonyms: ['measles', 'rubeola', 'khasra'],
  },
  CHOLERA: {
    canonicalName: 'Cholera',
    icd10Code: 'A00.9',
    category: 'WATER_BORNE',
    synonyms: ['cholera', 'vibrio cholerae', 'acute watery diarrhea', 'awd'],
  },
  TYPHOID: {
    canonicalName: 'Typhoid Fever',
    icd10Code: 'A01.0',
    category: 'WATER_BORNE',
    synonyms: ['typhoid', 'enteric fever', 'salmonella typhi'],
  },
};

export class SurveillanceNormalizer {
  /**
   * Normalizes a disease name into standard ICD-10 code and category.
   */
  static matchDisease(diseaseRaw: string): {
    canonicalName: string;
    icd10Code: string;
    category: 'RESPIRATORY' | 'VECTOR_BORNE' | 'WATER_BORNE' | 'VACCINE_PREVENTABLE' | 'GENERAL_INFECTION';
  } {
    const clean = (diseaseRaw || '').trim().toLowerCase();

    for (const def of Object.values(DISEASE_DICTIONARY)) {
      if (def.synonyms.some((s) => clean.includes(s) || s.includes(clean))) {
        return {
          canonicalName: def.canonicalName,
          icd10Code: def.icd10Code,
          category: def.category,
        };
      }
    }

    return {
      canonicalName: diseaseRaw.trim(),
      icd10Code: 'R69', // Unknown and unspecified causes of morbidity
      category: 'GENERAL_INFECTION',
    };
  }

  /**
   * Normalizes and rigorously validates raw surveillance data.
   * Rejects fabricated or mathematically impossible records (e.g. positiveCount > screenedCount).
   */
  static normalizeRecord(raw: RawSurveillanceRecord): NormalizedSurveillanceSignal {
    const diseaseMeta = this.matchDisease(raw.diseaseRaw);

    const screened = raw.screenedCount !== undefined ? Number(raw.screenedCount) : NaN;
    const positive = raw.positiveCount !== undefined ? Number(raw.positiveCount) : NaN;

    // Strict validation
    if (isNaN(screened) || isNaN(positive)) {
      return {
        source: raw.source,
        regionId: (raw.regionId || raw.district || 'UNKNOWN').trim().toUpperCase(),
        state: (raw.state || 'UNKNOWN').trim(),
        district: (raw.district || 'UNKNOWN').trim(),
        hospitalId: raw.hospitalId,
        disease: diseaseMeta.canonicalName,
        icd10Code: diseaseMeta.icd10Code,
        category: diseaseMeta.category,
        screenedCount: 0,
        positiveCount: 0,
        positivityRate: 0,
        reportedDate: raw.reportedDate || new Date().toISOString(),
        isValid: false,
        validationError: 'Missing screenedCount or positiveCount (fabrication prevented)',
      };
    }

    if (screened < 0 || positive < 0) {
      return {
        source: raw.source,
        regionId: (raw.regionId || raw.district || 'UNKNOWN').trim().toUpperCase(),
        state: (raw.state || 'UNKNOWN').trim(),
        district: (raw.district || 'UNKNOWN').trim(),
        hospitalId: raw.hospitalId,
        disease: diseaseMeta.canonicalName,
        icd10Code: diseaseMeta.icd10Code,
        category: diseaseMeta.category,
        screenedCount: screened,
        positiveCount: positive,
        positivityRate: 0,
        reportedDate: raw.reportedDate || new Date().toISOString(),
        isValid: false,
        validationError: 'Screened or positive count cannot be negative',
      };
    }

    if (positive > screened) {
      return {
        source: raw.source,
        regionId: (raw.regionId || raw.district || 'UNKNOWN').trim().toUpperCase(),
        state: (raw.state || 'UNKNOWN').trim(),
        district: (raw.district || 'UNKNOWN').trim(),
        hospitalId: raw.hospitalId,
        disease: diseaseMeta.canonicalName,
        icd10Code: diseaseMeta.icd10Code,
        category: diseaseMeta.category,
        screenedCount: screened,
        positiveCount: positive,
        positivityRate: 0,
        reportedDate: raw.reportedDate || new Date().toISOString(),
        isValid: false,
        validationError: `Positive count (${positive}) exceeds screened count (${screened})`,
      };
    }

    const positivityRate = screened > 0 ? Number((positive / screened).toFixed(4)) : 0;

    return {
      source: raw.source,
      regionId: (raw.regionId || raw.district || 'UNKNOWN').trim().toUpperCase(),
      state: (raw.state || 'UNKNOWN').trim(),
      district: (raw.district || 'UNKNOWN').trim(),
      hospitalId: raw.hospitalId,
      disease: diseaseMeta.canonicalName,
      icd10Code: diseaseMeta.icd10Code,
      category: diseaseMeta.category,
      screenedCount: screened,
      positiveCount: positive,
      positivityRate,
      reportedDate: raw.reportedDate || new Date().toISOString(),
      isValid: true,
    };
  }

  /**
   * Batch normalizes records and filters out corrupt/invalid inputs.
   */
  static normalizeBatch(records: RawSurveillanceRecord[]): {
    validSignals: NormalizedSurveillanceSignal[];
    invalidRecords: NormalizedSurveillanceSignal[];
  } {
    const validSignals: NormalizedSurveillanceSignal[] = [];
    const invalidRecords: NormalizedSurveillanceSignal[] = [];

    for (const r of records) {
      const normalized = this.normalizeRecord(r);
      if (normalized.isValid) {
        validSignals.push(normalized);
      } else {
        invalidRecords.push(normalized);
      }
    }

    return { validSignals, invalidRecords };
  }
}
