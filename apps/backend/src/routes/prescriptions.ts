import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const prescriptionsRouter = Router();

/**
 * POST /api/prescriptions
 * Doctor completes consultation and issues digital prescription
 */
prescriptionsRouter.post('/prescriptions', async (req, res, next) => {
  try {
    const { consultationId, patientId, doctorId, diagnosis, clinicalNotes, followUpDays, items } = req.body;

    if (!consultationId || !patientId || !doctorId || !diagnosis) {
      res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'consultationId, patientId, doctorId, and diagnosis are required' },
      });
      return;
    }

    const prescription = await prisma.prescription.create({
      data: {
        consultationId,
        patientId,
        doctorId,
        diagnosis,
        clinicalNotes,
        followUpDays: followUpDays || 7,
        items: {
          create: (items || []).map((item: any) => ({
            medicineName: item.medicineName,
            dosage: item.dosage || '1 Tablet',
            frequency: item.frequency || 'BD',
            durationDays: item.durationDays || 5,
            instructions: item.instructions || 'After food',
            timing: item.timing || 'Morning & Night',
          })),
        },
      },
      include: {
        items: true,
        doctor: {
          select: { name: true, department: true, roomNumber: true },
        },
      },
    });

    // Also add to patient's MedicalTimelineEvent
    await prisma.medicalTimelineEvent.create({
      data: {
        patientId,
        eventType: 'MEDICATION',
        title: `Prescription Issued: ${diagnosis}`,
        description: `Prescribed by ${prescription.doctor.name} (${prescription.doctor.department || 'OPD'}): ${(items || []).map((i: any) => i.medicineName).join(', ')}`,
        metadata: {
          prescriptionId: prescription.id,
          followUpDays: prescription.followUpDays,
        },
      },
    });

    // Mark consultation completed
    await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: clinicalNotes || diagnosis,
      },
    });

    res.json({ success: true, prescription });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/prescriptions/patient/:patientId
 * Historical prescriptions for a patient (Doctor Dashboard & Patient History)
 */
prescriptionsRouter.get('/prescriptions/patient/:patientId', async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: {
        items: true,
        doctor: {
          select: { name: true, department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ prescriptions });
  } catch (err) {
    next(err);
  }
});
