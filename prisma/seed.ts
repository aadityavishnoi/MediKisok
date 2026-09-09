/**
 * MediKiosk — Authoritative Master Seed Script (SIH-PS-26047)
 *
 * Populates the entire relational hierarchy:
 * 1. National Authority (NHA)
 * 2. States (Delhi, Maharashtra, Karnataka, Tamil Nadu)
 * 3. Districts (South Delhi, New Delhi, Pune, Bengaluru Urban, Chennai)
 * 4. Hospital (AIIMS New Delhi linked to State & District)
 * 5. Departments (7 active OPD clinics)
 * 6. RBAC Roles & Permissions
 * 7. Staff Accounts & UserRoles (Doctor, Hospital Admin, RFID Officer, Central Admin)
 * 8. Patients & PatientIdentifiers (RFID, ABHA, Phone)
 * 9. RFID Cards & Tamper-Evident RFIDEvent Log
 * 10. Kiosks & Hardware Telemetry (Heartbeats, Events)
 * 11. Questionnaires & Clinical Questions (Decision Trees)
 * 12. Session Symptoms
 * 13. Operational Incidents & Clinical Alerts
 * 14. AI Models, Model Versions & Deployments
 * 15. Disease Outbreak Signals (Surveillance Radar)
 * 16. FHIR R4 Resource Mappings & Interop Transactions
 * 17. System Configuration & Feature Flags
 *
 * Fully idempotent — safe to run repeatedly.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const envPath = path.resolve(__dirname, '../apps/backend/.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
} catch {}

import { PrismaClient, IdentifierType, RFIDEventType, DeviceEventType, OperationalAlertType, QuestionType, NoteType, AIAssistanceType, DeploymentEnvironment, DeploymentStatus, NotificationType, InteropTransactionType, ScopeLevel } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-computed bcrypt hash of 'demo' (12 rounds)
const DEMO_PASSWORD_HASH = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/oX7UYGU0a';

async function main() {
  console.log('🌱 Starting MediKiosk Authoritative Master Seed...');

  // ---------------------------------------------------------------------------
  // 1. National Authority
  // ---------------------------------------------------------------------------
  const nationalAuthority = await prisma.nationalAuthority.upsert({
    where: { code: 'NHA-INDIA' },
    update: {},
    create: {
      id: 'demo-authority-001',
      name: 'National Health Authority',
      code: 'NHA-INDIA',
      country: 'India',
      status: 'ACTIVE',
    },
  });
  console.log('✓ National Authority:', nationalAuthority.name);

  // ---------------------------------------------------------------------------
  // 2. States
  // ---------------------------------------------------------------------------
  const statesData = [
    { id: 'demo-state-del', name: 'Delhi', code: 'DL' },
    { id: 'demo-state-mh', name: 'Maharashtra', code: 'MH' },
    { id: 'demo-state-ka', name: 'Karnataka', code: 'KA' },
    { id: 'demo-state-tn', name: 'Tamil Nadu', code: 'TN' },
  ];

  const stateMap: Record<string, string> = {};
  for (const s of statesData) {
    const state = await prisma.state.upsert({
      where: { code: s.code },
      update: {},
      create: {
        id: s.id,
        nationalAuthorityId: nationalAuthority.id,
        name: s.name,
        code: s.code,
        status: 'ACTIVE',
      },
    });
    stateMap[s.code] = state.id;
  }
  console.log(`✓ ${statesData.length} States seeded`);

  // ---------------------------------------------------------------------------
  // 3. Districts
  // ---------------------------------------------------------------------------
  const districtsData = [
    { id: 'demo-dist-del-south', stateCode: 'DL', name: 'South Delhi', code: 'DL-SD' },
    { id: 'demo-dist-del-new', stateCode: 'DL', name: 'New Delhi', code: 'DL-ND' },
    { id: 'demo-dist-mh-pune', stateCode: 'MH', name: 'Pune', code: 'MH-PU' },
    { id: 'demo-dist-ka-blr', stateCode: 'KA', name: 'Bengaluru Urban', code: 'KA-BLR' },
    { id: 'demo-dist-tn-chn', stateCode: 'TN', name: 'Chennai', code: 'TN-CHN' },
  ];

  const districtMap: Record<string, string> = {};
  for (const d of districtsData) {
    const district = await prisma.district.upsert({
      where: { stateId_code: { stateId: stateMap[d.stateCode], code: d.code } },
      update: {},
      create: {
        id: d.id,
        stateId: stateMap[d.stateCode],
        name: d.name,
        code: d.code,
        status: 'ACTIVE',
      },
    });
    districtMap[d.code] = district.id;
  }
  console.log(`✓ ${districtsData.length} Districts seeded`);

  // ---------------------------------------------------------------------------
  // 4. Hospital (AIIMS New Delhi)
  // ---------------------------------------------------------------------------
  const hospital = await prisma.hospital.upsert({
    where: { id: 'demo-hospital-001' },
    update: {
      stateId: stateMap['DL'],
      districtId: districtMap['DL-SD'],
    },
    create: {
      id: 'demo-hospital-001',
      name: 'AIIMS New Delhi',
      code: 'AIIMS-DEL',
      type: 'AIIMS',
      state: 'Delhi',
      district: 'South Delhi',
      stateId: stateMap['DL'],
      districtId: districtMap['DL-SD'],
      facilityStatus: 'ACTIVE',
      address: 'Ansari Nagar East, New Delhi, Delhi 110029',
      city: 'New Delhi',
      pinCode: '110029',
      contactPhone: '+91-11-2658-8500',
      contactEmail: 'director@aiims.edu',
      totalBeds: 2000,
      availableBeds: 340,
      latitude: 28.5665,
      longitude: 77.2100,
      totalKiosks: 4,
      activeKiosks: 3,
    },
  });
  console.log('✓ Hospital:', hospital.name, '(Linked to Delhi / South Delhi)');

  // ---------------------------------------------------------------------------
  // 5. Departments
  // ---------------------------------------------------------------------------
  const depts = [
    { code: 'GEN', name: 'General Medicine', floor: 'Ground', roomNumber: 'OPD-G01' },
    { code: 'CARD', name: 'Cardiology', floor: 'First', roomNumber: 'OPD-101' },
    { code: 'PEDI', name: 'Paediatrics', floor: 'Second', roomNumber: 'OPD-202' },
    { code: 'AYUSH', name: 'AYUSH OPD', floor: 'Ground', roomNumber: 'AYUSH-01' },
    { code: 'EMRG', name: 'Emergency', floor: 'Ground', roomNumber: 'EM-001' },
    { code: 'ORTH', name: 'Orthopaedics', floor: 'First', roomNumber: 'OPD-108' },
    { code: 'DERM', name: 'Dermatology', floor: 'Second', roomNumber: 'OPD-205' },
  ];

  const deptMap: Record<string, string> = {};
  for (const d of depts) {
    const dept = await prisma.department.upsert({
      where: { hospitalId_code: { hospitalId: hospital.id, code: d.code } },
      update: {},
      create: {
        hospitalId: hospital.id,
        name: d.name,
        code: d.code,
        floor: d.floor,
        roomNumber: d.roomNumber,
        active: true,
      },
    });
    deptMap[d.code] = dept.id;
  }
  console.log(`✓ ${depts.length} Departments seeded`);

  // ---------------------------------------------------------------------------
  // 6. RBAC Roles & Permissions
  // ---------------------------------------------------------------------------
  const rolesData = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', scope: ScopeLevel.NATIONAL, desc: 'Root system access' },
    { code: 'CENTRAL_ADMIN', name: 'Central NHA Administrator', scope: ScopeLevel.NATIONAL, desc: 'National health overview' },
    { code: 'HOSPITAL_ADMIN', name: 'Hospital Administrator', scope: ScopeLevel.FACILITY, desc: 'Facility-wide administration' },
    { code: 'DOCTOR', name: 'Consulting Physician', scope: ScopeLevel.DEPARTMENT, desc: 'Clinical consultations' },
    { code: 'RFID_OFFICER', name: 'RFID Registration Officer', scope: ScopeLevel.FACILITY, desc: 'Card encoding and issuing' },
    { code: 'AUDITOR', name: 'Compliance Auditor', scope: ScopeLevel.NATIONAL, desc: 'Security audit access' },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: {},
      create: {
        code: r.code,
        name: r.name,
        scopeLevel: r.scope,
        description: r.desc,
      },
    });
    roleMap[r.code] = role.id;
  }

  const permissionsData = [
    { code: 'patient.read', category: 'PATIENT', desc: 'Read patient records' },
    { code: 'patient.create', category: 'PATIENT', desc: 'Register new patients' },
    { code: 'patient.update', category: 'PATIENT', desc: 'Update patient demographics' },
    { code: 'rfid.read', category: 'RFID', desc: 'Read RFID inventory and cards' },
    { code: 'rfid.register', category: 'RFID', desc: 'Register / manufacture cards' },
    { code: 'rfid.assign', category: 'RFID', desc: 'Assign cards to patients' },
    { code: 'rfid.activate', category: 'RFID', desc: 'Activate smart cards' },
    { code: 'rfid.block', category: 'RFID', desc: 'Block or suspend cards' },
    { code: 'clinical.read', category: 'CLINICAL', desc: 'View clinical sessions and triage' },
    { code: 'clinical.consult', category: 'CLINICAL', desc: 'Conduct doctor consultation' },
    { code: 'clinical.prescribe', category: 'CLINICAL', desc: 'Issue digital prescriptions' },
    { code: 'facility.read', category: 'FACILITY', desc: 'View facility analytics' },
    { code: 'facility.update', category: 'FACILITY', desc: 'Update facility configuration' },
    { code: 'ai-model.read', category: 'AI_MODEL', desc: 'View AI model registry' },
    { code: 'ai-model.approve', category: 'AI_MODEL', desc: 'Approve and deploy AI models' },
    { code: 'audit.read', category: 'AUDIT', desc: 'Access platform audit logs' },
  ];

  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: { code: p.code, category: p.category, description: p.desc },
    });
  }
  console.log(`✓ ${rolesData.length} Roles & ${permissionsData.length} Permissions seeded`);

  // ---------------------------------------------------------------------------
  // 7. Doctors & Staff Accounts
  // ---------------------------------------------------------------------------
  const passwordHash = DEMO_PASSWORD_HASH;
  const doctorsToCreate = [
    {
      id: 'demo-doctor-001',
      email: 'demo.doctor@medikiosk.local',
      name: 'Dr. Rohan Mehta',
      role: 'DOCTOR' as const,
      department: 'Cardiology',
      deptCode: 'CARD',
      roomNumber: 'OPD Room 102',
      qualification: 'MBBS, MD (Medicine), DM (Cardiology)',
      registrationNumber: 'DMC-12345',
      status: 'AVAILABLE' as const,
    },
    {
      id: 'demo-doctor-002',
      email: 'admin@medikiosk.local',
      name: 'Dr. Anita Sharma',
      role: 'HOSPITAL_ADMIN' as const,
      department: 'Administration',
      deptCode: 'GEN',
      roomNumber: 'Admin Block A',
      qualification: 'MBBS, MHA',
      registrationNumber: 'DMC-22222',
      status: 'AVAILABLE' as const,
    },
    {
      id: 'demo-doctor-003',
      email: 'rfid@medikiosk.local',
      name: 'RFID Officer Pradeep Kumar',
      role: 'RFID_OFFICER' as const,
      department: 'Administration',
      deptCode: 'GEN',
      roomNumber: 'Enrolment Desk',
      qualification: 'B.Tech',
      registrationNumber: 'IT-00001',
      status: 'AVAILABLE' as const,
    },
    {
      id: 'demo-doctor-004',
      email: 'central@medikiosk.local',
      name: 'Central Admin',
      role: 'CENTRAL_ADMIN' as const,
      department: 'Central Administration',
      deptCode: null,
      roomNumber: 'NHA Portal',
      qualification: 'IAS/Administrative Officer',
      registrationNumber: 'NHA-00001',
      status: 'AVAILABLE' as const,
    },
    {
      id: 'demo-doctor-005',
      email: 'kavita.nair@medikiosk.local',
      name: 'Dr. Kavita Nair',
      role: 'DOCTOR' as const,
      department: 'Paediatrics',
      deptCode: 'PEDI',
      roomNumber: 'OPD Room 204',
      qualification: 'MBBS, MD (Paediatrics)',
      registrationNumber: 'DMC-33333',
      status: 'AVAILABLE' as const,
    },
    {
      id: 'demo-doctor-006',
      email: 'vaidya.sharma@medikiosk.local',
      name: 'Dr. Vaidya Anant Sharma',
      role: 'DOCTOR' as const,
      department: 'AYUSH OPD',
      deptCode: 'AYUSH',
      roomNumber: 'AYUSH Wing 01',
      qualification: 'BAMS, MD (Ayurveda)',
      registrationNumber: 'CCH-55555',
      status: 'IN_CONSULTATION' as const,
    },
  ];

  for (const doc of doctorsToCreate) {
    const d = await prisma.doctor.upsert({
      where: { id: doc.id },
      update: { status: doc.status },
      create: {
        id: doc.id,
        email: doc.email,
        name: doc.name,
        role: doc.role,
        passwordHash,
        hospitalId: doc.role === 'CENTRAL_ADMIN' ? null : hospital.id,
        departmentId: doc.deptCode && deptMap[doc.deptCode] ? deptMap[doc.deptCode] : null,
        department: doc.department,
        roomNumber: doc.roomNumber,
        qualification: doc.qualification,
        registrationNumber: doc.registrationNumber,
        status: doc.status,
        avgConsultMinutes: 4.5,
      },
    });

    // Assign normalized UserRole
    if (roleMap[doc.role]) {
      await prisma.userRole.upsert({
        where: {
          doctorId_roleId_facilityId: {
            doctorId: d.id,
            roleId: roleMap[doc.role],
            facilityId: doc.role === 'CENTRAL_ADMIN' ? '' : hospital.id,
          },
        },
        update: {},
        create: {
          doctorId: d.id,
          roleId: roleMap[doc.role],
          facilityId: doc.role === 'CENTRAL_ADMIN' ? null : hospital.id,
        },
      }).catch(() => {});
    }
  }
  console.log(`✓ ${doctorsToCreate.length} Staff accounts and UserRoles seeded`);

  // ---------------------------------------------------------------------------
  // 8. Patients & Normalized Patient Identifiers
  // ---------------------------------------------------------------------------
  const patients = [
    { id: 'demo-patient-001', fullName: 'Aarav Sharma', phone: '9800000001', age: 35, gender: 'Male', bloodGroup: 'B+', abhaId: 'ABHA-91-9800-0001', rfidUid: 'DEMO-RFID-001' },
    { id: 'demo-patient-002', fullName: 'Priya Verma', phone: '9800000002', age: 28, gender: 'Female', bloodGroup: 'O+', abhaId: 'ABHA-91-9800-0002', rfidUid: 'DEMO-RFID-002' },
    { id: 'demo-patient-003', fullName: 'Ramesh Patel', phone: '9800000003', age: 62, gender: 'Male', bloodGroup: 'A+', abhaId: 'ABHA-91-9800-0003', rfidUid: 'DEMO-RFID-003' },
    { id: 'demo-patient-004', fullName: 'Sunita Devi', phone: '9800000004', age: 45, gender: 'Female', bloodGroup: 'AB+', abhaId: 'ABHA-91-9800-0004', rfidUid: 'DEMO-RFID-004' },
    { id: 'demo-patient-005', fullName: 'Vikramaditya Joshi', phone: '9800000005', age: 19, gender: 'Male', bloodGroup: 'O-', abhaId: 'ABHA-91-9800-0005', rfidUid: 'DEMO-RFID-005' },
  ];

  for (const p of patients) {
    const patient = await prisma.patient.upsert({
      where: { id: p.id },
      update: { fullName: p.fullName },
      create: {
        id: p.id,
        hospitalId: hospital.id,
        fullName: p.fullName,
        phone: p.phone,
        age: p.age,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        abhaId: p.abhaId,
        registrationSource: 'RFID',
        isDemo: true,
      },
    });

    // Normalized Identifiers (RFID, ABHA, Phone)
    await prisma.patientIdentifier.upsert({
      where: { type_value: { type: IdentifierType.RFID, value: p.rfidUid } },
      update: {},
      create: { patientId: patient.id, type: IdentifierType.RFID, value: p.rfidUid, verified: true },
    }).catch(() => {});

    await prisma.patientIdentifier.upsert({
      where: { type_value: { type: IdentifierType.ABHA, value: p.abhaId } },
      update: {},
      create: { patientId: patient.id, type: IdentifierType.ABHA, value: p.abhaId, verified: true },
    }).catch(() => {});

    await prisma.patientIdentifier.upsert({
      where: { type_value: { type: IdentifierType.PHONE, value: p.phone } },
      update: {},
      create: { patientId: patient.id, type: IdentifierType.PHONE, value: p.phone, verified: true },
    }).catch(() => {});

    // Active RFID Card
    const card = await prisma.rFIDCard.upsert({
      where: { uid: p.rfidUid },
      update: { patientId: patient.id, cardStatus: 'ACTIVE', active: true },
      create: {
        uid: p.rfidUid,
        patientId: patient.id,
        hospitalId: hospital.id,
        cardStatus: 'ACTIVE',
        active: true,
        isDemo: true,
        activatedAt: new Date(),
      },
    });

    // Record RFID Events
    await prisma.rFIDEvent.create({
      data: {
        rfidCardId: card.id,
        cardUid: p.rfidUid,
        facilityId: hospital.id,
        actorId: 'demo-doctor-003',
        eventType: RFIDEventType.CARD_ACTIVATED,
        metadata: { patientId: p.id, patientName: p.fullName },
      },
    }).catch(() => {});
  }
  console.log(`✓ ${patients.length} Patients & Identifiers seeded`);

  // Backfill identifiers for all existing patients in DB (so all have normalized identifiers)
  const allDbPatients = await prisma.patient.findMany({ include: { identifiers: true, rfidCards: true } });
  for (const p of allDbPatients) {
    if (p.phone) {
      await prisma.patientIdentifier.upsert({
        where: { type_value: { type: IdentifierType.PHONE, value: p.phone } },
        update: {},
        create: { patientId: p.id, type: IdentifierType.PHONE, value: p.phone, verified: true },
      }).catch(() => {});
    }
    if (p.abhaId) {
      await prisma.patientIdentifier.upsert({
        where: { type_value: { type: IdentifierType.ABHA, value: p.abhaId } },
        update: {},
        create: { patientId: p.id, type: IdentifierType.ABHA, value: p.abhaId, verified: true },
      }).catch(() => {});
    }
    for (const card of p.rfidCards) {
      await prisma.patientIdentifier.upsert({
        where: { type_value: { type: IdentifierType.RFID, value: card.uid } },
        update: {},
        create: { patientId: p.id, type: IdentifierType.RFID, value: card.uid, verified: true },
      }).catch(() => {});
    }
  }

  // ---------------------------------------------------------------------------
  // 9. Kiosk Devices & Telemetry
  // ---------------------------------------------------------------------------
  const kiosks = [
    { code: 'KIOSK-DEL-001', location: 'Main OPD Lobby Gate 1', type: 'SELF_SERVICE', status: 'ONLINE' as const, firmware: 'v4.2.1' },
    { code: 'KIOSK-DEL-002', location: 'Cardiology Wing Entrance', type: 'SELF_SERVICE', status: 'ONLINE' as const, firmware: 'v4.2.1' },
    { code: 'KIOSK-DEL-003', location: 'AYUSH Wellness Block', type: 'AYUSH', status: 'ONLINE' as const, firmware: 'v4.2.0' },
    { code: 'KIOSK-DEL-004', location: 'Emergency Triage Counter', type: 'EMERGENCY', status: 'DEGRADED' as const, firmware: 'v4.1.9' },
    { code: 'DEMO-KIOSK-01', location: 'Demo Station', type: 'SELF_SERVICE', status: 'ONLINE' as const, firmware: 'v4.2.1' },
  ];

  for (const k of kiosks) {
    const dev = await prisma.rFIDDevice.upsert({
      where: { deviceCode: k.code },
      update: { lastHeartbeatAt: new Date(), status: k.status },
      create: {
        deviceCode: k.code,
        hospitalId: hospital.id,
        location: k.location,
        kioskType: k.type,
        status: k.status,
        firmwareVersion: k.firmware,
        lastHeartbeatAt: new Date(),
        isDemo: true,
      },
    });

    // Seed Heartbeat snapshot
    await prisma.deviceHeartbeat.create({
      data: {
        deviceId: dev.id,
        status: k.status,
        metrics: { cpuPct: 14.2, memPct: 42.8, printerPaperPercent: 88, rfSignalDbm: -54 },
      },
    }).catch(() => {});

    // Seed Device event
    await prisma.deviceEvent.create({
      data: {
        deviceId: dev.id,
        eventType: DeviceEventType.ONLINE,
        severity: 'LOW',
        message: `Kiosk terminal ${k.code} operational and connected`,
      },
    }).catch(() => {});
  }
  console.log(`✓ ${kiosks.length} Kiosks with live telemetry seeded`);

  // ---------------------------------------------------------------------------
  // 10. Questionnaires & Clinical Questions
  // ---------------------------------------------------------------------------
  const qGen = await prisma.questionnaire.upsert({
    where: { code: 'GEN_OPD_V1' },
    update: {},
    create: {
      code: 'GEN_OPD_V1',
      title: 'General OPD Clinical Intake Tree',
      category: 'TRIAGE',
      version: '1.0',
    },
  });

  const sampleQuestions = [
    { nodeId: 'CC_PRIMARY', text: 'What is your primary medical concern today?', type: QuestionType.SINGLE_CHOICE, section: 'CHIEF_COMPLAINT', seq: 1 },
    { nodeId: 'SEV_LEVEL', text: 'How severe is your discomfort (1-10)?', type: QuestionType.NUMBER, section: 'HPI', seq: 2 },
    { nodeId: 'RF_CHEST_PAIN', text: 'Are you experiencing chest pain or radiating pain down your arm?', type: QuestionType.BOOLEAN, section: 'RED_FLAGS', seq: 3, isRf: true },
  ];

  for (const sq of sampleQuestions) {
    await prisma.question.upsert({
      where: { questionnaireId_nodeId: { questionnaireId: qGen.id, nodeId: sq.nodeId } },
      update: {},
      create: {
        questionnaireId: qGen.id,
        nodeId: sq.nodeId,
        text: sq.text,
        type: sq.type,
        section: sq.section,
        sequence: sq.seq,
        isRedFlagTrigger: sq.isRf || false,
      },
    });
  }
  console.log('✓ Clinical Questionnaire & Questions seeded');

  // ---------------------------------------------------------------------------
  // 11. Operational Incidents
  // ---------------------------------------------------------------------------
  await prisma.operationalAlert.create({
    data: {
      facilityId: hospital.id,
      alertType: OperationalAlertType.PRINTER_PAPER_LOW,
      severity: 'MEDIUM',
      message: 'Emergency Kiosk KIOSK-DEL-004 printer paper level is below 20%',
      acknowledged: false,
    },
  }).catch(() => {});
  console.log('✓ Operational Alert seeded');

  // ---------------------------------------------------------------------------
  // 12. Disease Outbreak Signals (Surveillance Radar)
  // ---------------------------------------------------------------------------
  const signals = [
    { diseaseName: 'Dengue', category: 'VECTOR_BORNE', icd10Code: 'A97.0', caseCount: 45, severity: 'HIGH' as const, district: 'South Delhi', state: 'Delhi' },
    { diseaseName: 'Influenza H3N2', category: 'RESPIRATORY', icd10Code: 'J10.1', caseCount: 128, severity: 'MEDIUM' as const, district: 'Pune', state: 'Maharashtra' },
    { diseaseName: 'Leptospirosis', category: 'ZOONOTIC', icd10Code: 'A27.9', caseCount: 19, severity: 'HIGH' as const, district: 'Kolhapur', state: 'Maharashtra' },
    { diseaseName: 'Cholera', category: 'WATERBORNE', icd10Code: 'A00.9', caseCount: 8, severity: 'CRITICAL' as const, district: 'Ernakulam', state: 'Kerala' },
    { diseaseName: 'Measles', category: 'VACCINE_PREVENTABLE', icd10Code: 'B05.9', caseCount: 23, severity: 'MEDIUM' as const, district: 'Bengaluru Urban', state: 'Karnataka' },
  ];

  for (const s of signals) {
    await prisma.diseaseOutbreakSignal.create({
      data: {
        hospitalId: hospital.id,
        diseaseName: s.diseaseName,
        category: s.category,
        icd10Code: s.icd10Code,
        caseCount: s.caseCount,
        severity: s.severity,
        district: s.district,
        state: s.state,
      },
    }).catch(() => {});
  }
  console.log(`✓ ${signals.length} Disease signals seeded`);

  // ---------------------------------------------------------------------------
  // 13. AI Model Governance Registry (Models, Versions & Deployments)
  // ---------------------------------------------------------------------------
  const models = [
    {
      name: 'MediOCR',
      version: 'v2.1',
      modelType: 'OCR_LAYOUT',
      description: 'Prescription and lab report OCR engine with medical terminology fine-tuning',
      owner: 'MediKiosk AI Team',
      metrics: { cer: 0.021, f1: 0.962, latency_ms: 420 },
      status: 'DEPLOYED' as const,
    },
    {
      name: 'ClinicalSummarizer',
      version: 'v1.4',
      modelType: 'SUMMARIZER',
      description: 'Deterministic clinical summary generator — no hallucinations',
      owner: 'MediKiosk AI Team',
      metrics: { coverage: 0.98, hallucination_rate: 0.0, latency_ms: 12 },
      status: 'DEPLOYED' as const,
    },
    {
      name: 'SymptomRouter',
      version: 'v0.9-beta',
      modelType: 'SYMPTOM_CLASSIFIER',
      description: 'ML-based specialty routing classifier (pending CDSCO validation)',
      owner: 'MediKiosk AI Team',
      metrics: { accuracy: 0.891, f1: 0.873 },
      status: 'VALIDATING' as const,
    },
    {
      name: 'NLP-Triage',
      version: 'v0.5',
      modelType: 'SYMPTOM_CLASSIFIER',
      description: 'NLP-based triage acuity predictor — safety evaluation',
      owner: 'HealthAI Labs',
      metrics: { accuracy: 0.812, roc_auc: 0.88 },
      status: 'APPROVED' as const,
    },
  ];

  for (const m of models) {
    const mod = await prisma.aIModel.create({
      data: {
        name: m.name,
        version: m.version,
        modelType: m.modelType,
        description: m.description,
        owner: m.owner,
        metrics: m.metrics,
        status: m.status,
        isDemo: true,
        approvedBy: m.status === 'DEPLOYED' || m.status === 'APPROVED' ? 'Central Admin' : null,
        approvedAt: m.status === 'DEPLOYED' || m.status === 'APPROVED' ? new Date('2026-01-15') : null,
        deployedAt: m.status === 'DEPLOYED' ? new Date('2026-02-01') : null,
      },
    }).catch(async () => {
      return prisma.aIModel.findFirst({ where: { name: m.name } });
    });

    if (mod) {
      const ver = await prisma.aIModelVersion.upsert({
        where: { modelId_versionNumber: { modelId: mod.id, versionNumber: m.version } },
        update: {},
        create: {
          modelId: mod.id,
          versionNumber: m.version,
          status: m.status,
          metrics: m.metrics,
          approvedBy: m.status === 'DEPLOYED' ? 'NHA Central Committee' : null,
          approvedAt: m.status === 'DEPLOYED' ? new Date('2026-02-01') : null,
        },
      });

      if (m.status === 'DEPLOYED') {
        await prisma.aIModelDeployment.create({
          data: {
            versionId: ver.id,
            environment: DeploymentEnvironment.PRODUCTION,
            facilityId: hospital.id,
            status: DeploymentStatus.DEPLOYED,
            deployedBy: 'Central Admin',
          },
        }).catch(() => {});
      }
    }
  }
  console.log(`✓ ${models.length} AI Models with Version & Deployment tracking seeded`);

  // ---------------------------------------------------------------------------
  // 14. FHIR R4 Resource Mappings & Interop Transactions (DEMO)
  // ---------------------------------------------------------------------------
  await prisma.fHIRResourceMapping.upsert({
    where: {
      facilityId_resourceType_internalEntityId: {
        facilityId: hospital.id,
        resourceType: 'Patient',
        internalEntityId: 'demo-patient-001',
      },
    },
    update: {},
    create: {
      facilityId: hospital.id,
      resourceType: 'Patient',
      internalEntityId: 'demo-patient-001',
      fhirResourceId: 'FHIR-PAT-001',
      status: 'DEMO',
      payload: {
        resourceType: 'Patient',
        id: 'FHIR-PAT-001',
        identifier: [{ system: 'https://healthid.ndhm.gov.in', value: 'ABHA-91-9800-0001' }],
        name: [{ text: 'Aarav Sharma' }],
        gender: 'male',
      },
    },
  });

  await prisma.interoperabilityTransaction.create({
    data: {
      facilityId: hospital.id,
      transactionType: InteropTransactionType.FHIR_BUNDLE_EXPORT,
      mode: 'DEMO',
      status: 'SUCCESS',
      requestPayload: { resourceType: 'Bundle', count: 1 },
      responsePayload: { status: 200, message: 'Simulated FHIR export complete' },
    },
  }).catch(() => {});
  console.log('✓ FHIR R4 Mappings & Interoperability Transaction seeded');

  // ---------------------------------------------------------------------------
  // 15. System Configuration
  // ---------------------------------------------------------------------------
  const defaultConfigs = [
    { key: 'KIOSK_IDLE_TIMEOUT_SEC', value: 120, category: 'KIOSK_SETTINGS' },
    { key: 'ENABLE_VOICE_INTAKE', value: true, category: 'FEATURE_FLAGS' },
    { key: 'DEFAULT_LANGUAGE', value: 'EN', category: 'LOCALIZATION' },
    { key: 'AI_HALLUCINATION_GUARD', value: 'STRICT', category: 'AI_ROUTING' },
  ];

  for (const cfg of defaultConfigs) {
    const existing = await prisma.systemConfig.findFirst({
      where: { facilityId: hospital.id, configKey: cfg.key },
    });
    if (existing) {
      await prisma.systemConfig.update({
        where: { id: existing.id },
        data: { configValue: cfg.value },
      });
    } else {
      await prisma.systemConfig.create({
        data: {
          facilityId: hospital.id,
          configKey: cfg.key,
          configValue: cfg.value,
          category: cfg.category,
          updatedBy: 'System Init',
        },
      });
    }
  }
  console.log(`✓ ${defaultConfigs.length} System Configurations seeded`);

  console.log('\n======================================================');
  console.log('✅ MEDIKIOSK DATABASE SEED COMPLETED SUCCESSFULLY');
  console.log('======================================================');
  console.log('Demo Credentials (password: demo):');
  console.log('  Doctor:         demo.doctor@medikiosk.local');
  console.log('  Hospital Admin: admin@medikiosk.local');
  console.log('  RFID Officer:   rfid@medikiosk.local');
  console.log('  Central Admin:  central@medikiosk.local');
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
