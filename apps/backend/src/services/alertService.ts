import type { AlertAcknowledgeResponse } from '@medikiosk/shared-types';
import { ActorType } from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { recordAudit } from '../lib/audit.js';
import { wsHub } from '../ws/hub.js';

export async function acknowledgeAlert(alertId: string, doctorId: string): Promise<AlertAcknowledgeResponse> {
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert) throw Errors.notFound('Alert not found');

  const now = new Date();
  await prisma.alert.update({
    where: { id: alertId },
    data: { acknowledged: true, acknowledgedByDoctorId: doctorId, acknowledgedAt: now },
  });

  await recordAudit({
    actorType: ActorType.DOCTOR,
    actorId: doctorId,
    action: 'REDFLAG_ACKNOWLEDGED',
    entityType: 'Alert',
    entityId: alertId,
    metadata: { sessionId: alert.sessionId },
  });

  wsHub.broadcast({
    type: 'ALERT_ACKNOWLEDGED',
    payload: { alertId, sessionId: alert.sessionId, timestamp: now.toISOString() },
  });

  return { alertId, acknowledged: true, acknowledgedAt: now.toISOString() };
}
