import { en, SUPPORTED_LANGUAGES } from '@medikiosk/ui';
import type { Language } from '@medikiosk/shared-types';
import { Volume2, Languages, Sparkles } from 'lucide-react';
import { textToSpeech, toSpeechLang } from '../lib/speech.js';

const t = en.language;

export interface LanguageScreenProps {
  onSelect: (language: string) => void;
}

export function LanguageScreen({ onSelect }: LanguageScreenProps) {
  const playAudioGreeting = (code: string, nativeName: string) => {
    if (textToSpeech.isSupported()) {
      textToSpeech.speak(`Welcome in ${nativeName}`, { lang: toSpeechLang(code as Language) });
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 text-center w-full max-w-xl mx-auto">
      <div>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100/80 mb-2">
          <Languages size={13} /> Select Preferred Language
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 font-display tracking-tight">{t.title}</h1>
        <p className="mt-1.5 text-base text-slate-500 font-medium">{t.subtitle}</p>
      </div>

      <div className="grid w-full grid-cols-2 sm:grid-cols-3 gap-3">
        {SUPPORTED_LANGUAGES.map(({ code, nativeName, englishName }) => (
          <button
            key={code}
            type="button"
            onClick={() => {
              playAudioGreeting(code, nativeName);
              onSelect(code);
            }}
            className="group relative flex flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/40 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
          >
            <span className="text-2xl font-bold text-slate-900 font-display group-hover:text-blue-700 transition-colors">
              {nativeName}
            </span>
            {englishName !== nativeName && (
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                {englishName}
              </span>
            )}
            <Volume2 size={13} className="absolute top-3 right-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}


