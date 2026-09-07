import { useState } from 'react';
import { submitConsent } from '@medikiosk/api-client';
import { getDictionary } from '@medikiosk/ui';
import type { Language } from '@medikiosk/shared-types';
import { ShieldCheck, Volume2, Lock, Activity, FileText } from 'lucide-react';
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
    <div className="flex flex-col items-center gap-6 text-center w-full max-w-xl mx-auto">
      <div>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-2">
          <ShieldCheck size={13} /> ABDM Health Data Security
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Your data privacy & confidentiality rights</p>
      </div>

      <ul className="w-full space-y-3 text-left">
        {t.points.map((point: string, i: number) => (
          <li key={i} className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600 text-xs border border-blue-100">
              {i === t.points.length - 1 ? '🔒' : '✓'}
            </span>
            <span className="text-sm font-semibold text-slate-700 leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>

      {textToSpeech.isSupported() && (
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          onClick={toggleListen}
        >
          <Volume2 size={15} />
          {speaking ? tc.stop : `${tc.listen} (Voice Consent Audio)`}
        </button>
      )}

      {error && (
        <div role="alert" className="w-full rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-800">
          {error}
        </div>
      )}

      <div className="mt-2 flex w-full flex-col gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => decide(true)}
          className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ShieldCheck size={20} /> {submitting ? tc.loading : t.agree}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => decide(false)}
          className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
        >
          {t.disagree}
        </button>
      </div>
    </div>
  );
}



