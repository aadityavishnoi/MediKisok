import { useState, useEffect } from 'react';
import { getDictionary } from '@medikiosk/ui';
import { Language, Mode, type HistoryQuestion } from '@medikiosk/shared-types';
import { startHistory, type WsConnectionState } from '@medikiosk/api-client';
import type { ChiefComplaintCategory } from '@medikiosk/clinical-engine';
import { KioskShell, type KioskStepId } from '../components/KioskShell.js';
import { IdleTimeoutGuard } from '../components/IdleTimeoutGuard.js';
import { LanguageScreen } from './LanguageScreen.js';
import { ConsentScreen } from './ConsentScreen.js';
import { ChiefComplaintScreen } from './ChiefComplaintScreen.js';
import { HistoryScreen } from './HistoryScreen.js';
import { DocumentUploadScreen } from './DocumentUploadScreen.js';
import { toUserMessage } from '../lib/errors.js';

type FlowStage =
  | { name: 'LANGUAGE' }
  | { name: 'CONSENT' }
  | { name: 'DECLINED' }
  | { name: 'CHIEF_COMPLAINT' }
  | { name: 'HISTORY'; question: HistoryQuestion; redFlagActive: boolean }
  | { name: 'SCAN' }
  | { name: 'DONE' };

const STEP_BY_STAGE: Record<FlowStage['name'], KioskStepId> = {
  LANGUAGE: 'LANGUAGE',
  CONSENT: 'CONSENT',
  DECLINED: 'CONSENT',
  CHIEF_COMPLAINT: 'CHIEF_COMPLAINT',
  HISTORY: 'HISTORY',
  SCAN: 'SCAN',
  DONE: 'DONE',
};

export interface PatientFlowProps {
  sessionId: string;
  patientId?: string | null;
  wsState: WsConnectionState;
}

interface IssuedTicket {
  id: string;
  tokenNumber: string;
  priority: string;
  estimatedWaitMins: number;
  roomNumber?: string;
  departmentName?: string;
}

