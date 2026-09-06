import { dictionaries } from '@medikiosk/ui';
import { CHIEF_COMPLAINT_CATEGORIES, CHIEF_COMPLAINT_LABELS, type ChiefComplaintCategory } from '@medikiosk/clinical-engine';
import type { Language } from '@medikiosk/shared-types';

const ICONS: Record<ChiefComplaintCategory, string> = {
  'chest-pain': '❤️',
  'breathing-difficulty': '🫁',
  'abdominal-pain': '🩺',
  fever: '🌡️',
  headache: '🧠',
  'general-fallback': '✏️',
};

export interface ChiefComplaintScreenProps {
  language: Language;
  onSelect: (category: ChiefComplaintCategory) => void;
}

export function ChiefComplaintScreen({ language, onSelect }: ChiefComplaintScreenProps) {
  const t = dictionaries[language].chiefComplaint;
  const langKey = language === 'HI' ? 'hi' : 'en';

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">{t.title}</h1>
        <p className="mt-1 text-lg text-neutral-600">{t.subtitle}</p>
      </div>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {CHIEF_COMPLAINT_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            className="flex min-h-[100px] flex-col items-center gap-1 rounded-2xl border-2 border-neutral-200 bg-white p-5 text-center shadow-sm transition-all duration-150 hover:border-primary-400 hover:shadow-md active:scale-[0.98] focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary-700 motion-reduce:transition-none"
          >
            <span className="text-4xl">{ICONS[category]}</span>
            <span className="text-xl font-semibold text-neutral-900">{CHIEF_COMPLAINT_LABELS[category][langKey]}</span>
            <span className="text-sm text-neutral-500">{t.hints[category]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
