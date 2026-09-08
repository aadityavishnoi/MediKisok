import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/userAuth.js';

export const queueRouter = Router();

/**
 * POST /api/queue/ticket
 * Kiosk issues OPD ticket / queue token upon finishing self-service intake
 */
queueRouter.post('/queue/ticket', async (req, res, next) => {
  try {
    const { sessionId, patientId, hospitalId, departmentCode, priority } = req.body;

    if (!sessionId || !patientId) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'sessionId and patientId are required' } });
      return;
    }

    // Resolve hospital (fallback to first available hospital if none provided)
    let targetHospitalId = hospitalId;
    if (!targetHospitalId) {
      const firstHosp = await prisma.hospital.findFirst({ select: { id: true } });
      targetHospitalId = firstHosp?.id;
    }

    // Resolve department
    let departmentId: string | undefined = undefined;
    if (departmentCode && targetHospitalId) {
      const dept = await prisma.department.findUnique({
        where: {
          hospitalId_code: {
            hospitalId: targetHospitalId,
            code: departmentCode,
          },
        },
      });
      if (dept) departmentId = dept.id;
    }

    // Count today's queue to generate token number like "CARD-102"
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const countToday = await prisma.triageQueue.count({
      where: {
        queuedAt: { gte: today },
      },
    });

    const prefix = departmentCode ? departmentCode.slice(0, 4).toUpperCase() : 'OPD';
    const tokenNumber = `${prefix}-${101 + countToday}`;

    const triageQueue = await prisma.triageQueue.create({
      data: {
        sessionId,
        patientId,
        hospitalId: targetHospitalId!,
        departmentId,
        tokenNumber,
        priority: priority === 'EMERGENCY' ? 'EMERGENCY' : priority === 'URGENT' ? 'URGENT' : 'NORMAL',
        status: 'WAITING',
        estimatedWaitMins: priority === 'EMERGENCY' ? 0 : 15,
      },
    });

    // Also update session status to ROUTED
    await prisma.patientSession.update({
      where: { id: sessionId },
      data: { status: 'ROUTED' },
    });

    res.json({
      ticket: triageQueue,
      tokenNumber,
      estimatedWaitMins: triageQueue.estimatedWaitMins,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/queue/doctor/:doctorId
 * Doctor retrieves their live OPD queue line
 */
queueRouter.get('/queue/doctor/:doctorId', requireAuth, async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { departmentId: true, hospitalId: true },
    });

    const queue = await prisma.triageQueue.findMany({
      where: {
        OR: [
          { doctorId },
          {
            departmentId: doctor?.departmentId || undefined,
            status: 'WAITING',
          },
        ],
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            age: true,
            gender: true,
            bloodGroup: true,
            phone: true,
            abhaId: true,
          },
        },
        session: {
          include: {
            clinicalHistory: true,
            aiSummary: true,
            documents: {
              select: {
                id: true,
                type: true,
                storagePath: true,
                ocrConfidence: true,
              },
            },
            alerts: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // EMERGENCY first
        { queuedAt: 'asc' },
      ],
    });

    res.json({
      total: queue.length,
      queue,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/queue/:id/call
 * Doctor calls patient into consultation room
 */
queueRouter.patch('/queue/:id/call', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { doctorId } = req.body;

    const updated = await prisma.triageQueue.update({
      where: { id },
      data: {
        status: 'IN_CONSULTATION',
        doctorId,
        calledAt: new Date(),
      },
    });

    // Update session status to IN_CONSULT
    await prisma.patientSession.update({
      where: { id: updated.sessionId },
      data: { status: 'IN_CONSULT' },
    });

    res.json({ success: true, queueItem: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/queue/:id/complete
 * Mark consultation completed
 */
queueRouter.patch('/queue/:id/complete', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.triageQueue.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await prisma.patientSession.update({
      where: { id: updated.sessionId },
      data: { status: 'COMPLETED' },
    });

    res.json({ success: true, queueItem: updated });
  } catch (err) {
    next(err);
  }
});
