import { BigButton, en } from '@medikiosk/ui';
import { Language } from '@medikiosk/shared-types';

const t = en.language;

export interface LanguageScreenProps {
  onSelect: (language: Language) => void;
}

export function LanguageScreen({ onSelect }: LanguageScreenProps) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <h1 className="text-4xl font-bold text-neutral-900">{t.title}</h1>
        <p className="mt-1 text-2xl text-neutral-600">{t.subtitle}</p>
      </div>
      <div className="flex w-full flex-col gap-4">
        <BigButton onClick={() => onSelect(Language.EN)}>🇬🇧 {t.english}</BigButton>
        <BigButton onClick={() => onSelect(Language.HI)}>🇮🇳 {t.hindi}</BigButton>
      </div>
    </div>
  );
}
