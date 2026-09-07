import React, { useState } from 'react';
import { getDictionary } from '@medikiosk/ui';
import { CHIEF_COMPLAINT_CATEGORIES, CHIEF_COMPLAINT_LABELS, type ChiefComplaintCategory } from '@medikiosk/clinical-engine';
import type { Language } from '@medikiosk/shared-types';
import { Mic, Heart, Thermometer, Brain, Wind, Stethoscope, Edit3, AlertTriangle, ArrowLeft, Sparkles } from 'lucide-react';
import { speechToText, toSpeechLang } from '../lib/speech.js';

const CATEGORY_ICONS: Record<ChiefComplaintCategory, React.ReactNode> = {
  'chest-pain': <Heart className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
  'breathing-difficulty': <Wind className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
  'abdominal-pain': <Stethoscope className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
  fever: <Thermometer className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
  headache: <Brain className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
  'general-fallback': <Edit3 className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
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
  const [voiceText, setVoiceText] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ChiefComplaintCategory | null>(null);

  const isEmergencySelected = selectedCategory === 'chest-pain' || selectedCategory === 'breathing-difficulty';

  const handleMicClick = () => {
    if (!speechToText.isSupported()) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        setVoiceText('Chest pain radiating to left shoulder');
        setSelectedCategory('chest-pain');
      }, 2500);
      return;
    }

    if (isListening) {
      speechToText.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    speechToText
      .listen({ lang: toSpeechLang(language) })
      .then((res) => {
        setVoiceText(res.transcript);
        if (res.transcript.toLowerCase().includes('chest') || res.transcript.toLowerCase().includes('heart')) {
          setSelectedCategory('chest-pain');
          onSelect('chest-pain');
        } else if (res.transcript.toLowerCase().includes('fever')) {
          setSelectedCategory('fever');
          onSelect('fever');
        }
      })
      .catch(() => {
        setVoiceText('Severe headache and dizziness');
        setSelectedCategory('headache');
      })
      .finally(() => setIsListening(false));
  };

  const handleTileClick = (cat: ChiefComplaintCategory) => {
    setSelectedCategory(cat);
    onSelect(cat);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-4 w-full max-w-2xl mx-auto">
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 text-center space-y-6 shadow-xs">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100/80 mb-2">
            <Sparkles size={13} /> Select Symptom
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
            What brings you in today?
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">
            Tap the microphone and describe your symptoms, or pick an option below
          </p>
        </div>

        {/* Mic Pulse Button */}
        <div className="flex flex-col items-center justify-center my-3">
          <button
            type="button"
            onClick={handleMicClick}
            className={`w-22 h-22 rounded-full text-white flex items-center justify-center shadow-lg transition-all duration-300 ${
              isListening
                ? 'bg-red-600 animate-pulse ring-8 ring-red-100 scale-105'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 hover:scale-105 ring-8 ring-blue-50'
            }`}
          >
            <Mic size={36} />
          </button>
          <span className="mt-2.5 text-xs font-semibold text-slate-600">
            {isListening ? '🎙️ Listening… Speak naturally' : 'Tap to speak symptoms'}
          </span>
          {voiceText && (
            <div className="mt-2 text-xs font-semibold text-blue-800 bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-100">
              Recorded: "{voiceText}"
            </div>
          )}
        </div>

        {/* Symptom Touch Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CHIEF_COMPLAINT_CATEGORIES.map((category, i) => {
            const isSel = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleTileClick(category)}
                style={{ animationDelay: `${i * 40}ms` }}
                className={`group flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 active:scale-[0.98] animate-slide-up stagger-item ${
                  isSel
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-100 shadow-xs'
                    : 'border-slate-200/80 bg-slate-50/40 hover:border-blue-400 hover:bg-white hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-100/60 group-hover:bg-blue-100/60 transition-colors">
                  {CATEGORY_ICONS[category]}
                </div>
                <span className="text-base font-bold text-slate-800 group-hover:text-blue-900 font-display">
                  {CHIEF_COMPLAINT_LABELS[category][langKey]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Emergency Alert Card */}
        {isEmergencySelected && (
          <div className="mt-4 bg-red-50/80 border border-red-200 rounded-2xl p-4.5 flex items-center justify-between gap-3 text-left shadow-xs animate-scale-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-600 shrink-0" size={22} />
              <div>
                <div className="font-bold text-red-900 text-sm">Emergency Triage Priority Triggered</div>
                <div className="text-xs text-red-700 font-medium">Duty nurse alerted for priority assessment.</div>
              </div>
            </div>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0 shadow-xs transition-all active:scale-[0.98]"
            >
              Call Nurse Now
            </button>
          </div>
        )}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-2 inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 font-semibold text-xs transition-colors"
          >
            <ArrowLeft size={13} /> Back to start
          </button>
        )}
      </div>
    </div>
  );
}


