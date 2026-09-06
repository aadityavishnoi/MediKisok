import { useState } from 'react';
import { getDictionary } from '@medikiosk/ui';
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
  const t = getDictionary(language).chiefComplaint;
  const langKey = language === 'HI' ? 'hi' : 'en';
  const [isListening, setIsListening] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ChiefComplaintCategory | null>(null);

  const isEmergencySelected = selectedCategory === 'chest-pain' || selectedCategory === 'breathing-difficulty';

  const handleTileClick = (cat: ChiefComplaintCategory) => {
    setSelectedCategory(cat);
    onSelect(cat);
  };

  return (
    <div className="flex flex-col items-center gap-6 text-center w-full max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">{t.title}</h1>
        <p className="mt-1.5 text-lg text-slate-600 font-medium">{t.subtitle}</p>
      </div>

      {/* Main Touch Card */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        {/* Pulsing Mic Button */}
        <div className="flex flex-col items-center space-y-3">
          <button
            type="button"
            onClick={() => setIsListening(!isListening)}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-md transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-200'
                : 'bg-blue-600 text-white hover:bg-blue-700 ring-8 ring-blue-100'
            }`}
          >
            🎙️
          </button>
          <span className="text-sm font-semibold text-slate-600">
            {isListening ? 'Listening… Speak your symptoms' : 'Tap to speak, or choose below'}
          </span>
        </div>

        {/* 2x2 Oversized Touch Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {CHIEF_COMPLAINT_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleTileClick(category)}
              className={`flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border-2 p-5 text-center transition-all duration-150 active:scale-[0.98] ${
                selectedCategory === category
                  ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500'
                  : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-white'
              }`}
            >
              <span className="text-4xl">{ICONS[category]}</span>
              <span className="text-lg font-bold text-slate-900">{CHIEF_COMPLAINT_LABELS[category][langKey]}</span>
              <span className="text-xs text-slate-500">{t.hints[category]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conditional Red Flag Banner */}
      {isEmergencySelected && (
        <div className="w-full bg-red-50 border-l-4 border-red-600 rounded-2xl p-5 text-left flex justify-between items-center shadow-md animate-fade-in">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">Immediate Triage Warning</span>
            <h3 className="text-lg font-extrabold text-red-900">Potential Emergency Symptoms Detected</h3>
            <p className="text-xs text-red-700 font-medium">This may require urgent clinical attention. Staff notified instantly.</p>
          </div>
          <button
            type="button"
            className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-sm shrink-0"
          >
            Call Nurse Now
          </button>
        </div>
      )}
    </div>
  );
}
