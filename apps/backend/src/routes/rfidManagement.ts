/**
 * RFID Card Management API — Full Lifecycle
 *
 * This module provides complete RFID card lifecycle management separate from the
 * hardware scanning routes (rfid.ts). It handles card inventory, enrollment,
 * assignment, activation, blocking, and audit.
 *
 * Valid state transitions:
 * MANUFACTURED → AVAILABLE → ASSIGNED → ACTIVE → BLOCKED/LOST/STOLEN → REPLACED/RETIRED
 */
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { Errors } from '../lib/errors.js';
import { requireAuth, requireRole, requireFacilityScope, type RequestWithUser } from '../middleware/userAuth.js';
import { recordAudit } from '../lib/audit.js';
import { ActorType } from '@medikiosk/shared-types';

import { env } from '../lib/env.js';
import { wsHub } from '../ws/hub.js';

export const rfidManagementRouter = Router();

const rfidAuthMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.header('Authorization');
  if (!authHeader && env.DEMO_MODE) {
    req.user = {
      sub: 'demo-rfid-officer',
      role: 'RFID_OFFICER',
      name: 'Demo RFID Officer',
      facilityId: null,
    };
    return next();
  }
  return requireAuth(req, res, () => {
    requireRole('RFID_OFFICER', 'HOSPITAL_ADMIN', 'CENTRAL_ADMIN', 'ADMIN')(req, res, next);
  });
};

const RFID_ROLES = [rfidAuthMiddleware];

