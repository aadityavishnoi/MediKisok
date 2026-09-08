import { describe, it, expect } from 'vitest';
import { DrugSafetyEngine } from '../src/DrugSafetyEngine';
import { MedicineNormalizer } from '../src/normalization/MedicineNormalizer';

describe('Developer 2: Medicine Intelligence & Rx Safety Engine', () => {
  // Test 1: Known Severe Interaction (Aspirin + Warfarin)
  it('detects contraindicated interaction between Aspirin and Warfarin', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: ['Ecosprin 75', 'Warfarin 5mg'],
    });

    expect(result.safe).toBe(false);
    expect(result.requiresDoctorReview).toBe(true);
    expect(result.interactions.length).toBeGreaterThan(0);

    const match = result.interactions.find(
      (it) => it.severity === 'CONTRAINDICATED' || it.severity === 'HIGH',
    );
    expect(match).toBeDefined();
    expect(match?.description).toContain('bleeding');
  });

  // Test 2: Unknown Drug Handling (Strict zero hallucinations)
  it('strictly returns UNKNOWN for uncatalogued substances without hallucinating', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: ['NonExistentCompoundX99'],
    });

    expect(result.normalizedDrugs.length).toBe(1);
    const drug = result.normalizedDrugs[0];
    expect(drug.isUnknown).toBe(true);
    expect(drug.genericName).toBe('UNKNOWN');
    expect(drug.therapeuticCategory).toBe('UNKNOWN');
    expect(drug.regulatoryStatus.cdscoSchedule).toBe('UNKNOWN');
    expect(result.regulatoryMetadata.unknownCount).toBe(1);
    expect(result.requiresDoctorReview).toBe(true);
  });

  // Test 3: Duplicate Drug Deduplication
  it('deduplicates identical medication tokens cleanly', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: ['Dolo 650', 'dolo 650', 'Dolo 650'],
    });

    expect(result.normalizedDrugs.length).toBe(1);
    expect(result.normalizedDrugs[0].genericName).toBe('Paracetamol');
  });

  // Test 4: Missing or Empty Data Handling
  it('gracefully handles empty medications request without error', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: [],
    });

    expect(result.safe).toBe(true);
    expect(result.requiresDoctorReview).toBe(false);
    expect(result.normalizedDrugs).toHaveLength(0);
    expect(result.interactions).toHaveLength(0);
  });

  // Test 5: Allergy Cross-Checking
  it('detects reported drug allergy conflict', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: ['Augmentin 625'],
      allergies: ['amoxicillin', 'penicillin'],
    });

    expect(result.safe).toBe(false);
    expect(result.contraindications.length).toBeGreaterThan(0);
    const allergyAlert = result.contraindications.find((c) => c.type === 'ALLERGY');
    expect(allergyAlert).toBeDefined();
    expect(allergyAlert?.severity).toBe('CRITICAL');
  });

  // Test 6: Jan Aushadhi Cost-Saving Generic Alternatives
  it('identifies Jan Aushadhi generic alternatives for NLEM medicines', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: ['Cifran 500', 'Atorva 10'],
    });

    expect(result.janAushadhiAlternatives.length).toBeGreaterThanOrEqual(1);
    const alt = result.janAushadhiAlternatives[0];
    expect(alt.approxSavingsPercent).toBeGreaterThanOrEqual(50);
    expect(alt.janAushadhiGeneric).toBeDefined();
  });

  // Test 7: Pregnancy Teratogenic Contraindication
  it('flags Warfarin in pregnant patient context', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: ['Warfarin'],
      patientContext: { isPregnant: true },
    });

    expect(result.safe).toBe(false);
    const pregAlert = result.contraindications.find((c) => c.type === 'ORGAN_CONTRAINDICATION');
    expect(pregAlert).toBeDefined();
    expect(pregAlert?.reason).toContain('teratogenic');
  });

  // Test 8: MedicineNormalizer Strength & Form Stripping
  it('extracts standardized strength and cleans formulation prefixes', () => {
    const cleaned = MedicineNormalizer.cleanMedicineString('Tab Dolo 650 mg');
    expect(cleaned).toContain('dolo 650 mg');

    const strength = MedicineNormalizer.extractStrength('Tab Dolo 650 mg');
    expect(strength).toBe('650mg');
  });

  // Test 9: Medicine Normalization & CDSCO Schedule Classification
  it('maps branded Indian prescription strings to NLEM & CDSCO schedules', () => {
    const medDolo = MedicineNormalizer.normalizeMedicine('Tab Dolo 650 mg');
    expect(medDolo.isUnknown).toBe(false);
    expect(medDolo.genericName).toBe('Paracetamol');
    expect(medDolo.isNLEMEssential).toBe(true);
    expect(medDolo.regulatorySchedule).toBe('OTC');
    expect(medDolo.janAushadhiAvailable).toBe(true);

    const medAugmentin = MedicineNormalizer.normalizeMedicine('Cap Augmentin 625');
    expect(medAugmentin.isUnknown).toBe(false);
    expect(medAugmentin.genericName).toContain('Amoxicillin');
    expect(medAugmentin.regulatorySchedule).toBe('SCHEDULE_H');

    const medCifran = MedicineNormalizer.normalizeMedicine('Tab Cifran 500');
    expect(medCifran.isUnknown).toBe(false);
    expect(medCifran.regulatorySchedule).toBe('SCHEDULE_H1');
  });

  // Test 10: Batch Normalization with Deduplication
  it('batch normalizes prescription strings and deduplicates equivalents', () => {
    const batch = MedicineNormalizer.normalizePrescriptionList([
      'Tab Dolo 650',
      'dolo 650',
      'Tab Ecosprin 75',
    ]);
    expect(batch.length).toBe(2);
    expect(batch.map((b) => b.genericName)).toContain('Paracetamol');
    expect(batch.map((b) => b.genericName)).toContain('Aspirin (Acetylsalicylic Acid)');
  });

  // Test 11: Unknown Substance Guarding (Zero Hallucination)
  it('strictly flags unrecognized substances as UNKNOWN requiring doctor verification', () => {
    const unknown = MedicineNormalizer.normalizeMedicine('MysteriousExtractAlpha99');
    expect(unknown.isUnknown).toBe(true);
    expect(unknown.genericName).toBe('UNKNOWN');
    expect(unknown.regulatorySchedule).toBe('UNKNOWN');
    expect(unknown.requiresDoctorVerification).toBe(true);
  });

  // Test 12: Exact Duplicate Therapy (Different brand names of same active ingredient)
  it('detects exact active ingredient duplicate therapy between Dolo and Calpol', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: ['Dolo 650', 'Calpol 500'],
    });

    expect(result.duplicateTherapy.length).toBeGreaterThan(0);
    const dup = result.duplicateTherapy.find((d) => d.type === 'EXACT_DUPLICATE');
    expect(dup).toBeDefined();
    expect(dup?.activeIngredient).toBe('Paracetamol');
    expect(dup?.severity).toBe('CRITICAL');
    expect(dup?.evidenceProvenance.source).toBeDefined();
    expect(result.requiresDoctorReview).toBe(true);
  });

  // Test 13: Class Duplicate Therapy (Two systemic NSAIDs)
  it('detects pharmacological class duplicate therapy between Ibuprofen and Diclofenac', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: ['Brufen 400', 'Voveran 50'],
    });

    expect(result.duplicateTherapy.length).toBeGreaterThan(0);
    const dup = result.duplicateTherapy.find((d) => d.type === 'POTENTIAL_DUPLICATE');
    expect(dup).toBeDefined();
    expect(dup?.pharmacologicalClass).toBe('NSAID');
    expect(result.requiresDoctorReview).toBe(true);
  });

  // Test 14: Dual RAAS Blockade Contraindication (ACE Inhibitor + ARB)
  it('flags contraindicated dual RAAS blockade between Enalapril and Telmisartan', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: ['Envas 5', 'Telma 40'],
    });

    expect(result.safe).toBe(false);
    expect(result.interactions.length).toBeGreaterThan(0);
    const raas = result.interactions.find((it) => it.severity === 'CONTRAINDICATED');
    expect(raas).toBeDefined();
    expect(raas?.description).toContain('Dual RAAS blockade');
    expect(raas?.mechanism).toContain('renin-angiotensin');
    expect(raas?.management).toBeDefined();
  });

  // Test 15: Cross-Reactivity Allergy Checking (Penicillin -> Cephalosporin)
  it('evaluates beta-lactam class cross-reactivity for penicillin allergy with Ceftriaxone', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: ['Monocef 1g'],
      allergies: ['penicillin'],
    });

    expect(result.allergyFlags.length).toBeGreaterThan(0);
    const flag = result.allergyFlags.find((f) => f.medication.includes('Monocef'));
    expect(flag).toBeDefined();
    expect(flag?.matchType).toBe('POSSIBLE_MATCH');
    expect(flag?.reason).toContain('beta-lactam cross-reactivity');
    expect(flag?.severity).toBe('WARNING');
  });

  // Test 16: Structured Strength, Formulation, and Route Parsing
  it('parses structured dosage quantity, unit, form, and route accurately', () => {
    const parsed = MedicineNormalizer.normalizeMedicine('Tab Paracetamol 500 mg BD');
    expect(parsed.genericName).toBe('Paracetamol');
    expect(parsed.parsedDetails?.strengthNum).toBe(500);
    expect(parsed.parsedDetails?.unit).toBe('mg');
    expect(parsed.parsedDetails?.form).toBe('tablet');
    expect(parsed.parsedDetails?.route).toBe('oral');
    expect(parsed.parsedDetails?.frequency).toBe('BD');
  });

  // Test 17: Evidence Provenance on Interactions and Alerts
  it('attaches verifiable regulatory provenance metadata to all drug interaction warnings', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: ['Deplatt 75', 'Omez 20'],
    });

    expect(result.interactions.length).toBeGreaterThan(0);
    const interaction = result.interactions[0];
    expect(interaction.evidenceProvenance).toBeDefined();
    expect(interaction.evidenceProvenance?.source).toBeDefined();
    expect(interaction.evidenceProvenance?.evidenceType).toBe('REGULATORY_COMPENDIUM');
    expect(interaction.mechanism).toContain('CYP2C19');
    expect(interaction.management).toContain('Pantoprazole');
  });

  // Test 18: Section 26 API Contract Compliance
  it('returns full Section 26 contract format with versioning and clinical disclaimer', () => {
    const result = DrugSafetyEngine.checkPrescriptionSafety({
      medications: ['Dolo 650', 'Cifran 500'],
      allergies: [],
    });

    expect(result.status).toBeDefined();
    expect(result.doctorReviewRequired).toBe(result.requiresDoctorReview);
    expect(result.normalizedMedications).toBeDefined();
    expect(result.allergyFlags).toBeDefined();
    expect(result.duplicateTherapy).toBeDefined();
    expect(result.evidence).toBeDefined();
    expect(result.rulesVersion).toBe('rx-rules-v2.1');
    expect(result.clinicalDisclaimer).toContain('assistive clinical decision support tool');
  });
});

