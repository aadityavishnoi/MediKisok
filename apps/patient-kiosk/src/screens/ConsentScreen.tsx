import { useState } from 'react';
import { BigButton, getDictionary } from '@medikiosk/ui';
import { submitConsent } from '@medikiosk/api-client';
import type { Language } from '@medikiosk/shared-types';
import { textToSpeech, toSpeechLang } from '../lib/speech.js';
import { toUserMessage } from '../lib/errors.js';

export interface ConsentScreenProps {
  sessionId: string;
  language: Language;
  onDecision: (granted: boolean) => void;
}

export function ConsentScreen({ sessionId, language, onDecision }: ConsentScreenProps) {
  const dict = getDictionary(language);
  const t = dict.consent;
  const tc = dict.common;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  function toggleListen() {
    if (speaking) {
      textToSpeech.cancel();
      setSpeaking(false);
      return;
    }
    if (!textToSpeech.isSupported()) return;
    setSpeaking(true);
    textToSpeech.speak(t.points.join('. '), { lang: toSpeechLang(language), onEnd: () => setSpeaking(false) });
  }

  async function decide(granted: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      await submitConsent({ sessionId, granted, language });
      onDecision(granted);
    } catch (err) {
      setError(toUserMessage(err, getDictionary(language)));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h1 className="text-4xl font-bold text-neutral-900">{t.title}</h1>

      <ul className="w-full space-y-3 text-left">
        {t.points.map((point: string, i: number) => (
          <li key={i} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              {i === t.points.length - 1 ? '⚠️' : '✓'}
            </span>
            <span className="text-lg text-neutral-700">{point}</span>
          </li>
        ))}
      </ul>

      {textToSpeech.isSupported() && (
        <button
          type="button"
          className="flex items-center gap-2 text-lg font-medium text-primary-700 underline decoration-2 underline-offset-4"
          onClick={toggleListen}
        >
          {speaking ? (
            <>■ {tc.stop}</>
          ) : (
            <>🔊 {tc.listen}</>
          )}
        </button>
      )}
      {speaking && <p className="text-sm text-primary-600 motion-safe:animate-pulse">{tc.speaking}</p>}

      {error && (
        <div role="alert" className="w-full rounded-xl bg-danger-50 px-4 py-3 text-lg text-danger-800">
          {error}
          <button type="button" className="ml-3 font-semibold underline" onClick={() => decide(true)}>
            {tc.tryAgain}
          </button>
        </div>
      )}

      <div className="mt-4 flex w-full flex-col gap-4">
        <BigButton disabled={submitting} onClick={() => decide(true)}>
          {submitting ? tc.loading : t.agree}
        </BigButton>
        <BigButton variant="secondary" disabled={submitting} onClick={() => decide(false)}>
          {t.disagree}
        </BigButton>
      </div>
    </div>
  );
}

