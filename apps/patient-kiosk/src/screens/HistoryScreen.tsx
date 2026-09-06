import { useState } from 'react';
import { BigButton, KioskLayout, dictionaries } from '@medikiosk/ui';
import { ApiClientError, answerHistory } from '@medikiosk/api-client';
import type { HistoryAnswerResponse, HistoryQuestion, Language } from '@medikiosk/shared-types';
import { speechToText, textToSpeech, toSpeechLang } from '../lib/speech.js';

export interface HistoryScreenProps {
  sessionId: string;
  language: Language;
  question: HistoryQuestion;
  redFlagActive: boolean;
  onAnswered: (result: HistoryAnswerResponse) => void;
}

export function HistoryScreen({ sessionId, language, question, redFlagActive, onAnswered }: HistoryScreenProps) {
  const t = dictionaries[language].history;
  const tc = dictionaries[language].common;
  const langKey = language === 'HI' ? 'hi' : 'en';
  const [selected, setSelected] = useState<string[]>([]);
  const [textValue, setTextValue] = useState('');
  const [listening, setListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(answerValue: unknown) {
    setSubmitting(true);
    setError(null);
    try {
      const result = await answerHistory({ sessionId, nodeId: question.nodeId, answerValue });
      setSelected([]);
      setTextValue('');
      onAnswered(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleListen() {
    if (!speechToText.isSupported()) return;
    setListening(true);
    try {
      const result = await speechToText.listen({ lang: toSpeechLang(language) });
      setTextValue((prev) => (prev ? `${prev} ${result.transcript}` : result.transcript));
    } catch {
      // Voice failed (denied mic, no speech, etc.) - touch input remains fully available.
    } finally {
      setListening(false);
    }
  }

  function toggleMultiSelect(value: string) {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  return (
    <KioskLayout>
      <div className="flex flex-col items-center gap-6 text-center">
        {redFlagActive && (
          <div role="alert" className="w-full rounded-xl border-2 border-red-600 bg-red-50 px-4 py-3 text-lg font-semibold text-red-800">
            ⚠️ {t.redFlagBanner}
          </div>
        )}

        <div className="flex w-full items-start justify-between gap-3">
          <h1 className="flex-1 text-left text-2xl font-bold text-slate-900 sm:text-3xl">
            {question.questionText[langKey]}
          </h1>
          <button
            type="button"
            aria-label={tc.listen}
            className="shrink-0 text-2xl"
            onClick={() => textToSpeech.speak(question.questionText[langKey], { lang: toSpeechLang(language) })}
          >
            🔊
          </button>
        </div>

        {error && (
          <div role="alert" className="w-full rounded-xl bg-red-50 px-4 py-3 text-lg text-red-800">
            {error}
          </div>
        )}

        {(question.type === 'SINGLE_SELECT' || question.type === 'BOOLEAN') && question.options && (
          <div className="flex w-full flex-col gap-3">
            {question.options.map((option) => (
              <BigButton
                key={option.value}
                variant="secondary"
                disabled={submitting}
                onClick={() => submit(option.value)}
              >
                {option.label[langKey]}
              </BigButton>
            ))}
          </div>
        )}

        {question.type === 'MULTI_SELECT' && question.options && (
          <div className="flex w-full flex-col gap-3">
            {question.options.map((option) => {
              const isChecked = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleMultiSelect(option.value)}
                  className={`flex min-h-[64px] items-center gap-4 rounded-2xl border-4 px-6 py-4 text-left text-xl font-medium transition-colors ${
                    isChecked ? 'border-blue-700 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 ${
                      isChecked ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-400'
                    }`}
                  >
                    {isChecked ? '✓' : ''}
                  </span>
                  {option.label[langKey]}
                </button>
              );
            })}
            <BigButton disabled={submitting || selected.length === 0} onClick={() => submit(selected)}>
              {tc.continueButton}
            </BigButton>
          </div>
        )}

        {(question.type === 'TEXT' || question.type === 'SCALE') && (
          <div className="flex w-full flex-col gap-3">
            <textarea
              className="min-h-[120px] w-full rounded-2xl border-2 border-slate-300 p-4 text-xl"
              placeholder={t.textPlaceholder}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
            />
            {speechToText.isSupported() ? (
              <BigButton variant="secondary" disabled={listening} onClick={handleListen}>
                🎙️ {listening ? t.listening : t.speak}
              </BigButton>
            ) : (
              <p className="text-base italic text-slate-500">{t.voiceUnavailable}</p>
            )}
            <BigButton disabled={submitting || textValue.trim().length === 0} onClick={() => submit(textValue.trim())}>
              {t.submit}
            </BigButton>
          </div>
        )}
      </div>
    </KioskLayout>
  );
}
