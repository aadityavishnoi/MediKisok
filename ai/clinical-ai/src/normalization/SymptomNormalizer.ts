/**
 * Developer 1: Clinical AI Symptom Normalization Engine
 * Normalizes vernacular, multilingual, and free-text symptom phrases into standardized clinical symptom tokens.
 */
import type { NormalizedSymptom } from '../../shared/types/index';

export interface SymptomSynonymMap {
  [key: string]: {
    code: string;
    canonicalName: string;
    icd10Category?: string;
    isRedFlag?: boolean;
  };
}

export const CANONICAL_SYMPTOMS: SymptomSynonymMap = {
  // Fever & Chills
  fever: { code: 'SYMPT_FEVER', canonicalName: 'Pyrexia / Elevated Temperature', icd10Category: 'R50' },
  bukhar: { code: 'SYMPT_FEVER', canonicalName: 'Pyrexia / Elevated Temperature', icd10Category: 'R50' },
  pyrexia: { code: 'SYMPT_FEVER', canonicalName: 'Pyrexia / Elevated Temperature', icd10Category: 'R50' },
  chills: { code: 'SYMPT_CHILLS', canonicalName: 'Rigors and Chills', icd10Category: 'R68.83' },
  kapkapi: { code: 'SYMPT_CHILLS', canonicalName: 'Rigors and Chills', icd10Category: 'R68.83' },

  // Respiratory
  cough: { code: 'SYMPT_COUGH', canonicalName: 'Cough', icd10Category: 'R05' },
  khansi: { code: 'SYMPT_COUGH', canonicalName: 'Cough', icd10Category: 'R05' },
  dyspnea: { code: 'SYMPT_DYSPNEA', canonicalName: 'Shortness of Breath', icd10Category: 'R06.0', isRedFlag: true },
  'shortness of breath': { code: 'SYMPT_DYSPNEA', canonicalName: 'Shortness of Breath', icd10Category: 'R06.0', isRedFlag: true },
  'saas lene me takleef': { code: 'SYMPT_DYSPNEA', canonicalName: 'Shortness of Breath', icd10Category: 'R06.0', isRedFlag: true },
  'saas phulna': { code: 'SYMPT_DYSPNEA', canonicalName: 'Shortness of Breath', icd10Category: 'R06.0', isRedFlag: true },

  // Cardiovascular
  'chest pain': { code: 'SYMPT_CHEST_PAIN', canonicalName: 'Acute Precordial / Chest Pain', icd10Category: 'R07.9', isRedFlag: true },
  'sine me dard': { code: 'SYMPT_CHEST_PAIN', canonicalName: 'Acute Precordial / Chest Pain', icd10Category: 'R07.9', isRedFlag: true },
  palpitations: { code: 'SYMPT_PALPITATIONS', canonicalName: 'Palpitations', icd10Category: 'R00.2' },
  dhadkan: { code: 'SYMPT_PALPITATIONS', canonicalName: 'Palpitations', icd10Category: 'R00.2' },

  // Gastrointestinal
  vomiting: { code: 'SYMPT_VOMITING', canonicalName: 'Emesis / Vomiting', icd10Category: 'R11.1' },
  ulti: { code: 'SYMPT_VOMITING', canonicalName: 'Emesis / Vomiting', icd10Category: 'R11.1' },
  diarrhea: { code: 'SYMPT_DIARRHEA', canonicalName: 'Diarrhea / Loose Stools', icd10Category: 'K52.9' },
  dast: { code: 'SYMPT_DIARRHEA', canonicalName: 'Diarrhea / Loose Stools', icd10Category: 'K52.9' },
  'abdominal pain': { code: 'SYMPT_ABDO_PAIN', canonicalName: 'Abdominal Pain', icd10Category: 'R10.9' },
  'pet dard': { code: 'SYMPT_ABDO_PAIN', canonicalName: 'Abdominal Pain', icd10Category: 'R10.9' },

  // Neurological & Systemic
  headache: { code: 'SYMPT_HEADACHE', canonicalName: 'Cephalea / Headache', icd10Category: 'R51' },
  'sar dard': { code: 'SYMPT_HEADACHE', canonicalName: 'Cephalea / Headache', icd10Category: 'R51' },
  fatigue: { code: 'SYMPT_FATIGUE', canonicalName: 'Malaise & Fatigue', icd10Category: 'R53' },
  thakan: { code: 'SYMPT_FATIGUE', canonicalName: 'Malaise & Fatigue', icd10Category: 'R53' },
  'loss of smell': { code: 'SYMPT_ANOSMIA', canonicalName: 'Anosmia', icd10Category: 'R43.0' },
  'loss of taste': { code: 'SYMPT_AGEUSIA', canonicalName: 'Ageusia', icd10Category: 'R43.2' },
  rash: { code: 'SYMPT_RASH', canonicalName: 'Exanthem / Skin Rash', icd10Category: 'R21' },
  dane: { code: 'SYMPT_RASH', canonicalName: 'Exanthem / Skin Rash', icd10Category: 'R21' },
};

export class SymptomNormalizer {
  /**
   * Normalizes raw symptom phrases into standardized clinical symptom tokens
   */
  static normalize(rawPhrase: string): NormalizedSymptom | null {
    if (!rawPhrase || typeof rawPhrase !== 'string') return null;
    const clean = rawPhrase.trim().toLowerCase();

    for (const [trigger, meta] of Object.entries(CANONICAL_SYMPTOMS)) {
      if (clean.includes(trigger)) {
        return {
          symptomCode: meta.code,
          symptomName: meta.canonicalName,
          confidence: 0.95,
        };
      }
    }

    // Default fallback normalization
    return {
      symptomCode: `SYMPT_${clean.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`,
      symptomName: rawPhrase.trim(),
      confidence: 0.70,
    };
  }

  /**
   * Batch normalize multiple symptom phrases
   */
  static normalizeList(phrases: string[]): NormalizedSymptom[] {
    const map = new Map<string, NormalizedSymptom>();
    for (const p of phrases) {
      const norm = this.normalize(p);
      if (norm && !map.has(norm.symptomCode)) {
        map.set(norm.symptomCode, norm);
      }
    }
    return Array.from(map.values());
  }
}
