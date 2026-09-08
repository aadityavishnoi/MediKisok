import { Prisma } from '@prisma/client';
import type { HistorySectionEntry, Mode } from '@medikiosk/shared-types';
import { ActorType, AlertSeverity, SessionStatus } from '@medikiosk/shared-types';
import { advance, startHistory as engineStartHistory, toApiQuestion, type ClinicalHistorySection } from '@medikiosk/clinical-engine';
import type { HistoryAnswerResponse, HistoryQuestion, HistoryStartResponse } from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { recordAudit } from '../lib/audit.js';
import { wsHub } from '../ws/hub.js';

const ARRAY_SECTIONS: ClinicalHistorySection[] = [
  'hpi',
  'pastMedicalHistory',
  'pastSurgicalHistory',
  'currentMedications',
  'drugAllergies',
  'familyHistory',
  'personalHistory',
  'reviewOfSystems',
  'previousInvestigations',
];

function appendEntry(current: unknown, entry: HistorySectionEntry): Prisma.InputJsonValue {
  const existing = Array.isArray(current) ? (current as HistorySectionEntry[]) : [];
  return [...existing, entry] as unknown as Prisma.InputJsonValue;
}

import { demoStore } from '../lib/demoStore.js';

import { ConsultationAiService } from './consultationAiService.js';

function formatAiQuestion(q: any): HistoryQuestion {
  return {
    nodeId: q.questionId,
    section: q.section || 'hpi',
    type: q.questionType === 'BOOLEAN'
      ? 'BOOLEAN'
      : q.questionType === 'MULTI_SELECT'
      ? 'MULTI_SELECT'
      : q.questionType === 'FREE_TEXT'
      ? 'TEXT'
      : q.questionType === 'SCALE_1_10'
      ? 'SCALE'
      : 'SINGLE_SELECT',
    questionText: {
      en: q.questionTextLocalized?.en || q.questionText,
      hi: q.questionTextLocalized?.hi || q.questionText,
    },
    options: q.options
      ? q.options.map((opt: any) => ({
          value: opt.value,
          label: {
            en: opt.label,
            hi: opt.labelHi || opt.label,
          },
        }))
      : null,
  };
}

export async function startHistory(input: {
  sessionId: string;
  mode: Mode;
  chiefComplaintCategory: string;
}): Promise<HistoryStartResponse> {
  const demoSession = demoStore.getSession(input.sessionId);
  if (demoSession) {
    const { treeId, node } = engineStartHistory(input.chiefComplaintCategory, input.mode);
    demoStore.updateSession(input.sessionId, {
      chiefComplaintCategory: input.chiefComplaintCategory,
      currentTreeId: treeId,
      currentNodeId: node.id,
      status: 'IN_HISTORY',
    });
    wsHub.broadcast({
      type: 'SESSION_UPDATED',
      payload: { sessionId: input.sessionId, status: SessionStatus.IN_HISTORY, timestamp: new Date().toISOString() },
    });
    return { clinicalHistoryId: `hist_${input.sessionId}`, question: toApiQuestion(node) };
  }

  const session = await prisma.patientSession.findUnique({ where: { id: input.sessionId } });
  if (!session) throw Errors.notFound('Session not found');
  if (!session.patientId) {
    throw Errors.badRequest('Patient registration must be completed before starting the history');
  }

  // 1. Trigger ConsultationAiService with full ML ranking & outbreak integration
  let aiQuestion: HistoryQuestion | null = null;
  try {
    const aiResult = await ConsultationAiService.startConsultation({
      sessionId: input.sessionId,
      patientId: session.patientId,
      chiefComplaint: input.chiefComplaintCategory,
      reportedSymptoms: [input.chiefComplaintCategory],
    });
    if (aiResult?.nextQuestion) {
      aiQuestion = formatAiQuestion(aiResult.nextQuestion);
    }
  } catch (aiErr) {
    console.warn('[startHistory] AI ranker notice, using standard question tree:', aiErr);
  }

  const { treeId, node, chiefComplaintText } = engineStartHistory(input.chiefComplaintCategory, input.mode);
  const activeQuestion = aiQuestion || toApiQuestion(node);

  const history = await prisma.clinicalHistory.upsert({
    where: { sessionId: input.sessionId },
    update: {
      mode: input.mode,
      chiefComplaint: chiefComplaintText,
      chiefComplaintCategory: input.chiefComplaintCategory,
      currentTreeId: treeId,
      currentNodeId: activeQuestion.nodeId,
    },
    create: {
      sessionId: input.sessionId,
      patientId: session.patientId,
      mode: input.mode,
      chiefComplaint: chiefComplaintText,
      chiefComplaintCategory: input.chiefComplaintCategory,
      currentTreeId: treeId,
      currentNodeId: activeQuestion.nodeId,
    },
  });

  await prisma.patientSession.update({
    where: { id: input.sessionId },
    data: { status: SessionStatus.IN_HISTORY, mode: input.mode },
  });

  await recordAudit({
    actorType: ActorType.PATIENT,
    action: 'HISTORY_STARTED',
    entityType: 'ClinicalHistory',
    entityId: history.id,
    metadata: { chiefComplaintCategory: input.chiefComplaintCategory, mode: input.mode },
  });

  wsHub.broadcast({
    type: 'SESSION_UPDATED',
    payload: { sessionId: input.sessionId, status: SessionStatus.IN_HISTORY, timestamp: new Date().toISOString() },
  });

  return { clinicalHistoryId: history.id, question: activeQuestion };
}

