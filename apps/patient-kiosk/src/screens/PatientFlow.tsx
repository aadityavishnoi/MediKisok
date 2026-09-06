import { useState } from 'react';
import { dictionaries } from '@medikiosk/ui';
import { Language, Mode, type HistoryQuestion } from '@medikiosk/shared-types';
import { startHistory, type WsConnectionState } from '@medikiosk/api-client';
import type { ChiefComplaintCategory } from '@medikiosk/clinical-engine';
import { KioskShell, type KioskStepId } from '../components/KioskShell.js';
import { IdleTimeoutGuard } from '../components/IdleTimeoutGuard.js';
import { LanguageScreen } from './LanguageScreen.js';
import { ConsentScreen } from './ConsentScreen.js';
import { ChiefComplaintScreen } from './ChiefComplaintScreen.js';
import { HistoryScreen } from './HistoryScreen.js';
import { toUserMessage } from '../lib/errors.js';

type FlowStage =
  | { name: 'LANGUAGE' }
  | { name: 'CONSENT' }
  | { name: 'DECLINED' }
  | { name: 'CHIEF_COMPLAINT' }
  | { name: 'HISTORY'; question: HistoryQuestion; redFlagActive: boolean }
  | { name: 'DONE' };

const STEP_BY_STAGE: Record<FlowStage['name'], KioskStepId> = {
  LANGUAGE: 'LANGUAGE',
  CONSENT: 'CONSENT',
  DECLINED: 'CONSENT',
  CHIEF_COMPLAINT: 'CHIEF_COMPLAINT',
  HISTORY: 'HISTORY',
  DONE: 'DONE',
};

export interface PatientFlowProps {
  sessionId: string;
  wsState: WsConnectionState;
}

/**
 * Everything after RFID identification: Language -> Consent -> Chief Complaint ->
 * adaptive clinical history. Mode is fixed to GENERAL here - AYUSH mode is exercised via
 * the clinical engine's own tests and the seeded demo data rather than a patient-facing
 * toggle. Language can still be switched mid-flow from the header - every question the
 * backend returns already carries both {en,hi} text, so this is a pure re-render.
 */
export function PatientFlow({ sessionId, wsState }: PatientFlowProps) {
  const [stage, setStage] = useState<FlowStage>({ name: 'LANGUAGE' });
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [startError, setStartError] = useState<string | null>(null);

  async function handleSelectComplaint(category: ChiefComplaintCategory) {
    setStartError(null);
    try {
      const result = await startHistory({ sessionId, mode: Mode.GENERAL, chiefComplaintCategory: category });
      if (result.question) {
        setStage({ name: 'HISTORY', question: result.question, redFlagActive: false });
      }
    } catch (err) {
      setStartError(toUserMessage(err, dictionaries[language]));
    }
  }

  let content;
  if (stage.name === 'LANGUAGE') {
    content = (
      <LanguageScreen
        onSelect={(selected) => {
          setLanguage(selected);
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
    const t = dictionaries[language].consent;
    content = (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-6xl">🙏</div>
        <p className="text-2xl text-neutral-800">{t.declinedMessage}</p>
      </div>
    );
  } else if (stage.name === 'CHIEF_COMPLAINT') {
    content = (
      <>
        <ChiefComplaintScreen language={language} onSelect={handleSelectComplaint} />
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
        onAnswered={(result) => {
          const redFlagActive = stage.redFlagActive || result.redFlag !== null;
          if (result.historyComplete || !result.nextQuestion) {
            setStage({ name: 'DONE' });
          } else {
            setStage({ name: 'HISTORY', question: result.nextQuestion, redFlagActive });
          }
        }}
      />
    );
  } else {
    const t = dictionaries[language].history;
    content = (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-6xl">✅</div>
        <h1 className="text-3xl font-bold text-neutral-900">{t.thankYouTitle}</h1>
        <p className="text-xl text-neutral-700">{t.thankYouBody}</p>
      </div>
    );
  }

  return (
    <>
      <KioskShell
        step={STEP_BY_STAGE[stage.name]}
        language={stage.name === 'LANGUAGE' ? null : language}
        onLanguageChange={setLanguage}
        wsState={wsState}
        sessionId={sessionId}
      >
        {content}
      </KioskShell>
      {stage.name !== 'DONE' && (
        <IdleTimeoutGuard language={language} onTimeout={() => window.location.reload()} />
      )}
    </>
  );
}
