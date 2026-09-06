import { useState } from 'react';
import { BigButton, KioskLayout, dictionaries } from '@medikiosk/ui';
import { ApiClientError, submitConsent } from '@medikiosk/api-client';
import type { Language } from '@medikiosk/shared-types';
import { textToSpeech, toSpeechLang } from '../lib/speech.js';

export interface ConsentScreenProps {
  sessionId: string;
  language: Language;
  onDecision: (granted: boolean) => void;
}

export function ConsentScreen({ sessionId, language, onDecision }: ConsentScreenProps) {
  const t = dictionaries[language].consent;
  const tc = dictionaries[language].common;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(granted: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      await submitConsent({ sessionId, granted, language });
      onDecision(granted);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KioskLayout>
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold text-slate-900">{t.title}</h1>
        <p className="text-xl text-slate-700">{t.body}</p>
        <button
          type="button"
          className="text-lg font-medium text-blue-700 underline"
          onClick={() => textToSpeech.speak(t.body, { lang: toSpeechLang(language) })}
        >
          🔊 {tc.listen}
        </button>

        {error && (
          <div role="alert" className="w-full rounded-xl bg-red-50 px-4 py-3 text-lg text-red-800">
            {error}
          </div>
        )}

        <div className="mt-4 flex w-full flex-col gap-4">
          <BigButton disabled={submitting} onClick={() => decide(true)}>
            {t.agree}
          </BigButton>
          <BigButton variant="secondary" disabled={submitting} onClick={() => decide(false)}>
            {t.disagree}
          </BigButton>
        </div>
      </div>
    </KioskLayout>
  );
}
