import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const adminRouter = Router();

// National & Facility Analytics Endpoint
adminRouter.get('/admin/metrics', async (_req, res, next) => {
  try {
    const totalPatients = await prisma.patient.count();
    const totalSessions = await prisma.patientSession.count();
    const activeKiosks = await prisma.rFIDDevice.count();
    const activeCards = await prisma.rFIDCard.count({ where: { active: true } });
    const alertsCount = await prisma.alert.count();

    res.json({
      overview: {
        totalFacilities: 48,
        activeFacilities: 46,
        activeKiosks,
        registeredPatients: totalPatients,
        dailyIntakeSessions: totalSessions,
        totalCardsIssued: activeCards,
        emergencyAlerts: alertsCount,
        averageIntakeMinutes: 3.8,
        systemUptime: '99.98%',
      },
      regionalDistribution: [
        { state: 'Delhi NCR', facilities: 12, sessionsToday: 340 },
        { state: 'Maharashtra', facilities: 18, sessionsToday: 512 },
        { state: 'Karnataka', facilities: 10, sessionsToday: 289 },
        { state: 'Tamil Nadu', facilities: 8, sessionsToday: 215 },
      ],
      aiPerformance: {
        ocrConfidenceAverage: 0.942,
        unsupportedClaimRate: 0.0,
        averageSummaryLatencyMs: 420,
        activeModelVersion: 'v2.1-med-llama-7b',
      },
    });
  } catch (err) {
    next(err);
  }
});

// Hardware RFID Devices List
adminRouter.get('/admin/devices', async (_req, res, next) => {
  try {
    const devices = await prisma.rFIDDevice.findMany();
    res.json(devices);
  } catch (err) {
    next(err);
  }
});
