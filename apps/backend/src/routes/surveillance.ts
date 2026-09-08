import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const surveillanceRouter = Router();

/**
 * GET /api/surveillance/outbreaks
 * Central Admin National Outbreak Radar & Epidemiological Surveillance
 */
surveillanceRouter.get('/surveillance/outbreaks', async (req, res, next) => {
  try {
    const { state } = req.query;

    const where: any = {};
    if (state && typeof state === 'string') {
      where.state = state;
    }

    const outbreaks = await prisma.diseaseOutbreakSignal.findMany({
      where,
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            district: true,
            state: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { reportedDate: 'desc' },
    });

    // Grouping by disease for national radar stats
    const diseaseGroups: Record<string, { totalCases: number; districts: Set<string>; severity: string }> = {};
    for (const o of outbreaks) {
      if (!diseaseGroups[o.diseaseName]) {
        diseaseGroups[o.diseaseName] = { totalCases: 0, districts: new Set(), severity: o.severity };
      }
      diseaseGroups[o.diseaseName].totalCases += o.caseCount;
      diseaseGroups[o.diseaseName].districts.add(o.district);
    }

    const aggregated = Object.entries(diseaseGroups).map(([name, data]) => ({
      disease: name,
      totalCases: data.totalCases,
      affectedDistrictsCount: data.districts.size,
      severity: data.severity,
    }));

    res.json({
      totalReports: outbreaks.length,
      signals: outbreaks,
      summary: aggregated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/surveillance/signal
 * Record a new outbreak signal from emergency triage or clinical diagnosis
 */
surveillanceRouter.post('/surveillance/signal', async (req, res, next) => {
  try {
    const { hospitalId, diseaseName, category, icd10Code, caseCount, severity, district, state } = req.body;

    if (!hospitalId || !diseaseName || !district || !state) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'hospitalId, diseaseName, district, and state are required' } });
      return;
    }

    const signal = await prisma.diseaseOutbreakSignal.create({
      data: {
        hospitalId,
        diseaseName,
        category: category || 'GENERAL_INFECTION',
        icd10Code,
        caseCount: Number(caseCount) || 1,
        severity: severity || 'MEDIUM',
        district,
        state,
      },
    });

    res.json({ success: true, signal });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/surveillance/regions/:regionId/risk
 * Developer 2: Regional Disease Surveillance Risk & Outbreak Intelligence
 * Computes observed positivity, Wilson confidence interval, Laplace-smoothed Bayesian risk,
 * and sample-size uncertainty ratings. Supports controlled 8/10 DEMO mode.
 */
surveillanceRouter.get('/surveillance/regions/:regionId/risk', async (req, res, next) => {
  try {
    const { regionId } = req.params;
    const { demo } = req.query;

    const surveillanceModulePath = '../../../../ai/surveillance/src/index.js';
    const { SurveillanceService } = await (import(surveillanceModulePath) as Promise<any>);

    const riskSummary = SurveillanceService.getRegionalRisk(
      regionId,
      typeof demo === 'string' ? demo : undefined,
    );
    res.json(riskSummary);
  } catch (err) {
    next(err);
  }
});
