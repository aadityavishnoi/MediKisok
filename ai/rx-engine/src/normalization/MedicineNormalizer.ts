/**
 * Developer 2: NLEM 2022 & CDSCO Medicine Normalization Pipeline
 *
 * Normalizes unstructured prescription strings and brand names into standardized
 * active pharmaceutical ingredients, strengths, units, formulation forms, routes,
 * frequencies, CDSCO regulatory schedules, and Jan Aushadhi generic equivalents.
 */
import { NLEM_CATALOG, type NormalizedMedicineConcept } from '../data/nlemCatalog';

export interface RawPrescriptionMedicineInput {
  rawString: string;
  prescribedDosage?: string;
  prescribedFrequency?: string;
  prescribedDuration?: string;
}

export interface ParsedDosageDetails {
  strengthNum?: number;
  unit?: string;
  form?: string;
  route?: string;
  frequency?: string;
}

export interface StandardizedMedicineRecord {
  rawInput: string;
  matchedConceptId: string | null;
  genericName: string;
  activeIngredients?: string[];
  pharmacologicalClass?: string;
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
  status: 'NORMALIZED' | 'UNKNOWN';
  requiresDoctorVerification: boolean;
  parsedDetails?: ParsedDosageDetails;
}

export class MedicineNormalizer {
  private static readonly STRENGTH_REGEX = /(\d+(?:\.\d+)?)\s*(mg|g|mcg|ml|iu|%)/i;
  private static readonly FORM_PREFIXES = /^(tab(?:let)?|cap(?:sule)?|syp(?:rup)?|inj(?:ection)?|oint(?:ment)?|drop(?:s)?|oral\s+suspension)\b\s*/i;
  private static readonly FREQUENCY_REGEX = /\b(od|bd|tds|qid|hs|sos|prn|stat|1-0-0|1-0-1|0-0-1|1-1-1|once\s+daily|twice\s+daily|thrice\s+daily)\b/i;

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
   * Extracts clinical strength string (e.g. "Dolo 650 mg" -> "650mg")
   */
  static extractStrength(input: string): string | null {
    const match = (input || '').match(this.STRENGTH_REGEX);
    return match ? `${match[1]}${match[2].toLowerCase()}` : null;
  }

  /**
   * Parses structured strength quantity and unit (e.g. "Paracetamol 500 mg" -> { strengthNum: 500, unit: "mg" })
   */
  static parseStrengthDetails(input: string): { strengthNum?: number; unit?: string } {
    const match = (input || '').match(this.STRENGTH_REGEX);
    if (!match) return {};
    return {
      strengthNum: Number(match[1]),
      unit: match[2].toLowerCase(),
    };
  }

  /**
   * Detects pharmaceutical dosage form (tablet, capsule, syrup, injection, etc.)
   */
  static detectDosageForm(input: string, defaultForm = 'Tablet'): string {
    const str = (input || '').toLowerCase();
    if (str.includes('cap') || str.includes('capsule')) return 'Capsule';
    if (str.includes('syp') || str.includes('syrup') || str.includes('suspension')) return 'Syrup';
    if (str.includes('inj') || str.includes('injection') || str.includes('ampoule') || str.includes('vial')) return 'Injection';
    if (str.includes('oint') || str.includes('ointment') || str.includes('gel') || str.includes('cream')) return 'Topical Ointment';
    if (str.includes('drop')) return 'Drops';
    if (str.includes('inhaler') || str.includes('respule')) return 'Inhaler';
    if (str.includes('tab') || str.includes('tablet')) return 'Tablet';
    return defaultForm;
  }

  /**
   * Detects administration route from form
   */
  static detectRoute(form: string): string {
    const f = form.toLowerCase();
    if (f.includes('injection')) return 'intravenous';
    if (f.includes('topical')) return 'topical';
    if (f.includes('drop')) return 'ophthalmic/otic';
    if (f.includes('inhaler')) return 'inhalation';
    return 'oral';
  }

  /**
   * Extracts prescribed frequency (e.g. "BD", "1-0-1", "SOS")
   */
  static extractFrequency(input: string): string | undefined {
    const match = (input || '').match(this.FREQUENCY_REGEX);
    return match ? match[1].toUpperCase() : undefined;
  }

  /**
   * Normalizes a raw prescription input against canonical NLEM 2022 & CDSCO schedules.
   */
  static normalizeMedicine(input: RawPrescriptionMedicineInput | string): StandardizedMedicineRecord {
    const rawString = typeof input === 'string' ? input : input.rawString;
    const clean = this.cleanMedicineString(rawString);
    const extractedStrength = this.extractStrength(rawString);
    const { strengthNum, unit } = this.parseStrengthDetails(rawString);
    const form = this.detectDosageForm(rawString);
    const route = this.detectRoute(form);
    const frequency =
      (typeof input !== 'string' && input.prescribedFrequency)
        ? input.prescribedFrequency
        : this.extractFrequency(rawString);

    for (const concept of NLEM_CATALOG) {
      // Check generic name match
      const genericClean = concept.genericName.toLowerCase();
      const matchGeneric =
        clean.includes(genericClean) ||
        genericClean.split(' ')[0].length > 3 && clean.includes(genericClean.split(' ')[0]);

      // Check brand name matches (preserving Indian brand names)
      const matchedBrand = concept.brandNames.find(
        (b) => clean.includes(b.toLowerCase()) || b.toLowerCase().includes(clean),
      );

      if (matchGeneric || matchedBrand) {
        return {
          rawInput: rawString,
          matchedConceptId: concept.id,
          genericName: concept.genericName,
          activeIngredients: concept.activeIngredients,
          pharmacologicalClass: concept.pharmacologicalClass,
          detectedBrand: matchedBrand ? matchedBrand.toUpperCase() : null,
          extractedStrength: extractedStrength || concept.standardStrength,
          dosageForm: form !== 'Tablet' ? form : concept.dosageForm,
          therapeuticCategory: concept.therapeuticCategory,
          regulatorySchedule: concept.regulatoryStatus.cdscoSchedule,
          isNLEMEssential: concept.regulatoryStatus.isNLEM,
          janAushadhiAvailable: concept.regulatoryStatus.janAushadhiAvailable,
          janAushadhiGenericName: concept.regulatoryStatus.janAushadhiGenericName,
          estimatedCostSavingsPercent: concept.regulatoryStatus.janAushadhiAvailable ? 68 : undefined,
          isUnknown: false,
          status: 'NORMALIZED',
          requiresDoctorVerification: false,
          parsedDetails: {
            strengthNum: strengthNum ?? (concept.standardStrength ? parseInt(concept.standardStrength) : undefined),
            unit: unit ?? concept.standardUnit,
            form: form !== 'Tablet' ? form.toLowerCase() : concept.dosageForm.toLowerCase(),
            route: concept.standardRoute ?? route,
            frequency,
          },
        };
      }
    }

    // Explicit UNKNOWN return — Zero Hallucinations. Never guess active ingredient.
    return {
      rawInput: rawString,
      matchedConceptId: null,
      genericName: 'UNKNOWN',
      detectedBrand: null,
      extractedStrength: extractedStrength,
      dosageForm: form,
      therapeuticCategory: 'UNKNOWN',
      regulatorySchedule: 'UNKNOWN',
      isNLEMEssential: false,
      janAushadhiAvailable: false,
      isUnknown: true,
      status: 'UNKNOWN',
      requiresDoctorVerification: true,
      parsedDetails: {
        strengthNum,
        unit,
        form: form.toLowerCase(),
        route,
        frequency,
      },
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

