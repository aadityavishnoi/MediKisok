import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getNextClinicalQuestion } from '@medikiosk/api-client';
import { getDictionary } from '@medikiosk/ui';
import type { Language, NextQuestionApiResponse, RegionalSignal } from '@medikiosk/shared-types';
import {
  Volume2,
  Mic,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ClipboardList,
  Stethoscope,
  Send,
} from 'lucide-react';
import { speechToText, toSpeechLang } from '../lib/speech.js';
import { toUserMessage } from '../lib/errors.js';

const GTTS_LANG: Record<string, string> = {
  EN: 'en',
  HI: 'hi',
  BN: 'bn',
  MR: 'mr',
  TE: 'te',
  TA: 'ta',
  GU: 'gu',
  KN: 'kn',
  ML: 'ml',
  PA: 'pa',
  OR: 'or',
  AS: 'as',
  UR: 'ur',
};

function speakQuestion(text: string, language: Language) {
  const gttsLang = GTTS_LANG[language] || 'en';
  const encodedText = encodeURIComponent(text);
  const audio = new Audio(`/api/tts?text=${encodedText}&lang=${gttsLang}`);
  audio.play().catch(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = `${gttsLang}-IN`;
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  });
}

export interface PatientDemographics {
  age: number;
  gender: string;
}

export interface DynamicHistoryScreenProps {
  sessionId: string;
  language: Language;
  initialSymptoms: string[];
  patientDemographics?: PatientDemographics;
  regionalSignals?: RegionalSignal[];
  onComplete: () => void;
  onEmergencyEscalate?: () => void;
}

export interface AnswerHistoryEntry {
  questionId: string;
  questionText: string;
  answer: string | boolean | number;
}

