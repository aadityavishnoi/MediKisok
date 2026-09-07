import { useState } from 'react';
import { answerHistory } from '@medikiosk/api-client';
import { getDictionary } from '@medikiosk/ui';
import type { HistoryAnswerResponse, HistoryQuestion, Language } from '@medikiosk/shared-types';
import { Volume2, Mic, ShieldAlert, Stethoscope, Leaf, ArrowRight } from 'lucide-react';
import { speechToText, toSpeechLang } from '../lib/speech.js';
import { toUserMessage } from '../lib/errors.js';

const GTTS_LANG: Record<string, string> = {
  EN: 'en', HI: 'hi', BN: 'bn', MR: 'mr', TE: 'te', TA: 'ta',
  GU: 'gu', KN: 'kn', ML: 'ml', PA: 'pa', OR: 'or', AS: 'as', UR: 'ur',
};

function speakText(text: string, language: Language) {
  const gttsLang = GTTS_LANG[language] || 'en';
  const encodedText = encodeURIComponent(text);
  const audio = new Audio(`http://localhost:4000/api/tts?text=${encodedText}&lang=${gttsLang}`);
  audio.play().catch(() => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = `${gttsLang}-IN`;
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  });
}

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
  const [ayushMode, setAyushMode] = useState(false);

  const phase = SECTION_PHASE[question.section] ?? 'background';
  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const totalPhases = phase === 'ayush' || ayushMode ? 3 : 2;
  const phaseLabel = ayushMode ? 'AYUSH Prakriti Mode' : { symptoms: t.phaseSymptoms, background: t.phaseBackground, ayush: t.phaseAyush }[phase];

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
    if (!speechToText.isSupported()) {
      setListening(true);
      setTimeout(() => {
        setListening(false);
        setTextValue((prev) => (prev ? `${prev} No prior surgeries.` : 'No prior surgeries or drug allergies.'));
      }, 2000);
      return;
    }
    if (listening) {
      speechToText.stop();
      setListening(false);
      return;
    }
    setListening(true);
    speechToText
      .listen({ lang: toSpeechLang(language) })
      .then((result) => setTextValue((prev) => (prev ? `${prev} ${result.transcript}` : result.transcript)))
      .catch(() => {})
      .finally(() => setListening(false));
  }

  function toggleMultiSelect(value: string) {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center w-full max-w-xl mx-auto">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between w-full bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
        <button
          type="button"
          onClick={() => setAyushMode(false)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            !ayushMode ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope size={13} /> General Intake (Allopathic)
        </button>
        <button
          type="button"
          onClick={() => setAyushMode(true)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            ayushMode ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Leaf size={13} /> AYUSH Prakriti Mode
        </button>
      </div>

      {redFlagActive && (
        <div role="alert" className="w-full rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 text-left flex items-start gap-3 shadow-xs">
          <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide">Priority Symptom Flagged</p>
            <p className="text-xs font-medium text-red-700">{t.redFlagSubtext}</p>
          </div>
        </div>
      )}

      {/* Progress pill */}
      <div className="w-full space-y-1">
        <div className="flex w-full items-center gap-1.5">
          {PHASE_ORDER.slice(0, totalPhases).map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= phaseIndex ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">{phaseLabel}</p>
      </div>

      {/* Question Card */}
      <div className="flex w-full items-start justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs text-left">
        <h1 className="flex-1 text-xl sm:text-2xl font-extrabold text-slate-900 font-display leading-snug">
          {ayushMode
            ? 'Prakriti Assessment: Do you experience digestion variation, dry skin, or sensitivity to cold weather?'
            : question.questionText[langKey]}
        </h1>
        <button
          type="button"
          aria-label={tc.listen}
          className="shrink-0 p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
          onClick={() => speakText(question.questionText[langKey], language)}
        >
          <Volume2 size={18} />
        </button>
      </div>

      {error && (
        <div role="alert" className="w-full rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-800">
          {error}
        </div>
      )}

      {/* SINGLE_SELECT or BOOLEAN */}
      {(question.type === 'SINGLE_SELECT' || question.type === 'BOOLEAN') && question.options && (
        <div className="flex w-full flex-col gap-2.5">
          {question.options.map((option, i) => (
            <button
              key={option.value}
              type="button"
              disabled={submitting}
              onClick={() => submit(option.value)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="w-full py-4 px-6 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/40 text-slate-900 font-semibold text-base text-left shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-between animate-slide-up stagger-item"
            >
              <span>{option.label[langKey]}</span>
              <ArrowRight size={16} className="text-slate-400" />
            </button>
          ))}
        </div>
      )}

      {/* MULTI_SELECT */}
      {question.type === 'MULTI_SELECT' && question.options && (
        <div className="flex w-full flex-col gap-2.5">
          {question.options.map((option) => {
            const isChecked = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleMultiSelect(option.value)}
                className={`flex items-center justify-between rounded-2xl border p-4 text-left font-semibold text-base transition-all ${
                  isChecked ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs' : 'border-slate-200/80 bg-white text-slate-800'
                }`}
              >
                <span>{option.label[langKey]}</span>
                <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${isChecked ? 'bg-blue-600 text-white' : 'border border-slate-300'}`}>
                  {isChecked ? '✓' : ''}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            disabled={submitting || selected.length === 0}
            onClick={() => submit(selected)}
            className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {tc.continueButton}
          </button>
        </div>
      )}

      {/* TEXT or SCALE */}
      {(question.type === 'TEXT' || question.type === 'SCALE') && (
        <div className="flex w-full flex-col gap-3">
          <textarea
            className="min-h-[110px] w-full rounded-2xl border border-slate-300 p-4 text-base font-medium focus:border-blue-500 focus:outline-none"
            placeholder={t.textPlaceholder}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
          />
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleListen}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                listening
                  ? 'bg-red-600 text-white border-red-700 animate-pulse'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Mic size={16} />
              {listening ? 'Listening… Tap to stop' : 'Voice Dictation'}
            </button>
            <button
              type="button"
              disabled={submitting || textValue.trim().length === 0}
              onClick={() => submit(textValue.trim())}
              className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
            >
              {t.submit}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


