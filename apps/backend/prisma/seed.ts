import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Enterprise MediKiosk Multi-Portal Database Seed for SIH...');

  // =========================================================================
  // 1. National Hospital Anchors (Central Admin & Hospital Admin)
  // =========================================================================
  console.log('1. Seeding 5 Anchor Hospitals...');
  const defaultPasswordHash = await bcrypt.hash('MediKiosk@123', 10);

  const aiimsDelhi = await prisma.hospital.upsert({
    where: { code: 'AIIMS-DEL-01' },
    update: {},
    create: {
      id: 'hosp-aiims-delhi',
      code: 'AIIMS-DEL-01',
      name: 'All India Institute of Medical Sciences (AIIMS), New Delhi',
      type: 'AIIMS',
      state: 'Delhi',
      district: 'New Delhi',
      city: 'New Delhi',
      pinCode: '110029',
      address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi',
      latitude: 28.5672,
      longitude: 77.2100,
      contactPhone: '+91-11-26588500',
      contactEmail: 'director@aiims.edu',
      totalBeds: 2478,
      availableBeds: 312,
      totalKiosks: 16,
      activeKiosks: 15,
      abdmFacilityId: 'IN0710000001',
    },
  });

  const safdarjung = await prisma.hospital.upsert({
    where: { code: 'SJH-DEL-02' },
    update: {},
    create: {
      id: 'hosp-safdarjung',
      code: 'SJH-DEL-02',
      name: 'Vardhman Mahavir Medical College & Safdarjung Hospital',
      type: 'TERTIARY_HOSPITAL',
      state: 'Delhi',
      district: 'South Delhi',
      city: 'New Delhi',
      pinCode: '110029',
      address: 'Ring Road, Opposite AIIMS, New Delhi',
      latitude: 28.5701,
      longitude: 77.2078,
      contactPhone: '+91-11-26165060',
      contactEmail: 'ms@safdarjunghospital.gov.in',
      totalBeds: 2800,
      availableBeds: 180,
      totalKiosks: 10,
      activeKiosks: 9,
      abdmFacilityId: 'IN0710000002',
    },
  });

  const civilGurugram = await prisma.hospital.upsert({
    where: { code: 'DH-GUR-03' },
    update: {},
    create: {
      id: 'hosp-civil-gurugram',
      code: 'DH-GUR-03',
      name: 'Civil Hospital, Sector 10, Gurugram',
      type: 'DISTRICT_HOSPITAL',
      state: 'Haryana',
      district: 'Gurugram',
      city: 'Gurugram',
      pinCode: '122001',
      address: 'Sector 10A, Near Hero Honda Chowk, Gurugram',
      latitude: 28.4414,
      longitude: 76.9934,
      contactPhone: '+91-124-2222100',
      contactEmail: 'civilhosp.gurugram@hry.nic.in',
      totalBeds: 400,
      availableBeds: 68,
      totalKiosks: 6,
      activeKiosks: 6,
      abdmFacilityId: 'IN0610000014',
    },
  });

  const distVaranasi = await prisma.hospital.upsert({
    where: { code: 'DH-VAR-04' },
    update: {},
    create: {
      id: 'hosp-dist-varanasi',
      code: 'DH-VAR-04',
      name: 'Pandit Madan Mohan Malaviya District Hospital, Varanasi',
      type: 'DISTRICT_HOSPITAL',
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      city: 'Varanasi',
      pinCode: '221001',
      address: 'Kabir Chaura, Varanasi, Uttar Pradesh',
      latitude: 25.3176,
      longitude: 82.9739,
      contactPhone: '+91-542-2412345',
      contactEmail: 'dh.varanasi@up.gov.in',
      totalBeds: 350,
      availableBeds: 45,
      totalKiosks: 4,
      activeKiosks: 4,
      abdmFacilityId: 'IN0910000088',
    },
  });

  const chcAlwar = await prisma.hospital.upsert({
    where: { code: 'CHC-ALW-05' },
    update: {},
    create: {
      id: 'hosp-chc-alwar',
      code: 'CHC-ALW-05',
      name: 'Community Health Centre (CHC), Tijara, Alwar',
      type: 'COMMUNITY_HEALTH_CENTRE',
      state: 'Rajasthan',
      district: 'Alwar',
      city: 'Tijara',
      pinCode: '301411',
      address: 'Main Highway, Tijara Tehsil, Alwar',
      latitude: 27.9304,
      longitude: 76.8532,
      contactPhone: '+91-1469-222110',
      contactEmail: 'chc.tijara@rajasthan.gov.in',
      totalBeds: 50,
      availableBeds: 18,
      totalKiosks: 2,
      activeKiosks: 2,
      abdmFacilityId: 'IN0810000201',
    },
  });

  // =========================================================================
  // 2. Hospital Departments (Hospital Admin & OPD Routing)
  // =========================================================================
  console.log('2. Seeding Hospital Departments for AIIMS & District Facilities...');
  const deptData = [
    { hospitalId: aiimsDelhi.id, code: 'CARD', name: 'Cardiology', floor: '1st Floor', roomNumber: 'OPD Room 102', head: 'Dr. Rohan Mehta' },
    { hospitalId: aiimsDelhi.id, code: 'GEN', name: 'General Medicine', floor: 'Ground Floor', roomNumber: 'OPD Room 105', head: 'Dr. Rajesh Sharma' },
    { hospitalId: aiimsDelhi.id, code: 'PED', name: 'Pediatrics', floor: '2nd Floor', roomNumber: 'OPD Room 204', head: 'Dr. Kavita Nair' },
    { hospitalId: aiimsDelhi.id, code: 'ORTHO', name: 'Orthopedics', floor: '1st Floor', roomNumber: 'OPD Room 108', head: 'Dr. Sameer Joshi' },
    { hospitalId: aiimsDelhi.id, code: 'AYU', name: 'AYUSH OPD & Panchakarma', floor: 'AYUSH Wing', roomNumber: 'AYUSH Wing 01', head: 'Dr. Vaidya Anant Sharma' },
    { hospitalId: aiimsDelhi.id, code: 'EMG', name: 'Emergency Triage & Trauma', floor: 'Ground Floor', roomNumber: 'Red Zone Counter 1', head: 'Dr. Priya Mukherjee' },
    { hospitalId: civilGurugram.id, code: 'GEN', name: 'General Medicine', floor: 'Ground Floor', roomNumber: 'Room 04', head: 'Dr. Arun Sundaram' },
    { hospitalId: civilGurugram.id, code: 'EMG', name: 'Emergency Triage', floor: 'Ground Floor', roomNumber: 'Room 01', head: 'Dr. Manoj Verma' },
  ];

  const depts: Record<string, any> = {};
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: {
        hospitalId_code: { hospitalId: d.hospitalId, code: d.code },
      },
      update: {},
      create: {
        hospitalId: d.hospitalId,
        code: d.code,
        name: d.name,
        floor: d.floor,
        roomNumber: d.roomNumber,
        headOfDepartment: d.head,
      },
    });
    depts[`${d.hospitalId}_${d.code}`] = dept;
  }

  // =========================================================================
  // 3. Specialized Doctors (Doctor Dashboard & Hospital Admin)
  // =========================================================================
  console.log('3. Seeding Specialized Doctors with Credentials...');
  const doctorsList = [
    {
      id: 'doc-rohan-mehta',
      name: 'Dr. Rohan Mehta',
      email: 'rohan.mehta@aiims.edu',
      department: 'Cardiology',
      deptCode: 'CARD',
      hospitalId: aiimsDelhi.id,
      roomNumber: 'OPD Room 102',
      status: 'AVAILABLE',
      qualification: 'MBBS, MD (Med), DM (Cardiology), FACC',
      registrationNumber: 'MCI-184920-DEL',
      avgConsultMinutes: 4.2,
    },
    {
      id: 'doc-rajesh-sharma',
      name: 'Dr. Rajesh Sharma',
      email: 'demo.doctor@medikiosk.local',
      department: 'General Medicine',
      deptCode: 'GEN',
      hospitalId: aiimsDelhi.id,
      roomNumber: 'OPD Room 105',
      status: 'AVAILABLE',
      qualification: 'MBBS, MD (General Medicine)',
      registrationNumber: 'MCI-143021-DEL',
      avgConsultMinutes: 4.5,
    },
    {
      id: 'doc-kavita-nair',
      name: 'Dr. Kavita Nair',
      email: 'kavita.nair@aiims.edu',
      department: 'Pediatrics',
      deptCode: 'PED',
      hospitalId: aiimsDelhi.id,
      roomNumber: 'OPD Room 204',
      status: 'IN_CONSULTATION',
      qualification: 'MBBS, MD (Pediatrics)',
      registrationNumber: 'MCI-192834-DEL',
      avgConsultMinutes: 3.8,
    },
    {
      id: 'doc-anant-sharma',
      name: 'Dr. Vaidya Anant Sharma',
      email: 'anant.sharma@aiims.edu',
      department: 'AYUSH OPD',
      deptCode: 'AYU',
      hospitalId: aiimsDelhi.id,
      roomNumber: 'AYUSH Wing 01',
      status: 'IN_CONSULTATION',
      qualification: 'BAMS, MD (Ayurveda - Kayachikitsa)',
      registrationNumber: 'CCIM-DEL-0849',
      avgConsultMinutes: 6.5,
    },
    {
      id: 'doc-sameer-joshi',
      name: 'Dr. Sameer Joshi',
      email: 'sameer.joshi@aiims.edu',
      department: 'Orthopedics',
      deptCode: 'ORTHO',
      hospitalId: aiimsDelhi.id,
      roomNumber: 'OPD Room 108',
      status: 'OFF_DUTY',
      qualification: 'MBBS, MS (Orthopedics)',
      registrationNumber: 'MCI-167890-DEL',
      avgConsultMinutes: 5.0,
    },
    {
      id: 'doc-priya-mukherjee',
      name: 'Dr. Priya Mukherjee',
      email: 'priya.mukherjee@aiims.edu',
      department: 'Emergency Triage & Trauma',
      deptCode: 'EMG',
      hospitalId: aiimsDelhi.id,
      roomNumber: 'Red Zone Counter 1',
      status: 'AVAILABLE',
      qualification: 'MBBS, MEM (Emergency Medicine)',
      registrationNumber: 'MCI-205910-DEL',
      avgConsultMinutes: 3.2,
    },
  ];

  const doctors: Record<string, any> = {};
  for (const d of doctorsList) {
    const departmentId = depts[`${d.hospitalId}_${d.deptCode}`]?.id;
    const doc = await prisma.doctor.upsert({
      where: { email: d.email },
      update: {
        name: d.name,
        hospitalId: d.hospitalId,
        departmentId,
        department: d.department,
        roomNumber: d.roomNumber,
        status: d.status as any,
        avgConsultMinutes: d.avgConsultMinutes,
        qualification: d.qualification,
        registrationNumber: d.registrationNumber,
      },
      create: {
        id: d.id,
        name: d.name,
        email: d.email,
        passwordHash: defaultPasswordHash,
        role: 'DOCTOR',
        status: d.status as any,
        hospitalId: d.hospitalId,
        departmentId,
        department: d.department,
        roomNumber: d.roomNumber,
        qualification: d.qualification,
        registrationNumber: d.registrationNumber,
        avgConsultMinutes: d.avgConsultMinutes,
      },
    });
    doctors[d.id] = doc;
  }

  // =========================================================================
  // 4. Kiosk Hardware Terminals (Hospital Admin Fleet & Kiosk App)
  // =========================================================================
  console.log('4. Seeding Kiosk Hardware Terminals & Serial Bridges...');
  const fleetData = [
    { deviceCode: 'KSK-DEL-014', location: 'Main OPD Lobby Gate 1', hospitalId: aiimsDelhi.id, firmwareVersion: 'v4.2.0', ipAddress: '192.168.1.101', status: 'ONLINE', printerPaperPercent: 85 },
    { deviceCode: 'KSK-DEL-015', location: 'Cardiology Wing Entrance', hospitalId: aiimsDelhi.id, firmwareVersion: 'v4.2.0', ipAddress: '192.168.1.102', status: 'ONLINE', printerPaperPercent: 92 },
    { deviceCode: 'KSK-DEL-016', location: 'AYUSH Wellness Block', hospitalId: aiimsDelhi.id, firmwareVersion: 'v4.2.0', ipAddress: '192.168.1.103', status: 'ONLINE', printerPaperPercent: 40 },
    { deviceCode: 'KSK-DEL-017', location: 'Emergency Triage Counter', hospitalId: aiimsDelhi.id, firmwareVersion: 'v4.1.9', ipAddress: '192.168.1.104', status: 'DEGRADED', printerPaperPercent: 15 },
    { deviceCode: 'COM9-ARDUINO-BRIDGE', location: 'Physical USB RFID Bridge (COM9)', hospitalId: aiimsDelhi.id, firmwareVersion: 'v1.0.0-Nano', ipAddress: '127.0.0.1', status: 'ONLINE', printerPaperPercent: 100 },
  ];

  for (const f of fleetData) {
    await prisma.rFIDDevice.upsert({
      where: { deviceCode: f.deviceCode },
      update: {
        lastHeartbeatAt: new Date(),
        hospitalId: f.hospitalId,
        status: f.status as any,
        printerPaperPercent: f.printerPaperPercent,
      },
      create: {
        deviceCode: f.deviceCode,
        location: f.location,
        hospitalId: f.hospitalId,
        firmwareVersion: f.firmwareVersion,
        ipAddress: f.ipAddress,
        status: f.status as any,
        printerPaperPercent: f.printerPaperPercent,
        lastHeartbeatAt: new Date(),
      },
    });
  }

  // =========================================================================
  // 5. Physical RFID Card Mappings (Including 24:33:F0:06 - Prakhar Rai)
  // =========================================================================
  console.log('5. Seeding Real Physical RFID Cards & Registered Patients...');

  // User's Real Physical Hardware Card: 24:33:F0:06
  const prakhar = await prisma.patient.upsert({
    where: { phone: '9876543210' },
    update: {
      hospitalId: aiimsDelhi.id,
      fullName: 'Prakhar Rai',
      age: 28,
      gender: 'Male',
      bloodGroup: 'O+',
      abhaId: '91-2345-6789-0123',
    },
    create: {
      id: 'patient-prakhar-rai',
      hospitalId: aiimsDelhi.id,
      fullName: 'Prakhar Rai',
      age: 28,
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '9876543210',
      abhaId: '91-2345-6789-0123',
      registrationSource: 'RFID',
      dateOfBirth: new Date('1998-05-15'),
    },
  });

  await prisma.rFIDCard.upsert({
    where: { uid: '24:33:F0:06' },
    update: { patientId: prakhar.id, active: true, hospitalId: aiimsDelhi.id },
    create: {
      uid: '24:33:F0:06',
      patientId: prakhar.id,
      hospitalId: aiimsDelhi.id,
      cardType: 'ISO/IEC 14443-A Smart Card',
      active: true,
    },
  });

  // Stock / Blank Smart Cards for RFID Portal registration
  await prisma.rFIDCard.upsert({
    where: { uid: '82:12:68:E9' },
    update: { active: true, hospitalId: aiimsDelhi.id },
    create: {
      uid: '82:12:68:E9',
      hospitalId: aiimsDelhi.id,
      cardType: 'ISO/IEC 14443-A Mifare',
      active: true,
    },
  });

  await prisma.rFIDCard.upsert({
    where: { uid: 'DB:F9:25:07' },
    update: { active: true, hospitalId: aiimsDelhi.id },
    create: {
      uid: 'DB:F9:25:07',
      hospitalId: aiimsDelhi.id,
      cardType: 'ISO/IEC 14443-A Smart Card',
      active: true,
    },
  });

  // Additional 5 Synthetic Patient Cases for Comprehensive Demo
  const syntheticPatients = [
    {
      id: 'patient-aarav-sharma',
      fullName: 'Aarav Sharma',
      age: 39,
      gender: 'Male',
      bloodGroup: 'B+',
      phone: '9999900001',
      abhaId: '91-1111-2222-3333',
      rfidUid: 'DEMO-RFID-001',
      chiefComplaint: 'Acute chest pain radiating to left shoulder and diaphoresis',
      category: 'chest-pain',
      deptCode: 'CARD',
      priority: 'EMERGENCY',
      token: 'CARD-101',
    },
    {
      id: 'patient-priya-verma',
      fullName: 'Priya Verma',
      age: 32,
      gender: 'Female',
      bloodGroup: 'A+',
      phone: '9999900002',
      abhaId: '91-2222-3333-4444',
      rfidUid: 'DEMO-RFID-002',
      chiefComplaint: 'Severe breathlessness and persistent wheezing',
      category: 'breathing-difficulty',
      deptCode: 'EMG',
      priority: 'URGENT',
      token: 'EMG-002',
    },
    {
      id: 'patient-ramesh-patel',
      fullName: 'Ramesh Patel',
      age: 56,
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '9999900003',
      abhaId: '91-3333-4444-5555',
      rfidUid: 'DEMO-RFID-003',
      chiefComplaint: 'Type 2 Diabetes routine quarterly review & HbA1c verification',
      category: 'general-fallback',
      deptCode: 'GEN',
      priority: 'NORMAL',
      token: 'GEN-103',
    },
    {
      id: 'patient-vikram-joshi',
      fullName: 'Vikramaditya Joshi',
      age: 34,
      gender: 'Male',
      bloodGroup: 'AB+',
      phone: '9999900005',
      abhaId: '91-5555-6666-7777',
      rfidUid: 'DEMO-RFID-005',
      chiefComplaint: 'AYUSH Prakriti analysis & chronic cervical stiffness (Vata)',
      category: 'general-fallback',
      deptCode: 'AYU',
      priority: 'NORMAL',
      token: 'AYU-101',
    },
  ];

  for (const p of syntheticPatients) {
    const patient = await prisma.patient.upsert({
      where: { phone: p.phone },
      update: {
        fullName: p.fullName,
        age: p.age,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        abhaId: p.abhaId,
        hospitalId: aiimsDelhi.id,
      },
      create: {
        id: p.id,
        fullName: p.fullName,
        age: p.age,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        phone: p.phone,
        abhaId: p.abhaId,
        registrationSource: 'RFID',
        hospitalId: aiimsDelhi.id,
        isDemo: true,
      },
    });

    await prisma.rFIDCard.upsert({
      where: { uid: p.rfidUid },
      update: { patientId: patient.id, active: true },
      create: {
        uid: p.rfidUid,
        patientId: patient.id,
        hospitalId: aiimsDelhi.id,
        cardType: 'Mifare Classic 1K',
        active: true,
        isDemo: true,
      },
    });

    // Create an active intake session
    const session = await prisma.patientSession.create({
      data: {
        patientId: patient.id,
        hospitalId: aiimsDelhi.id,
        status: 'ROUTED',
        mode: p.deptCode === 'AYU' ? 'AYUSH' : 'GENERAL',
        language: 'EN',
        identifiedVia: 'RFID',
      },
    });

    // Create Consent
    await prisma.consent.create({
      data: {
        sessionId: session.id,
        status: 'GRANTED',
        language: 'EN',
        consentTextVersion: 'v2.1-ABDM-Compliant',
        grantedAt: new Date(),
      },
    });

    // Create Clinical History
    await prisma.clinicalHistory.create({
      data: {
        sessionId: session.id,
        patientId: patient.id,
        mode: p.deptCode === 'AYU' ? 'AYUSH' : 'GENERAL',
        chiefComplaint: p.chiefComplaint,
        chiefComplaintCategory: p.category,
        completedAt: new Date(),
      },
    });

    // Create Triage Queue Ticket
    const deptId = depts[`${aiimsDelhi.id}_${p.deptCode}`]?.id;
    await prisma.triageQueue.create({
      data: {
        sessionId: session.id,
        patientId: patient.id,
        hospitalId: aiimsDelhi.id,
        departmentId: deptId,
        tokenNumber: p.token,
        priority: p.priority as any,
        status: 'WAITING',
        estimatedWaitMins: p.priority === 'EMERGENCY' ? 0 : 15,
      },
    });

    // Create AI Summary
    await prisma.aISummary.create({
      data: {
        sessionId: session.id,
        patientId: patient.id,
        generatorType: 'GEMINI_MULTIMODAL_CLINICAL',
        status: 'CONFIRMED',
        content: `Chief Complaint: ${p.chiefComplaint}. Patient identified via RFID Smart Card (${p.rfidUid}). Vitals stable. Prior triage classification: ${p.priority}. Recommended for direct consultation with ${p.deptCode} specialist.`,
      },
    });
  }

  // =========================================================================
  // 6. Prakhar Rai's Session with ImageKit Document & Digital Prescription
  // =========================================================================
  console.log("6. Attaching Verified ImageKit Prescription to Prakhar Rai's Session...");
  const prakharSession = await prisma.patientSession.create({
    data: {
      patientId: prakhar.id,
      hospitalId: aiimsDelhi.id,
      status: 'COMPLETED',
      mode: 'GENERAL',
      language: 'EN',
      identifiedVia: 'RFID',
    },
  });

  const prakharDoc = await prisma.medicalDocument.create({
    data: {
      sessionId: prakharSession.id,
      patientId: prakhar.id,
      type: 'PRESCRIPTION',
      originalFilename: 'prakhar_prescription_pantop_d3.jpg',
      storagePath: 'https://ik.imagekit.io/aadityavishnoi/medikiosk/patients/anonymous/scan_prescription_1788799710202_W0ElqLwoga.jpg',
      mimeType: 'image/jpeg',
      ocrText: 'Rx Doctor Prescription\n1. Tab. Pantoprazole (Pantop) 40mg - OD before breakfast x 14 days\n2. Tab. Vitamin D3 60,000 IU - 1 tab weekly x 8 weeks\nAdvice: Avoid oily and spicy foods, maintain adequate hydration.',
      ocrConfidence: 0.92,
      processedAt: new Date(),
    },
  });

  await prisma.extractedMedicalData.createMany({
    data: [
      {
        documentId: prakharDoc.id,
        fieldType: 'MEDICATION',
        fieldValue: 'Pantop 40mg OD (Empty stomach)',
        confidence: 0.94,
        status: 'VERIFIED',
        verifiedBy: 'Dr. Rohan Mehta',
      },
      {
        documentId: prakharDoc.id,
        fieldType: 'MEDICATION',
        fieldValue: 'Vitamin D3 60k IU (Weekly)',
        confidence: 0.90,
        status: 'VERIFIED',
        verifiedBy: 'Dr. Rohan Mehta',
      },
    ],
  });

  // Doctor Consultation & Prescription issued
  const consultation = await prisma.consultation.create({
    data: {
      sessionId: prakharSession.id,
      patientId: prakhar.id,
      doctorId: doctors['doc-rohan-mehta'].id,
      status: 'COMPLETED',
      notes: 'Patient presented with mild gastroesophageal reflux and generalized weakness. Verified physical prescription via side-by-side ImageKit viewer. Prescribed continuation of Pantop 40mg and weekly Vitamin D3 cholecalciferol supplement.',
      startedAt: new Date(Date.now() - 15 * 60 * 1000),
      completedAt: new Date(),
    },
  });

  const rx = await prisma.prescription.create({
    data: {
      consultationId: consultation.id,
      patientId: prakhar.id,
      doctorId: doctors['doc-rohan-mehta'].id,
      diagnosis: 'GERD with Subclinical Vitamin D Deficiency',
      clinicalNotes: 'Follow up in 4 weeks with serum 25-OH Vitamin D report',
      followUpDays: 28,
      items: {
        create: [
          {
            medicineName: 'Tab. Pantoprazole 40mg',
            dosage: '1 Tablet',
            frequency: 'OD',
            durationDays: 14,
            instructions: 'Empty stomach 30 mins before breakfast',
          },
          {
            medicineName: 'Tab. Vitamin D3 60,000 IU (Cholecalciferol)',
            dosage: '1 Tablet',
            frequency: 'PRN',
            durationDays: 56,
            instructions: 'Once weekly after milk',
          },
        ],
      },
    },
  });

  // =========================================================================
  // 7. National Disease Surveillance Signals (Central Admin Outbreak Radar)
  // =========================================================================
  console.log('7. Seeding Disease Outbreak Radar Telemetry...');
  const outbreaksData = [
    {
      hospitalId: aiimsDelhi.id,
      diseaseName: 'Dengue Fever (NS1 Ag+)',
      category: 'VECTOR_BORNE',
      icd10Code: 'A90',
      caseCount: 48,
      severity: 'HIGH',
      district: 'South Delhi',
      state: 'Delhi',
    },
    {
      hospitalId: safdarjung.id,
      diseaseName: 'Acute Gastroenteritis & Cholera Surveillance',
      category: 'WATER_BORNE',
      icd10Code: 'A09',
      caseCount: 32,
      severity: 'MEDIUM',
      district: 'New Delhi',
      state: 'Delhi',
    },
    {
      hospitalId: civilGurugram.id,
      diseaseName: 'Viral Influenza H3N2 Cluster',
      category: 'RESPIRATORY',
      icd10Code: 'J10.1',
      caseCount: 71,
      severity: 'MEDIUM',
      district: 'Gurugram',
      state: 'Haryana',
    },
    {
      hospitalId: distVaranasi.id,
      diseaseName: 'Enteric Typhoid Fever',
      category: 'WATER_BORNE',
      icd10Code: 'A01.0',
      caseCount: 26,
      severity: 'MEDIUM',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
    },
    {
      hospitalId: chcAlwar.id,
      diseaseName: 'Plasmodium Vivax Malaria',
      category: 'VECTOR_BORNE',
      icd10Code: 'B54',
      caseCount: 15,
      severity: 'LOW',
      district: 'Alwar',
      state: 'Rajasthan',
    },
  ];

  for (const o of outbreaksData) {
    await prisma.diseaseOutbreakSignal.create({
      data: {
        hospitalId: o.hospitalId,
        diseaseName: o.diseaseName,
        category: o.category,
        icd10Code: o.icd10Code,
        caseCount: o.caseCount,
        severity: o.severity as any,
        district: o.district,
        state: o.state,
        reportedDate: new Date(),
      },
    });
  }

  // =========================================================================
  // 8. ABDM Care Contexts & Consent Artefacts (Interoperability)
  // =========================================================================
  console.log('8. Seeding ABDM Consent Artefacts & Care Contexts...');
  await prisma.abdmConsentArtefact.upsert({
    where: { consentArtefactId: 'CONSENT-ARTEFACT-ABDM-001' },
    update: {},
    create: {
      patientId: prakhar.id,
      abhaAddress: 'prakhar.rai@abdm',
      consentArtefactId: 'CONSENT-ARTEFACT-ABDM-001',
      hipId: 'IN0710000001',
      hiuId: 'IN0710000002',
      purpose: 'CARETREAT',
      status: 'GRANTED',
      dateFrom: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      dateTo: new Date(),
      expiryDate: new Date(Date.now() + 180 * 24 * 3600 * 1000),
    },
  });

  console.log('✅ Enterprise MediKiosk Multi-Portal Database Successfully Seeded!');
  console.log('   - 5 Anchor Hospitals (AIIMS Delhi, Safdarjung, Gurugram, Varanasi, Alwar)');
  console.log('   - 6 Specialized OPD Departments & 6 Doctors on Duty');
  console.log('   - Kiosk Fleet Terminals');
  console.log('   - Physical RFID Card: 24:33:F0:06 (Prakhar Rai) + Stock cards');
  console.log('   - Verified ImageKit Prescription Document + Digital Prescription');
  console.log('   - Live Triage Queues for Doctor Dashboard');
  console.log('   - National Outbreak Radar Epidemiological Signals');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
