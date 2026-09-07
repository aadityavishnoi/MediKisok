import { useState, useRef } from 'react';
import { submitConsent } from '@medikiosk/api-client';
import { getDictionary } from '@medikiosk/ui';
import type { Language } from '@medikiosk/shared-types';
import { ShieldCheck, Volume2, Lock, Activity, FileText } from 'lucide-react';
import { toUserMessage } from '../lib/errors.js';

// BCP-47 → Google TTS lang code map
const GTTS_LANG: Record<string, string> = {
  EN: 'en', HI: 'hi', BN: 'bn', MR: 'mr', TE: 'te', TA: 'ta',
  GU: 'gu', KN: 'kn', ML: 'ml', PA: 'pa', OR: 'or', AS: 'as', UR: 'ur',
};

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggleListen() {
    if (speaking) {
      // Stop currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    const text = t.points.join('. ');
    const gttsLang = GTTS_LANG[language] || 'en';
    const encodedText = encodeURIComponent(text);
    const proxyUrl = `http://localhost:4000/api/tts?text=${encodedText}&lang=${gttsLang}`;

    const audio = new Audio(proxyUrl);
    audioRef.current = audio;
    audio.onended = () => setSpeaking(false);
    audio.onerror = () => {
      // Fallback: Web Speech API
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = `${gttsLang}-IN`;
        u.rate = 0.85;
        u.onend = () => setSpeaking(false);
        window.speechSynthesis.speak(u);
      } else {
        setSpeaking(false);
      }
    };
    audio.play().catch(() => audio.dispatchEvent(new Event('error')));
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
          <li
            key={i}
            style={{ animationDelay: `${i * 50}ms` }}
            className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs animate-slide-up stagger-item"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600 text-xs border border-blue-100">
              {i === t.points.length - 1 ? '🔒' : '✓'}
            </span>
            <span className="text-sm font-semibold text-slate-700 leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${speaking ? 'text-red-500 hover:text-red-600' : 'text-blue-600 hover:text-blue-700'}`}
        onClick={toggleListen}
      >
        <Volume2 size={15} />
        {speaking ? tc.stop : `${tc.listen} (Voice Consent Audio)`}
      </button>


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



