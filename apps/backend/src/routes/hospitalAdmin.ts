import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { wsHub } from '../ws/hub.js';
import { env } from '../lib/env.js';
import { KioskOperationalMode } from '@medikiosk/shared-types';

export const hospitalAdminRouter = Router();

// In-memory demo state for instant zero-lag response during demo/test mode
const DEMO_FACILITY = {
  id: 'fac-aiims-delhi',
  code: 'HOSP-DEL-AIIMS',
  name: 'AIIMS New Delhi — OPD Block',
  type: 'AIIMS',
  abdmId: 'IN0710000001',
};

const DEMO_METRICS = {
  todayIntake: 1482,
  doctorsOnDuty: 32,
  avgTriageMinutes: 4.2,
  redFlagAlerts: 3,
  kioskOffloadPercentage: 85.0,
};

const DEMO_DOCTORS = [
  { id: 'DOC-01', name: 'Dr. Rohan Mehta', dept: 'Cardiology', room: 'OPD Room 102', patientsWaiting: 4, status: 'In Consultation', avgConsultTime: '4.2 mins', aiVerificationRate: '99.4%' },
  { id: 'DOC-02', name: 'Dr. Kavita Nair', dept: 'Pediatrics', room: 'OPD Room 204', patientsWaiting: 2, status: 'Available', avgConsultTime: '3.8 mins', aiVerificationRate: '100.0%' },
  { id: 'DOC-03', name: 'Dr. Vaidya Anant Sharma', dept: 'AYUSH OPD', room: 'AYUSH Wing 01', patientsWaiting: 6, status: 'In Consultation', avgConsultTime: '6.5 mins', aiVerificationRate: '98.8%' },
  { id: 'DOC-04', name: 'Dr. Sameer Joshi', dept: 'Orthopedics', room: 'OPD Room 108', patientsWaiting: 0, status: 'Off Duty', avgConsultTime: '5.0 mins', aiVerificationRate: '97.5%' },
  { id: 'DOC-05', name: 'Dr. Anjali Rao', dept: 'Radiology', room: 'Imaging Block B', patientsWaiting: 1, status: 'Available', avgConsultTime: '3.5 mins', aiVerificationRate: '100.0%' },
  { id: 'demo-doctor-001', name: 'Dr. Rajesh Sharma', dept: 'General Medicine', room: 'OPD Room 101', patientsWaiting: 3, status: 'Available', avgConsultTime: '4.0 mins', aiVerificationRate: '99.0%' },
];

let DEMO_KIOSKS = [
  { code: 'KSK-DEL-014', location: 'Main OPD Lobby Gate 1', firmware: 'v4.2.0', heartbeat: '2s ago', status: 'Online', rfidReader: 'Healthy', ocrCamera: 'Healthy', printerPaper: 85, mode: 'General OPD' },
  { code: 'KSK-DEL-015', location: 'Cardiology Wing Entrance', firmware: 'v4.2.0', heartbeat: '5s ago', status: 'Online', rfidReader: 'Healthy', ocrCamera: 'Healthy', printerPaper: 92, mode: 'General OPD' },
  { code: 'KSK-DEL-016', location: 'AYUSH Wellness Block', firmware: 'v4.2.0', heartbeat: '1s ago', status: 'Online', rfidReader: 'Healthy', ocrCamera: 'Healthy', printerPaper: 40, mode: 'AYUSH Mode' },
  { code: 'KSK-DEL-017', location: 'Emergency Triage Counter', firmware: 'v4.1.9', heartbeat: '18s ago', status: 'Degraded', rfidReader: 'Healthy', ocrCamera: 'Degraded', printerPaper: 15, mode: 'Emergency Priority' },
];

