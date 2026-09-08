/**
 * Developer 2 Phase 4: Complete Consultation & Workflow Integration Tests
 *
 * Verifies all 14 Integration Tests (Section 19) + Complete E2E Scenario (Section 20):
 * 1. Patient starts consultation
 * 2. Symptoms reach Clinical AI
 * 3. Clinical AI returns next question
 * 4. Regional signal is retrieved
 * 5. Regional signal enters consultation context
 * 6. Doctor sees structured AI history
 * 7. Doctor writes prescription
 * 8. Rx engine detects interaction
 * 9. Doctor reviews alert
 * 10. Doctor completes consultation
 * 11. Surveillance API unavailable -> Consultation still works
 * 12. Rx API unavailable -> Prescription remains review-required
 * 13. Unauthorized doctor attempts to access another patient's consultation -> Must fail
 * 14. Regional 8/10 signal -> Must maintain: individualDiagnosis = false
 * 15. Complete E2E Consultation Cycle
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { ConsultationAiService } from '../services/consultationAiService.js';

describe('Developer 2 Phase 4: Consultation Workflow & Safety Integration', () => {
  const app = createApp();

  // Test 1: Patient starts consultation
  it('Test 1: Patient starts consultation via POST /api/ai/consultation/start', async () => {
    const res = await request(app)
      .post('/api/ai/consultation/start')
      .send({
        sessionId: 'test_session_workflow_01',
        patientId: 'pat_workflow_01',
        chiefComplaint: 'Fever and joint pain for 3 days',
        district: 'Varanasi',
        state: 'Uttar Pradesh',
      });

    expect(res.status).toBe(200);
    expect(res.body.context).toBeDefined();
    expect(res.body.context.sessionId).toBe('test_session_workflow_01');
    expect(res.body.context.status).toBe('IN_PROGRESS');
    expect(res.body.context.requiresDoctorReview).toBe(true);
  });

  // Test 2: Symptoms reach Clinical AI
  it('Test 2: Symptoms reach Clinical AI engine', async () => {
    const res = await request(app)
      .post('/api/ai/consultation/start')
      .send({
        sessionId: 'test_session_symptoms_02',
        chiefComplaint: 'High fever, severe headache, retro-orbital pain',
        reportedSymptoms: ['fever', 'chills', 'headache'],
        district: 'Varanasi',
      });

    expect(res.status).toBe(200);
    expect(res.body.context.symptoms).toEqual(['fever', 'chills', 'headache']);
    expect(res.body.context.clinicalSignals.length).toBeGreaterThan(0);
    expect(res.body.context.clinicalSignals[0].normalizedSymptoms.length).toBe(3);
  });

  // Test 3: Clinical AI returns next question
  it('Test 3: Clinical AI returns next ranked question', async () => {
    const res = await request(app)
      .post('/api/ai/consultation/start')
      .send({
        sessionId: 'test_session_qrank_03',
        chiefComplaint: 'Chest tightness radiating to arm',
        reportedSymptoms: ['chest pain', 'dyspnea'],
        district: 'Varanasi',
      });

    expect(res.status).toBe(200);
    expect(res.body.nextQuestion).toBeDefined();
    expect(res.body.nextQuestion.questionId).toBeDefined();
    expect(res.body.nextQuestion.questionText).toBeDefined();
    expect(res.body.suspectedDifferentials.length).toBeGreaterThan(0);
  });

  // Test 4: Regional signal is retrieved
  it('Test 4: Regional signal is retrieved for patient district', async () => {
    const res = await request(app)
      .get('/api/surveillance/regions/IN-UP-VARANASI/risk');

    expect(res.status).toBe(200);
    expect(res.body.regionId).toBe('IN-UP-VARANASI');
    expect(res.body.signals).toBeDefined();
    expect(res.body.riskLevel).toBeDefined();
    expect(res.body.clinicalUse?.individualDiagnosis).toBe(false);
  });

  // Test 5: Regional signal enters consultation context
  it('Test 5: Regional surveillance signal enters consultation context', async () => {
    const res = await request(app)
      .post('/api/ai/consultation/start')
      .send({
        sessionId: 'test_session_surv_context_05',
        chiefComplaint: 'Acute fever with chills',
        district: 'Varanasi',
        state: 'Uttar Pradesh',
      });

    expect(res.status).toBe(200);
    expect(res.body.context.regionalSignals.length).toBeGreaterThan(0);
    const regional = res.body.context.regionalSignals[0];
    expect(regional.regionId).toBe('IN-UP-VARANASI');
    expect(regional.district).toBe('Varanasi');
    expect(regional.state).toBe('Uttar Pradesh');
    expect(res.body.context.forecasts.length).toBeGreaterThanOrEqual(1);
  });

  // Test 6: Doctor sees structured AI history after patient answers
  it('Test 6: Doctor sees structured AI history summary after answers', async () => {
    // Start consultation
    await request(app)
      .post('/api/ai/consultation/start')
      .send({
        sessionId: 'test_session_answers_06',
        chiefComplaint: 'Persistent cough and fever',
        district: 'Varanasi',
      });

    // Answer questions
    await request(app)
      .post('/api/ai/consultation/answer')
      .send({
        sessionId: 'test_session_answers_06',
        questionId: 'Q_FEV_1',
        questionText: 'How high is the fever?',
        answerValue: '102.5 F with rigors',
        isRedFlagTrigger: false,
      });

    const ans2 = await request(app)
      .post('/api/ai/consultation/answer')
      .send({
        sessionId: 'test_session_answers_06',
        questionId: 'Q_RESP_1',
        questionText: 'Any shortness of breath?',
        answerValue: 'Mild exertion breathlessness',
        isRedFlagTrigger: true,
      });

    expect(ans2.status).toBe(200);
    expect(ans2.body.context.answers.length).toBe(2);

    // Retrieve context as doctor
    const ctxRes = await request(app).get('/api/ai/consultation/test_session_answers_06/context');
    expect(ctxRes.status).toBe(200);
    expect(ctxRes.body.context.answers.length).toBe(2);
    expect(ctxRes.body.context.answers[1].isRedFlagTrigger).toBe(true);
  });

  // Test 7: Doctor writes prescription
  it('Test 7: Doctor writes prescription lines', async () => {
    const res = await request(app)
      .post('/api/rx/check')
      .send({
        medications: ['Tab. Paracetamol 650mg', 'Tab. Azithromycin 500mg'],
        allergies: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.normalizedDrugs.length).toBe(2);
    expect(res.body.safe).toBe(true);
  });

  // Test 8: Rx engine detects interaction
  it('Test 8: Rx engine detects clinically significant interaction', async () => {
    const res = await request(app)
      .post('/api/rx/check')
      .send({
        medications: ['Ecosprin 75', 'Warfarin 5mg'],
        allergies: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.safe).toBe(false);
    expect(res.body.interactions.length).toBeGreaterThan(0);
    const aspirinWarfarin = res.body.interactions.find(
      (i: any) =>
        (i.drugA.toLowerCase().includes('aspirin') || i.drugB.toLowerCase().includes('aspirin') ||
         i.drugA.toLowerCase().includes('warfarin') || i.drugB.toLowerCase().includes('warfarin')),
    );
    expect(aspirinWarfarin).toBeDefined();
  });

  // Test 9: Doctor reviews explainable alert
  it('Test 9: Doctor reviews explainable alert with evidence provenance', async () => {
    const res = await request(app)
      .post('/api/rx/check')
      .send({
        medications: ['Warfarin 5mg', 'Aspirin 75mg'],
        allergies: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.evidence.length).toBeGreaterThan(0);
    const ev = res.body.evidence[0];
    expect(ev.source).toBeDefined();
    expect(ev.evidenceType).toBeDefined();
    expect(res.body.requiresDoctorReview).toBe(true);
  });

  // Test 10: Doctor completes consultation
  it('Test 10: Doctor completes consultation with final authority', async () => {
    // Start
    await request(app)
      .post('/api/ai/consultation/start')
      .send({
        sessionId: 'test_session_complete_10',
        chiefComplaint: 'Chest tightness',
        district: 'Varanasi',
      });

    // Complete
    const completeRes = await request(app)
      .post('/api/consultations/test_session_complete_10/complete')
      .send({
        doctorId: 'doc_rohan_mehta',
        diagnosis: 'Stage 1 Essential Hypertension. Coronary Angina Ruled Out.',
        notes: 'Advised lifestyle modification, low salt diet, and ambulatory BP tracking.',
        prescriptions: [
          { medicineName: 'Tab. Telmisartan 40mg', dosage: '1 Tab', frequency: '1-0-0' },
        ],
        acknowledgedAlerts: ['ALT_BP_ELEVATED'],
      });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);
    expect(completeRes.body.status).toBe('COMPLETED');
    expect(completeRes.body.doctorFinalDecision).toBe(true);
    expect(completeRes.body.autonomousDiagnosis).toBe(false);
    expect(completeRes.body.autonomousPrescription).toBe(false);
  });

  // Test 11: Surveillance API unavailable -> Consultation still works
  it('Test 11: Surveillance API unavailable -> Consultation proceeds safely', async () => {
    const res = await request(app)
      .post('/api/ai/consultation/start')
      .send({
        sessionId: 'test_session_fail_surv_11',
        chiefComplaint: 'Routine wellness check',
        district: 'UNKNOWN_NONEXISTENT_DISTRICT_XYZ',
        state: 'UNKNOWN_STATE',
      });

    expect(res.status).toBe(200);
    expect(res.body.context).toBeDefined();
    expect(res.body.context.status).toBe('IN_PROGRESS');
  });

  // Test 12: Rx API unavailable -> Prescription remains review-required
  it('Test 12: Rx engine failure fallback marks REVIEW_REQUIRED without claiming safe', async () => {
    const fallbackResult = await ConsultationAiService.checkPrescriptionSafety(
      'test_session_rx_fallback_12',
      ['DrugUnknownX', 'DrugUnknownY'],
    );

    expect(fallbackResult.status).toBe('REVIEW_REQUIRED');
    expect(fallbackResult.doctorReviewRequired).toBe(true);
  });

  // Test 13: Unauthorized doctor attempts to access another patient's consultation
  it("Test 13: Unauthorized doctor cannot access another facility patient consultation", async () => {
    await request(app)
      .post('/api/ai/consultation/start')
      .send({
        sessionId: 'test_session_unauth_13',
        chiefComplaint: 'Confidential consultation',
        facilityId: 'HOSPITAL_FACILITY_A',
      });

    try {
      await ConsultationAiService.getContext('test_session_unauth_13', {
        id: 'doc_external',
        facilityId: 'HOSPITAL_FACILITY_B',
      });
      expect.fail('Should have thrown 403');
    } catch (err: any) {
      expect(err.status || err.statusCode).toBe(403);
    }
  });


  // Test 14: Regional 8/10 signal -> Must maintain individualDiagnosis = false
  it('Test 14: Regional 8/10 signal strictly maintains individualDiagnosis = false', async () => {
    const res = await request(app).get('/api/surveillance/regions/REGION_X/risk');

    expect(res.status).toBe(200);
    expect(res.body.clinicalUse.individualDiagnosis).toBe(false);
    expect(res.body.clinicalUse.doctorReviewRequired).toBe(true);
    expect(res.body.clinicalUse.enhancedScreeningRecommended).toBe(true);
  });

  // Test 15: Complete End-to-End Workflow Scenario (Section 20)
  it('Test 15: Complete End-to-End Automated Workflow Scenario (Section 20)', async () => {
    const sessionId = `e2e_full_session_${Date.now()}`;

    // Step 1 & 2: Patient starts intake at Kiosk with symptoms
    const startRes = await request(app)
      .post('/api/ai/consultation/start')
      .send({
        sessionId,
        patientId: 'pat_e2e_001',
        chiefComplaint: 'Acute fever with joint aches and chills',
        reportedSymptoms: ['fever', 'chills', 'arthralgia'],
        district: 'Varanasi',
        state: 'Uttar Pradesh',
      });

    expect(startRes.status).toBe(200);
    expect(startRes.body.context.status).toBe('IN_PROGRESS');
    expect(startRes.body.context.regionalSignals.length).toBeGreaterThan(0);
    expect(startRes.body.nextQuestion).toBeDefined();

    const firstQuestion = startRes.body.nextQuestion;

    // Step 3 & 4: Patient answers Clinical AI question
    const ansRes = await request(app)
      .post('/api/ai/consultation/answer')
      .send({
        sessionId,
        questionId: firstQuestion.questionId,
        questionText: firstQuestion.questionText,
        answerValue: 'High grade 103 F for 4 days',
        isRedFlagTrigger: false,
      });

    expect(ansRes.status).toBe(200);
    expect(ansRes.body.context.answers.length).toBe(1);

    // Step 5: Doctor views AI context & Regional Surveillance
    const doctorContextRes = await request(app).get(`/api/ai/consultation/${sessionId}/context`);
    expect(doctorContextRes.status).toBe(200);
    const docContext = doctorContextRes.body.context;
    expect(docContext.regionalSignals[0].disease).toBeDefined();
    expect(docContext.forecasts.length).toBeGreaterThanOrEqual(1);

    // Step 6 & 7: Doctor writes prescription & checks Rx safety
    const rxCheckRes = await request(app)
      .post('/api/rx/check')
      .send({
        medications: ['Dolo 650 mg Tablet', 'Calpol 500 mg Tablet'],
        allergies: [],
      });

    expect(rxCheckRes.status).toBe(200);
    // Duplicate active ingredient acetaminophen flagged
    expect(rxCheckRes.body.duplicateTherapy.length).toBeGreaterThan(0);
    expect(rxCheckRes.body.doctorReviewRequired).toBe(true);

    // Step 8: Doctor makes final decision and completes consultation
    const completeRes = await request(app)
      .post(`/api/consultations/${sessionId}/complete`)
      .send({
        doctorId: 'doc_senior_consultant',
        diagnosis: 'Suspected Viral Pyrexia. Monitored for Dengue.',
        notes: 'Advised hydration, Paracetamol 650mg SOS (max 3/day). Resolved duplicate Calpol.',
        prescriptions: [
          { medicineName: 'Paracetamol 650mg', dosage: '1 Tab', frequency: 'SOS', duration: '3 days' },
        ],
        acknowledgedAlerts: ['DUPLICATE_ACETAMINOPHEN_RESOLVED'],
      });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);
    expect(completeRes.body.status).toBe('COMPLETED');
    expect(completeRes.body.doctorFinalDecision).toBe(true);
    expect(completeRes.body.autonomousDiagnosis).toBe(false);
    expect(completeRes.body.autonomousPrescription).toBe(false);
  });
});
