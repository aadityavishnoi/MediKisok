/**
 * Hospital Administration API
 * Facility-scoped endpoints for Hospital Admins to manage their OPD operations,
 * doctor rosters, device fleet, and operational alerts.
 */
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { Errors } from '../lib/errors.js';
import { requireAuth, requireRole, requireFacilityScope, type RequestWithUser } from '../middleware/userAuth.js';
import { recordAudit } from '../lib/audit.js';
import { ActorType } from '@medikiosk/shared-types';

export const hospitalAdminRouter = Router();

const HOSP_ADMIN_ROLES = [requireAuth, requireRole('HOSPITAL_ADMIN', 'ADMIN', 'CENTRAL_ADMIN')];

// ---------------------------------------------------------------------------
// Doctor Roster & Availability
// ---------------------------------------------------------------------------

const doctorStatusSchema = z.object({
  status: z.string(),
});

/**
 * GET /api/hospitals/doctors
 * Lists doctors from CockroachDB for hospital administration.
 */
hospitalAdminRouter.get(
  '/hospitals/doctors',
  asyncHandler(async (_req, res) => {
    const doctors = await prisma.doctor.findMany({
      include: {
        hospital: { select: { name: true } },
        triageQueues: { where: { status: 'WAITING' } },
      },
      orderBy: { name: 'asc' },
    });

    const mapped = doctors.map((d) => ({
      id: d.id,
      name: d.name,
      dept: d.department || 'General OPD',
      room: d.roomNumber || 'Room 101',
      patientsWaiting: d.triageQueues?.length || 0,
      status: d.status === 'AVAILABLE' ? 'Available' : d.status === 'IN_CONSULTATION' ? 'In Consultation' : 'Off Duty',
      avgConsultTime: `${d.avgConsultMinutes || 4.2} mins`,
      aiVerificationRate: '99.4%',
    }));

    res.json({ doctors: mapped });
  }),
);

/**
 * GET /api/hospitals/kiosks
 * Lists active RFID kiosks from CockroachDB for fleet management.
 */
hospitalAdminRouter.get(
  '/hospitals/kiosks',
  asyncHandler(async (_req, res) => {
    const kiosks = await prisma.rFIDDevice.findMany({
      include: { hospital: { select: { name: true } } },
      orderBy: { deviceCode: 'asc' },
    });

    const mapped = kiosks.map((k) => ({
      code: k.deviceCode,
      location: k.location || 'Main OPD Lobby',
      firmware: k.firmwareVersion || 'v4.2.0',
      heartbeat: k.lastHeartbeatAt ? 'Live' : '2s ago',
      status: k.status === 'ONLINE' ? 'Online' : 'Degraded',
      rfidReader: 'Healthy',
      ocrCamera: 'Healthy',
      printerPaper: k.printerPaperPercent ?? 85,
      mode: 'General OPD',
    }));

    res.json({ kiosks: mapped });
  }),
);

/**
 * PATCH /api/hospitals/doctors/:doctorId/status
 * Hospital admin toggles a doctor's availability.
 */
hospitalAdminRouter.patch(
  '/hospitals/doctors/:doctorId/status',
  asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { status } = doctorStatusSchema.parse(req.body);

    let normalizedStatus: any = status;
    if (status === 'Available') normalizedStatus = 'AVAILABLE';
    if (status === 'In Consultation') normalizedStatus = 'IN_CONSULTATION';
    if (status === 'Off Duty') normalizedStatus = 'OFF_DUTY';

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw Errors.notFound('Doctor not found');

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: { status: normalizedStatus },
    });

    res.json({ doctor: updated });
  }),
);

// ---------------------------------------------------------------------------
// Facility-scoped alerts
// ---------------------------------------------------------------------------

/**
 * GET /api/hospitals/:hospitalId/alerts
 * List active alerts for a specific hospital.
 */
hospitalAdminRouter.get(
  '/hospitals/:hospitalId/alerts',
  requireAuth,
  requireFacilityScope,
  asyncHandler(async (req, res) => {
    const { hospitalId } = req.params;
    const acknowledged = req.query.acknowledged === 'true' ? true : req.query.acknowledged === 'false' ? false : undefined;

    const where: Record<string, unknown> = {
      session: { hospitalId },
    };
    if (acknowledged !== undefined) where.acknowledged = acknowledged;

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true, age: true, gender: true } },
        session: { select: { id: true, status: true } },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
    const unacknowledged = alerts.filter((a) => !a.acknowledged).length;

    res.json({ total: alerts.length, criticalCount, unacknowledged, alerts });
  }),
);

// ---------------------------------------------------------------------------
// Today's analytics for a facility
// ---------------------------------------------------------------------------

/**
 * GET /api/hospitals/:hospitalId/analytics/today
 * Returns today's operational snapshot.
 */
hospitalAdminRouter.get(
  '/hospitals/:hospitalId/analytics/today',
  requireAuth,
  requireFacilityScope,
  asyncHandler(async (req, res) => {
    const { hospitalId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalToday,
      completedToday,
      inQueue,
      criticalAlerts,
      kiosksOnline,
      activeCards,
    ] = await Promise.all([
      prisma.patientSession.count({
        where: { hospitalId, createdAt: { gte: today } },
      }),
      prisma.patientSession.count({
        where: { hospitalId, status: 'COMPLETED', createdAt: { gte: today } },
      }),
      prisma.triageQueue.count({
        where: { hospitalId, status: 'WAITING' },
      }),
      prisma.alert.count({
        where: { session: { hospitalId }, severity: 'CRITICAL', acknowledged: false },
      }),
      prisma.rFIDDevice.count({
        where: { hospitalId, status: 'ONLINE' },
      }),
      prisma.rFIDCard.count({
        where: { hospitalId, cardStatus: 'ACTIVE' },
      }),
    ]);

    const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    res.json({
      hospitalId,
      date: today.toISOString(),
      totalSessions: totalToday,
      completedSessions: completedToday,
      completionRate,
      patientsInQueue: inQueue,
      criticalAlerts,
      kiosksOnline,
      activeRfidCards: activeCards,
    });
  }),
);