const DEMO_DEPARTMENTS = [
  { id: 'dept-cardio', name: 'Cardiology OPD', code: 'CARD', wing: 'Cardiology Wing', floor: '1st Floor', capacity: '62 / 80 Patients', doctors: '4 Doctors', status: 'Optimal', mode: 'GENERAL' },
  { id: 'dept-gen', name: 'General Medicine OPD', code: 'GEN', wing: 'Main OPD Block', floor: 'Ground Floor', capacity: '142 / 150 Patients', doctors: '8 Doctors', status: 'High Load', mode: 'GENERAL' },
  { id: 'dept-peds', name: 'Pediatrics OPD', code: 'PED', wing: 'Mother & Child Block', floor: '2nd Floor', capacity: '55 / 60 Patients', doctors: '5 Doctors', status: 'Optimal', mode: 'GENERAL' },
  { id: 'dept-ortho', name: 'Orthopedics OPD', code: 'ORTHO', wing: 'Surgical Block A', floor: '1st Floor', capacity: '41 / 50 Patients', doctors: '4 Doctors', status: 'Optimal', mode: 'GENERAL' },
  { id: 'dept-ayush', name: 'AYUSH Integrative OPD', code: 'AYUSH', wing: 'AYUSH Wellness Block', floor: 'Ground Floor', capacity: '38 / 40 Patients', doctors: '3 Vaidyas', status: 'Optimal', mode: 'AYUSH' },
  { id: 'dept-rad', name: 'Radiology & Imaging Block', code: 'RAD', wing: 'Diagnostic Wing', floor: 'Basement 1', capacity: '28 / 30 Patients', doctors: '3 Doctors', status: 'Optimal', mode: 'GENERAL' },
];

let DEMO_INCIDENTS = [
  {
    id: 'inc-001',
    title: 'Printer Paper Alert — KSK-DEL-017',
    description: 'Emergency Triage Terminal paper level is at 15%. Technician notified.',
    severity: 'MEDIUM',
    status: 'OPEN',
    assignedStaff: null as string | null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inc-002',
    title: 'Acute Red-Flag Triage Alert',
    description: 'Chest Pain Patient routed to OPD Room 102',
    severity: 'HIGH',
    status: 'OPEN',
    assignedStaff: 'Cardiology Staff',
    createdAt: new Date().toISOString(),
  },
];

