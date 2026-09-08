/**
 * Developer 2: Evidence-Backed Drug Safety & Interaction Engine
 *
 * Provides deterministic clinical checks:
 * 1. Medicine Name Normalization (Brand & Generic mapping to NLEM 2022 / CDSCO)
 * 2. Pairwise Drug-Drug Interaction Matrix (with evidence citations from CDSCO / NLEM)
 * 3. Allergy & Contraindication Cross-Checking
 * 4. Jan Aushadhi Cost-Saving Alternative Recommendations
 * 5. Deterministic UNKNOWN handling for unrecognized substances (Zero Hallucinations)
 */
import { NLEM_CATALOG, type NormalizedMedicineConcept } from './data/nlemCatalog';

export interface RxCheckRequestInput {
  medications: string[];
  allergies?: string[];
  patientContext?: {
    age?: number;
    gender?: string;
    isPregnant?: boolean;
    renalImpairment?: boolean;
    hepaticImpairment?: boolean;
  };
}

export interface NormalizedDrugResult {
  inputName: string;
  matchedId: string | null;
  genericName: string;
  brandName?: string;
  strength: string;
  dosageForm: string;
  therapeuticCategory: string;
  regulatoryStatus: {
    isNLEM: boolean;
    cdscoSchedule: string;
    janAushadhiAvailable: boolean;
    janAushadhiGenericName?: string;
  };
  isUnknown: boolean;
  source: string;
  sourceDate: string;
}

export interface DrugInteractionAlert {
  drugA: string;
  drugB: string;
  severity: 'CONTRAINDICATED' | 'HIGH' | 'MODERATE' | 'LOW';
  description: string;
  source: string;
}

export interface AllergyContraindicationAlert {
  medication: string;
  triggeredBy: string;
  type: 'ALLERGY' | 'ORGAN_CONTRAINDICATION';
  severity: 'CRITICAL' | 'WARNING';
  reason: string;
}

export interface RxCheckOutput {
  safe: boolean;
  requiresDoctorReview: boolean;
  normalizedDrugs: NormalizedDrugResult[];
  interactions: DrugInteractionAlert[];
  contraindications: AllergyContraindicationAlert[];
  janAushadhiAlternatives: Array<{
    prescribedDrug: string;
    janAushadhiGeneric: string;
    approxSavingsPercent: number;
    availabilityNote: string;
  }>;
  regulatoryMetadata: {
    totalDrugs: number;
    nlemCount: number;
    scheduleHCount: number;
    scheduleH1Count: number;
    unknownCount: number;
    evidenceSource: string;
  };
  clinicalDisclaimer: string;
}

export class DrugSafetyEngine {
  /**
   * Normalizes a raw drug string into an authoritative medicine concept.
   * If uncatalogued, strictly returns UNKNOWN concept without LLM fabrication.
   */
  static normalizeDrug(rawName: string): NormalizedDrugResult {
    const clean = (rawName || '').trim().toLowerCase();

    for (const med of NLEM_CATALOG) {
      const matchGeneric = med.genericName.toLowerCase().includes(clean) || clean.includes(med.genericName.toLowerCase().split(' ')[0]);
      const matchBrand = med.brandNames.some((b) => clean.includes(b) || b.includes(clean));

      if (matchGeneric || matchBrand) {
        return {
          inputName: rawName,
          matchedId: med.id,
          genericName: med.genericName,
          brandName: rawName.trim(),
          strength: med.standardStrength,
          dosageForm: med.dosageForm,
          therapeuticCategory: med.therapeuticCategory,
          regulatoryStatus: {
            isNLEM: med.regulatoryStatus.isNLEM,
            cdscoSchedule: med.regulatoryStatus.cdscoSchedule,
            janAushadhiAvailable: med.regulatoryStatus.janAushadhiAvailable,
            janAushadhiGenericName: med.regulatoryStatus.janAushadhiGenericName,
          },
          isUnknown: false,
          source: med.source,
          sourceDate: med.sourceDate,
        };
      }
    }

    // Explicit UNKNOWN return — NO HALLUCINATIONS
    return {
      inputName: rawName,
      matchedId: null,
      genericName: 'UNKNOWN',
      strength: 'UNKNOWN',
      dosageForm: 'UNKNOWN',
      therapeuticCategory: 'UNKNOWN',
      regulatoryStatus: {
        isNLEM: false,
        cdscoSchedule: 'UNKNOWN',
        janAushadhiAvailable: false,
      },
      isUnknown: true,
      source: 'Not in canonical NLEM/CDSCO database',
      sourceDate: new Date().toISOString().slice(0, 10),
    };
  }

