import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole, type RequestWithUser } from '../middleware/userAuth.js';
import { recordAudit } from '../lib/audit.js';
import { ActorType } from '@medikiosk/shared-types';
import { env } from '../lib/env.js';

export const clinicalRouter = Router();

const allowDemoOrAdmin = (req: any, res: any, next: any) => {
  if (!req.header('Authorization') && env.DEMO_MODE) {
    req.user = {
      sub: 'demo-clinical-admin',
      role: 'CENTRAL_ADMIN',
      name: 'Demo Clinical Administrator',
      facilityId: null,
    };
    return next();
  }
  return requireAuth(req, res, () => {
    requireRole('CENTRAL_ADMIN', 'ADMIN', 'DOCTOR')(req, res, next);
  });
};

const DEFAULT_SYMPTOMS = [
  {
    id: 'chest-pain',
    name: 'Chest pain',
    localizedLabels: { en: 'Chest pain', hi: 'सीने में दर्द' },
    category: 'CARDIOVASCULAR',
    isEmergency: true,
    mappedTreeId: 'chest-pain',
    icon: 'Heart',
    active: true,
  },
  {
    id: 'breathing-difficulty',
    name: 'Breathing difficulty',
    localizedLabels: { en: 'Breathing difficulty', hi: 'सांस लेने में तकलीफ' },
    category: 'RESPIRATORY',
    isEmergency: true,
    mappedTreeId: 'breathing-difficulty',
    icon: 'Wind',
    active: true,
  },
  {
    id: 'abdominal-pain',
    name: 'Abdominal pain',
    localizedLabels: { en: 'Abdominal pain', hi: 'पेट में दर्द' },
    category: 'GASTROINTESTINAL',
    isEmergency: false,
    mappedTreeId: 'abdominal-pain',
    icon: 'Stethoscope',
    active: true,
  },
  {
    id: 'fever',
    name: 'Fever',
    localizedLabels: { en: 'Fever', hi: 'बुखार' },
    category: 'INFECTIOUS',
    isEmergency: false,
    mappedTreeId: 'fever',
    icon: 'Thermometer',
    active: true,
  },
  {
    id: 'headache',
    name: 'Headache',
    localizedLabels: { en: 'Headache', hi: 'सिरदर्द' },
    category: 'NEUROLOGICAL',
    isEmergency: false,
    mappedTreeId: 'headache',
    icon: 'Brain',
    active: true,
  },
  {
    id: 'general-fallback',
    name: 'Something else',
    localizedLabels: { en: 'Something else', hi: 'कुछ और' },
    category: 'GENERAL',
    isEmergency: false,
    mappedTreeId: 'general-fallback',
    icon: 'Edit3',
    active: true,
  },
];

const DEFAULT_PROTOCOLS = [
  {
    id: 'PROT-01',
    name: 'Chest Pain Intake Protocol',
    version: 'v1.4',
    status: 'ACTIVE',
    jurisdiction: 'National Default',
    mandatoryQuestions: 6,
    redFlagTriggers: ['Radiation to Left Arm', 'Diaphoresis', 'SPO2 < 92%'],
    lastUpdated: '2026-08-01',
  },
  {
    id: 'PROT-02',
    name: 'Acute Respiratory & Dyspnea',
    version: 'v1.2',
    status: 'ACTIVE',
    jurisdiction: 'National Default',
    mandatoryQuestions: 5,
    redFlagTriggers: ['Stridor', 'SPO2 < 90%', 'Cyanosis'],
    lastUpdated: '2026-08-10',
  },
  {
    id: 'PROT-03',
    name: 'Febrile Illness & Outbreak Screening',
    version: 'v2.1',
    status: 'ACTIVE',
    jurisdiction: 'National Default',
    mandatoryQuestions: 7,
    redFlagTriggers: ['Fever > 103°F', 'Petechiae', 'Altered Sensorium'],
    lastUpdated: '2026-08-20',
  },
  {
    id: 'PROT-04',
    name: 'AYUSH Prakriti & Clinical Assessment',
    version: 'v1.0',
    status: 'ACTIVE',
    jurisdiction: 'National Default',
    mandatoryQuestions: 8,
    redFlagTriggers: ['Severe Agni Imbalance', 'Acute Dhatu Depletion'],
    lastUpdated: '2026-08-25',
  },
  {
    id: 'PROT-05',
    name: 'Pediatric General OPD Intake',
    version: 'v1.1',
    status: 'ACTIVE',
    jurisdiction: 'Delhi NCR & Maharashtra Pilot',
    mandatoryQuestions: 6,
    redFlagTriggers: ['Grunting', 'Severe Chest Indrawing'],
    lastUpdated: '2026-09-01',
  },
];

