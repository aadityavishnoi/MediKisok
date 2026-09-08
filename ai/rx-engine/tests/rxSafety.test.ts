import { describe, it, expect } from 'vitest';
import { DrugSafetyEngine } from '../src/DrugSafetyEngine';

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
});
