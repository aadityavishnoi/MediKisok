import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting MediKiosk seed script with Hospital Admin facility & patient data...');

  const passwordHash = await bcrypt.hash('MediKiosk@123', 10);

  // 1. Primary Hospital Facility
  const facility = await prisma.hospitalFacility.upsert({
    where: { facilityCode: 'HOSP-DEL-AIIMS' },
    update: {},
    create: {
      id: 'fac-aiims-delhi',
      facilityCode: 'HOSP-DEL-AIIMS',
      name: 'AIIMS New Delhi — OPD Block',
      type: 'AIIMS',
      abdmFacilityId: 'IN0710000001',
      address: 'Sri Aurobindo Marg, Ansari Nagar East',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110029',
      contactPhone: '+91-11-26588500',
      contactEmail: 'opd.admin@aiims.edu',
      active: true,
    },
  });

  // 2. Hospital Administrative Staff
  await prisma.hospitalStaff.upsert({
    where: { email: 'admin.gupta@aiims.edu' },
    update: {},
    create: {
      id: 'staff-001',
      facilityId: facility.id,
      name: 'Dr. S. K. Gupta',
      email: 'admin.gupta@aiims.edu',
      passwordHash,
      role: 'MEDICAL_SUPERINTENDENT',
      designation: 'Medical Superintendent',
      phone: '9811001100',
      isActive: true,
    },
  });

  await prisma.hospitalStaff.upsert({
    where: { email: 'tech.verma@aiims.edu' },
    update: {},
    create: {
      id: 'staff-002',
      facilityId: facility.id,
      name: 'Rajesh Verma',
      email: 'tech.verma@aiims.edu',
      passwordHash,
      role: 'KIOSK_TECHNICIAN',
      designation: 'Senior Kiosk Hardware Specialist',
      phone: '9811001101',
      isActive: true,
    },
  });

  // 3. Hospital OPD Departments
  const departmentsData = [
    { id: 'dept-cardio', code: 'CARD', name: 'Cardiology OPD', wing: 'Cardiology Wing', floor: '1st Floor', capacity: 80, status: 'OPTIMAL' as const, mode: 'GENERAL' as const },
    { id: 'dept-gen', code: 'GEN', name: 'General Medicine OPD', wing: 'Main OPD Block', floor: 'Ground Floor', capacity: 150, status: 'HIGH_LOAD' as const, mode: 'GENERAL' as const },
    { id: 'dept-peds', code: 'PED', name: 'Pediatrics OPD', wing: 'Mother & Child Block', floor: '2nd Floor', capacity: 60, status: 'OPTIMAL' as const, mode: 'GENERAL' as const },
    { id: 'dept-ortho', code: 'ORTHO', name: 'Orthopedics OPD', wing: 'Surgical Block A', floor: '1st Floor', capacity: 50, status: 'OPTIMAL' as const, mode: 'GENERAL' as const },
    { id: 'dept-ayush', code: 'AYUSH', name: 'AYUSH Integrative OPD', wing: 'AYUSH Wellness Block', floor: 'Ground Floor', capacity: 40, status: 'OPTIMAL' as const, mode: 'AYUSH' as const },
    { id: 'dept-rad', code: 'RAD', name: 'Radiology & Imaging Block', wing: 'Diagnostic Wing', floor: 'Basement 1', capacity: 30, status: 'OPTIMAL' as const, mode: 'GENERAL' as const },
  ];

  const createdDepts: Record<string, any> = {};
  for (const d of departmentsData) {
    createdDepts[d.code] = await prisma.department.upsert({
      where: { facilityId_code: { facilityId: facility.id, code: d.code } },
      update: { dailyCapacity: d.capacity, currentLoadStatus: d.status },
      create: {
        id: d.id,
        facilityId: facility.id,
        name: d.name,
        code: d.code,
        wingOrBlock: d.wing,
        floor: d.floor,
        dailyCapacity: d.capacity,
        currentLoadStatus: d.status,
        mode: d.mode,
        isActive: true,
      },
    });
  }

  // 4. Consultation Rooms
  const roomsData = [
    { id: 'room-102', deptCode: 'CARD', number: '102', name: 'OPD Room 102', floor: '1st Floor' },
    { id: 'room-101', deptCode: 'GEN', number: '101', name: 'OPD Room 101', floor: 'Ground Floor' },
    { id: 'room-204', deptCode: 'PED', number: '204', name: 'OPD Room 204', floor: '2nd Floor' },
    { id: 'room-108', deptCode: 'ORTHO', number: '108', name: 'OPD Room 108', floor: '1st Floor' },
    { id: 'room-ayush-01', deptCode: 'AYUSH', number: 'AYUSH-01', name: 'AYUSH Wing 01', floor: 'Ground Floor' },
    { id: 'room-img-b', deptCode: 'RAD', number: 'IMG-B', name: 'Imaging Block B', floor: 'Basement 1' },
  ];

  const createdRooms: Record<string, any> = {};
  for (const r of roomsData) {
    createdRooms[r.number] = await prisma.consultationRoom.upsert({
      where: { facilityId_roomNumber: { facilityId: facility.id, roomNumber: r.number } },
      update: {},
      create: {
        id: r.id,
        facilityId: facility.id,
        departmentId: createdDepts[r.deptCode].id,
        roomNumber: r.number,
        roomName: r.name,
        floor: r.floor,
        isActive: true,
      },
    });
  }

  // 5. Doctors on Roster
  const doctorsData = [
    { id: 'DOC-01', name: 'Dr. Rohan Mehta', email: 'rohan.mehta@aiims.edu', deptCode: 'CARD', roomNo: '102', patientsWaiting: 4, status: 'IN_CONSULTATION' as const, avgConsultTime: 4.2, aiVerifyRate: 99.4 },
    { id: 'DOC-02', name: 'Dr. Kavita Nair', email: 'kavita.nair@aiims.edu', deptCode: 'PED', roomNo: '204', patientsWaiting: 2, status: 'AVAILABLE' as const, avgConsultTime: 3.8, aiVerifyRate: 100.0 },
    { id: 'DOC-03', name: 'Dr. Vaidya Anant Sharma', email: 'anant.sharma@aiims.edu', deptCode: 'AYUSH', roomNo: 'AYUSH-01', patientsWaiting: 6, status: 'IN_CONSULTATION' as const, avgConsultTime: 6.5, aiVerifyRate: 98.8 },
    { id: 'DOC-04', name: 'Dr. Sameer Joshi', email: 'sameer.joshi@aiims.edu', deptCode: 'ORTHO', roomNo: '108', patientsWaiting: 0, status: 'OFF_DUTY' as const, avgConsultTime: 5.0, aiVerifyRate: 97.5 },
    { id: 'DOC-05', name: 'Dr. Anjali Rao', email: 'anjali.rao@aiims.edu', deptCode: 'RAD', roomNo: 'IMG-B', patientsWaiting: 1, status: 'AVAILABLE' as const, avgConsultTime: 3.5, aiVerifyRate: 100.0 },
    { id: 'demo-doctor-001', name: 'Dr. Rajesh Sharma', email: 'demo.doctor@medikiosk.local', deptCode: 'GEN', roomNo: '101', patientsWaiting: 3, status: 'AVAILABLE' as const, avgConsultTime: 4.0, aiVerifyRate: 99.0 },
  ];

  for (const doc of doctorsData) {
    const doctor = await prisma.doctor.upsert({
      where: { email: doc.email },
      update: {
        name: doc.name,
        facilityId: facility.id,
        departmentId: createdDepts[doc.deptCode].id,
        department: createdDepts[doc.deptCode].name,
      },
      create: {
        id: doc.id,
        name: doc.name,
        email: doc.email,
        passwordHash,
        role: 'DOCTOR',
        department: createdDepts[doc.deptCode].name,
        facilityId: facility.id,
        departmentId: createdDepts[doc.deptCode].id,
      },
    });

    // Create Doctor Roster for today
    await prisma.doctorRoster.upsert({
      where: { id: `roster-${doc.id}` },
      update: {
        status: doc.status,
        patientsWaitingCount: doc.patientsWaiting,
        avgConsultTimeMinutes: doc.avgConsultTime,
        aiVerificationRate: doc.aiVerifyRate,
      },
      create: {
        id: `roster-${doc.id}`,
        facilityId: facility.id,
        doctorId: doctor.id,
        departmentId: createdDepts[doc.deptCode].id,
        roomId: createdRooms[doc.roomNo]?.id,
        shiftDate: new Date(),
        shiftType: 'MORNING',
        status: doc.status,
        patientsWaitingCount: doc.patientsWaiting,
        patientsServedCount: 14,
        avgConsultTimeMinutes: doc.avgConsultTime,
        aiVerificationRate: doc.aiVerifyRate,
        checkInTime: new Date(Date.now() - 3 * 3600 * 1000),
      },
    });
  }

  // 6. Hardware RFID Kiosks & Operational Profiles
  const kiosksData = [
    { code: 'KSK-DEL-014', location: 'Main OPD Lobby Gate 1', firmware: 'v4.2.0', paper: 85, mode: 'GENERAL_OPD' as const, status: 'Online' },
    { code: 'KSK-DEL-015', location: 'Cardiology Wing Entrance', firmware: 'v4.2.0', paper: 92, mode: 'GENERAL_OPD' as const, status: 'Online' },
    { code: 'KSK-DEL-016', location: 'AYUSH Wellness Block', firmware: 'v4.2.0', paper: 40, mode: 'AYUSH_MODE' as const, status: 'Online' },
    { code: 'KSK-DEL-017', location: 'Emergency Triage Counter', firmware: 'v4.1.9', paper: 15, mode: 'EMERGENCY_PRIORITY' as const, status: 'Degraded' },
    { code: 'KIOSK-DEV-001', location: 'OPD Building A - Kiosk 1', firmware: 'v2.4.1', paper: 90, mode: 'GENERAL_OPD' as const, status: 'Online' },
  ];

  for (const k of kiosksData) {
    const device = await prisma.rFIDDevice.upsert({
      where: { deviceCode: k.code },
      update: { location: k.location, lastHeartbeatAt: new Date(), facilityId: facility.id },
      create: {
        deviceCode: k.code,
        location: k.location,
        firmwareVersion: k.firmware,
        facilityId: facility.id,
        lastHeartbeatAt: new Date(),
        isDemo: true,
      },
    });

    await prisma.kioskTerminalProfile.upsert({
      where: { deviceId: device.id },
      update: {
        mode: k.mode,
        printerPaperLevel: k.paper,
        printerStatus: k.paper < 20 ? 'PAPER_LOW' : 'HEALTHY',
        ocrCameraStatus: k.status === 'Degraded' ? 'DEGRADED' : 'HEALTHY',
      },
      create: {
        facilityId: facility.id,
        deviceId: device.id,
        terminalCode: k.code,
        mode: k.mode,
        rfidReaderStatus: 'HEALTHY',
        ocrCameraStatus: k.status === 'Degraded' ? 'DEGRADED' : 'HEALTHY',
        printerStatus: k.paper < 20 ? 'PAPER_LOW' : 'HEALTHY',
        printerPaperLevel: k.paper,
        touchscreenStatus: 'HEALTHY',
        batteryBackupPercentage: 100,
      },
    });
  }

  // 7. RFID Card Stock & Inventory Batches
  const rfidBatch = await prisma.rfidInventoryBatch.upsert({
    where: { facilityId_batchNumber: { facilityId: facility.id, batchNumber: 'BATCH-2026-DEL-01' } },
    update: {
      totalAllocated: 2500,
      availableStock: 1840,
      issuedCount: 610,
      damagedReturnedCount: 50,
    },
    create: {
      id: 'batch-del-01',
      facilityId: facility.id,
      batchNumber: 'BATCH-2026-DEL-01',
      cardType: 'MIFARE_CLASSIC_1K',
      totalAllocated: 2500,
      availableStock: 1840,
      issuedCount: 610,
      damagedReturnedCount: 50,
      reorderThreshold: 200,
      unitCost: 18.5,
      supplier: 'National Health Mission - Digital India Supply',
      notes: 'Initial allocation for AIIMS New Delhi OPD Kiosks',
    },
  });

  // 8. HIS & ABDM Gateway Integration Configuration
  await prisma.hospitalIntegrationConfig.upsert({
    where: { facilityId: facility.id },
    update: {
      lastSyncAt: new Date(),
      syncHealthStatus: 'HEALTHY',
      uptimePercentage: 99.9,
    },
    create: {
      id: 'his-aiims-delhi',
      facilityId: facility.id,
      hisType: 'CUSTOM_FHIR_R4',
      fhirGatewayUrl: 'https://fhir.aiims.edu/r4/v1',
      hfrFacilityId: 'HOSP-DEL-AIIMS',
      isLinkedHfr: true,
      syncEnabled: true,
      syncIntervalSeconds: 60,
      lastSyncAt: new Date(),
      syncHealthStatus: 'HEALTHY',
      uptimePercentage: 99.9,
      abdmMilestone1: true,
      abdmMilestone2: true,
      abdmMilestone3: true,
    },
  });

  // 9. Technical Maintenance Incidents & Alerts
  const emergencyKiosk = await prisma.rFIDDevice.findUnique({ where: { deviceCode: 'KSK-DEL-017' } });
  const emergencyProfile = emergencyKiosk ? await prisma.kioskTerminalProfile.findUnique({ where: { deviceId: emergencyKiosk.id } }) : null;

  await prisma.maintenanceIncident.upsert({
    where: { id: 'inc-001' },
    update: {},
    create: {
      id: 'inc-001',
      facilityId: facility.id,
      deviceId: emergencyKiosk?.id,
      kioskProfileId: emergencyProfile?.id,
      title: 'Printer Paper Alert — KSK-DEL-017',
      description: 'Emergency Triage Terminal paper level is at 15%. Technician notified.',
      incidentType: 'PRINTER_PAPER_LOW',
      severity: 'MEDIUM',
      status: 'DISPATCHED',
      assignedStaff: 'Rajesh Verma (Hardware Specialist)',
      dispatchedAt: new Date(),
    },
  });

  // 10. OPD Executive Metric Snapshot (Today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.opdMetricSnapshot.upsert({
    where: { id: `metric-delhi-${today.toISOString().slice(0, 10)}` },
    update: {
      totalPatientIntake: 1482,
      generalOpdIntake: 1210,
      ayushIntake: 234,
      emergencyIntake: 38,
      doctorsOnDuty: 32,
      avgTriageMinutes: 4.2,
      redFlagAlerts: 3,
      kioskOffloadPercentage: 85.0,
    },
    create: {
      id: `metric-delhi-${today.toISOString().slice(0, 10)}`,
      facilityId: facility.id,
      snapshotDate: today,
      totalPatientIntake: 1482,
      generalOpdIntake: 1210,
      ayushIntake: 234,
      emergencyIntake: 38,
      doctorsOnDuty: 32,
      avgTriageMinutes: 4.2,
      redFlagAlerts: 3,
      kioskOffloadPercentage: 85.0,
    },
  });

  // 11. 8 Synthetic Patients & Active Sessions
  const patientsData = [
    { id: 'demo-patient-001', fullName: 'Aarav Sharma', gender: 'Male', dob: new Date('1985-03-14'), phone: '9999900001', rfidUid: 'DEMO-RFID-001', chiefComplaint: 'Chest pain', category: 'chest-pain', deptCode: 'CARD', isRedFlag: true },
    { id: 'demo-patient-002', fullName: 'Priya Verma', gender: 'Female', dob: new Date('1992-07-22'), phone: '9999900002', rfidUid: 'DEMO-RFID-002', chiefComplaint: 'Severe breathlessness', category: 'breathing-difficulty', deptCode: 'GEN', isRedFlag: true },
    { id: 'demo-patient-003', fullName: 'Ramesh Patel', gender: 'Male', dob: new Date('1968-11-05'), phone: '9999900003', rfidUid: 'DEMO-RFID-003', chiefComplaint: 'Chronic Type 2 Diabetes follow-up', category: 'general-fallback', deptCode: 'GEN', isRedFlag: false },
    { id: 'demo-patient-004', fullName: 'Sunita Devi', gender: 'Female', dob: new Date('1975-01-30'), phone: '9999900004', rfidUid: 'DEMO-RFID-004', chiefComplaint: 'पेट में तेज दर्द (Severe Abdominal Pain)', category: 'abdominal-pain', deptCode: 'GEN', isRedFlag: true },
    { id: 'demo-patient-005', fullName: 'Vikramaditya Joshi', gender: 'Male', dob: new Date('1990-09-18'), phone: '9999900005', rfidUid: 'DEMO-RFID-005', chiefComplaint: 'AYUSH Prakriti & Vata Imbalance Assessment', category: 'general-fallback', deptCode: 'AYUSH', isRedFlag: false },
    { id: 'demo-patient-006', fullName: 'Ananya Roy', gender: 'Female', dob: new Date('1998-04-12'), phone: '9999900006', rfidUid: 'DEMO-RFID-006', chiefComplaint: 'Recurrent High Fever with Chills', category: 'fever', deptCode: 'PED', isRedFlag: false },
    { id: 'demo-patient-007', fullName: 'Mohammed Iqbal', gender: 'Male', dob: new Date('1960-06-25'), phone: '9999900007', rfidUid: 'DEMO-RFID-007', chiefComplaint: 'Severe Headache & Blurred Vision (Allergy Conflict)', category: 'headache', deptCode: 'CARD', isRedFlag: false },
    { id: 'demo-patient-008', fullName: 'Kavita Sundaram', gender: 'Female', dob: new Date('1982-12-08'), phone: '9999900008', rfidUid: 'DEMO-RFID-008', chiefComplaint: 'Fatigue & Abnormal Renal Function', category: 'general-fallback', deptCode: 'GEN', isRedFlag: false },
  ];

  const primaryDevice = await prisma.rFIDDevice.findUnique({ where: { deviceCode: 'KIOSK-DEV-001' } });

  for (let idx = 0; idx < patientsData.length; idx++) {
    const p = patientsData[idx];
    const patient = await prisma.patient.upsert({
      where: { id: p.id },
      update: { registeredFacilityId: facility.id },
      create: {
        id: p.id,
        fullName: p.fullName,
        dateOfBirth: p.dob,
        gender: p.gender,
        phone: p.phone,
        registrationSource: 'RFID',
        registeredFacilityId: facility.id,
        isDemo: true,
      },
    });

    await prisma.rFIDCard.upsert({
      where: { uid: p.rfidUid },
      update: { patientId: patient.id, facilityId: facility.id, batchId: rfidBatch.id },
      create: {
        uid: p.rfidUid,
        patientId: patient.id,
        facilityId: facility.id,
        batchId: rfidBatch.id,
        isDemo: true,
        active: true,
        stockStatus: 'ACTIVE_ISSUED',
      },
    });

    const session = await prisma.patientSession.upsert({
      where: { id: `session-${p.id}` },
      update: { facilityId: facility.id, departmentId: createdDepts[p.deptCode].id },
      create: {
        id: `session-${p.id}`,
        patientId: patient.id,
        deviceId: primaryDevice?.id,
        facilityId: facility.id,
        departmentId: createdDepts[p.deptCode].id,
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

    await prisma.aISummary.upsert({
      where: { sessionId: session.id },
      update: {},
      create: {
        sessionId: session.id,
        patientId: patient.id,
        content: `[Patient ${p.fullName}] Presented with ${p.chiefComplaint}. History recorded via MediKiosk pre-consultation intake. Evidence cross-referenced.`,
        generatorType: 'LOCAL_LLM',
        status: 'DRAFT',
      },
    });

    // Create live Queue Entry for OPD stream
    await prisma.patientQueueEntry.upsert({
      where: { sessionId: session.id },
      update: {},
      create: {
        id: `queue-${p.id}`,
        facilityId: facility.id,
        departmentId: createdDepts[p.deptCode].id,
        sessionId: session.id,
        patientId: patient.id,
        tokenNumber: `${p.deptCode.slice(0, 1)}-${100 + idx + 1}`,
        priority: p.isRedFlag ? 'EMERGENCY_RED_FLAG' : 'NORMAL',
        status: 'WAITING',
        queuePosition: idx + 1,
        estimatedWaitMinutes: (idx + 1) * 4,
      },
    });
  }

  console.log('Seed completed successfully: Hospital Admin facility, departments, staff, devices & queues initialized!');
  console.log('Hospital Admin: Dr. S. K. Gupta (admin.gupta@aiims.edu / MediKiosk@123)');
  console.log('Doctor login: demo.doctor@medikiosk.local / MediKiosk@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
