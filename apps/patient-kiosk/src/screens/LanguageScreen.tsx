import { en, SUPPORTED_LANGUAGES } from '@medikiosk/ui';

const t = en.language;

export interface LanguageScreenProps {
  onSelect: (language: string) => void;
}

export function LanguageScreen({ onSelect }: LanguageScreenProps) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <h1 className="text-4xl font-bold text-neutral-900">{t.title}</h1>
        <p className="mt-1 text-2xl text-neutral-600">{t.subtitle}</p>
      </div>
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
        {SUPPORTED_LANGUAGES.map(({ code, nativeName, englishName }) => (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            className="flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-neutral-200 bg-white px-3 py-4 shadow-sm transition-all duration-150 hover:border-primary-400 hover:shadow-md active:scale-[0.98] focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary-700 motion-reduce:transition-none"
          >
            <span className="text-xl font-semibold text-neutral-900">{nativeName}</span>
            {englishName !== nativeName && <span className="text-xs text-neutral-400">{englishName}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
