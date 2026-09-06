import React, { useState } from 'react';
import { getDictionary } from '@medikiosk/ui';
import { CHIEF_COMPLAINT_CATEGORIES, CHIEF_COMPLAINT_LABELS, type ChiefComplaintCategory } from '@medikiosk/clinical-engine';
import type { Language } from '@medikiosk/shared-types';
import { Mic, Heart, Thermometer, Brain, Wind, Stethoscope, Edit3, AlertTriangle, ArrowLeft } from 'lucide-react';

const CATEGORY_ICONS: Record<ChiefComplaintCategory, React.ReactNode> = {
  'chest-pain': <Heart className="w-8 h-8 text-blue-500" />,
  'breathing-difficulty': <Wind className="w-8 h-8 text-blue-500" />,
  'abdominal-pain': <Stethoscope className="w-8 h-8 text-blue-500" />,
  fever: <Thermometer className="w-8 h-8 text-blue-500" />,
  headache: <Brain className="w-8 h-8 text-blue-500" />,
  'general-fallback': <Edit3 className="w-8 h-8 text-blue-500" />,
};

export interface ChiefComplaintScreenProps {
  language: Language;
  onSelect: (category: ChiefComplaintCategory) => void;
  onBack?: () => void;
}

export function ChiefComplaintScreen({ language, onSelect, onBack }: ChiefComplaintScreenProps) {
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
    <div className="flex-1 flex items-center justify-center px-6 py-8 w-full">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-display">What brings you in today?</h1>
          <p className="mt-1.5 text-base text-slate-500 font-medium">Tap the microphone and speak, or choose a symptom below</p>
        </div>

        {/* Pulsing Mic Button */}
        <div className="flex flex-col items-center justify-center my-6">
          <button
            type="button"
            onClick={() => setIsListening(!isListening)}
            className={`w-24 h-24 rounded-full text-white flex items-center justify-center shadow-lg transition-all ${
              isListening
                ? 'bg-red-600 animate-pulse ring-8 ring-red-100'
                : 'bg-blue-600 hover:bg-blue-700 ring-8 ring-blue-100'
            }`}
          >
            <Mic size={40} />
          </button>
          <span className="mt-3 text-xs font-semibold text-slate-500">
            {isListening ? 'Listening… Speak your symptoms' : 'Tap to speak'}
          </span>
        </div>

        {/* Oversized Touch Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CHIEF_COMPLAINT_CATEGORIES.map((category) => {
            const isSel = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleTileClick(category)}
                className={`flex min-h-[120px] flex-col items-center justify-center gap-2.5 rounded-2xl border-2 p-5 text-center transition-all duration-150 active:scale-[0.97] ${
                  isSel
                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30'
                    : 'border-slate-200 bg-slate-50/50 hover:border-blue-500 hover:bg-blue-50/50'
                }`}
              >
                {CATEGORY_ICONS[category]}
                <span className="text-lg font-bold text-slate-800">{CHIEF_COMPLAINT_LABELS[category][langKey]}</span>
              </button>
            );
          })}
        </div>

        {/* Emergency Red Flag Alert Banner */}
        {isEmergencySelected && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-600 rounded-2xl p-5 flex items-center justify-between shadow-sm text-left animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-2xl text-red-600 shrink-0" size={28} />
              <div>
                <div className="font-bold text-red-900 text-base">This may need urgent attention</div>
                <div className="text-xs text-red-700 font-medium">We're alerting a nurse to assist you right away.</div>
              </div>
            </div>
            <button
              type="button"
              className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shrink-0 shadow-sm transition-all"
            >
              Call Nurse Now
            </button>
          </div>
        )}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-1.5 text-blue-600 font-semibold text-sm hover:underline"
          >
            <ArrowLeft size={16} /> Back to start
          </button>
        )}
      </div>
    </div>
  );
}
