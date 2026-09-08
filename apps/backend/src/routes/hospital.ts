import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireFacilityScope, requireRole, type RequestWithUser } from '../middleware/userAuth.js';
import { env } from '../lib/env.js';
import { recordAudit } from '../lib/audit.js';
import { wsHub } from '../ws/hub.js';
import { Errors } from '../lib/errors.js';
import { ActorType } from '@medikiosk/shared-types';

export const hospitalRouter = Router();

const allowDemoOrAdmin = (req: any, res: any, next: any) => {
  if (!req.header('Authorization') && env.DEMO_MODE) {
    req.user = {
      sub: 'demo-central-admin',
      role: 'CENTRAL_ADMIN',
      name: 'Demo Central Administrator',
      facilityId: null,
    };
    return next();
  }
  return requireAuth(req, res, () => {
    requireRole('CENTRAL_ADMIN', 'ADMIN', 'HOSPITAL_ADMIN')(req, res, next);
  });
};

const hospitalCreateSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  type: z.enum(['AIIMS', 'TERTIARY_HOSPITAL', 'DISTRICT_HOSPITAL', 'COMMUNITY_HEALTH_CENTRE', 'PRIMARY_HEALTH_CENTRE', 'PRIVATE_HOSPITAL']).default('DISTRICT_HOSPITAL'),
  state: z.string().min(1),
  district: z.string().min(1),
  city: z.string().min(1),
  pinCode: z.string().optional(),
  address: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  totalBeds: z.number().int().min(0).default(100),
  availableBeds: z.number().int().min(0).default(20),
  totalKiosks: z.number().int().min(0).default(2),
  activeKiosks: z.number().int().min(0).default(2),
  abdmFacilityId: z.string().optional().or(z.literal('')),
  facilityStatus: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'REJECTED']).default('PENDING_APPROVAL'),
});

const hospitalUpdateSchema = hospitalCreateSchema.partial();

/**
 * GET /api/hospitals
 * Returns all registered health facilities with filtering, search, status, and pagination.
 */
hospitalRouter.get('/hospitals', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { search, state, district, status, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (state && typeof state === 'string') where.state = { contains: state, mode: 'insensitive' };
    if (district && typeof district === 'string') where.district = { contains: district, mode: 'insensitive' };
    if (status && typeof status === 'string' && status !== 'All') {
      where.facilityStatus = status as any;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, hospitals] = await Promise.all([
      prisma.hospital.count({ where }),
      prisma.hospital.findMany({
        where,
        include: {
          _count: {
            select: {
              departments: true,
              doctors: true,
              kiosks: true,
              sessions: true,
              triageQueues: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    res.json({
      total,
      page: pageNum,
      limit: limitNum,
      facilities: hospitals,
      hospitals,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals
 * Central Admin registers or onboards a new hospital application
 */
hospitalRouter.post('/hospitals', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const data = hospitalCreateSchema.parse(req.body);
    const user = (req as RequestWithUser).user;

    const existing = await prisma.hospital.findUnique({ where: { code: data.code } });
    if (existing) {
      throw Errors.conflict(`Facility code ${data.code} is already registered.`);
    }

    const hospital = await prisma.hospital.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        state: data.state,
        district: data.district,
        city: data.city,
        pinCode: data.pinCode,
        address: data.address,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail || null,
        totalBeds: data.totalBeds,
        availableBeds: data.availableBeds,
        totalKiosks: data.totalKiosks,
        activeKiosks: data.activeKiosks,
        abdmFacilityId: data.abdmFacilityId || null,
        facilityStatus: data.facilityStatus,
      },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user?.sub,
      facilityId: hospital.id,
      action: 'HOSPITAL_ONBOARDED',
      entityType: 'Hospital',
      entityId: hospital.id,
      metadata: { code: hospital.code, name: hospital.name, status: hospital.facilityStatus },
    });

    wsHub.broadcast({
      type: 'HOSPITAL_STATUS_CHANGED',
      payload: {
        hospitalId: hospital.id,
        code: hospital.code,
        name: hospital.name,
        status: hospital.facilityStatus,
        timestamp: new Date().toISOString(),
      },
    });

    res.status(201).json({ success: true, hospital, facility: hospital });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id
 * Get single hospital facility details
 */
hospitalRouter.get('/hospitals/:id', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        departments: true,
        doctors: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            roomNumber: true,
            status: true,
            avgConsultMinutes: true,
          },
        },
        kiosks: true,
        _count: {
          select: {
            departments: true,
            doctors: true,
            kiosks: true,
            sessions: true,
            triageQueues: true,
          },
        },
      },
    });

    if (!hospital) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hospital facility not found' } });
      return;
    }

    res.json({ hospital });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/hospitals/:id
 * Update hospital facility profile
 */
hospitalRouter.patch('/hospitals/:id', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = hospitalUpdateSchema.parse(req.body);
    const user = (req as RequestWithUser).user;

    const hospital = await prisma.hospital.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.state && { state: data.state }),
        ...(data.district && { district: data.district }),
        ...(data.city && { city: data.city }),
        ...(data.pinCode !== undefined && { pinCode: data.pinCode }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail || null }),
        ...(data.totalBeds !== undefined && { totalBeds: data.totalBeds }),
        ...(data.availableBeds !== undefined && { availableBeds: data.availableBeds }),
        ...(data.totalKiosks !== undefined && { totalKiosks: data.totalKiosks }),
        ...(data.activeKiosks !== undefined && { activeKiosks: data.activeKiosks }),
        ...(data.abdmFacilityId !== undefined && { abdmFacilityId: data.abdmFacilityId || null }),
        ...(data.facilityStatus && { facilityStatus: data.facilityStatus }),
      },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user?.sub,
      facilityId: hospital.id,
      action: 'HOSPITAL_UPDATED',
      entityType: 'Hospital',
      entityId: hospital.id,
      metadata: { fieldsUpdated: Object.keys(data) },
    });

    res.json({ success: true, hospital });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals/:id/approve
 * Approves a hospital application -> status becomes ACTIVE
 */
