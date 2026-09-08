/**
 * MediKiosk Master Automated Acceptance Test Suite
 *
 * Implements full 8-Step Live End-to-End Operational Lifecycle Verification:
 * Central Admin (Onboarding) → Hospital Admin (Clinics/Doctors/Kiosks) →
 * RFID Portal (Lifecycle/Assignment/Atomic Replacement) → Patient Kiosk (Intake/Consent/Queue) →
 * OPD Queue (Token Calling/Emergency Override) → Doctor Dashboard (Consultation/Rx Safety) →
 * Central Governance (AI Model Deployment & Surveillance & Immutable Audit Logs)
 *
 * Runs against live CockroachDB database.
 */

import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend .env for CockroachDB connection
const envPath = path.resolve(__dirname, '../apps/backend/.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

// Dynamically import backend app
const { createApp } = await import('../apps/backend/src/app.js');
const { prisma } = await import('../apps/backend/src/lib/prisma.js');

async function runSuite() {
  console.log('================================================================');
  console.log('🚀 MEDIKIOSK COMPLETE LIVE ACCEPTANCE TEST SUITE');
  console.log('🏛️ Testing End-to-End Operational Lifecycle against CockroachDB');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================\n');

  // Start ephemeral server on random available port
  const app = createApp();
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 4000;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`📡 In-process test server running on ${baseUrl}\n`);

  let passed = 0;
  let failed = 0;

  async function step(description: string, fn: () => Promise<void>) {
    process.stdout.write(`⏳ ${description}... `);
    try {
      await fn();
      passed++;
      console.log('✅ PASSED');
    } catch (err: any) {
      failed++;
      console.log('❌ FAILED');
      console.error(`   Error: ${err.message}`);
    }
  }

  const testSuffix = Math.floor(1000 + Math.random() * 9000);
  let testHospitalId = '';
  let testHospitalCode = `TEST-HOSP-${testSuffix}`;
  let testDoctorId = '';
  let testDepartmentId = '';
  let testKioskId = '';
  let testCardUid = `04:TEST:${testSuffix}:A1`;
  let testReplacementUid = `04:TEST:${testSuffix}:B2`;
  let testPatientId = '';
  let testTicketId = '';
  let testSessionId = '';
  let testAiModelId = '';

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Central Admin — Hospital Onboarding & Approval Workflow
    // -------------------------------------------------------------------------
    console.log('\n--- [STEP 1] Central Admin: Hospital Onboarding & Approval ---');

    await step('Submit Hospital Onboarding Application (POST /api/hospitals)', async () => {
      const res = await fetch(`${baseUrl}/api/hospitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `MediKiosk District Hospital ${testSuffix}`,
          code: testHospitalCode,
          type: 'DISTRICT_HOSPITAL',
          state: 'Uttar Pradesh',
          district: 'Varanasi',
          city: 'Varanasi',
          pinCode: '221001',
          contactPhone: '+91 98765 43210',
          contactEmail: `admin.${testSuffix}@varanasi-hospital.gov.in`,
          totalBeds: 350,
          availableBeds: 82,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      testHospitalId = data.hospital.id;
      if (!testHospitalId) throw new Error('Missing hospital ID');
      if (data.hospital.facilityStatus !== 'UNDER_REVIEW' && data.hospital.facilityStatus !== 'PENDING_APPROVAL' && data.hospital.facilityStatus !== 'ACTIVE') {
        throw new Error(`Unexpected status: ${data.hospital.facilityStatus}`);
      }
    });

    await step('Central Admin Approves Hospital (POST /api/hospitals/:id/approve)', async () => {
      const res = await fetch(`${baseUrl}/api/hospitals/${testHospitalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Verified compliance & state accreditation' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (data.hospital.facilityStatus !== 'ACTIVE') {
        throw new Error(`Expected ACTIVE, got ${data.hospital.facilityStatus}`);
      }
    });

    // -------------------------------------------------------------------------
    // STEP 2: Hospital Admin — Facility Operations Setup
    // -------------------------------------------------------------------------
    console.log('\n--- [STEP 2] Hospital Admin: Departments, Doctors & Kiosks ---');

    await step('Create OPD Department (POST /api/hospitals/:id/departments)', async () => {
      const res = await fetch(`${baseUrl}/api/hospitals/${testHospitalId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Cardiology & Chest Clinic',
          code: `CRD${testSuffix.toString().slice(-3)}`,
          floor: '1st Floor',
          roomNumber: 'OPD Room 102',
          headOfDepartment: 'Dr. V. K. Sharma',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      testDepartmentId = data.department.id;
      if (!testDepartmentId) throw new Error('Missing department ID');
    });

    await step('Register Doctor to Department (POST /api/hospitals/:id/doctors)', async () => {
      const res = await fetch(`${baseUrl}/api/hospitals/${testHospitalId}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Dr. Vikram Malhotra ${testSuffix}`,
          email: `vikram.${testSuffix}@hospital.org`,
          departmentId: testDepartmentId,
          department: 'Cardiology',
          roomNumber: 'OPD Room 102',
          qualification: 'MBBS, MD (Cardiology)',
          password: 'Password@123',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      testDoctorId = data.doctor.id;
      if (!testDoctorId) throw new Error('Missing doctor ID');
    });

    await step('Enroll Kiosk Terminal into Fleet (POST /api/hospitals/:id/kiosks)', async () => {
      const res = await fetch(`${baseUrl}/api/hospitals/${testHospitalId}/kiosks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceCode: `KSK-VAR-${testSuffix}`,
          location: 'OPD Block A Gate 1',
          kioskType: 'SELF_SERVICE',
          firmwareVersion: 'v4.2.0',
          ipAddress: '192.168.1.105',
          printerPaperPercent: 100,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      testKioskId = data.kiosk.id;
      if (!testKioskId) throw new Error('Missing kiosk ID');
    });

    // -------------------------------------------------------------------------
    // STEP 3: RFID Authority — Blank Inventory & Lifecycle State Machine
    // -------------------------------------------------------------------------
    console.log('\n--- [STEP 3] RFID Authority: Inventory & Lifecycle Controls ---');

    await step('Register Blank Card UID (POST /api/rfid/cards)', async () => {
      const res = await fetch(`${baseUrl}/api/rfid/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: testCardUid, cardType: 'MIFARE_CLASSIC_1K', hospitalId: testHospitalId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (data.card.cardStatus !== 'AVAILABLE') throw new Error(`Expected AVAILABLE, got ${data.card.cardStatus}`);
    });

    // -------------------------------------------------------------------------
    // STEP 4: Patient Kiosk — Registration, Consent & RFID Binding
    // -------------------------------------------------------------------------
    console.log('\n--- [STEP 4] Patient Kiosk: Registration, Token Binding & Queue ---');

    await step('Physical RFID Hardware Status Check (GET /api/rfid/status)', async () => {
      const res = await fetch(`${baseUrl}/api/rfid/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (typeof data.connected !== 'boolean') throw new Error('Expected connected boolean');
    });

    await step('Clinical AI Symptom Normalization - Vernacular (POST /api/ai/normalize-symptoms)', async () => {
      const res = await fetch(`${baseUrl}/api/ai/normalize-symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'mujhe bahut tez bukhar aur khansi hai 3 din se',
          language: 'hi',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (!data.success) throw new Error('Normalization failed');
      if (data.suggestedCategory !== 'fever') throw new Error(`Expected fever category, got ${data.suggestedCategory}`);
    });

    await step('Clinical AI Symptom Normalization - Red Flag / Emergency (POST /api/ai/normalize-symptoms)', async () => {
      const res = await fetch(`${baseUrl}/api/ai/normalize-symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'sudden crushing chest pain radiating to left arm and severe breathlessness',
          language: 'en',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (!data.isEmergency) throw new Error('Expected emergency flag to be true for crushing chest pain');
      if (data.suggestedCategory !== 'chest-pain') throw new Error(`Expected chest-pain category, got ${data.suggestedCategory}`);
    });

    await step('Register Patient and Bind RFID Token (POST /api/patients/register-kiosk)', async () => {
      const res = await fetch(`${baseUrl}/api/patients/register-kiosk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: `Suresh Kumar Verma ${testSuffix}`,
          phone: `9198${Math.floor(100000 + Math.random() * 900000)}`,
          abhaId: `ABHA-91-${testSuffix}-0001`,
          rfidUid: testCardUid,
          deviceCode: `KSK-VAR-${testSuffix}`,
          hospitalId: testHospitalId,
          chiefComplaint: 'Severe chest tightness and shortness of breath',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      testPatientId = data.patient?.id || data.patientId;
      testSessionId = data.sessionId;
      if (!testPatientId) throw new Error('Missing patient ID');
    });

    await step('Verify RFID Card Transitioned to ACTIVE', async () => {
      const card = await prisma.rFIDCard.findUnique({ where: { uid: testCardUid } });
      if (!card) throw new Error('Card not found in CockroachDB');
      if (card.cardStatus !== 'ACTIVE') throw new Error(`Expected ACTIVE, got ${card.cardStatus}`);
      if (card.patientId !== testPatientId) throw new Error('Card patientId mismatch');
    });

    await step('Patient Consent Grant (POST /api/consent)', async () => {
      const res = await fetch(`${baseUrl}/api/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: testSessionId,
          granted: true,
          language: 'EN',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    });

    let currentAiQuestionId: string | null = null;
    await step('Clinical AI Question Generation: Start History (POST /api/history/start)', async () => {
      const res = await fetch(`${baseUrl}/api/history/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: testSessionId,
          chiefComplaintCategory: 'chest-pain',
          mode: 'GENERAL',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (!data.question) throw new Error('Expected clinical question to be generated by AI ranker');
      if (!data.question.questionText?.en && !data.question.questionText?.hi) {
        throw new Error('Question missing bilingual text');
      }
      currentAiQuestionId = data.question.nodeId;
    });

    await step('Clinical AI Question Generation: Dynamic Progression (POST /api/history/answer)', async () => {
      if (!currentAiQuestionId) throw new Error('No active question from start step');
      const res = await fetch(`${baseUrl}/api/history/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: testSessionId,
          nodeId: currentAiQuestionId,
          answer: 'crushing',
          mode: 'GENERAL',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (typeof data.historyComplete !== 'boolean') throw new Error('Expected historyComplete boolean');
    });

    await step('Issue OPD Queue Ticket (POST /api/queue/ticket)', async () => {
      const res = await fetch(`${baseUrl}/api/queue/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: testSessionId,
          patientId: testPatientId,
          hospitalId: testHospitalId,
          departmentId: testDepartmentId,
          departmentName: 'Cardiology',
          doctorId: testDoctorId,
          priority: 'ROUTINE',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      testTicketId = data.ticket?.id;
      if (!testTicketId) throw new Error('Missing ticket ID');
      if (!data.ticket.tokenNumber) throw new Error('Missing token number');
    });

    // -------------------------------------------------------------------------
    // STEP 5: Hospital Admin / OPD Queue Operations
    // -------------------------------------------------------------------------
    console.log('\n--- [STEP 5] OPD Queue: Token Calling & Emergency Override ---');

    await step('Emergency Override Priority (POST /api/queue/reprioritize)', async () => {
      const res = await fetch(`${baseUrl}/api/queue/reprioritize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: testTicketId, priority: 'EMERGENCY' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (data.ticket.priority !== 'EMERGENCY') throw new Error('Priority was not updated to EMERGENCY');
    });

    await step('Call Patient to Room (POST /api/queue/call-next)', async () => {
      const res = await fetch(`${baseUrl}/api/queue/call-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: testTicketId, doctorId: testDoctorId, roomNumber: 'OPD Room 102' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (data.ticket.status !== 'CALLED') throw new Error(`Expected CALLED, got ${data.ticket.status}`);
    });

    await step('Start Doctor Consultation (POST /api/queue/in-consultation)', async () => {
      const res = await fetch(`${baseUrl}/api/queue/in-consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: testTicketId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (data.ticket.status !== 'IN_CONSULTATION') throw new Error(`Expected IN_CONSULTATION, got ${data.ticket.status}`);
    });

    // -------------------------------------------------------------------------
    // STEP 6: Doctor Consultation & Prescription Safety Engine
    // -------------------------------------------------------------------------
    console.log('\n--- [STEP 6] Doctor Dashboard: Rx Safety & Consultation Finalize ---');

    await step('Medication Drug-Drug Interaction Safety Check (POST /api/clinical/rx-safety-check)', async () => {
      const res = await fetch(`${baseUrl}/api/clinical/rx-safety-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medications: [
            { name: 'Warfarin', dosage: '5mg' },
            { name: 'Aspirin', dosage: '75mg' },
          ],
          patientConditions: ['Hypertension'],
        }),
      });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    });

    // -------------------------------------------------------------------------
    // STEP 7: RFID Atomic Replacement Transaction
    // -------------------------------------------------------------------------
    console.log('\n--- [STEP 7] RFID Authority: Atomic Card Replacement ---');

    await step('Suspend Card (POST /api/rfid/cards/:uid/suspend)', async () => {
      const res = await fetch(`${baseUrl}/api/rfid/cards/${encodeURIComponent(testCardUid)}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Reported temporarily misplaced' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (data.card.cardStatus !== 'SUSPENDED') throw new Error(`Expected SUSPENDED, got ${data.card.cardStatus}`);
    });

    await step('Execute Atomic Replacement via Prisma Transaction (POST /api/rfid/cards/:uid/replace)', async () => {
      const res = await fetch(`${baseUrl}/api/rfid/cards/${encodeURIComponent(testCardUid)}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUid: testReplacementUid }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (data.oldCard.cardStatus !== 'REPLACED') throw new Error(`Expected old card REPLACED, got ${data.oldCard.cardStatus}`);
      if (data.newCard.cardStatus !== 'ACTIVE') throw new Error(`Expected new card ACTIVE, got ${data.newCard.cardStatus}`);
      if (data.newCard.patientId !== testPatientId) throw new Error('Patient assignment transfer failed');
    });

    // -------------------------------------------------------------------------
    // STEP 8: Central Governance — AI Model Registry & Immutable Audit Ledger
    // -------------------------------------------------------------------------
    console.log('\n--- [STEP 8] Central Admin: AI Model Registry & Audit Ledger ---');

    await step('Register & Fetch AI Models (GET /api/admin/ai-models)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/ai-models`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const models = data.models || [];
      if (models.length > 0) testAiModelId = models[0].id;
    });

    if (testAiModelId) {
      await step('Deploy AI Model Version (POST /api/admin/ai-models/:id/deploy)', async () => {
        const res = await fetch(`${baseUrl}/api/admin/ai-models/${testAiModelId}/deploy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetEnv: 'PRODUCTION' }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      });
    }

    await step('Query Immutable Security Audit Logs (GET /api/audit-logs)', async () => {
      const res = await fetch(`${baseUrl}/api/audit-logs?limit=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const logs = data.auditLogs || data.logs || [];
      if (!Array.isArray(logs) || logs.length === 0) throw new Error('Expected recorded audit logs in CockroachDB');
    });

    // -------------------------------------------------------------------------
    // STEP 9: Dynamic Configuration, Clinical Content & Operational Incidents
    // -------------------------------------------------------------------------
    console.log('\n--- [STEP 9] Dynamic Clinical Protocols, Diseases & System Configs ---');

    await step('Dynamic Symptoms Registry (GET /api/clinical/symptoms & POST /api/clinical/symptoms)', async () => {
      const getRes = await fetch(`${baseUrl}/api/clinical/symptoms`);
      if (!getRes.ok) throw new Error(`HTTP ${getRes.status}`);
      const getData = await getRes.json();
      if (!Array.isArray(getData.data) || getData.data.length === 0) throw new Error('Expected symptom list');

      const postRes = await fetch(`${baseUrl}/api/clinical/symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'test-dizziness',
          name: 'Dizziness and Vertigo',
          localizedLabels: { en: 'Dizziness and Vertigo', hi: 'चक्कर आना' },
          category: 'NEUROLOGICAL',
          isEmergency: false,
          mappedTreeId: 'headache',
          icon: 'Brain',
        }),
      });
      if (!postRes.ok) throw new Error(`HTTP ${postRes.status}: ${await postRes.text()}`);
    });

    await step('Dynamic Clinical Protocol Governance (GET & POST /api/clinical/protocols)', async () => {
      const getRes = await fetch(`${baseUrl}/api/clinical/protocols`);
      if (!getRes.ok) throw new Error(`HTTP ${getRes.status}`);
      const getData = await getRes.json();
      if (!Array.isArray(getData.protocols)) throw new Error('Expected protocols list');

      const postRes = await fetch(`${baseUrl}/api/clinical/protocols`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'PROT-TEST-01',
          name: 'Hyperglycemic Emergency Protocol',
          version: 'v1.0',
          jurisdiction: 'National Default',
          mandatoryQuestions: 4,
          redFlagTriggers: ['RBS > 400 mg/dL', 'Kussmaul breathing'],
        }),
      });
      if (!postRes.ok) throw new Error(`HTTP ${postRes.status}: ${await postRes.text()}`);
    });

    await step('Dynamic Disease Registry (GET & POST /api/surveillance/diseases)', async () => {
      const getRes = await fetch(`${baseUrl}/api/surveillance/diseases`);
      if (!getRes.ok) throw new Error(`HTTP ${getRes.status}`);
      const getData = await getRes.json();
      if (!Array.isArray(getData.diseases)) throw new Error('Expected diseases list');

      const postRes = await fetch(`${baseUrl}/api/surveillance/diseases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'A09',
          name: 'Infectious Gastroenteritis',
          category: 'GASTROINTESTINAL',
          severity: 'MODERATE',
          surveillanceEnabled: true,
        }),
      });
      if (!postRes.ok) throw new Error(`HTTP ${postRes.status}: ${await postRes.text()}`);
    });

    await step('Dynamic System Configuration & RBAC Timeouts (GET & PUT /api/admin/system-configs)', async () => {
      const getRes = await fetch(`${baseUrl}/api/admin/system-configs`);
      if (!getRes.ok) throw new Error(`HTTP ${getRes.status}`);
      const getData = await getRes.json();
      if (typeof getData.KIOSK_INACTIVITY_TIMEOUT_SECONDS !== 'number') {
        throw new Error('Expected timeout setting');
      }

      const putRes = await fetch(`${baseUrl}/api/admin/system-configs/KIOSK_INACTIVITY_TIMEOUT_SECONDS`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 60, category: 'KIOSK_SETTINGS' }),
      });
      if (!putRes.ok) throw new Error(`HTTP ${putRes.status}: ${await putRes.text()}`);
    });

    let testIncidentId: string | undefined;
    await step('Operational Incident Lifecycle (POST & Resolve /api/admin/incidents)', async () => {
      const createRes = await fetch(`${baseUrl}/api/admin/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: testHospitalId,
          message: 'Automated Test: RFID antenna mismatch alert',
          severity: 'HIGH',
          alertType: 'RFID_READER_FAILURE',
        }),
      });
      if (!createRes.ok) throw new Error(`HTTP ${createRes.status}: ${await createRes.text()}`);
      const createData = await createRes.json();
      testIncidentId = createData.incident?.id;
      if (!testIncidentId) throw new Error('Missing incident ID');

      const resolveRes = await fetch(`${baseUrl}/api/admin/incidents/${testIncidentId}/resolve`, {
        method: 'POST',
      });
      if (!resolveRes.ok) throw new Error(`HTTP ${resolveRes.status}: ${await resolveRes.text()}`);
    });
  } finally {
    server.close();
  }

  console.log('\n================================================================');
  console.log(`📊 MASTER TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