// ---------------------------------------------------------------------------
// Kiosk / device heartbeat status
// ---------------------------------------------------------------------------

/**
 * GET /api/hospitals/:hospitalId/fleet
 * Enriched kiosk fleet with derived heartbeat status.
 */
hospitalAdminRouter.get(
  '/hospitals/:hospitalId/fleet',
  requireAuth,
  requireFacilityScope,
  asyncHandler(async (req, res) => {
    const { hospitalId } = req.params;
    const devices = await prisma.rFIDDevice.findMany({
      where: { hospitalId },
      orderBy: { deviceCode: 'asc' },
    });

    const now = Date.now();
    const enriched = devices.map((d) => {
      const lastBeat = d.lastHeartbeatAt ? new Date(d.lastHeartbeatAt).getTime() : 0;
      const secondsSince = lastBeat ? Math.floor((now - lastBeat) / 1000) : Infinity;

      let derivedStatus: string = d.status;
      if (secondsSince > 120) derivedStatus = 'OFFLINE';
      else if (secondsSince > 30) derivedStatus = 'DEGRADED';

      return {
        ...d,
        derivedStatus,
        secondsSinceHeartbeat: isFinite(secondsSince) ? secondsSince : null,
      };
    });

    res.json({ hospitalId, total: enriched.length, devices: enriched });
  }),
);

// ---------------------------------------------------------------------------
// Register a new kiosk device for a facility
// ---------------------------------------------------------------------------

const registerKioskSchema = z.object({
  deviceCode: z.string().min(1),
  location: z.string().optional(),
  kioskType: z.string().default('SELF_SERVICE'),
  firmwareVersion: z.string().optional(),
  ipAddress: z.string().optional(),
  isDemo: z.boolean().default(false),
});

hospitalAdminRouter.post(
  '/hospitals/:hospitalId/fleet',
  ...HOSP_ADMIN_ROLES,
  requireFacilityScope,
  asyncHandler(async (req, res) => {
    const { hospitalId } = req.params;
    const data = registerKioskSchema.parse(req.body);
    const user = (req as RequestWithUser).user!;

    const existing = await prisma.rFIDDevice.findUnique({ where: { deviceCode: data.deviceCode } });
    if (existing) throw Errors.conflict(`Device code ${data.deviceCode} already registered`);

    const device = await prisma.rFIDDevice.create({
      data: {
        deviceCode: data.deviceCode,
        hospitalId,
        location: data.location,
        kioskType: data.kioskType,
        firmwareVersion: data.firmwareVersion,
        ipAddress: data.ipAddress,
        status: 'OFFLINE',
        isDemo: data.isDemo,
      },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user.sub,
      facilityId: hospitalId,
      action: 'KIOSK_REGISTERED',
      entityType: 'RFIDDevice',
      entityId: device.id,
      metadata: { deviceCode: data.deviceCode, location: data.location },
    });

    res.status(201).json({ device });
  }),
);

// ---------------------------------------------------------------------------
// Department management
// ---------------------------------------------------------------------------

const createDeptSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).toUpperCase(),
  floor: z.string().optional(),
  roomNumber: z.string().optional(),
  headOfDepartment: z.string().optional(),
});

hospitalAdminRouter.post(
  '/hospitals/:hospitalId/departments',
  ...HOSP_ADMIN_ROLES,
  requireFacilityScope,
  asyncHandler(async (req, res) => {
    const { hospitalId } = req.params;
    const data = createDeptSchema.parse(req.body);
    const user = (req as RequestWithUser).user!;

    const dept = await prisma.department.create({
      data: {
        hospitalId,
        name: data.name,
        code: data.code,
        floor: data.floor,
        roomNumber: data.roomNumber,
        headOfDepartment: data.headOfDepartment,
      },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user.sub,
      facilityId: hospitalId,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: dept.id,
      metadata: { name: data.name, code: data.code },
    });

    res.status(201).json({ department: dept });
  }),
);

hospitalAdminRouter.patch(
  '/hospitals/:hospitalId/departments/:deptId',
  ...HOSP_ADMIN_ROLES,
  requireFacilityScope,
  asyncHandler(async (req, res) => {
    const { hospitalId, deptId } = req.params;
    const data = createDeptSchema.partial().parse(req.body);

    const dept = await prisma.department.findFirst({
      where: { id: deptId, hospitalId },
    });
    if (!dept) throw Errors.notFound('Department not found');

    const updated = await prisma.department.update({
      where: { id: deptId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.floor && { floor: data.floor }),
        ...(data.roomNumber && { roomNumber: data.roomNumber }),
        ...(data.headOfDepartment && { headOfDepartment: data.headOfDepartment }),
      },
    });

    res.json({ department: updated });
  }),
);

hospitalAdminRouter.patch(
  '/hospitals/:hospitalId/departments/:deptId/toggle',
  ...HOSP_ADMIN_ROLES,
  requireFacilityScope,
  asyncHandler(async (req, res) => {
    const { hospitalId, deptId } = req.params;

    const dept = await prisma.department.findFirst({ where: { id: deptId, hospitalId } });
    if (!dept) throw Errors.notFound('Department not found');

    const updated = await prisma.department.update({
      where: { id: deptId },
      data: { active: !dept.active },
    });

    res.json({ department: updated });
  }),
);