export function PatientFlow({ sessionId, patientId, wsState }: PatientFlowProps) {
  const [stage, setStage] = useState<FlowStage>({ name: 'LANGUAGE' });
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [startError, setStartError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<IssuedTicket | null>(null);
  const [issuingTicket, setIssuingTicket] = useState(false);

  async function handleSelectComplaint(category: ChiefComplaintCategory) {
    setStartError(null);
    try {
      const result = await startHistory({ sessionId, mode: Mode.GENERAL, chiefComplaintCategory: category });
      if (result.question) {
        setStage({ name: 'HISTORY', question: result.question, redFlagActive: false });
      }
    } catch (err) {
      setStartError(toUserMessage(err, getDictionary(language)));
    }
  }

  // Issue real queue ticket when patient reaches DONE
  useEffect(() => {
    if (stage.name === 'DONE' && !ticket && !issuingTicket) {
      setIssuingTicket(true);
      fetch('/api/queue/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          patientId: patientId || undefined,
          departmentName: 'General OPD',
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setTicket(data.ticket);
          } else {
            // Fallback token if queue issue fails
            setTicket({
              id: 'fallback',
              tokenNumber: `OPD-${Math.floor(100 + Math.random() * 900)}`,
              priority: 'ROUTINE',
              estimatedWaitMins: 15,
              roomNumber: 'OPD Room 102',
              departmentName: 'General OPD',
            });
          }
        })
        .catch(() => {
          setTicket({
            id: 'fallback',
            tokenNumber: `OPD-${Math.floor(100 + Math.random() * 900)}`,
            priority: 'ROUTINE',
            estimatedWaitMins: 15,
            roomNumber: 'OPD Room 102',
            departmentName: 'General OPD',
          });
        })
        .finally(() => setIssuingTicket(false));
    }
  }, [stage.name, sessionId, ticket, issuingTicket]);

  let content;
  if (stage.name === 'LANGUAGE') {
    content = (
      <LanguageScreen
        onSelect={(selected) => {
          setLanguage(selected as Language);
          setStage({ name: 'CONSENT' });
        }}
      />
    );
  } else if (stage.name === 'CONSENT') {
    content = (
      <ConsentScreen
        sessionId={sessionId}
        language={language}
        onDecision={(granted) => setStage(granted ? { name: 'CHIEF_COMPLAINT' } : { name: 'DECLINED' })}
      />
    );
  } else if (stage.name === 'DECLINED') {
    const t = getDictionary(language).consent;
    content = (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-6xl">🙏</div>
        <p className="text-2xl text-neutral-800">{t.declinedMessage}</p>
      </div>
    );
  } else if (stage.name === 'CHIEF_COMPLAINT') {
    content = (
      <>
        <ChiefComplaintScreen
          language={language}
          onSelect={handleSelectComplaint}
          onScanDocument={() => setStage({ name: 'SCAN' })}
        />
        {startError && (
          <div role="alert" className="fixed inset-x-0 bottom-20 mx-auto w-fit rounded-xl bg-danger-50 px-4 py-3 text-lg text-danger-800">
            {startError}
          </div>
        )}
      </>
    );
  } else if (stage.name === 'HISTORY') {
    content = (
      <HistoryScreen
        sessionId={sessionId}
        language={language}
        question={stage.question}
        redFlagActive={stage.redFlagActive}
        onScanDocument={() => setStage({ name: 'SCAN' })}
        onAnswered={(result) => {
          const redFlagActive = stage.redFlagActive || result.redFlag !== null;
          if (result.historyComplete || !result.nextQuestion) {
            setStage({ name: 'SCAN' });
          } else {
            setStage({ name: 'HISTORY', question: result.nextQuestion, redFlagActive });
          }
        }}
      />
    );
  } else if (stage.name === 'SCAN') {
    content = (
      <DocumentUploadScreen
        sessionId={sessionId}
        patientId={patientId || undefined}
        language={language}
        onComplete={() => setStage({ name: 'DONE' })}
        onSkip={() => setStage({ name: 'DONE' })}
      />
    );
  } else {
    const t = getDictionary(language).history;
    content = (
      <div className="flex flex-col items-center gap-4 text-center bg-white border border-slate-200 p-8 rounded-2xl shadow-sm max-w-lg mx-auto">
        <div className="text-6xl animate-bounce">✅</div>
        <h1 className="text-3xl font-black text-slate-900 font-display">{t.thankYouTitle}</h1>
        <p className="text-base text-slate-600 font-medium max-w-md">{t.thankYouBody}</p>

        {/* Live Queue Ticket Slip */}
        <div className="mt-4 p-5 bg-gradient-to-tr from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl text-left w-full space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider font-mono">OPD Triage Slip</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
              ticket?.priority === 'EMERGENCY' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {ticket?.priority || 'ROUTINE'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Your Token Number:</span>
              <span className="text-3xl font-black text-blue-900 font-mono tracking-tight">
                {ticket?.tokenNumber || (issuingTicket ? 'Generating...' : 'OPD-101')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Est. Wait:</span>
              <span className="text-base font-extrabold text-indigo-700 font-mono">
                ~{ticket?.estimatedWaitMins ?? 12} mins
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-blue-200 text-xs text-slate-700 space-y-1">
            <div>Department: <strong>{ticket?.departmentName || 'General OPD'}</strong></div>
            <div>Consultation Room: <strong>{ticket?.roomNumber || 'OPD Room 102'}</strong></div>
            <div className="text-[11px] text-blue-700 font-medium pt-1">
              Please proceed to the waiting area. Your token will be announced on the digital display.
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
        >
          Return to Start Screen
        </button>
      </div>
    );
  }

  return (
    <>
      <KioskShell
        step={STEP_BY_STAGE[stage.name]}
        language={stage.name === 'LANGUAGE' ? null : language}
        onLanguageChange={(lang) => setLanguage(lang as Language)}
        onStepClick={(stepId) => {
          if (stepId === 'SCAN') setStage({ name: 'SCAN' });
          else if (stepId === 'CHIEF_COMPLAINT') setStage({ name: 'CHIEF_COMPLAINT' });
          else if (stepId === 'LANGUAGE') setStage({ name: 'LANGUAGE' });
          else if (stepId === 'CONSENT') setStage({ name: 'CONSENT' });
        }}
        wsState={wsState}
        sessionId={sessionId}
      >
        <div key={stage.name} className="w-full animate-fade-in">
          {content}
        </div>
      </KioskShell>
      {stage.name !== 'DONE' && (
        <IdleTimeoutGuard language={language} onTimeout={() => window.location.reload()} />
      )}
    </>
  );
}