hospitalRouter.post('/hospitals/:id/approve', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = (req as RequestWithUser).user;

    const hospital = await prisma.hospital.update({
      where: { id },
      data: { facilityStatus: 'ACTIVE' },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user?.sub,
      facilityId: hospital.id,
      action: 'HOSPITAL_APPROVED',
      entityType: 'Hospital',
      entityId: hospital.id,
      metadata: { status: 'ACTIVE' },
    });

    wsHub.broadcast({
      type: 'HOSPITAL_STATUS_CHANGED',
      payload: {
        hospitalId: hospital.id,
        code: hospital.code,
        name: hospital.name,
        status: 'ACTIVE',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, hospital });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals/:id/reject
 * Rejects a hospital application with reason
 */
hospitalRouter.post('/hospitals/:id/reject', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Compliance criteria not met' } = req.body;
    const user = (req as RequestWithUser).user;

    const hospital = await prisma.hospital.update({
      where: { id },
      data: { facilityStatus: 'REJECTED' },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user?.sub,
      facilityId: hospital.id,
      action: 'HOSPITAL_REJECTED',
      entityType: 'Hospital',
      entityId: hospital.id,
      metadata: { reason, status: 'REJECTED' },
    });

    wsHub.broadcast({
      type: 'HOSPITAL_STATUS_CHANGED',
      payload: {
        hospitalId: hospital.id,
        code: hospital.code,
        name: hospital.name,
        status: 'REJECTED',
        reason,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, hospital });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals/:id/suspend
 * Suspends an active hospital with reason
 */
hospitalRouter.post('/hospitals/:id/suspend', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Administrative review' } = req.body;
    const user = (req as RequestWithUser).user;

    const hospital = await prisma.hospital.update({
      where: { id },
      data: { facilityStatus: 'SUSPENDED' },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user?.sub,
      facilityId: hospital.id,
      action: 'HOSPITAL_SUSPENDED',
      entityType: 'Hospital',
      entityId: hospital.id,
      metadata: { reason, status: 'SUSPENDED' },
    });

    wsHub.broadcast({
      type: 'HOSPITAL_STATUS_CHANGED',
      payload: {
        hospitalId: hospital.id,
        code: hospital.code,
        name: hospital.name,
        status: 'SUSPENDED',
        reason,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, hospital });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals/:id/reactivate
 * Reactivates a suspended hospital
 */
hospitalRouter.post('/hospitals/:id/reactivate', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = (req as RequestWithUser).user;

    const hospital = await prisma.hospital.update({
      where: { id },
      data: { facilityStatus: 'ACTIVE' },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user?.sub,
      facilityId: hospital.id,
      action: 'HOSPITAL_REACTIVATED',
      entityType: 'Hospital',
      entityId: hospital.id,
      metadata: { status: 'ACTIVE' },
    });

    wsHub.broadcast({
      type: 'HOSPITAL_STATUS_CHANGED',
      payload: {
        hospitalId: hospital.id,
        code: hospital.code,
        name: hospital.name,
        status: 'ACTIVE',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, hospital });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals/:hospitalId/doctors
 * Hospital Admin or Central Admin adds a doctor to the facility
 */
const doctorCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).default('MediKiosk@123'),
  departmentId: z.string().optional(),
  department: z.string().optional(),
  roomNumber: z.string().optional().default('OPD Room 101'),
  qualification: z.string().optional().default('MBBS, MD'),
  registrationNumber: z.string().optional(),
  avgConsultMinutes: z.number().default(4.5),
});

hospitalRouter.post('/hospitals/:hospitalId/doctors', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const data = doctorCreateSchema.parse(req.body);
    const user = (req as RequestWithUser).user;

    const existing = await prisma.doctor.findUnique({ where: { email: data.email } });
    if (existing) {
      throw Errors.conflict(`Doctor with email ${data.email} already exists`);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const doctor = await prisma.doctor.create({
      data: {
        hospitalId,
        departmentId: data.departmentId || null,
        name: data.name,
        email: data.email,
        passwordHash,
        department: data.department || 'General Medicine',
        roomNumber: data.roomNumber,
        qualification: data.qualification,
        registrationNumber: data.registrationNumber || `MCI-${Math.floor(10000 + Math.random() * 90000)}`,
        avgConsultMinutes: data.avgConsultMinutes,
        status: 'AVAILABLE',
      },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user?.sub,
      facilityId: hospitalId,
      action: 'DOCTOR_CREATED',
      entityType: 'Doctor',
      entityId: doctor.id,
      metadata: { name: doctor.name, email: doctor.email, department: doctor.department },
    });

    wsHub.broadcast({
      type: 'DOCTOR_STATUS_CHANGED',
      payload: {
        doctorId: doctor.id,
        doctorName: doctor.name,
        hospitalId,
        status: 'AVAILABLE',
        timestamp: new Date().toISOString(),
      },
    });

    res.status(201).json({ success: true, doctor });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id/overview
 * Executive metrics for a specific hospital (Hospital Admin dashboard)
 */
hospitalRouter.get('/hospitals/:id/overview', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        departments: {
          include: {
            doctors: {
              select: {
                id: true,
                name: true,
                status: true,
                roomNumber: true,
                avgConsultMinutes: true,
              },
            },
          },
        },
        kiosks: {
          orderBy: { location: 'asc' },
        },
      },
    });

    if (!hospital) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hospital facility not found' } });
      return;
    }

    // Live Queue Counts
    const queueStats = await prisma.triageQueue.groupBy({
      by: ['status', 'priority'],
      where: { hospitalId: id },
      _count: { id: true },
    });

    // Today's Intake Volume
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessionsCount = await prisma.patientSession.count({
      where: {
        hospitalId: id,
        createdAt: { gte: today },
      },
    });

    res.json({
      hospital,
      queueStats,
      todaySessionsCount,
      bedOccupancyRate: Math.round(((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds) * 100),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id/departments
 * Departments with doctors and active queue
 */
hospitalRouter.get('/hospitals/:id/departments', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const departments = await prisma.department.findMany({
      where: { hospitalId: id },
      include: {
        doctors: {
          select: {
            id: true,
            name: true,
            status: true,
            roomNumber: true,
          },
        },
        _count: {
          select: {
            triageQueues: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ departments });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id/doctors
 * Doctors roster for this facility
 */
hospitalRouter.get('/hospitals/:id/doctors', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctors = await prisma.doctor.findMany({
      where: { hospitalId: id },
      include: {
        departmentRel: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ doctors });
  } catch (err) {
    next(err);
  }
});


/**
 * GET /api/hospitals/:id/kiosks
 * Kiosk fleet health for Hospital Admin
 */
hospitalRouter.get('/hospitals/:id/kiosks', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const kiosks = await prisma.rFIDDevice.findMany({
      where: { hospitalId: id },
      orderBy: { deviceCode: 'asc' },
    });

    res.json({ kiosks });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals/:id/departments
 * Create a new department for a hospital
 */
const departmentCreateSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(10).toUpperCase(),
  floor: z.string().optional().default('Ground Floor'),
  roomNumber: z.string().optional().default('Room 101'),
  headOfDepartment: z.string().optional(),
});

hospitalRouter.post('/hospitals/:id/departments', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = departmentCreateSchema.parse(req.body);
    const user = (req as RequestWithUser).user;

    const existing = await prisma.department.findUnique({
      where: { hospitalId_code: { hospitalId: id, code: data.code } },
    });
    if (existing) {
      throw Errors.conflict(`Department with code ${data.code} already exists in this hospital`);
    }

    const department = await prisma.department.create({
      data: {
        hospitalId: id,
        name: data.name,
        code: data.code,
        floor: data.floor,
        roomNumber: data.roomNumber,
        headOfDepartment: data.headOfDepartment,
        active: true,
      },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user?.sub,
      facilityId: id,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: department.id,
      metadata: { name: department.name, code: department.code },
    });

    res.status(201).json({ success: true, department });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/hospitals/:id/departments/:deptId
 * Update department status or details
 */
hospitalRouter.patch('/hospitals/:id/departments/:deptId', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id, deptId } = req.params;
    const { name, floor, roomNumber, headOfDepartment, active } = req.body;
    const user = (req as RequestWithUser).user;

    const department = await prisma.department.update({
      where: { id: deptId },
      data: {
        ...(name !== undefined && { name }),
        ...(floor !== undefined && { floor }),
        ...(roomNumber !== undefined && { roomNumber }),
        ...(headOfDepartment !== undefined && { headOfDepartment }),
        ...(active !== undefined && { active }),
      },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user?.sub,
      facilityId: id,
      action: 'DEPARTMENT_UPDATED',
      entityType: 'Department',
      entityId: department.id,
      metadata: { active: department.active, name: department.name },
    });

    res.json({ success: true, department });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals/:id/kiosks
 * Register or onboard a new terminal to this hospital
 */
const kioskCreateSchema = z.object({
  deviceCode: z.string().min(3).toUpperCase(),
  location: z.string().min(2),
  kioskType: z.string().default('SELF_SERVICE'),
  firmwareVersion: z.string().default('v4.2.0'),
  ipAddress: z.string().optional().default('10.0.4.12'),
  printerPaperPercent: z.number().min(0).max(100).default(100),
});

hospitalRouter.post('/hospitals/:id/kiosks', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = kioskCreateSchema.parse(req.body);
    const user = (req as RequestWithUser).user;

    const existing = await prisma.rFIDDevice.findUnique({
      where: { deviceCode: data.deviceCode },
    });
    if (existing) {
      throw Errors.conflict(`Kiosk with code ${data.deviceCode} already registered`);
    }

    const kiosk = await prisma.rFIDDevice.create({
      data: {
        hospitalId: id,
        deviceCode: data.deviceCode,
        location: data.location,
        kioskType: data.kioskType,
        firmwareVersion: data.firmwareVersion,
        ipAddress: data.ipAddress,
        printerPaperPercent: data.printerPaperPercent,
        status: 'ONLINE',
      },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user?.sub,
      facilityId: id,
      action: 'KIOSK_REGISTERED',
      entityType: 'RFIDDevice',
      entityId: kiosk.id,
      metadata: { deviceCode: kiosk.deviceCode, location: kiosk.location },
    });

    wsHub.broadcast({
      type: 'KIOSK_STATUS_CHANGED',
      payload: {
        deviceId: kiosk.id,
        deviceCode: kiosk.deviceCode,
        hospitalId: id,
        status: 'ONLINE',
        location: kiosk.location || undefined,
        timestamp: new Date().toISOString(),
      },
    });

    res.status(201).json({ success: true, kiosk });
  } catch (err) {
    next(err);
  }
});

