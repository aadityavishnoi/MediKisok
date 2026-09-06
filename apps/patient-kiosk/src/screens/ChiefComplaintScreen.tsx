import { BigButton, KioskLayout, dictionaries } from '@medikiosk/ui';
import { CHIEF_COMPLAINT_CATEGORIES, CHIEF_COMPLAINT_LABELS, type ChiefComplaintCategory } from '@medikiosk/clinical-engine';
import type { Language } from '@medikiosk/shared-types';

const ICONS: Record<ChiefComplaintCategory, string> = {
  'chest-pain': '🫀',
  'breathing-difficulty': '🌬️',
  'abdominal-pain': '🤢',
  fever: '🌡️',
  headache: '🤕',
  'general-fallback': '❓',
};

export interface ChiefComplaintScreenProps {
  language: Language;
  onSelect: (category: ChiefComplaintCategory) => void;
}

export function ChiefComplaintScreen({ language, onSelect }: ChiefComplaintScreenProps) {
  const t = dictionaries[language].chiefComplaint;
  const langKey = language === 'HI' ? 'hi' : 'en';

  return (
    <KioskLayout>
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-1 text-lg text-slate-600">{t.subtitle}</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {CHIEF_COMPLAINT_CATEGORIES.map((category) => (
            <BigButton key={category} variant="secondary" onClick={() => onSelect(category)}>
              <span className="mr-2">{ICONS[category]}</span>
              {CHIEF_COMPLAINT_LABELS[category][langKey]}
            </BigButton>
          ))}
        </div>
      </div>
    </KioskLayout>
  );
}
