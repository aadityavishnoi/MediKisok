/**
 * Developer 2: NLEM 2022 & CDSCO Canonical Medicine Database
 * Strictly evidence-based, deterministic catalog. Zero LLM hallucinations.
 */

export interface NormalizedMedicineConcept {
  id: string;
  genericName: string;
  brandNames: string[];
  therapeuticCategory: string;
  standardStrength: string;
  dosageForm: string;
  regulatoryStatus: {
    isNLEM: boolean;
    cdscoSchedule: 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X' | 'SCHEDULE_G' | 'OTC';
    janAushadhiAvailable: boolean;
    janAushadhiGenericName?: string;
  };
  contraindications: string[];
  knownInteractions: Array<{
    targetGenericId: string;
    targetName: string;
    severity: 'CONTRAINDICATED' | 'HIGH' | 'MODERATE' | 'LOW';
    description: string;
    source: string;
  }>;
  source: string;
  sourceDate: string;
}

export const NLEM_CATALOG: NormalizedMedicineConcept[] = [
  {
    id: 'MED_PARACETAMOL',
    genericName: 'Paracetamol',
    brandNames: ['crocin', 'calpol', 'dolo', 'dolo 650', 'pacimol', 'pyrigesic'],
    therapeuticCategory: 'Analgesics, Antipyretics and NSAIDs',
    standardStrength: '500mg / 650mg',
    dosageForm: 'Tablet / Syrup',
    regulatoryStatus: {
      isNLEM: true,
      cdscoSchedule: 'OTC',
      janAushadhiAvailable: true,
      janAushadhiGenericName: 'Paracetamol Tablets IP 500mg/650mg',
    },
    contraindications: ['Severe active hepatic impairment', 'Paracetamol hypersensitivity'],
    knownInteractions: [
      {
        targetGenericId: 'MED_WARFARIN',
        targetName: 'Warfarin',
        severity: 'MODERATE',
        description: 'Prolonged high-dose paracetamol usage may enhance anticoagulant effect of Warfarin and increase INR.',
        source: 'CDSCO National Formulary of India (NFI)',
      },
    ],
    source: 'NLEM 2022 (Section 2.1), CDSCO',
    sourceDate: '2022-09',
  },
  {
    id: 'MED_ASPIRIN',
    genericName: 'Aspirin (Acetylsalicylic Acid)',
    brandNames: ['ecosprin', 'ecosprin 75', 'ecosprin 150', 'disprin', 'aspin'],
    therapeuticCategory: 'Antiplatelet and Cardiovascular Medicines',
    standardStrength: '75mg / 150mg',
    dosageForm: 'Gastro-resistant Tablet',
    regulatoryStatus: {
      isNLEM: true,
      cdscoSchedule: 'SCHEDULE_H',
      janAushadhiAvailable: true,
      janAushadhiGenericName: 'Aspirin Gastro-resistant Tablets IP 75mg',
    },
    contraindications: ['Active gastrointestinal peptic ulceration', 'Bleeding diathesis', 'Aspirin-induced asthma'],
    knownInteractions: [
      {
        targetGenericId: 'MED_WARFARIN',
        targetName: 'Warfarin',
        severity: 'CONTRAINDICATED',
        description: 'Concurrent Aspirin and Warfarin profoundly amplifies major hemorrhagic and gastrointestinal bleeding risk.',
        source: 'CDSCO Safety Alert & BNF 84',
      },
      {
        targetGenericId: 'MED_IBUPROFEN',
        targetName: 'Ibuprofen',
        severity: 'HIGH',
        description: 'Ibuprofen may competitively attenuate irreversible platelet inhibition by low-dose Aspirin and increases GI ulceration.',
        source: 'CDSCO & US FDA Drug Safety Communication',
      },
    ],
    source: 'NLEM 2022 (Section 12.5), CDSCO',
    sourceDate: '2022-09',
  },
  {
    id: 'MED_WARFARIN',
    genericName: 'Warfarin Sodium',
    brandNames: ['warfm', 'warf', 'coumadin', 'uniwarf'],
    therapeuticCategory: 'Antithrombotic Medicines',
    standardStrength: '1mg / 2mg / 5mg',
    dosageForm: 'Tablet',
    regulatoryStatus: {
      isNLEM: true,
      cdscoSchedule: 'SCHEDULE_H',
      janAushadhiAvailable: true,
      janAushadhiGenericName: 'Warfarin Tablets IP 5mg',
    },
    contraindications: ['Pregnancy (Teratogenic)', 'Severe liver failure', 'Active uncontrollable bleeding'],
    knownInteractions: [
      {
        targetGenericId: 'MED_ASPIRIN',
        targetName: 'Aspirin',
        severity: 'CONTRAINDICATED',
        description: 'Dual antiplatelet-anticoagulation causes severe fatal hemorrhage risk.',
        source: 'NLEM / CDSCO Alert',
      },
      {
        targetGenericId: 'MED_IBUPROFEN',
        targetName: 'Ibuprofen',
        severity: 'HIGH',
        description: 'NSAIDs displace Warfarin from albumin and induce GI mucosal erosion, multiplying bleeding danger.',
        source: 'CDSCO Drug Interaction Database',
      },
      {
        targetGenericId: 'MED_CIPROFLOXACIN',
        targetName: 'Ciprofloxacin',
        severity: 'HIGH',
        description: 'Ciprofloxacin inhibits CYP1A2/CYP3A4 metabolism of Warfarin, causing marked INR elevation and hemorrhage.',
        source: 'NFI / CDSCO Interaction Advisory',
      },
    ],
    source: 'NLEM 2022 (Section 10.2), CDSCO',
    sourceDate: '2022-09',
  },
  {
    id: 'MED_IBUPROFEN',
    genericName: 'Ibuprofen',
    brandNames: ['brufen', 'combiflam', 'ibugesic', 'advil'],
    therapeuticCategory: 'Analgesics, Antipyretics and NSAIDs',
    standardStrength: '200mg / 400mg',
    dosageForm: 'Tablet',
    regulatoryStatus: {
      isNLEM: true,
      cdscoSchedule: 'SCHEDULE_H',
      janAushadhiAvailable: true,
      janAushadhiGenericName: 'Ibuprofen Tablets IP 400mg',
    },
    contraindications: ['Active peptic ulcer disease', 'Severe renal impairment (eGFR < 30)', 'Third trimester of pregnancy'],
    knownInteractions: [
      {
        targetGenericId: 'MED_WARFARIN',
        targetName: 'Warfarin',
        severity: 'HIGH',
        description: 'Synergistic GI hemorrhagic risk.',
        source: 'CDSCO NFI',
      },
      {
        targetGenericId: 'MED_ASPIRIN',
        targetName: 'Aspirin',
        severity: 'HIGH',
        description: 'Competes with cardioprotective antiplatelet effect of Aspirin.',
        source: 'CDSCO NFI',
      },
      {
        targetGenericId: 'MED_TELMISARTAN',
        targetName: 'Telmisartan',
        severity: 'MODERATE',
        description: 'NSAIDs attenuate antihypertensive efficacy of ARBs and aggravate acute renal failure risk.',
        source: 'CDSCO Interaction Guidelines',
      },
    ],
    source: 'NLEM 2022 (Section 2.1), CDSCO',
    sourceDate: '2022-09',
  },
  {
    id: 'MED_CIPROFLOXACIN',
    genericName: 'Ciprofloxacin',
    brandNames: ['cifran', 'ciplox', 'cifran 500', 'zoxan'],
    therapeuticCategory: 'Antibacterials - Fluoroquinolones',
    standardStrength: '250mg / 500mg',
    dosageForm: 'Film-coated Tablet',
    regulatoryStatus: {
      isNLEM: true,
      cdscoSchedule: 'SCHEDULE_H1',
      janAushadhiAvailable: true,
      janAushadhiGenericName: 'Ciprofloxacin Tablets IP 500mg',
    },
    contraindications: ['History of tendon rupture associated with fluoroquinolones', 'Myasthenia gravis'],
    knownInteractions: [
      {
        targetGenericId: 'MED_WARFARIN',
        targetName: 'Warfarin',
        severity: 'HIGH',
        description: 'Marked increase in prothrombin time / INR.',
        source: 'CDSCO Schedule H1 Warning',
      },
      {
        targetGenericId: 'MED_IBUPROFEN',
        targetName: 'Ibuprofen',
        severity: 'HIGH',
        description: 'Concomitant fluoroquinolone and NSAID administration may precipitate central nervous system excitation and convulsions.',
        source: 'CDSCO Schedule H1 Advisory',
      },
    ],
    source: 'NLEM 2022 (Section 6.2.2), CDSCO Schedule H1 Notification',
    sourceDate: '2022-09',
  },
  {
    id: 'MED_METFORMIN',
    genericName: 'Metformin Hydrochloride',
    brandNames: ['glyciphage', 'glycomet', 'gluformin', 'obimet', 'janumet'],
    therapeuticCategory: 'Medicines used in Diabetes (Biguanides)',
    standardStrength: '500mg / 850mg / 1000mg',
    dosageForm: 'Sustained-release Tablet',
    regulatoryStatus: {
      isNLEM: true,
      cdscoSchedule: 'SCHEDULE_H',
      janAushadhiAvailable: true,
      janAushadhiGenericName: 'Metformin SR Tablets IP 500mg',
    },
    contraindications: ['Severe renal dysfunction (eGFR < 30 mL/min)', 'Acute metabolic or lactic acidosis', 'Severe hepatic disease'],
    knownInteractions: [],
    source: 'NLEM 2022 (Section 18.5), CDSCO',
    sourceDate: '2022-09',
  },
  {
    id: 'MED_AMOXICILLIN',
    genericName: 'Amoxicillin + Clavulanic Acid',
    brandNames: ['augmentin', 'moxikind-cv', 'amoxyclav', 'clamox'],
    therapeuticCategory: 'Antibacterials - Beta-lactam medicines',
    standardStrength: '625mg (500mg + 125mg)',
    dosageForm: 'Film-coated Tablet',
    regulatoryStatus: {
      isNLEM: true,
      cdscoSchedule: 'SCHEDULE_H',
      janAushadhiAvailable: true,
      janAushadhiGenericName: 'Amoxicillin & Potassium Clavulanate Tablets IP 625mg',
    },
    contraindications: ['History of penicillin/beta-lactam anaphylaxis', 'Previous amoxicillin-clavulanate jaundice'],
    knownInteractions: [
      {
        targetGenericId: 'MED_WARFARIN',
        targetName: 'Warfarin',
        severity: 'MODERATE',
        description: 'Broad-spectrum antibiotics eradicate gut microflora producing Vitamin K, potentially enhancing Warfarin anticoagulant action.',
        source: 'CDSCO NFI',
      },
    ],
    source: 'NLEM 2022 (Section 6.2.1), CDSCO',
    sourceDate: '2022-09',
  },
  {
    id: 'MED_AZITHROMYCIN',
    genericName: 'Azithromycin',
    brandNames: ['azithral', 'zithromax', 'azee', 'azimax'],
    therapeuticCategory: 'Antibacterials - Macrolides',
    standardStrength: '250mg / 500mg',
    dosageForm: 'Tablet',
    regulatoryStatus: {
      isNLEM: true,
      cdscoSchedule: 'SCHEDULE_H',
      janAushadhiAvailable: true,
      janAushadhiGenericName: 'Azithromycin Tablets IP 500mg',
    },
    contraindications: ['Known hypersensitivity to macrolides', 'Severe cholestatic jaundice history'],
    knownInteractions: [
      {
        targetGenericId: 'MED_ATORVASTATIN',
        targetName: 'Atorvastatin',
        severity: 'MODERATE',
        description: 'Macrolides may increase systemic statin exposure, increasing risk of myopathy or rhabdomyolysis.',
        source: 'CDSCO NFI',
      },
    ],
    source: 'NLEM 2022 (Section 6.2.2), CDSCO',
    sourceDate: '2022-09',
  },
  {
    id: 'MED_ATORVASTATIN',
    genericName: 'Atorvastatin',
    brandNames: ['atorva', 'lipitor', 'atocor', 'storvas'],
    therapeuticCategory: 'Lipid Lowering Medicines (Statins)',
    standardStrength: '10mg / 20mg / 40mg',
    dosageForm: 'Tablet',
    regulatoryStatus: {
      isNLEM: true,
      cdscoSchedule: 'SCHEDULE_H',
      janAushadhiAvailable: true,
      janAushadhiGenericName: 'Atorvastatin Tablets IP 10mg',
    },
    contraindications: ['Active liver disease', 'Unexplained persistent transaminase elevation', 'Pregnancy'],
    knownInteractions: [
      {
        targetGenericId: 'MED_AZITHROMYCIN',
        targetName: 'Azithromycin',
        severity: 'MODERATE',
        description: 'May elevate statin serum concentration and risk of myalgia.',
        source: 'CDSCO NFI',
      },
    ],
    source: 'NLEM 2022 (Section 12.6), CDSCO',
    sourceDate: '2022-09',
  },
  {
    id: 'MED_TELMISARTAN',
    genericName: 'Telmisartan',
    brandNames: ['telma', 'telmikind', 'micardis', 'telsar'],
    therapeuticCategory: 'Antihypertensive Medicines (ARBs)',
    standardStrength: '20mg / 40mg / 80mg',
    dosageForm: 'Tablet',
    regulatoryStatus: {
      isNLEM: true,
      cdscoSchedule: 'SCHEDULE_H',
      janAushadhiAvailable: true,
      janAushadhiGenericName: 'Telmisartan Tablets IP 40mg',
    },
    contraindications: ['Second and third trimesters of pregnancy', 'Biliary obstructive disorders'],
    knownInteractions: [
      {
        targetGenericId: 'MED_IBUPROFEN',
        targetName: 'Ibuprofen',
        severity: 'MODERATE',
        description: 'NSAIDs diminish antihypertensive effect and increase renal injury risk.',
        source: 'CDSCO NFI',
      },
    ],
    source: 'NLEM 2022 (Section 12.3), CDSCO',
    sourceDate: '2022-09',
  },
];