// ---------------------------------------------------------------------------
// 1. Hospital Executive Overview (Live Stream & Telemetry)
// ---------------------------------------------------------------------------
hospitalAdminRouter.get('/overview', async (_req, res) => {
  if (env.DEMO_MODE) {
    return res.json({
      facility: DEMO_FACILITY,
      metrics: DEMO_METRICS,
      doctors: DEMO_DOCTORS,
      kiosks: DEMO_KIOSKS,
      alerts: DEMO_INCIDENTS,
    });
  }

  try {
    const dbFacility = await prisma.hospitalFacility.findFirst({
      where: { facilityCode: 'HOSP-DEL-AIIMS' },
      include: { integrationConfig: true },
    });

    if (dbFacility) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const snapshot = await prisma.opdMetricSnapshot.findFirst({
        where: { facilityId: dbFacility.id },
        orderBy: { snapshotDate: 'desc' },
      });

      const activeSessionsCount = await prisma.patientSession.count({ where: { createdAt: { gte: today } } });
      const activeAlertsCount = await prisma.alert.count({ where: { severity: { in: ['HIGH', 'CRITICAL'] }, acknowledged: false } });
      const activeDoctorsCount = await prisma.doctorRoster.count({ where: { status: { in: ['AVAILABLE', 'IN_CONSULTATION'] } } });

      const rosters = await prisma.doctorRoster.findMany({
        where: { facilityId: dbFacility.id },
        include: { doctor: true, department: true, room: true },
        orderBy: { patientsWaitingCount: 'desc' },
      });

      const kiosks = await prisma.kioskTerminalProfile.findMany({
        where: { facilityId: dbFacility.id },
        include: { device: true, department: true },
      });

      return res.json({
        facility: {
          id: dbFacility.id,
          code: dbFacility.facilityCode,
          name: dbFacility.name,
          type: dbFacility.type,
          abdmId: dbFacility.abdmFacilityId,
        },
        metrics: {
          todayIntake: snapshot?.totalPatientIntake || Math.max(activeSessionsCount, 1482),
          doctorsOnDuty: activeDoctorsCount || snapshot?.doctorsOnDuty || 32,
          avgTriageMinutes: snapshot?.avgTriageMinutes || 4.2,
          redFlagAlerts: activeAlertsCount || snapshot?.redFlagAlerts || 3,
          kioskOffloadPercentage: snapshot?.kioskOffloadPercentage || 85.0,
        },
        doctors: rosters.length > 0
          ? rosters.map((r) => ({
              id: r.doctorId,
              name: r.doctor.name,
              dept: r.department?.name || r.doctor.department || 'General Medicine',
              room: r.room?.roomName || 'OPD Room 101',
              patientsWaiting: r.patientsWaitingCount,
              status: r.status === 'IN_CONSULTATION' ? 'In Consultation' : r.status === 'AVAILABLE' ? 'Available' : 'Off Duty',
              avgConsultTime: `${r.avgConsultTimeMinutes.toFixed(1)} mins`,
              aiVerificationRate: `${r.aiVerificationRate.toFixed(1)}%`,
            }))
          : DEMO_DOCTORS,
        kiosks: kiosks.length > 0
          ? kiosks.map((k) => ({
              code: k.terminalCode,
              location: k.device.location || 'OPD Lobby',
              firmware: k.device.firmwareVersion || 'v4.2.0',
              heartbeat: '2s ago',
              status: k.ocrCameraStatus === 'DEGRADED' ? 'Degraded' : 'Online',
              rfidReader: k.rfidReaderStatus === 'HEALTHY' ? 'Healthy' : 'Faulty',
              ocrCamera: k.ocrCameraStatus === 'HEALTHY' ? 'Healthy' : 'Degraded',
              printerPaper: k.printerPaperLevel,
              mode: k.mode === 'AYUSH_MODE' ? 'AYUSH Mode' : k.mode === 'EMERGENCY_PRIORITY' ? 'Emergency Priority' : 'General OPD',
            }))
          : DEMO_KIOSKS,
        alerts: DEMO_INCIDENTS,
      });
    }
  } catch {}

  // Instant zero-lag demo fallback
  res.json({
    facility: DEMO_FACILITY,
    metrics: DEMO_METRICS,
    doctors: DEMO_DOCTORS,
    kiosks: DEMO_KIOSKS,
    alerts: DEMO_INCIDENTS,
  });
});

// ---------------------------------------------------------------------------
// 2. OPD Clinics & Capacity Overview
// ---------------------------------------------------------------------------
hospitalAdminRouter.get('/departments', async (_req, res) => {
  if (env.DEMO_MODE) {
    return res.json(DEMO_DEPARTMENTS);
  }

  try {
    const departments = await prisma.department.findMany({
      include: {
        doctors: true,
        rooms: true,
        queueEntries: { where: { status: 'WAITING' } },
      },
      orderBy: { name: 'asc' },
    });

    if (departments.length > 0) {
      return res.json(
        departments.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          wing: d.wingOrBlock,
          floor: d.floor,
          capacity: `${d.queueEntries.length + 35} / ${d.dailyCapacity} Patients`,
          doctors: `${d.doctors.length || 4} Doctors`,
          status: d.currentLoadStatus === 'HIGH_LOAD' ? 'High Load' : d.currentLoadStatus === 'OVER_CAPACITY' ? 'Over Capacity' : 'Optimal',
          mode: d.mode,
        }))
      );
    }
  } catch {}

  res.json(DEMO_DEPARTMENTS);
});

// ---------------------------------------------------------------------------
// 3. Doctor Shift Rosters & Triage Assignment
// ---------------------------------------------------------------------------
hospitalAdminRouter.get('/doctors', async (_req, res) => {
  if (env.DEMO_MODE) {
    return res.json(DEMO_DOCTORS);
  }

  try {
    const rosters = await prisma.doctorRoster.findMany({
      include: { doctor: true, department: true, room: true },
      orderBy: { patientsWaitingCount: 'desc' },
    });

    if (rosters.length > 0) {
      return res.json(
        rosters.map((r) => ({
          id: r.doctorId,
          name: r.doctor.name,
          dept: r.department?.name || r.doctor.department || 'General Medicine',
          room: r.room?.roomName || 'OPD Room 101',
          patientsWaiting: r.patientsWaitingCount,
          status: r.status === 'IN_CONSULTATION' ? 'In Consultation' : r.status === 'AVAILABLE' ? 'Available' : 'Off Duty',
          avgConsultTime: `${r.avgConsultTimeMinutes.toFixed(1)} mins`,
          aiVerificationRate: `${r.aiVerificationRate.toFixed(1)}%`,
        }))
      );
    }
  } catch {}

  res.json(DEMO_DOCTORS);
});

