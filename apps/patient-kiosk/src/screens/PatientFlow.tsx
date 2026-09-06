import { useState } from 'react';
import { KioskLayout, dictionaries } from '@medikiosk/ui';
import { Language, Mode, type HistoryQuestion } from '@medikiosk/shared-types';
import { startHistory, ApiClientError } from '@medikiosk/api-client';
import type { ChiefComplaintCategory } from '@medikiosk/clinical-engine';
import { LanguageScreen } from './LanguageScreen.js';
import { ConsentScreen } from './ConsentScreen.js';
import { ChiefComplaintScreen } from './ChiefComplaintScreen.js';
import { HistoryScreen } from './HistoryScreen.js';

type FlowStage =
  | { name: 'LANGUAGE' }
  | { name: 'CONSENT'; language: Language }
  | { name: 'DECLINED'; language: Language }
  | { name: 'CHIEF_COMPLAINT'; language: Language }
  | { name: 'HISTORY'; language: Language; question: HistoryQuestion; redFlagActive: boolean }
  | { name: 'DONE'; language: Language };

export interface PatientFlowProps {
  sessionId: string;
}

/**
 * Everything after RFID identification: Consent -> Language -> adaptive clinical
 * history. Mode is fixed to GENERAL here - AYUSH mode is exercised via the clinical
 * engine's own tests and the seeded demo data rather than a patient-facing toggle.
 */
export function PatientFlow({ sessionId }: PatientFlowProps) {
  const [stage, setStage] = useState<FlowStage>({ name: 'LANGUAGE' });
  const [startError, setStartError] = useState<string | null>(null);

  async function handleSelectComplaint(category: ChiefComplaintCategory, language: Language) {
    setStartError(null);
    try {
      const result = await startHistory({ sessionId, mode: Mode.GENERAL, chiefComplaintCategory: category });
      if (result.question) {
        setStage({ name: 'HISTORY', language, question: result.question, redFlagActive: false });
      }
    } catch (err) {
      setStartError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (stage.name === 'LANGUAGE') {
    return <LanguageScreen onSelect={(language) => setStage({ name: 'CONSENT', language })} />;
  }

  if (stage.name === 'CONSENT') {
    return (
      <ConsentScreen
        sessionId={sessionId}
        language={stage.language}
        onDecision={(granted) =>
          setStage(granted ? { name: 'CHIEF_COMPLAINT', language: stage.language } : { name: 'DECLINED', language: stage.language })
        }
      />
    );
  }

  if (stage.name === 'DECLINED') {
    const t = dictionaries[stage.language].consent;
    return (
      <KioskLayout>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-6xl">🙏</div>
          <p className="text-2xl text-slate-800">{t.declinedMessage}</p>
        </div>
      </KioskLayout>
    );
  }

  if (stage.name === 'CHIEF_COMPLAINT') {
    return (
      <>
        <ChiefComplaintScreen language={stage.language} onSelect={(category) => handleSelectComplaint(category, stage.language)} />
        {startError && (
          <div role="alert" className="fixed inset-x-0 bottom-4 mx-auto w-fit rounded-xl bg-red-50 px-4 py-3 text-lg text-red-800">
            {startError}
          </div>
        )}
      </>
    );
  }

  if (stage.name === 'HISTORY') {
    return (
      <HistoryScreen
        sessionId={sessionId}
        language={stage.language}
        question={stage.question}
        redFlagActive={stage.redFlagActive}
        onAnswered={(result) => {
          const redFlagActive = stage.redFlagActive || result.redFlag !== null;
          if (result.historyComplete || !result.nextQuestion) {
            setStage({ name: 'DONE', language: stage.language });
          } else {
            setStage({ name: 'HISTORY', language: stage.language, question: result.nextQuestion, redFlagActive });
          }
        }}
      />
    );
  }

  const t = dictionaries[stage.language].history;
  return (
    <KioskLayout>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-6xl">✅</div>
        <h1 className="text-3xl font-bold text-slate-900">{t.thankYouTitle}</h1>
        <p className="text-xl text-slate-700">{t.thankYouBody}</p>
      </div>
    </KioskLayout>
  );
}