export function DynamicHistoryScreen({
  sessionId,
  language,
  initialSymptoms,
  patientDemographics = { age: 38, gender: 'M' },
  regionalSignals = [],
  onComplete,
  onEmergencyEscalate,
}: DynamicHistoryScreenProps) {
  const dict = getDictionary(language);
  const tc = dict.common;
  const isHindi = language === 'HI';

  // State
  const [currentResponse, setCurrentResponse] = useState<NextQuestionApiResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | boolean | number>>({});
  const [history, setHistory] = useState<AnswerHistoryEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [listening, setListening] = useState(false);

  // In-flight guard to prevent duplicate API requests
  const inFlightRef = useRef(false);
  const initialFetchDoneRef = useRef(false);

  // Fetch next question from API
  const fetchNextQuestion = useCallback(
    async (currentAnswers: Record<string, string | boolean | number>) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setSubmitting(true);
      setError(null);

      try {
        const response = await getNextClinicalQuestion({
          sessionId,
          patient: {
            age: Math.max(1, patientDemographics.age),
            gender: patientDemographics.gender || 'M',
          },
          symptoms: initialSymptoms.length > 0 ? initialSymptoms : ['general-evaluation'],
          answers: currentAnswers,
          regionalSignals,
        });

        setCurrentResponse(response);
      } catch (err: unknown) {
        setError(toUserMessage(err, dict));
      } finally {
        setSubmitting(false);
        inFlightRef.current = false;
      }
    },
    [sessionId, patientDemographics, initialSymptoms, regionalSignals, dict],
  );

  // Initial load
  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      fetchNextQuestion({});
    }
  }, [fetchNextQuestion]);

  // Handle Answer submission
  async function handleAnswer(answerVal: string | boolean | number) {
    if (submitting || inFlightRef.current || !currentResponse?.nextQuestion) return;

    const q = currentResponse.nextQuestion;
    const updatedAnswers = {
      ...answers,
      [q.id]: answerVal,
    };

    setAnswers(updatedAnswers);
    setHistory((prev) => [
      ...prev,
      {
        questionId: q.id,
        questionText: q.text,
        answer: answerVal,
      },
    ]);
    setCustomText('');

    await fetchNextQuestion(updatedAnswers);
  }

  // Voice recognition for custom answering
  function handleDictateAnswer() {
    if (!speechToText.isSupported()) {
      setListening(true);
      setTimeout(() => {
        setListening(false);
        setCustomText(isHindi ? 'हाँ, परेशानी हो रही है' : 'Yes, experiencing discomfort.');
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
      .then((res) => {
        if (res.transcript) {
          setCustomText(res.transcript);
        }
      })
      .catch(() => {})
      .finally(() => setListening(false));
  }

  // Active Red Flag Condition
  const hasSafetyFlags = (currentResponse?.safetyFlags?.length ?? 0) > 0;
  const isHighPriority =
    currentResponse?.nextQuestion?.priority === 'HIGH' ||
    currentResponse?.nextQuestion?.priority === 'CRITICAL' ||
    currentResponse?.reason === 'red_flag_screening';

  // Completion view when nextQuestion is null
  if (currentResponse && currentResponse.nextQuestion === null) {
    return (
      <div className="flex flex-col items-center gap-6 text-center w-full max-w-xl mx-auto py-2 animate-fade-in">
        <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 mb-2">
              <ClipboardList size={13} /> Clinical Screening Complete
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              Initial Intake Questions Complete
            </h1>
            <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
              Initial clinical screening questions are complete. Your responses require review by a qualified
              healthcare professional.
            </p>
          </div>

          {/* Strict Non-Diagnostic Disclaimer */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 text-left space-y-1">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <Stethoscope size={15} /> Clinical Decision Support Notice
            </div>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              This screening assists your consultation and is <strong>NOT a definitive medical diagnosis</strong>. No
              disease condition has been diagnosed. The doctor remains the sole diagnostician.
            </p>
          </div>

          {/* Screening Intake Breakdown */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Intake Summary</span>
              <span className="text-blue-700">{history.length} Questions Answered</span>
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Reported Symptoms: </span>
              {initialSymptoms.join(', ') || 'General Consultation'}
            </div>

            {currentResponse.safetyFlags.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200/80">
                <span className="font-semibold text-red-800 text-xs flex items-center gap-1">
                  <AlertTriangle size={13} className="text-red-600" /> Triage Safety Notices:
                </span>
                <ul className="mt-1 list-disc list-inside text-xs text-red-700 space-y-0.5">
                  {currentResponse.safetyFlags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Mandatory Doctor Review Badge */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 py-2.5 px-4 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            Screening Status: Awaiting Doctor Review
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={onComplete}
            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Document Upload / Rx Scan</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Active question display
  const currentQ = currentResponse?.nextQuestion;

  return (
    <div className="flex flex-col items-center gap-5 text-center w-full max-w-xl mx-auto py-2">
      {/* Priority or Red Flag Banner */}
      {(hasSafetyFlags || isHighPriority) && (
        <div
          role="alert"
          className="w-full rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 text-left flex items-start justify-between gap-3 shadow-xs animate-scale-in"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert size={22} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-900">Priority Clinical Screening</p>
              <p className="text-xs font-medium text-red-700 mt-0.5">
                {currentResponse?.safetyFlags[0] ||
                  'Critical symptom inquiry active. Your responses assist the physician in urgent triage.'}
              </p>
            </div>
          </div>
          {onEmergencyEscalate && (
            <button
              type="button"
              onClick={onEmergencyEscalate}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Alert Nurse
            </button>
          )}
        </div>
      )}

      {/* Progress pill */}
      <div className="w-full space-y-1">
        <div className="flex w-full items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
          <span className="flex items-center gap-1.5 text-blue-700">
            <Sparkles size={12} /> Dynamic Clinical AI Intake
          </span>
          <span>Question #{history.length + 1}</span>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="flex flex-col w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs text-left space-y-4">
        {/* Priority & Rationale Tags */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              isHighPriority ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800 border border-blue-100'
            }`}
          >
            {currentQ?.priority ? `${currentQ.priority} Priority` : 'Evaluating…'}
          </span>

          {currentResponse?.reason && (
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
              {currentResponse.reason.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Question Text */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="flex-1 text-xl sm:text-2xl font-extrabold text-slate-900 font-display leading-snug">
            {currentQ ? currentQ.text : 'Analyzing patient profile for next clinical question…'}
          </h1>
          {currentQ && (
            <button
              type="button"
              aria-label={tc.listen}
              onClick={() => speakQuestion(currentQ.text, language)}
              className="shrink-0 p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer"
            >
              <Volume2 size={20} />
            </button>
          )}
        </div>

        {/* Loading Spinner */}
        {submitting && (
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 animate-pulse pt-1">
            <RefreshCw size={14} className="animate-spin" /> Evaluating dynamic evidence…
          </div>
        )}
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div
          role="alert"
          className="w-full rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-800 text-left flex items-center justify-between gap-3 shadow-xs"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchNextQuestion(answers)}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0 transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Fast Touch Answer Options */}
      {currentQ && (
        <div className="flex w-full flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleAnswer('yes')}
              className="py-4 px-6 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-600 hover:bg-blue-50/50 text-slate-900 font-bold text-lg text-center shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isHindi ? 'हाँ (Yes)' : 'Yes'}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleAnswer('no')}
              className="py-4 px-6 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-600 hover:bg-blue-50/50 text-slate-900 font-bold text-lg text-center shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isHindi ? 'नहीं (No)' : 'No'}
            </button>
          </div>

          {/* Voice or Detailed Text Input */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex items-center gap-2">
            <input
              type="text"
              placeholder={isHindi ? 'या यहाँ विस्तार से उत्तर लिखें…' : 'Or type additional details…'}
              value={customText}
              disabled={submitting}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customText.trim()) {
                  handleAnswer(customText.trim());
                }
              }}
              className="flex-1 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="button"
              aria-label="Voice input"
              onClick={handleDictateAnswer}
              disabled={submitting}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                listening
                  ? 'bg-red-600 text-white border-red-700 animate-pulse'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Mic size={17} />
            </button>
            <button
              type="button"
              disabled={submitting || !customText.trim()}
              onClick={() => handleAnswer(customText.trim())}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}

      {/* Clinical Non-Diagnostic Footer Disclaimer */}
      <p className="text-[11px] text-slate-600 font-medium max-w-md text-center pt-2">
        Clinical Decision Support · Responses are securely transmitted for doctor review. Never replaces direct
        physician examination.
      </p>
    </div>
  );
}
