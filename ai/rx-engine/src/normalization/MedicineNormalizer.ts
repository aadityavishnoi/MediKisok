/**
 * Developer 2: NLEM 2022 & CDSCO Medicine Normalization Pipeline
 *
 * Normalizes unstructured prescription strings and brand names into standardized
 * active pharmaceutical ingredients, strengths, CDSCO regulatory schedules,
 * and Jan Aushadhi generic equivalents.
 */
import { NLEM_CATALOG, type NormalizedMedicineConcept } from '../data/nlemCatalog';

export interface RawPrescriptionMedicineInput {
  rawString: string;
  prescribedDosage?: string;
  prescribedFrequency?: string;
  prescribedDuration?: string;
}

export interface StandardizedMedicineRecord {
  rawInput: string;
  matchedConceptId: string | null;
  genericName: string;
  detectedBrand: string | null;
  extractedStrength: string | null;
  dosageForm: string;
  therapeuticCategory: string;
  regulatorySchedule: 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X' | 'SCHEDULE_G' | 'OTC' | 'UNKNOWN';
  isNLEMEssential: boolean;
  janAushadhiAvailable: boolean;
  janAushadhiGenericName?: string;
  estimatedCostSavingsPercent?: number;
  isUnknown: boolean;
  requiresDoctorVerification: boolean;
}

export class MedicineNormalizer {
  private static readonly STRENGTH_REGEX = /(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|iu|%))/i;
  private static readonly FORM_PREFIXES = /^(tab(?:let)?|cap(?:sule)?|syp(?:rup)?|inj(?:ection)?|oint(?:ment)?|drop(?:s)?)\b\s*/i;

  /**
   * Cleans prescription strings by stripping dosage form prefixes, extra symbols, and whitespace.
   */
  static cleanMedicineString(input: string): string {
    return (input || '')
      .replace(this.FORM_PREFIXES, '')
      .replace(/[^\w\s.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Extracts clinical strength from medicine string (e.g. "Dolo 650 mg" -> "650mg")
   */
  static extractStrength(input: string): string | null {
    const match = (input || '').match(this.STRENGTH_REGEX);
    return match ? match[1].replace(/\s+/g, '').toLowerCase() : null;
  }

  /**
   * Normalizes a raw prescription input against canonical NLEM 2022 & CDSCO schedules.
   */
  static normalizeMedicine(input: RawPrescriptionMedicineInput | string): StandardizedMedicineRecord {
    const rawString = typeof input === 'string' ? input : input.rawString;
    const clean = this.cleanMedicineString(rawString);
    const extractedStrength = this.extractStrength(rawString);

    for (const concept of NLEM_CATALOG) {
      // Check generic name match
      const genericClean = concept.genericName.toLowerCase();
      const matchGeneric =
        clean.includes(genericClean) ||
        genericClean.split(' ')[0].length > 3 && clean.includes(genericClean.split(' ')[0]);

      // Check brand name matches
      const matchedBrand = concept.brandNames.find(
        (b) => clean.includes(b.toLowerCase()) || b.toLowerCase().includes(clean),
      );

      if (matchGeneric || matchedBrand) {
        return {
          rawInput: rawString,
          matchedConceptId: concept.id,
          genericName: concept.genericName,
          detectedBrand: matchedBrand ? matchedBrand.toUpperCase() : null,
          extractedStrength: extractedStrength || concept.standardStrength,
          dosageForm: concept.dosageForm,
          therapeuticCategory: concept.therapeuticCategory,
          regulatorySchedule: concept.regulatoryStatus.cdscoSchedule,
          isNLEMEssential: concept.regulatoryStatus.isNLEM,
          janAushadhiAvailable: concept.regulatoryStatus.janAushadhiAvailable,
          janAushadhiGenericName: concept.regulatoryStatus.janAushadhiGenericName,
          estimatedCostSavingsPercent: concept.regulatoryStatus.janAushadhiAvailable ? 68 : undefined,
          isUnknown: false,
          requiresDoctorVerification: false,
        };
      }
    }

    // Explicit UNKNOWN return — Zero Hallucinations
    return {
      rawInput: rawString,
      matchedConceptId: null,
      genericName: 'UNKNOWN',
      detectedBrand: null,
      extractedStrength: extractedStrength,
      dosageForm: 'UNKNOWN',
      therapeuticCategory: 'UNKNOWN',
      regulatorySchedule: 'UNKNOWN',
      isNLEMEssential: false,
      janAushadhiAvailable: false,
      isUnknown: true,
      requiresDoctorVerification: true,
    };
  }

  /**
   * Batch processes a list of raw prescriptions with deduplication.
   */
  static normalizePrescriptionList(
    items: Array<RawPrescriptionMedicineInput | string>,
  ): StandardizedMedicineRecord[] {
    const seen = new Set<string>();
    const results: StandardizedMedicineRecord[] = [];

    for (const it of items) {
      const rawStr = typeof it === 'string' ? it : it.rawString;
      const key = this.cleanMedicineString(rawStr);
      if (key && !seen.has(key)) {
        seen.add(key);
        results.push(this.normalizeMedicine(it));
      }
    }

    return results;
  }
}