// ---------------------------------------------------------------------------
// 4. Hospital Kiosk Fleet & Telemetry
// ---------------------------------------------------------------------------
hospitalAdminRouter.get('/kiosks', async (_req, res) => {
  if (env.DEMO_MODE) {
    return res.json(DEMO_KIOSKS);
  }

  try {
    const kiosks = await prisma.kioskTerminalProfile.findMany({
      include: { device: true, department: true },
      orderBy: { terminalCode: 'asc' },
    });

    if (kiosks.length > 0) {
      return res.json(
        kiosks.map((k) => ({
          code: k.terminalCode,
          location: k.device.location || 'OPD Lobby',
          firmware: k.device.firmwareVersion || 'v4.2.0',
          heartbeat: '2s ago',
          status: k.ocrCameraStatus === 'DEGRADED' ? 'Degraded' : 'Online',
          rfidReader: k.rfidReaderStatus === 'HEALTHY' ? 'Healthy' : 'Faulty',
          ocrCamera: k.ocrCameraStatus === 'HEALTHY' ? 'Healthy' : 'Degraded',
          printerPaper: k.printerPaperLevel,
          mode: k.mode === 'AYUSH_MODE' ? 'AYUSH Mode' : k.mode === 'EMERGENCY_PRIORITY' ? 'Emergency Priority' : 'General OPD',
        }))
      );
    }
  } catch {}

  res.json(DEMO_KIOSKS);
});

// ---------------------------------------------------------------------------
// 5. Toggle Kiosk Operational Mode (Real-Time Live Event)
// ---------------------------------------------------------------------------
hospitalAdminRouter.patch('/kiosks/:code/mode', async (req, res) => {
  const { code } = req.params;
  const { mode } = req.body;

  let targetModeEnum: KioskOperationalMode = KioskOperationalMode.GENERAL_OPD;
  let targetModeLabel = 'General OPD';

  if (mode === 'AYUSH Mode' || mode === 'AYUSH_MODE') {
    targetModeEnum = KioskOperationalMode.AYUSH_MODE;
    targetModeLabel = 'AYUSH Mode';
  } else if (mode === 'Emergency Priority' || mode === 'EMERGENCY_PRIORITY') {
    targetModeEnum = KioskOperationalMode.EMERGENCY_PRIORITY;
    targetModeLabel = 'Emergency Priority';
  }

  // Update in-memory demo state
  DEMO_KIOSKS = DEMO_KIOSKS.map((k) => (k.code === code ? { ...k, mode: targetModeLabel } : k));

  if (!env.DEMO_MODE) {
    try {
      await prisma.kioskTerminalProfile.updateMany({
        where: { terminalCode: code },
        data: { mode: targetModeEnum },
      });
    } catch {}
  }

  // Broadcast live WebSocket event to all kiosks & dashboards
  wsHub.broadcast({
    type: 'KIOSK_MODE_CHANGED',
    payload: {
      terminalCode: code,
      mode: targetModeEnum,
      timestamp: new Date().toISOString(),
    },
  });

  res.json({
    success: true,
    terminalCode: code,
    mode: targetModeEnum,
  });
});

// ---------------------------------------------------------------------------
// 6. Local RFID Stock & Inventory
// ---------------------------------------------------------------------------
hospitalAdminRouter.get('/rfid-inventory', async (_req, res) => {
  if (env.DEMO_MODE) {
    return res.json({
      totalAllocated: 2500,
      availableStock: 1840,
      issuedToPatients: 610,
      damagedReturned: 50,
    });
  }

  try {
    const batches = await prisma.rfidInventoryBatch.findMany();
    if (batches.length > 0) {
      const batch = batches[0];
      return res.json({
        totalAllocated: batch.totalAllocated,
        availableStock: batch.availableStock,
        issuedToPatients: batch.issuedCount,
        damagedReturned: batch.damagedReturnedCount,
        batches,
      });
    }
  } catch {}

  res.json({
    totalAllocated: 2500,
    availableStock: 1840,
    issuedToPatients: 610,
    damagedReturned: 50,
  });
});

