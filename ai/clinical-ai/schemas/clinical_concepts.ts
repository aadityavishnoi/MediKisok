/**
 * MediKiosk Clinical AI - Clinical Concept & ICD-10 Taxonomy
 * Strict mapping of canonical symptoms, verified ICD-10-CM codes, and vernacular synonyms.
 * Zero invented ICD-10 codes.
 */

export type ClinicalCategory =
  | 'CONSTITUTIONAL'
  | 'RESPIRATORY'
  | 'CARDIOVASCULAR'
  | 'GASTROINTESTINAL'
  | 'NEUROLOGICAL'
  | 'DERMATOLOGICAL'
  | 'MUSCULOSKELETAL';

export interface CanonicalConcept {
  id: string;
  code: string;
  canonicalName: string;
  icd10: string;
  category: ClinicalCategory;
  isRedFlag: boolean;
  synonyms: string[];
  description: string;
}

export const CANONICAL_CONCEPTS: Record<string, CanonicalConcept> = {
  FEVER: {
    id: 'CON_FEVER',
    code: 'FEVER_ACUTE',
    canonicalName: 'Pyrexia / Elevated Temperature',
    icd10: 'R50.9',
    category: 'CONSTITUTIONAL',
    isRedFlag: false,
    synonyms: [
      'fever',
      'high temperature',
      'pyrexia',
      'febrile',
      'bukhar',
      'tezz bukhar',
      'body burning',
      'tapan',
      'garam shareer',
    ],
    description: 'Elevated body temperature above normal baseline (>38.0°C / 100.4°F).',
  },
  CHILLS: {
    id: 'CON_CHILLS',
    code: 'RIGORS_CHILLS',
    canonicalName: 'Rigors and Chills',
    icd10: 'R68.83',
    category: 'CONSTITUTIONAL',
    isRedFlag: false,
    synonyms: ['chills', 'rigors', 'shivering', 'kapkapi', 'tharthari', 'thand lagna'],
    description: 'Episodes of involuntary shivering with sensation of cold.',
  },
  FATIGUE: {
    id: 'CON_FATIGUE',
    code: 'MALAISE_FATIGUE',
    canonicalName: 'Malaise and Fatigue',
    icd10: 'R53.83',
    category: 'CONSTITUTIONAL',
    isRedFlag: false,
    synonyms: ['fatigue', 'tiredness', 'exhaustion', 'weakness', 'thakan', 'sustee', 'kamzori'],
    description: 'General state of lethargy, muscle weakness, or lack of energy.',
  },
  COUGH: {
    id: 'CON_COUGH',
    code: 'COUGH_ACUTE',
    canonicalName: 'Cough',
    icd10: 'R05',
    category: 'RESPIRATORY',
    isRedFlag: false,
    synonyms: ['cough', 'coughing', 'dry cough', 'wet cough', 'productive cough', 'khansi', 'dhasak'],
    description: 'Sudden, repetitive reflex to clear respiratory tract.',
  },
  DYSPNEA: {
    id: 'CON_DYSPNEA',
    code: 'DYSPNEA_ACUTE',
    canonicalName: 'Shortness of Breath / Dyspnea',
    icd10: 'R06.0',
    category: 'RESPIRATORY',
    isRedFlag: true,
    synonyms: [
      'dyspnea',
      'shortness of breath',
      'difficulty breathing',
      'breathlessness',
      'labored breathing',
      'saas lene me takleef',
      'saas phulna',
      'saas rukna',
      'dum ghutna',
    ],
    description: 'Distressing sensation of breathlessness, requiring rapid triage.',
  },
  SORE_THROAT: {
    id: 'CON_SORE_THROAT',
    code: 'PHARYNGITIS_ACUTE',
    canonicalName: 'Sore Throat / Pharyngalgia',
    icd10: 'R07.0',
    category: 'RESPIRATORY',
    isRedFlag: false,
    synonyms: ['sore throat', 'throat pain', 'scratchy throat', 'gala kharab', 'gale me dard', 'gale me kharash'],
    description: 'Pain, scratchiness, or irritation of the pharynx, often worsening when swallowing.',
  },
  CHEST_PAIN: {
    id: 'CON_CHEST_PAIN',
    code: 'PRECORDIAL_CHEST_PAIN',
    canonicalName: 'Acute Chest Pain / Angina',
    icd10: 'R07.9',
    category: 'CARDIOVASCULAR',
    isRedFlag: true,
    synonyms: [
      'chest pain',
      'angina',
      'chest pressure',
      'chest tightness',
      'heaviness in chest',
      'sine me dard',
      'chhati me dard',
      'chhati me bhari pan',
    ],
    description: 'Discomfort, pressure, squeezing, or pain in the chest region.',
  },
  PALPITATIONS: {
    id: 'CON_PALPITATIONS',
    code: 'CARDIAC_PALPITATIONS',
    canonicalName: 'Palpitations',
    icd10: 'R00.2',
    category: 'CARDIOVASCULAR',
    isRedFlag: false,
    synonyms: ['palpitations', 'racing heart', 'fluttering', 'dil ki dhadkan tezz', 'dhadkan badhna'],
    description: 'Perceived sensation of rapid, fluttering, or pounding heartbeat.',
  },
  ABDOMINAL_PAIN: {
    id: 'CON_ABDOMINAL_PAIN',
    code: 'ABDOMINAL_PAIN_UNSPECIFIED',
    canonicalName: 'Abdominal Pain',
    icd10: 'R10.9',
    category: 'GASTROINTESTINAL',
    isRedFlag: false,
    synonyms: ['abdominal pain', 'stomach pain', 'belly ache', 'pet dard', 'pet me marod', 'tummy ache'],
    description: 'Pain localized to the abdomen.',
  },
  VOMITING: {
    id: 'CON_VOMITING',
    code: 'EMESIS_VOMITING',
    canonicalName: 'Emesis / Vomiting',
    icd10: 'R11.1',
    category: 'GASTROINTESTINAL',
    isRedFlag: false,
    synonyms: ['vomiting', 'emesis', 'throwing up', 'nausea and vomiting', 'ulti', 'kai hona'],
    description: 'Involuntary, forceful expulsion of the contents of stomach through mouth.',
  },
  DIARRHEA: {
    id: 'CON_DIARRHEA',
    code: 'DIARRHEA_ACUTE',
    canonicalName: 'Diarrhea / Loose Stools',
    icd10: 'K52.9',
    category: 'GASTROINTESTINAL',
    isRedFlag: false,
    synonyms: ['diarrhea', 'loose stools', 'watery stool', 'dast', 'patla pakhana', 'pet kharab'],
    description: 'Passage of three or more loose or liquid stools per day.',
  },
  HEADACHE: {
    id: 'CON_HEADACHE',
    code: 'CEPHALEA_HEADACHE',
    canonicalName: 'Headache / Cephalea',
    icd10: 'R51',
    category: 'NEUROLOGICAL',
    isRedFlag: false,
    synonyms: ['headache', 'head pain', 'migraine', 'sar dard', 'matha dard', 'sir me dard'],
    description: 'Pain or discomfort in head, scalp, or neck.',
  },
  ANOSMIA: {
    id: 'CON_ANOSMIA',
    code: 'LOSS_OF_SMELL',
    canonicalName: 'Anosmia / Loss of Smell',
    icd10: 'R43.0',
    category: 'NEUROLOGICAL',
    isRedFlag: false,
    synonyms: ['loss of smell', 'anosmia', 'cannot smell', 'khushbu na aana', 'sunghe na aana'],
    description: 'Partial or complete loss of the sense of smell.',
  },
  AGEUSIA: {
    id: 'CON_AGEUSIA',
    code: 'LOSS_OF_TASTE',
    canonicalName: 'Ageusia / Loss of Taste',
    icd10: 'R43.2',
    category: 'NEUROLOGICAL',
    isRedFlag: false,
    synonyms: ['loss of taste', 'ageusia', 'no taste', 'swad na aana', 'muh beswad'],
    description: 'Partial or complete loss of the sense of taste.',
  },
  RASH: {
    id: 'CON_RASH',
    code: 'EXANTHEM_RASH',
    canonicalName: 'Skin Eruption / Rash',
    icd10: 'R21',
    category: 'DERMATOLOGICAL',
    isRedFlag: false,
    synonyms: ['rash', 'skin rash', 'red spots', 'dane', 'khujli ke dane', 'chhakatte'],
    description: 'Noticeable change in texture or color of the skin.',
  },
  ARTHRALGIA: {
    id: 'CON_ARTHRALGIA',
    code: 'JOINT_PAIN',
    canonicalName: 'Arthralgia / Joint Pain',
    icd10: 'M25.50',
    category: 'MUSCULOSKELETAL',
    isRedFlag: false,
    synonyms: ['joint pain', 'body ache', 'muscle pain', 'arthralgia', 'jodon ka dard', 'haddi dard'],
    description: 'Discomfort, pain, or inflammation arising from joints.',
  },
};