export async function answerHistory(input: {
  sessionId: string;
  nodeId: string;
  answerValue?: unknown;
}): Promise<HistoryAnswerResponse> {
  const demoSession = demoStore.getSession(input.sessionId);
  if (demoSession) {
    const result = advance({
      chiefComplaintCategory: demoSession.chiefComplaintCategory ?? 'general-fallback',
      mode: 'GENERAL' as any,
      currentTreeId: demoSession.currentTreeId ?? 'general-review-of-systems',
      currentNodeId: demoSession.currentNodeId ?? input.nodeId,
      answerValue: input.answerValue,
    });

    demoStore.updateSession(input.sessionId, {
      currentTreeId: result.nextTreeId ?? undefined,
      currentNodeId: result.nextNode?.id ?? undefined,
      historyCompleted: result.historyComplete,
      status: result.historyComplete ? 'DOCUMENTS' : 'IN_HISTORY',
    });

    if (result.historyComplete) {
      wsHub.broadcast({
        type: 'SESSION_UPDATED',
        payload: { sessionId: input.sessionId, status: SessionStatus.DOCUMENTS, timestamp: new Date().toISOString() },
      });
    }

    const sectionComplete = result.historyComplete || (result.nextNode ? result.nextNode.section !== result.appliedEntry.section : true);

    return {
      historyComplete: result.historyComplete,
      sectionComplete,
      nextQuestion: result.nextNode ? toApiQuestion(result.nextNode) : null,
      redFlag: result.redFlag ? { severity: result.redFlag.severity, message: result.redFlag.message } : null,
    };
  }

  const history = await prisma.clinicalHistory.findUnique({ where: { sessionId: input.sessionId } });
  if (!history) throw Errors.notFound('History has not been started for this session');
  if (!history.currentTreeId || !history.currentNodeId) {
    throw Errors.conflict('This history has already been completed');
  }
  if (history.currentNodeId !== input.nodeId) {
    throw Errors.conflict('This question has already been answered or is out of sequence');
  }

  // 1. Submit answer to Clinical AI Engine & Ranker
  let aiResult: any = null;
  try {
    aiResult = await ConsultationAiService.submitAnswer({
      sessionId: input.sessionId,
      questionId: input.nodeId,
      answerValue: String(input.answerValue),
    });
  } catch (aiErr) {
    console.warn('[answerHistory] AI ranking notice, falling back to tree:', aiErr);
  }

  if (aiResult) {
    const isRedFlag = Boolean(aiResult.nextQuestion?.redFlagTrigger);
    try {
      await prisma.clinicalAnswer.create({
        data: {
          clinicalHistoryId: history.id,
          nodeId: input.nodeId,
          section: 'hpi',
          questionText: input.nodeId,
          answerValue: (input.answerValue ?? null) as Prisma.InputJsonValue,
          isRedFlagTrigger: isRedFlag,
        },
      });
    } catch {}

    if (aiResult.isComplete || !aiResult.nextQuestion) {
      await prisma.clinicalHistory.update({
        where: { id: history.id },
        data: { completedAt: new Date(), currentNodeId: null },
      });
      await prisma.patientSession.update({
        where: { id: input.sessionId },
        data: { status: SessionStatus.ROUTED },
      });
      return {
        nextQuestion: null,
        sectionComplete: true,
        historyComplete: true,
        redFlag: null,
      };
    }

    const nextAiQuestion = formatAiQuestion(aiResult.nextQuestion);
    await prisma.clinicalHistory.update({
      where: { id: history.id },
      data: { currentNodeId: nextAiQuestion.nodeId },
    });

    return {
      nextQuestion: nextAiQuestion,
      sectionComplete: false,
      historyComplete: false,
      redFlag: isRedFlag
        ? {
            severity: 'EMERGENCY' as any,
            message: {
              en: 'Critical red-flag clinical indicator detected',
              hi: 'गंभीर लक्षण पाया गया - तत्काल जांच आवश्यक',
            },
          }
        : null,
    };
  }

  const result = advance({
    chiefComplaintCategory: history.chiefComplaintCategory ?? 'general-fallback',
    mode: history.mode,
    currentTreeId: history.currentTreeId,
    currentNodeId: history.currentNodeId,
    answerValue: input.answerValue,
  });

  const { appliedEntry } = result;
  const updateData: Record<string, unknown> = {
    currentTreeId: result.nextTreeId,
    currentNodeId: result.nextNode?.id ?? null,
    completedAt: result.historyComplete ? new Date() : null,
  };

  if (appliedEntry.section === 'chiefComplaint') {
    updateData.chiefComplaint = appliedEntry.value;
  } else if (appliedEntry.section === 'ayush') {
    const currentAyush = (history.ayushFields as Record<string, string> | null) ?? {};
    updateData.ayushFields = { ...currentAyush, [appliedEntry.ayushField ?? 'unknown']: appliedEntry.value } as Prisma.InputJsonValue;
  } else if (ARRAY_SECTIONS.includes(appliedEntry.section)) {
    updateData[appliedEntry.section] = appendEntry((history as Record<string, unknown>)[appliedEntry.section], {
      label: appliedEntry.label,
      value: appliedEntry.value,
    });
  }

  await prisma.clinicalHistory.update({ where: { id: history.id }, data: updateData as any });

  const answer = await prisma.clinicalAnswer.create({
    data: {
      clinicalHistoryId: history.id,
      nodeId: input.nodeId,
      section: appliedEntry.section,
      questionText: appliedEntry.label,
      answerValue: (input.answerValue ?? null) as Prisma.InputJsonValue,
      isRedFlagTrigger: result.redFlag !== null,
    },
  });

  if (result.redFlag) {
    const alert = await prisma.alert.create({
      data: {
        sessionId: input.sessionId,
        patientId: history.patientId,
        severity: result.redFlag.severity as AlertSeverity,
        triggerType: result.redFlag.triggerType,
        message: result.redFlag.message.en,
        triggeredByAnswerId: answer.id,
      },
    });

    await recordAudit({
      actorType: ActorType.SYSTEM,
      action: 'RED_FLAG_RAISED',
      entityType: 'Alert',
      entityId: alert.id,
      metadata: { sessionId: input.sessionId, triggerType: result.redFlag.triggerType, severity: result.redFlag.severity },
    });

    wsHub.broadcast({
      type: 'ALERT_RAISED',
      payload: {
        alertId: alert.id,
        sessionId: input.sessionId,
        patientId: history.patientId,
        severity: alert.severity,
        message: alert.message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (result.historyComplete) {
    // Document upload/OCR and AI summary generation are not implemented yet (see
    // docs/architecture.md), so a completed history routes straight to the doctor's
    // queue rather than parking at an intermediate status nothing can advance it past.
    await prisma.patientSession.update({
      where: { id: input.sessionId },
      data: { status: SessionStatus.ROUTED },
    });
    await recordAudit({
      actorType: ActorType.PATIENT,
      action: 'HISTORY_SUBMITTED',
      entityType: 'ClinicalHistory',
      entityId: history.id,
    });
    wsHub.broadcast({
      type: 'SESSION_UPDATED',
      payload: { sessionId: input.sessionId, status: SessionStatus.ROUTED, timestamp: new Date().toISOString() },
    });
  }

  const previousSection = history.currentNodeId ? appliedEntry.section : null;
  const sectionComplete = result.historyComplete || (result.nextNode ? result.nextNode.section !== previousSection : true);

  return {
    nextQuestion: result.nextNode ? toApiQuestion(result.nextNode) : null,
    sectionComplete,
    historyComplete: result.historyComplete,
    redFlag: result.redFlag ? { severity: result.redFlag.severity, message: result.redFlag.message } : null,
  };
}