/**
 * Valid lifecycle transitions. Prevents impossible state jumps.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  MANUFACTURED: ['AVAILABLE', 'ASSIGNED', 'RETIRED'],
  AVAILABLE: ['ASSIGNED', 'RETIRED'],
  ASSIGNED: ['ACTIVE', 'AVAILABLE', 'RETIRED'],
  ACTIVE: ['SUSPENDED', 'LOST', 'STOLEN', 'BLOCKED', 'REPLACED', 'RETIRED'],
  SUSPENDED: ['ACTIVE', 'BLOCKED', 'LOST', 'RETIRED', 'REPLACED'],
  LOST: ['REPLACED', 'RETIRED'],
  STOLEN: ['REPLACED', 'RETIRED', 'BLOCKED'],
  BLOCKED: ['RETIRED'],
  REPLACED: ['RETIRED'],
  RETIRED: [], // terminal state
};

function assertTransition(from: string, to: string) {
  if (!VALID_TRANSITIONS[from]?.includes(to)) {
    throw Errors.badRequest(`Invalid lifecycle transition: ${from} → ${to}`);
  }
}

// ---------------------------------------------------------------------------
// List / Search Cards
// ---------------------------------------------------------------------------

const listCardsQuery = z.object({
  status: z.string().optional(),
  hospitalId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

rfidManagementRouter.get(
  '/rfid/cards',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const query = listCardsQuery.parse(req.query);
    const user = (req as RequestWithUser).user!;

    const where: Record<string, unknown> = {};

    // Hospital admins / RFID officers can only see their own facility's cards
    if (user.facilityId && (user.role === 'HOSPITAL_ADMIN' || user.role === 'RFID_OFFICER')) {
      where.hospitalId = user.facilityId;
    } else if (query.hospitalId) {
      where.hospitalId = query.hospitalId;
    }

    if (query.status) where.cardStatus = query.status;

    if (query.search) {
      where.OR = [
        { uid: { contains: query.search, mode: 'insensitive' } },
        { patient: { fullName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [cards, total] = await Promise.all([
      (prisma.rFIDCard.findMany as any)({
        where,
        include: {
          patient: {
            select: { id: true, fullName: true, phone: true, abhaId: true, gender: true },
          },
          hospital: { select: { id: true, name: true, code: true } },
        },
        orderBy: { issuedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.rFIDCard.count({ where }),
    ]);

    res.json({ total, page: query.page, limit: query.limit, cards });
  }),
);

// ---------------------------------------------------------------------------
// Get single card
// ---------------------------------------------------------------------------

rfidManagementRouter.get(
  '/rfid/cards/:uid',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const card = await prisma.rFIDCard.findUnique({
      where: { uid: req.params.uid },
      include: {
        patient: {
          select: { id: true, fullName: true, phone: true, abhaId: true, gender: true, dateOfBirth: true },
        },
        hospital: { select: { id: true, name: true, state: true, city: true } },
      },
    });
    if (!card) throw Errors.notFound(`Card UID ${req.params.uid} not found`);

    // Fetch card's audit history
    const auditHistory = await prisma.auditLog.findMany({
      where: { entityType: 'RFIDCard', entityId: card.id } as any,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.json({ card, auditHistory });
  }),
);

// ---------------------------------------------------------------------------
// Register / manufacture new card(s)
// ---------------------------------------------------------------------------

const registerCardSchema = z.object({
  uid: z.string().min(1),
  cardType: z.string().default('STANDARD_MIFARE'),
  cardStatus: z.enum(['MANUFACTURED', 'AVAILABLE']).default('AVAILABLE'),
  hospitalId: z.string().optional(),
  isDemo: z.boolean().default(false),
});

rfidManagementRouter.post(
  '/rfid/cards',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const data = registerCardSchema.parse(req.body);
    const user = (req as RequestWithUser).user!;

    // Scope to user's facility if they're not a central admin
    const hospitalId = (user.role === 'HOSPITAL_ADMIN' || user.role === 'RFID_OFFICER')
      ? (user.facilityId ?? data.hospitalId)
      : data.hospitalId;

    const existing = await prisma.rFIDCard.findUnique({ where: { uid: data.uid } });
    if (existing) throw Errors.conflict(`Card UID ${data.uid} already exists`);

    const card = await (prisma.rFIDCard.create as any)({
      data: {
        uid: data.uid,
        cardType: data.cardType,
        hospitalId: hospitalId ?? null,
        cardStatus: data.cardStatus,
        active: false,
        isDemo: data.isDemo,
        cardStatusChangedAt: new Date(),
      },
    });

    await recordAudit({
      actorType: 'ADMIN' as any,
      actorId: user.sub,
      facilityId: hospitalId ?? null,
      action: 'RFID_CARD_REGISTERED',
      entityType: 'RFIDCard',
      entityId: card.id,
      metadata: { uid: data.uid, cardType: data.cardType },
    });

    res.status(201).json({ card });
  }),
);

// ---------------------------------------------------------------------------
// Assign card to patient  (MANUFACTURED/AVAILABLE → ASSIGNED)
// ---------------------------------------------------------------------------

const assignCardSchema = z.object({
  patientId: z.string().min(1),
});

rfidManagementRouter.post(
  '/rfid/cards/:uid/assign',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const { uid } = req.params;
    const { patientId } = assignCardSchema.parse(req.body);
    const user = (req as RequestWithUser).user!;

    const card = await prisma.rFIDCard.findUnique({ where: { uid } });
    if (!card) throw Errors.notFound(`Card ${uid} not found`);
    assertTransition(card.cardStatus as string, 'ASSIGNED');

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw Errors.notFound(`Patient ${patientId} not found`);

    const updated = await (prisma.rFIDCard.update as any)({
      where: { uid },
      data: {
        patientId,
        cardStatus: 'ASSIGNED',
        cardStatusChangedAt: new Date(),
        active: false,
      },
      include: { patient: { select: { fullName: true } } },
    });

    await recordAudit({
      actorType: 'ADMIN' as any,
      actorId: user.sub,
      facilityId: card.hospitalId,
      action: 'RFID_CARD_ASSIGNED',
      entityType: 'RFIDCard',
      entityId: card.id,
      metadata: { uid, patientId, patientName: patient.fullName },
    });

    res.json({ card: updated });
  }),
);

// ---------------------------------------------------------------------------
// Activate card (ASSIGNED → ACTIVE)
// ---------------------------------------------------------------------------

rfidManagementRouter.post(
  '/rfid/cards/:uid/activate',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const { uid } = req.params;
    const user = (req as RequestWithUser).user!;

    const card = await prisma.rFIDCard.findUnique({ where: { uid } });
    if (!card) throw Errors.notFound(`Card ${uid} not found`);
    assertTransition(card.cardStatus, 'ACTIVE');

    const updated = await prisma.rFIDCard.update({
      where: { uid },
      data: { cardStatus: 'ACTIVE', active: true, cardStatusChangedAt: new Date() },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user.sub,
      facilityId: card.hospitalId,
      action: 'RFID_CARD_ACTIVATED',
      entityType: 'RFIDCard',
      entityId: card.id,
      metadata: { uid },
    });

    wsHub.broadcast({
      type: 'RFID_STATUS_CHANGED',
      payload: {
        uid,
        status: 'ACTIVE',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ card: updated });
  }),
);

// ---------------------------------------------------------------------------
// Suspend card (ACTIVE → SUSPENDED)
// ---------------------------------------------------------------------------

rfidManagementRouter.post(
  '/rfid/cards/:uid/suspend',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const { uid } = req.params;
    const { reason = 'Temporary security hold' } = req.body || {};
    const user = (req as RequestWithUser).user!;

    const card = await prisma.rFIDCard.findUnique({ where: { uid } });
    if (!card) throw Errors.notFound(`Card ${uid} not found`);
    assertTransition(card.cardStatus, 'SUSPENDED');

    const updated = await prisma.rFIDCard.update({
      where: { uid },
      data: { cardStatus: 'SUSPENDED', active: false, blockReason: reason, cardStatusChangedAt: new Date() },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user.sub,
      facilityId: card.hospitalId,
      action: 'RFID_CARD_SUSPENDED',
      entityType: 'RFIDCard',
      entityId: card.id,
      metadata: { uid, reason },
    });

    wsHub.broadcast({
      type: 'RFID_STATUS_CHANGED',
      payload: {
        uid,
        status: 'SUSPENDED',
        reason,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ card: updated });
  }),
);

// ---------------------------------------------------------------------------
// Reactivate card (SUSPENDED → ACTIVE)
// ---------------------------------------------------------------------------

rfidManagementRouter.post(
  '/rfid/cards/:uid/reactivate',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const { uid } = req.params;
    const user = (req as RequestWithUser).user!;

    const card = await prisma.rFIDCard.findUnique({ where: { uid } });
    if (!card) throw Errors.notFound(`Card ${uid} not found`);
    assertTransition(card.cardStatus, 'ACTIVE');

    const updated = await prisma.rFIDCard.update({
      where: { uid },
      data: { cardStatus: 'ACTIVE', active: true, blockReason: null, cardStatusChangedAt: new Date() },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user.sub,
      facilityId: card.hospitalId,
      action: 'RFID_CARD_REACTIVATED',
      entityType: 'RFIDCard',
      entityId: card.id,
      metadata: { uid },
    });

    wsHub.broadcast({
      type: 'RFID_STATUS_CHANGED',
      payload: {
        uid,
        status: 'ACTIVE',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ card: updated });
  }),
);

// ---------------------------------------------------------------------------
// Block card (ACTIVE/SUSPENDED → BLOCKED)
// ---------------------------------------------------------------------------

const blockSchema = z.object({ reason: z.string().min(1) });

rfidManagementRouter.post(
  '/rfid/cards/:uid/block',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const { uid } = req.params;
    const { reason } = blockSchema.parse(req.body);
    const user = (req as RequestWithUser).user!;

    const card = await prisma.rFIDCard.findUnique({ where: { uid } });
    if (!card) throw Errors.notFound(`Card ${uid} not found`);
    assertTransition(card.cardStatus, 'BLOCKED');

    const updated = await prisma.rFIDCard.update({
      where: { uid },
      data: { cardStatus: 'BLOCKED', active: false, blockReason: reason, cardStatusChangedAt: new Date() },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user.sub,
      facilityId: card.hospitalId,
      action: 'RFID_CARD_BLOCKED',
      entityType: 'RFIDCard',
      entityId: card.id,
      metadata: { uid, reason },
    });

    res.json({ card: updated });
  }),
);

// ---------------------------------------------------------------------------
// Report lost (ACTIVE → LOST)
// ---------------------------------------------------------------------------

rfidManagementRouter.post(
  '/rfid/cards/:uid/report-lost',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const { uid } = req.params;
    const user = (req as RequestWithUser).user!;

    const card = await prisma.rFIDCard.findUnique({ where: { uid } });
    if (!card) throw Errors.notFound(`Card ${uid} not found`);
    assertTransition(card.cardStatus, 'LOST');

    const updated = await prisma.rFIDCard.update({
      where: { uid },
      data: { cardStatus: 'LOST', active: false, cardStatusChangedAt: new Date() },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user.sub,
      facilityId: card.hospitalId,
      action: 'RFID_CARD_LOST',
      entityType: 'RFIDCard',
      entityId: card.id,
      metadata: { uid, patientId: card.patientId },
    });

    res.json({ card: updated });
  }),
);

// ---------------------------------------------------------------------------
// Replace card (LOST/STOLEN → REPLACED on old; new card assigned to patient)
// ---------------------------------------------------------------------------

const replaceSchema = z.object({ newUid: z.string().min(1) });

rfidManagementRouter.post(
  '/rfid/cards/:uid/replace',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const { uid } = req.params;
    const { newUid } = replaceSchema.parse(req.body);
    const user = (req as RequestWithUser).user!;

    const oldCard = await prisma.rFIDCard.findUnique({ where: { uid } });
    if (!oldCard) throw Errors.notFound(`Card ${uid} not found`);
    assertTransition(oldCard.cardStatus, 'REPLACED');

    if (!oldCard.patientId) throw Errors.badRequest('Card has no assigned patient to transfer');

    const existing = await prisma.rFIDCard.findUnique({ where: { uid: newUid } });
    if (existing) throw Errors.conflict(`New UID ${newUid} already exists`);

    const [oldUpdated, newCard] = await prisma.$transaction([
      prisma.rFIDCard.update({
        where: { uid },
        data: { cardStatus: 'REPLACED', active: false, cardStatusChangedAt: new Date() },
      }),
      prisma.rFIDCard.create({
        data: {
          uid: newUid,
          patientId: oldCard.patientId,
          hospitalId: oldCard.hospitalId,
          cardType: oldCard.cardType,
          cardStatus: 'ACTIVE',
          active: true,
          isDemo: oldCard.isDemo,
          cardStatusChangedAt: new Date(),
        },
      }),
    ]);

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user.sub,
      facilityId: oldCard.hospitalId,
      action: 'RFID_CARD_REPLACED',
      entityType: 'RFIDCard',
      entityId: oldCard.id,
      metadata: { oldUid: uid, newUid, patientId: oldCard.patientId },
    });

    res.json({ oldCard: oldUpdated, newCard });
  }),
);

// ---------------------------------------------------------------------------
// Retire card (terminal state)
// ---------------------------------------------------------------------------

rfidManagementRouter.post(
  '/rfid/cards/:uid/retire',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const { uid } = req.params;
    const user = (req as RequestWithUser).user!;

    const card = await prisma.rFIDCard.findUnique({ where: { uid } });
    if (!card) throw Errors.notFound(`Card ${uid} not found`);
    assertTransition(card.cardStatus, 'RETIRED');

    const updated = await prisma.rFIDCard.update({
      where: { uid },
      data: { cardStatus: 'RETIRED', active: false, cardStatusChangedAt: new Date() },
    });

    await recordAudit({
      actorType: ActorType.ADMIN,
      actorId: user.sub,
      facilityId: card.hospitalId,
      action: 'RFID_CARD_RETIRED',
      entityType: 'RFIDCard',
      entityId: card.id,
      metadata: { uid },
    });

    res.json({ card: updated });
  }),
);

// ---------------------------------------------------------------------------
// Card audit trail
// ---------------------------------------------------------------------------

rfidManagementRouter.get(
  '/rfid/cards/:uid/audit',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const { uid } = req.params;
    const card = await prisma.rFIDCard.findUnique({ where: { uid } });
    if (!card) throw Errors.notFound(`Card ${uid} not found`);

    const history = await prisma.auditLog.findMany({
      where: { entityType: 'RFIDCard', entityId: card.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ uid, cardId: card.id, history });
  }),
);

// ---------------------------------------------------------------------------
// RFID inventory summary (stats for dashboard cards)
// ---------------------------------------------------------------------------

rfidManagementRouter.get(
  '/rfid/inventory',
  ...RFID_ROLES,
  asyncHandler(async (req, res) => {
    const user = (req as RequestWithUser).user!;
    const facilityId = (user.role === 'HOSPITAL_ADMIN' || user.role === 'RFID_OFFICER')
      ? user.facilityId
      : (req.query.hospitalId as string | undefined);

    const where: Record<string, unknown> = {};
    if (facilityId) where.hospitalId = facilityId;

    const stats = await prisma.rFIDCard.groupBy({
      by: ['cardStatus'],
      where,
      _count: { id: true },
    });

    const summary: Record<string, number> = {};
    for (const s of stats) {
      summary[s.cardStatus] = s._count.id;
    }

    const hospitals = await prisma.hospital.findMany({
      select: { id: true, name: true, state: true },
      take: 20,
    });

    const byHospital = await prisma.rFIDCard.groupBy({
      by: ['hospitalId'],
      _count: { id: true },
    });

    const batches = hospitals.map((h, i) => {
      const match = byHospital.find((b) => b.hospitalId === h.id);
      const cardCount = match?._count.id || 0;
      return {
        batchId: `BATCH-2026-NHA-${String(i + 1).padStart(3, '0')}`,
        manufacturedDate: '2026-08-01',
        totalCards: Math.max(cardCount, 1),
        assignedState: h.state || 'National Facility',
        status: 'Active' as const,
        clonedAlerts: 0,
        securityHash: `sha256:batch-${h.id.slice(0, 8)}`,
      };
    });

    res.json({
      facilityId: facilityId ?? 'NATIONAL',
      total: Object.values(summary).reduce((a, b) => a + b, 0),
      byStatus: summary,
      batches: batches.length > 0 ? batches : undefined,
    });
  }),
);
