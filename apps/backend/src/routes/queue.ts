import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/userAuth.js';
import { wsHub } from '../ws/hub.js';
import { env } from '../lib/env.js';

export const queueRouter = Router();

const allowDemoOrAuth = (req: any, res: any, next: any) => {
  if (!req.header('Authorization') && env.DEMO_MODE) {
    req.user = {
      sub: 'demo-user',
      role: 'HOSPITAL_ADMIN',
      name: 'Demo Operator',
      facilityId: null,
    };
    return next();
  }
  return requireAuth(req, res, next);
};

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

    if (!targetHospitalId) {
      res.status(400).json({ error: { code: 'NO_HOSPITAL', message: 'No registered hospital facility found.' } });
      return;
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
        hospitalId: targetHospitalId,
        queuedAt: { gte: today },
      },
    });

    const prefix = departmentCode ? departmentCode.slice(0, 4).toUpperCase() : 'OPD';
    const tokenNumber = `${prefix}-${101 + countToday}`;
    const priorityVal = priority === 'EMERGENCY' ? 'EMERGENCY' : priority === 'URGENT' ? 'URGENT' : 'NORMAL';

    const triageQueue = await prisma.triageQueue.create({
      data: {
        sessionId,
        patientId,
        hospitalId: targetHospitalId,
        departmentId,
        tokenNumber,
        priority: priorityVal as any,
        status: 'WAITING',
        estimatedWaitMins: priorityVal === 'EMERGENCY' ? 0 : 15,
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            gender: true,
            age: true,
            abhaId: true,
          },
        },
      },
    });

    // Update session status to ROUTED
    await prisma.patientSession.update({
      where: { id: sessionId },
      data: { status: 'ROUTED' },
    });

    // Broadcast WebSocket event to Hospital Admin & Doctor station
    wsHub.broadcastToFacility(targetHospitalId, {
      type: 'PATIENT_QUEUE_ADDED',
      payload: {
        queueId: triageQueue.id,
        tokenNumber,
        hospitalId: targetHospitalId,
        patientId,
        patientName: triageQueue.patient?.fullName,
        departmentId,
        priority: priorityVal,
        status: 'WAITING',
        estimatedWaitMins: triageQueue.estimatedWaitMins,
        timestamp: new Date().toISOString(),
      },
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
 * GET /api/queues
 * Lists active and historical queue entries with filters (hospitalId, departmentId, doctorId, status)
 */
queueRouter.get('/queues', allowDemoOrAuth, async (req, res, next) => {
  try {
    const { hospitalId, departmentId, doctorId, status } = req.query;

    const where: any = {};
    if (hospitalId && typeof hospitalId === 'string') where.hospitalId = hospitalId;
    if (departmentId && typeof departmentId === 'string') where.departmentId = departmentId;
    if (doctorId && typeof doctorId === 'string') where.doctorId = doctorId;
    if (status && typeof status === 'string' && status !== 'All') {
      where.status = status as any;
    }

    const queue = await prisma.triageQueue.findMany({
      where,
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
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // EMERGENCY first
        { queuedAt: 'asc' },
      ],
      take: 100,
    });

    res.json({ queue, total: queue.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/queue/doctor/:doctorId
 * Doctor retrieves their live OPD queue line
 */
queueRouter.get('/queue/doctor/:doctorId', allowDemoOrAuth, async (req, res, next) => {
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
 * POST /api/queues/:id/call-next
 * Doctor or Nurse calls next patient to consultation room
 */
queueRouter.post('/queues/:id/call-next', allowDemoOrAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { doctorId } = req.body;

    const existing = await prisma.triageQueue.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Queue item not found' } });
      return;
    }

    const assignedDoctorId = doctorId || existing.doctorId;

    const updated = await prisma.triageQueue.update({
      where: { id },
      data: {
        status: 'CALLED',
        doctorId: assignedDoctorId,
        calledAt: new Date(),
      },
      include: {
        doctor: { select: { id: true, name: true, roomNumber: true } },
        patient: { select: { id: true, fullName: true } },
      },
    });

    wsHub.broadcastToFacility(updated.hospitalId, {
      type: 'QUEUE_CALLED',
      payload: {
        queueId: updated.id,
        tokenNumber: updated.tokenNumber,
        doctorId: assignedDoctorId || '',
        doctorName: updated.doctor?.name,
        roomNumber: updated.doctor?.roomNumber || 'Room 101',
        hospitalId: updated.hospitalId,
        timestamp: new Date().toISOString(),
      },
    });

    wsHub.broadcastToFacility(updated.hospitalId, {
      type: 'QUEUE_UPDATED',
      payload: {
        queueId: updated.id,
        hospitalId: updated.hospitalId,
        status: 'CALLED',
        doctorId: assignedDoctorId,
        tokenNumber: updated.tokenNumber,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, item: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queues/:id/in-consultation
 * Mark patient entry as actively in consultation
 */
queueRouter.post('/queues/:id/in-consultation', allowDemoOrAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.triageQueue.update({
      where: { id },
      data: {
        status: 'IN_CONSULTATION',
      },
    });

    await prisma.patientSession.update({
      where: { id: updated.sessionId },
      data: { status: 'IN_CONSULT' },
    });

    wsHub.broadcastToFacility(updated.hospitalId, {
      type: 'QUEUE_UPDATED',
      payload: {
        queueId: updated.id,
        hospitalId: updated.hospitalId,
        status: 'IN_CONSULTATION',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, item: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queues/:id/transfer
 * Transfer patient to another doctor or department
 */
queueRouter.post('/queues/:id/transfer', allowDemoOrAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { doctorId, departmentId } = req.body;

    const updated = await prisma.triageQueue.update({
      where: { id },
      data: {
        ...(doctorId && { doctorId }),
        ...(departmentId && { departmentId }),
        status: 'WAITING',
      },
    });

    wsHub.broadcastToFacility(updated.hospitalId, {
      type: 'QUEUE_UPDATED',
      payload: {
        queueId: updated.id,
        hospitalId: updated.hospitalId,
        status: 'WAITING',
        doctorId: updated.doctorId,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, item: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queues/:id/reprioritize
 * Emergency override / triage reprioritization
 */
queueRouter.post('/queues/:id/reprioritize', allowDemoOrAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const priorityVal = priority === 'EMERGENCY' ? 'EMERGENCY' : priority === 'URGENT' ? 'URGENT' : 'NORMAL';

    const updated = await prisma.triageQueue.update({
      where: { id },
      data: {
        priority: priorityVal as any,
        estimatedWaitMins: priorityVal === 'EMERGENCY' ? 0 : 15,
      },
    });

    wsHub.broadcastToFacility(updated.hospitalId, {
      type: 'QUEUE_UPDATED',
      payload: {
        queueId: updated.id,
        hospitalId: updated.hospitalId,
        status: updated.status,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, item: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queues/:id/no-show
 * Mark patient as no-show
 */
queueRouter.post('/queues/:id/no-show', allowDemoOrAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.triageQueue.update({
      where: { id },
      data: {
        status: 'NO_SHOW',
      },
    });

    wsHub.broadcastToFacility(updated.hospitalId, {
      type: 'QUEUE_UPDATED',
      payload: {
        queueId: updated.id,
        hospitalId: updated.hospitalId,
        status: 'NO_SHOW',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, item: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queues/:id/cancel
 * Cancel queue entry
 */
queueRouter.post('/queues/:id/cancel', allowDemoOrAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.triageQueue.update({
      where: { id },
      data: {
        status: 'NO_SHOW',
      },
    });

    wsHub.broadcastToFacility(updated.hospitalId, {
      type: 'QUEUE_UPDATED',
      payload: {
        queueId: updated.id,
        hospitalId: updated.hospitalId,
        status: 'NO_SHOW',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, item: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/queue/:id/call (legacy alias)
 */
queueRouter.patch('/queue/:id/call', allowDemoOrAuth, async (req, res, next) => {
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
 * PATCH /api/queue/:id/complete (legacy alias)
 */
queueRouter.patch('/queue/:id/complete', allowDemoOrAuth, async (req, res, next) => {
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

/**
 * POST /api/queue/call-next (body-based alias)
 */
queueRouter.post('/queue/call-next', allowDemoOrAuth, async (req, res, next) => {
  try {
    const { ticketId, doctorId, roomNumber } = req.body;
    const existing = await prisma.triageQueue.findUnique({
      where: { id: ticketId },
      include: { doctor: true },
    });

    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Queue item not found' } });
      return;
    }

    const assignedDoctorId = doctorId || existing.doctorId;

    const updated = await prisma.triageQueue.update({
      where: { id: ticketId },
      data: {
        status: 'CALLED',
        doctorId: assignedDoctorId,
        calledAt: new Date(),
      },
      include: {
        doctor: { select: { id: true, name: true, roomNumber: true } },
        patient: { select: { id: true, fullName: true } },
      },
    });

    wsHub.broadcastToFacility(updated.hospitalId, {
      type: 'QUEUE_CALLED',
      payload: {
        queueId: updated.id,
        tokenNumber: updated.tokenNumber,
        doctorId: assignedDoctorId || '',
        doctorName: updated.doctor?.name,
        roomNumber: roomNumber || updated.doctor?.roomNumber || 'Room 101',
        hospitalId: updated.hospitalId,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, ticket: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queue/in-consultation (body-based alias)
 */
queueRouter.post('/queue/in-consultation', allowDemoOrAuth, async (req, res, next) => {
  try {
    const { ticketId } = req.body;
    const updated = await prisma.triageQueue.update({
      where: { id: ticketId },
      data: { status: 'IN_CONSULTATION' },
    });

    await prisma.patientSession.update({
      where: { id: updated.sessionId },
      data: { status: 'IN_CONSULT' },
    });

    wsHub.broadcastToFacility(updated.hospitalId, {
      type: 'QUEUE_UPDATED',
      payload: {
        queueId: updated.id,
        hospitalId: updated.hospitalId,
        status: 'IN_CONSULTATION',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, ticket: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queue/reprioritize (body-based alias)
 */
queueRouter.post('/queue/reprioritize', allowDemoOrAuth, async (req, res, next) => {
  try {
    const { ticketId, priority } = req.body;
    const priorityVal = priority === 'EMERGENCY' ? 'EMERGENCY' : priority === 'URGENT' ? 'URGENT' : 'NORMAL';

    const updated = await prisma.triageQueue.update({
      where: { id: ticketId },
      data: {
        priority: priorityVal as any,
        estimatedWaitMins: priorityVal === 'EMERGENCY' ? 0 : 15,
      },
    });

    wsHub.broadcastToFacility(updated.hospitalId, {
      type: 'QUEUE_UPDATED',
      payload: {
        queueId: updated.id,
        hospitalId: updated.hospitalId,
        status: updated.status,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, ticket: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queue/no-show (body-based alias)
 */
queueRouter.post('/queue/no-show', allowDemoOrAuth, async (req, res, next) => {
  try {
    const { ticketId } = req.body;
    const updated = await prisma.triageQueue.update({
      where: { id: ticketId },
      data: { status: 'NO_SHOW' },
    });

    wsHub.broadcastToFacility(updated.hospitalId, {
      type: 'QUEUE_UPDATED',
      payload: {
        queueId: updated.id,
        hospitalId: updated.hospitalId,
        status: 'NO_SHOW',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, ticket: updated });
  } catch (err) {
    next(err);
  }
});
