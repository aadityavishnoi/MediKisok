import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting MediKiosk seed script with 8 synthetic patient cases...');

  // 1. Demo Doctor Account
  const passwordHash = await bcrypt.hash('MediKiosk@123', 10);
  const doctor = await prisma.doctor.upsert({
    where: { email: 'demo.doctor@medikiosk.local' },
    update: { passwordHash },
    create: {
      id: 'demo-doctor-001',
      name: 'Dr. Rajesh Sharma',
      email: 'demo.doctor@medikiosk.local',
      passwordHash,
      role: 'DOCTOR',
      department: 'General Medicine',
    },
  });

  // 2. Hardware RFID Devices
  const device1 = await prisma.rFIDDevice.upsert({
    where: { deviceCode: 'KIOSK-DEV-001' },
    update: { lastHeartbeatAt: new Date() },
    create: {
      id: 'device-001',
      deviceCode: 'KIOSK-DEV-001',
      location: 'OPD Building A - Kiosk 1',
      firmwareVersion: 'v2.4.1',
      ipAddress: '192.168.1.101',
      isDemo: true,
      lastHeartbeatAt: new Date(),
    },
  });

  // 3. 8 Synthetic Patients & RFID Cards
  const patientsData = [
    {
      id: 'demo-patient-001',
      fullName: 'Aarav Sharma',
      gender: 'Male',
      dob: new Date('1985-03-14'),
      phone: '9999900001',
      rfidUid: 'DEMO-RFID-001',
      chiefComplaint: 'Chest pain',
      category: 'chest-pain',
    },
    {
      id: 'demo-patient-002',
      fullName: 'Priya Verma',
      gender: 'Female',
      dob: new Date('1992-07-22'),
      phone: '9999900002',
      rfidUid: 'DEMO-RFID-002',
      chiefComplaint: 'Severe breathlessness',
      category: 'breathing-difficulty',
    },
    {
      id: 'demo-patient-003',
      fullName: 'Ramesh Patel',
      gender: 'Male',
      dob: new Date('1968-11-05'),
      phone: '9999900003',
      rfidUid: 'DEMO-RFID-003',
      chiefComplaint: 'Chronic Type 2 Diabetes follow-up',
      category: 'general-fallback',
    },
    {
      id: 'demo-patient-004',
      fullName: 'Sunita Devi',
      gender: 'Female',
      dob: new Date('1975-01-30'),
      phone: '9999900004',
      rfidUid: 'DEMO-RFID-004',
      chiefComplaint: 'पेट में तेज दर्द (Severe Abdominal Pain)',
      category: 'abdominal-pain',
    },
    {
      id: 'demo-patient-005',
      fullName: 'Vikramaditya Joshi',
      gender: 'Male',
      dob: new Date('1990-09-18'),
      phone: '9999900005',
      rfidUid: 'DEMO-RFID-005',
      chiefComplaint: 'AYUSH Prakriti & Vata Imbalance Assessment',
      category: 'general-fallback',
    },
    {
      id: 'demo-patient-006',
      fullName: 'Ananya Roy',
      gender: 'Female',
      dob: new Date('1998-04-12'),
      phone: '9999900006',
      rfidUid: 'DEMO-RFID-006',
      chiefComplaint: 'Recurrent High Fever with Chills',
      category: 'fever',
    },
    {
      id: 'demo-patient-007',
      fullName: 'Mohammed Iqbal',
      gender: 'Male',
      dob: new Date('1960-06-25'),
      phone: '9999900007',
      rfidUid: 'DEMO-RFID-007',
      chiefComplaint: 'Severe Headache & Blurred Vision (Allergy Conflict)',
      category: 'headache',
    },
    {
      id: 'demo-patient-008',
      fullName: 'Kavita Sundaram',
      gender: 'Female',
      dob: new Date('1982-12-08'),
      phone: '9999900008',
      rfidUid: 'DEMO-RFID-008',
      chiefComplaint: 'Fatigue & Abnormal Renal Function',
      category: 'general-fallback',
    },
  ];

  for (const p of patientsData) {
    const patient = await prisma.patient.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        fullName: p.fullName,
        dateOfBirth: p.dob,
        gender: p.gender,
        phone: p.phone,
        registrationSource: 'RFID',
        isDemo: true,
      },
    });

    await prisma.rFIDCard.upsert({
      where: { uid: p.rfidUid },
      update: { patientId: patient.id },
      create: {
        uid: p.rfidUid,
        patientId: patient.id,
        isDemo: true,
        active: true,
      },
    });

    // Create session & intake history for each demo patient
    const session = await prisma.patientSession.upsert({
      where: { id: `session-${p.id}` },
      update: {},
      create: {
        id: `session-${p.id}`,
        patientId: patient.id,
        deviceId: device1.id,
        status: 'SUMMARY_READY',
        mode: p.id === 'demo-patient-005' ? 'AYUSH' : 'GENERAL',
        language: p.id === 'demo-patient-004' ? 'HI' : 'EN',
        isDemo: true,
        identifiedVia: 'RFID',
      },
    });

    await prisma.clinicalHistory.upsert({
      where: { sessionId: session.id },
      update: {},
      create: {
        sessionId: session.id,
        patientId: patient.id,
        mode: p.id === 'demo-patient-005' ? 'AYUSH' : 'GENERAL',
        chiefComplaint: p.chiefComplaint,
        chiefComplaintCategory: p.category,
        completedAt: new Date(),
      },
    });

    // Create AI Summary for Patient 360
    await prisma.aISummary.upsert({
      where: { sessionId: session.id },
      update: {},
      create: {
        sessionId: session.id,
        patientId: patient.id,
        content: `[Patient ${p.fullName}] Presented with ${p.chiefComplaint}. History taken via MediKiosk pre-consultation intake. Vital signs stable, non-invasive intake complete. Evidence verified against recorded answers.`,
        generatorType: 'LOCAL_LLM',
        status: 'DRAFT',
      },
    });

    // Create Consultation in queue
    await prisma.consultation.upsert({
      where: { sessionId: session.id },
      update: {},
      create: {
        sessionId: session.id,
        patientId: patient.id,
        doctorId: doctor.id,
        status: 'PENDING',
      },
    });
  }

  console.log('Seed completed successfully: 8 synthetic patient cases created!');
  console.log('Doctor login credentials: demo.doctor@medikiosk.local / MediKiosk@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