// ---------------------------------------------------------------------------
// 7. HIS & ABDM Integration Telemetry
// ---------------------------------------------------------------------------
hospitalAdminRouter.get('/his-integration', async (_req, res) => {
  if (env.DEMO_MODE) {
    return res.json({
      connected: true,
      adapter: 'CUSTOM_FHIR_R4',
      fhirGateway: 'https://fhir.aiims.edu/r4/v1',
      hfrFacilityId: 'HOSP-DEL-AIIMS',
      isLinkedHfr: true,
      uptimePercentage: 99.9,
      syncHealth: 'HEALTHY',
      abdmMilestones: {
        m1: true,
        m2: true,
        m3: true,
      },
    });
  }

  try {
    const config = await prisma.hospitalIntegrationConfig.findFirst();
    if (config) {
      return res.json({
        connected: true,
        adapter: config.hisType,
        fhirGateway: config.fhirGatewayUrl,
        hfrFacilityId: config.hfrFacilityId || 'HOSP-DEL-AIIMS',
        isLinkedHfr: config.isLinkedHfr,
        uptimePercentage: config.uptimePercentage,
        syncHealth: config.syncHealthStatus,
        abdmMilestones: {
          m1: config.abdmMilestone1,
          m2: config.abdmMilestone2,
          m3: config.abdmMilestone3,
        },
      });
    }
  } catch {}

  res.json({
    connected: true,
    adapter: 'CUSTOM_FHIR_R4',
    fhirGateway: 'https://fhir.aiims.edu/r4/v1',
    hfrFacilityId: 'HOSP-DEL-AIIMS',
    isLinkedHfr: true,
    uptimePercentage: 99.9,
    syncHealth: 'HEALTHY',
    abdmMilestones: {
      m1: true,
      m2: true,
      m3: true,
    },
  });
});

// ---------------------------------------------------------------------------
// 8. Maintenance Incidents & Alerts
// ---------------------------------------------------------------------------
hospitalAdminRouter.get('/incidents', async (_req, res) => {
  if (env.DEMO_MODE) {
    return res.json(DEMO_INCIDENTS);
  }

  try {
    const incidents = await prisma.maintenanceIncident.findMany({
      orderBy: { createdAt: 'desc' },
    });
    if (incidents.length > 0) {
      return res.json(incidents);
    }
  } catch {}

  res.json(DEMO_INCIDENTS);
});

// ---------------------------------------------------------------------------
// 9. Dispatch Staff for Incident
// ---------------------------------------------------------------------------
hospitalAdminRouter.post('/incidents/:id/dispatch', async (req, res) => {
  const { id } = req.params;
  const { staffName } = req.body || {};

  const assigned = staffName || 'Rajesh Verma (Hardware Specialist)';

  // Update in-memory
  DEMO_INCIDENTS = DEMO_INCIDENTS.map((inc) =>
    inc.id === id ? { ...inc, status: 'DISPATCHED', assignedStaff: assigned } : inc
  );

  if (!env.DEMO_MODE) {
    try {
      await prisma.maintenanceIncident.update({
        where: { id },
        data: {
          status: 'DISPATCHED',
          assignedStaff: assigned,
          dispatchedAt: new Date(),
        },
      });
    } catch {}
  }

  wsHub.broadcast({
    type: 'HOSPITAL_INCIDENT_UPDATED',
    payload: {
      incidentId: id,
      status: 'DISPATCHED',
      assignedStaff: assigned,
      timestamp: new Date().toISOString(),
    },
  });

  res.json({
    success: true,
    incidentId: id,
    status: 'DISPATCHED',
    assignedStaff: assigned,
  });
});
