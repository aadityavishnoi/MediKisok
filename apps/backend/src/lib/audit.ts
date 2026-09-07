import type { ActorType } from '@medikiosk/shared-types';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

/**
 * Records a key event for later review. Never pass raw medical content in `metadata` -
 * only identifiers, categories, and outcome flags (see docs/architecture.md).
 */
export async function recordAudit(entry: {
  actorType: ActorType;
  actorId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorType: entry.actorType as any,
        actorId: entry.actorId ?? null,
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata ? (entry.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (err) {
    // Non-blocking in demo mode or when database is offline
  }

}
