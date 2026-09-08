import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireFacilityScope, requireRole } from '../middleware/userAuth.js';

export const hospitalRouter = Router();

// Admins and doctors can read hospital data
const requireHospitalAccess = [requireAuth];

/**
 * GET /api/hospitals
 * Returns all registered health facilities (for Central Admin & multi-facility switcher)
 */
hospitalRouter.get('/hospitals', requireAuth, requireRole('CENTRAL_ADMIN', 'ADMIN', 'HOSPITAL_ADMIN'), async (_req, res, next) => {

  try {
    const hospitals = await prisma.hospital.findMany({
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
      orderBy: { name: 'asc' },
    });

    res.json({
      total: hospitals.length,
      facilities: hospitals,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id/overview
 * Executive metrics for a specific hospital (Hospital Admin dashboard)
 */
hospitalRouter.get('/hospitals/:id/overview', requireAuth, requireFacilityScope, async (req, res, next) => {
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
hospitalRouter.get('/hospitals/:id/departments', requireAuth, requireFacilityScope, async (req, res, next) => {
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
    });

    res.json({ departments });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id/kiosks
 * Kiosk fleet health for Hospital Admin
 */
hospitalRouter.get('/hospitals/:id/kiosks', requireAuth, requireFacilityScope, async (req, res, next) => {
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