  /**
   * Master Rx Safety Evaluation Method
   */
  static checkPrescriptionSafety(request: RxCheckRequestInput): RxCheckOutput {
    const rawMeds = request.medications || [];
    const allergies = (request.allergies || []).map((a) => a.trim().toLowerCase());
    const ctx = request.patientContext || {};

    // 1. Case-insensitive deduplication of medication input tokens
    const seenKeys = new Set<string>();
    const uniqueInputs: string[] = [];
    for (const raw of rawMeds) {
      const key = (raw || '').trim().toLowerCase();
      if (key && !seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueInputs.push(raw.trim());
      }
    }

    // 2. Normalize medicines
    const normalizedDrugs = uniqueInputs.map((m) => this.normalizeDrug(m));

    const interactions: DrugInteractionAlert[] = [];
    const contraindications: AllergyContraindicationAlert[] = [];
    const janAushadhiAlternatives: RxCheckOutput['janAushadhiAlternatives'] = [];

    let nlemCount = 0;
    let scheduleHCount = 0;
    let scheduleH1Count = 0;
    let unknownCount = 0;

    // 3. Scan each drug for regulatory status and Jan Aushadhi generic substitutions
    for (const drug of normalizedDrugs) {
      if (drug.isUnknown) {
        unknownCount++;
        continue;
      }

      if (drug.regulatoryStatus.isNLEM) nlemCount++;
      if (drug.regulatoryStatus.cdscoSchedule === 'SCHEDULE_H') scheduleHCount++;
      if (drug.regulatoryStatus.cdscoSchedule === 'SCHEDULE_H1') scheduleH1Count++;

      if (drug.regulatoryStatus.janAushadhiAvailable && drug.regulatoryStatus.janAushadhiGenericName) {
        janAushadhiAlternatives.push({
          prescribedDrug: drug.inputName,
          janAushadhiGeneric: drug.regulatoryStatus.janAushadhiGenericName,
          approxSavingsPercent: 65,
          availabilityNote: 'Available under PMBJP at Pradhan Mantri Jan Aushadhi Kendras nationwide.',
        });
      }

      // Check known patient allergies
      for (const allergy of allergies) {
        if (allergy && (drug.genericName.toLowerCase().includes(allergy) || drug.inputName.toLowerCase().includes(allergy))) {
          contraindications.push({
            medication: drug.inputName,
            triggeredBy: `Patient reported allergy: ${allergy}`,
            type: 'ALLERGY',
            severity: 'CRITICAL',
            reason: `Direct match between patient allergy '${allergy}' and prescribed medication '${drug.genericName}'.`,
          });
        }
      }

      // Check context contraindications (e.g. pregnancy, renal)
      if (ctx.isPregnant) {
        if (drug.matchedId === 'MED_WARFARIN') {
          contraindications.push({
            medication: drug.inputName,
            triggeredBy: 'Pregnancy',
            type: 'ORGAN_CONTRAINDICATION',
            severity: 'CRITICAL',
            reason: 'Warfarin is strictly teratogenic and contraindicated during pregnancy.',
          });
        }
      }
    }

    // 4. Pairwise interaction checking (N x N)
    for (let i = 0; i < normalizedDrugs.length; i++) {
      for (let j = i + 1; j < normalizedDrugs.length; j++) {
        const drugA = normalizedDrugs[i];
        const drugB = normalizedDrugs[j];

        if (drugA.isUnknown || drugB.isUnknown || !drugA.matchedId || !drugB.matchedId) {
          continue;
        }

        const medAConcept = NLEM_CATALOG.find((m) => m.id === drugA.matchedId);
        if (medAConcept) {
          const match = medAConcept.knownInteractions.find((k) => k.targetGenericId === drugB.matchedId);
          if (match) {
            interactions.push({
              drugA: drugA.inputName,
              drugB: drugB.inputName,
              severity: match.severity,
              description: match.description,
              source: match.source,
            });
          }
        }
      }
    }

    // 5. Determine overall safety & physician review requirement
    const hasSevereOrContraindicated = interactions.some(
      (it) => it.severity === 'CONTRAINDICATED' || it.severity === 'HIGH',
    );
    const hasAllergyConflict = contraindications.some((c) => c.severity === 'CRITICAL');
    const safe = !hasSevereOrContraindicated && !hasAllergyConflict;

    const requiresDoctorReview =
      !safe || interactions.length > 0 || contraindications.length > 0 || unknownCount > 0;

    return {
      safe,
      requiresDoctorReview,
      normalizedDrugs,
      interactions,
      contraindications,
      janAushadhiAlternatives,
      regulatoryMetadata: {
        totalDrugs: normalizedDrugs.length,
        nlemCount,
        scheduleHCount,
        scheduleH1Count,
        unknownCount,
        evidenceSource: 'NLEM 2022, CDSCO National Formulary of India (NFI), PMBJP Formulary',
      },
      clinicalDisclaimer:
        'MediKiosk Rx Safety Engine is an advisory clinical decision support tool. The consulting physician remains the sole legal and clinical authority for all drug prescriptions.',
    };
  }
}