/**
 * GET /api/clinical/symptoms
 * Dynamic symptom and chief complaint registry
 */
clinicalRouter.get('/clinical/symptoms', async (_req, res, next) => {
  try {
    const config = await prisma.systemConfig.findFirst({
      where: { facilityId: null, configKey: 'CLINICAL_SYMPTOMS' },
    }).catch(() => null);

    const list = (config && Array.isArray(config.configValue)) ? config.configValue : DEFAULT_SYMPTOMS;
    res.json({ success: true, data: list, symptoms: list });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/clinical/symptoms
 * Clinical administrator registers or updates a symptom
 */
const symptomSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  localizedLabels: z.record(z.string()),
  category: z.string().default('GENERAL'),
  isEmergency: z.boolean().default(false),
  mappedTreeId: z.string().default('general-fallback'),
  icon: z.string().default('Stethoscope'),
});

clinicalRouter.post('/clinical/symptoms', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const data = symptomSchema.parse(req.body);
    const user = (req as RequestWithUser).user;

    const currentConfig = await prisma.systemConfig.findFirst({
      where: { facilityId: null, configKey: 'CLINICAL_SYMPTOMS' },
    });

    let currentList = DEFAULT_SYMPTOMS;
    if (currentConfig && Array.isArray(currentConfig.configValue)) {
      currentList = currentConfig.configValue as any[];
    }

    // Upsert symptom into list
    const filtered = currentList.filter(s => s.id !== data.id);
    const updatedList = [...filtered, { ...data, active: true }];

    const existing = await prisma.systemConfig.findFirst({
      where: { facilityId: null, configKey: 'CLINICAL_SYMPTOMS' },
    });
    if (existing) {
      await prisma.systemConfig.update({
        where: { id: existing.id },
        data: { configValue: updatedList as any, updatedBy: user?.sub },
      });
    } else {
      await prisma.systemConfig.create({
        data: {
          facilityId: null,
          configKey: 'CLINICAL_SYMPTOMS',
          configValue: updatedList as any,
          category: 'CLINICAL_CONFIG',
          updatedBy: user?.sub,
        },
      });
    }

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user?.sub,
      action: 'SYMPTOM_REGISTERED',
      entityType: 'ClinicalSymptom',
      entityId: data.id,
      metadata: { name: data.name, category: data.category },
    });

    res.status(201).json({ success: true, symptom: data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/clinical/protocols
 * Database-backed Clinical Protocol & Questionnaire Registry
 */
clinicalRouter.get('/clinical/protocols', async (_req, res, next) => {
  try {
    const config = await prisma.systemConfig.findFirst({
      where: { facilityId: null, configKey: 'CLINICAL_PROTOCOLS' },
    });

    if (config && Array.isArray(config.configValue)) {
      res.json({ protocols: config.configValue });
      return;
    }

    res.json({ protocols: DEFAULT_PROTOCOLS });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/clinical/protocols
 * Create or publish new clinical protocol version
 */
const protocolCreateSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  version: z.string().min(2),
  jurisdiction: z.string().default('National Default'),
  mandatoryQuestions: z.number().int().min(1).default(5),
  redFlagTriggers: z.array(z.string()).default([]),
});

clinicalRouter.post('/clinical/protocols', allowDemoOrAdmin, async (req, res, next) => {
  try {
    const data = protocolCreateSchema.parse(req.body);
    const user = (req as RequestWithUser).user;

    const currentConfig = await prisma.systemConfig.findFirst({
      where: { facilityId: null, configKey: 'CLINICAL_PROTOCOLS' },
    });

    let currentList = DEFAULT_PROTOCOLS;
    if (currentConfig && Array.isArray(currentConfig.configValue)) {
      currentList = currentConfig.configValue as any[];
    }

    const newProtocol = {
      ...data,
      status: 'ACTIVE',
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    const updatedList = [newProtocol, ...currentList.filter(p => p.id !== data.id)];

    const existing = await prisma.systemConfig.findFirst({
      where: { facilityId: null, configKey: 'CLINICAL_PROTOCOLS' },
    });
    if (existing) {
      await prisma.systemConfig.update({
        where: { id: existing.id },
        data: { configValue: updatedList as any, updatedBy: user?.sub },
      });
    } else {
      await prisma.systemConfig.create({
        data: {
          facilityId: null,
          configKey: 'CLINICAL_PROTOCOLS',
          configValue: updatedList as any,
          category: 'CLINICAL_PROTOCOL',
          updatedBy: user?.sub,
        },
      });
    }

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user?.sub,
      action: 'CLINICAL_PROTOCOL_PUBLISHED',
      entityType: 'ClinicalProtocol',
      entityId: data.id,
      metadata: { name: data.name, version: data.version },
    });

    res.status(201).json({ success: true, protocol: newProtocol });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/vitals
 * Records or updates clinical vitals captured at the Kiosk health test station or via IoT sensors
 */
const recordVitalsSchema = z.object({
  sessionId: z.string(),
  patientId: z.string().optional(),
  systolicBp: z.number().int().optional().nullable(),
  diastolicBp: z.number().int().optional().nullable(),
  pulse: z.number().int().optional().nullable(),
  spo2: z.number().int().optional().nullable(),
  temperatureF: z.number().optional().nullable(),
  heightCm: z.number().optional().nullable(),
  weightKg: z.number().optional().nullable(),
  bmi: z.number().optional().nullable(),
  source: z.string().optional().default('KIOSK_IOT'),
});

clinicalRouter.post('/vitals', async (req, res, next) => {
  try {
    const input = recordVitalsSchema.parse(req.body);

    // Resolve patientId if not supplied
    let effectivePatientId = input.patientId;
    if (!effectivePatientId) {
      const session = await prisma.patientSession.findUnique({
        where: { id: input.sessionId },
        select: { patientId: true },
      });
      if (session?.patientId) {
        effectivePatientId = session.patientId;
      }
    }

    if (!effectivePatientId) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Session does not have a linked patient' } });
      return;
    }

    // Auto-calculate BMI if height and weight are provided but bmi was not
    let calculatedBmi = input.bmi;
    if (!calculatedBmi && input.heightCm && input.weightKg) {
      const hM = input.heightCm / 100;
      if (hM > 0) {
        calculatedBmi = Math.round((input.weightKg / (hM * hM)) * 10) / 10;
      }
    }

    const vitals = await prisma.patientVitals.upsert({
      where: { sessionId: input.sessionId },
      update: {
        systolicBp: input.systolicBp,
        diastolicBp: input.diastolicBp,
        pulse: input.pulse,
        spo2: input.spo2,
        temperatureF: input.temperatureF,
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        bmi: calculatedBmi,
        source: input.source,
        recordedAt: new Date(),
      },
      create: {
        sessionId: input.sessionId,
        patientId: effectivePatientId,
        systolicBp: input.systolicBp,
        diastolicBp: input.diastolicBp,
        pulse: input.pulse,
        spo2: input.spo2,
        temperatureF: input.temperatureF,
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        bmi: calculatedBmi,
        source: input.source,
        recordedAt: new Date(),
      },
    });

    res.status(200).json({ success: true, vitals });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/vitals/:sessionId
 * Retrieves recorded vitals for a kiosk session
 */
clinicalRouter.get('/vitals/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const vitals = await prisma.patientVitals.findUnique({
      where: { sessionId },
    });
    if (!vitals) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No vitals recorded for this session' } });
      return;
    }
    res.status(200).json({ success: true, vitals });
  } catch (err) {
    next(err);
  }
});

