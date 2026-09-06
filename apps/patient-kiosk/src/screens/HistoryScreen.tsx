import { useState } from 'react';
import { BigButton, getDictionary } from '@medikiosk/ui';
import { answerHistory } from '@medikiosk/api-client';
import type { HistoryAnswerResponse, HistoryQuestion, Language } from '@medikiosk/shared-types';
import { speechToText, textToSpeech, toSpeechLang } from '../lib/speech.js';
import { toUserMessage } from '../lib/errors.js';

export interface HistoryScreenProps {
  sessionId: string;
  language: Language;
  question: HistoryQuestion;
  redFlagActive: boolean;
  onAnswered: (result: HistoryAnswerResponse) => void;
}

const PHASE_ORDER = ['symptoms', 'background', 'ayush'] as const;
type Phase = (typeof PHASE_ORDER)[number];

const SECTION_PHASE: Record<string, Phase> = {
  chiefComplaint: 'symptoms',
  hpi: 'symptoms',
  pastMedicalHistory: 'background',
  pastSurgicalHistory: 'background',
  currentMedications: 'background',
  drugAllergies: 'background',
  familyHistory: 'background',
  personalHistory: 'background',
  reviewOfSystems: 'background',
  previousInvestigations: 'background',
  ayush: 'ayush',
};

export function HistoryScreen({ sessionId, language, question, redFlagActive, onAnswered }: HistoryScreenProps) {
  const dict = getDictionary(language);
  const t = dict.history;
  const tc = dict.common;
  const langKey = language === 'HI' ? 'hi' : 'en';
  const [selected, setSelected] = useState<string[]>([]);
  const [textValue, setTextValue] = useState('');
  const [listening, setListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phase = SECTION_PHASE[question.section] ?? 'background';
  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const totalPhases = phase === 'ayush' ? 3 : 2;
  const phaseLabel = { symptoms: t.phaseSymptoms, background: t.phaseBackground, ayush: t.phaseAyush }[phase];

  async function submit(answerValue: unknown) {
    setSubmitting(true);
    setError(null);
    try {
      const result = await answerHistory({ sessionId, nodeId: question.nodeId, answerValue });
      setSelected([]);
      setTextValue('');
      onAnswered(result);
    } catch (err) {
      setError(toUserMessage(err, getDictionary(language)));
    } finally {
      setSubmitting(false);
    }
  }


  function handleListen() {
    if (!speechToText.isSupported()) return;
    if (listening) {
      speechToText.stop();
      setListening(false);
      return;
    }
    setListening(true);
    speechToText
      .listen({ lang: toSpeechLang(language) })
      .then((result) => setTextValue((prev) => (prev ? `${prev} ${result.transcript}` : result.transcript)))
      .catch(() => {
        // Voice failed (denied mic, no speech, stopped early, etc.) - touch input remains fully available.
      })
      .finally(() => setListening(false));
  }

  function toggleMultiSelect(value: string) {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {redFlagActive && (
        <div role="alert" className="w-full rounded-xl border-2 border-danger-600 bg-danger-50 px-4 py-3 text-danger-800">
          <p className="text-lg font-semibold">⚠️ {t.redFlagBanner}</p>
          <p className="text-sm">{t.redFlagSubtext}</p>
        </div>
      )}

      <div className="flex w-full items-center gap-2">
        {PHASE_ORDER.slice(0, totalPhases).map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= phaseIndex ? 'bg-primary-600' : 'bg-neutral-200'}`} />
        ))}
      </div>
      <p className="-mt-4 text-xs font-medium uppercase tracking-wide text-neutral-400">{phaseLabel}</p>

      <div className="flex w-full items-start justify-between gap-3">
        <h1 className="flex-1 text-left text-2xl font-bold text-neutral-900 sm:text-3xl">
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
        <div role="alert" className="w-full rounded-xl bg-danger-50 px-4 py-3 text-lg text-danger-800">
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
                className={`flex min-h-[64px] items-center gap-4 rounded-2xl border-4 px-6 py-4 text-left text-xl font-medium transition-colors duration-150 ${
                  isChecked ? 'border-primary-700 bg-primary-50 text-primary-900' : 'border-neutral-200 bg-white text-neutral-800'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 ${
                    isChecked ? 'border-primary-700 bg-primary-700 text-white' : 'border-neutral-400'
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
            className="min-h-[120px] w-full rounded-2xl border-2 border-neutral-300 p-4 text-xl"
            placeholder={t.textPlaceholder}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
          />
          {speechToText.isSupported() ? (
            <BigButton variant={listening ? 'danger' : 'secondary'} onClick={handleListen}>
              {listening ? <>🔴 {t.listening} · {t.tapToStop}</> : <>🎙️ {t.speak}</>}
            </BigButton>
          ) : (
            <p className="text-base italic text-neutral-500">{t.voiceUnavailable}</p>
          )}
          <BigButton disabled={submitting || textValue.trim().length === 0} onClick={() => submit(textValue.trim())}>
            {t.submit}
          </BigButton>
        </div>
      )}
    </div>
  );
}
