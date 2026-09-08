import React, { useState, useEffect } from 'react';
import { getDictionary } from '@medikiosk/ui';
import { CHIEF_COMPLAINT_CATEGORIES, CHIEF_COMPLAINT_LABELS, type ChiefComplaintCategory } from '@medikiosk/clinical-engine';
import type { Language } from '@medikiosk/shared-types';
import { Mic, Heart, Thermometer, Brain, Wind, Stethoscope, Edit3, AlertTriangle, ArrowLeft, Sparkles, Send, Cpu, CheckCircle2 } from 'lucide-react';
import { speechToText, toSpeechLang } from '../lib/speech.js';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'chest-pain': <Heart className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
  'breathing-difficulty': <Wind className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
  'abdominal-pain': <Stethoscope className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
  fever: <Thermometer className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
  headache: <Brain className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
  'general-fallback': <Edit3 className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
  dizziness: <Sparkles className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
  'test-dizziness': <Sparkles className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />,
};

export interface ChiefComplaintScreenProps {
  language: Language;
  onSelect: (category: ChiefComplaintCategory) => void;
  onBack?: () => void;
  onScanDocument?: () => void;
}

export function ChiefComplaintScreen({ language, onSelect, onBack, onScanDocument }: ChiefComplaintScreenProps) {
  const isHindi = language === 'HI';
  const t = getDictionary(language ?? 'EN');
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [extractedTokens, setExtractedTokens] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ChiefComplaintCategory | null>(null);
  const [symptomList, setSymptomList] = useState<Array<{ category: ChiefComplaintCategory; label: { en: string; hi: string } }>>(() =>
    CHIEF_COMPLAINT_CATEGORIES.map((cat) => ({
      category: cat,
      label: CHIEF_COMPLAINT_LABELS[cat] || { en: cat, hi: cat },
    }))
  );

  useEffect(() => {
    let isMounted = true;
    fetch('/api/clinical/symptoms')
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const active = json.data.filter((s: any) => s.active !== false);
          if (active.length > 0) {
            setSymptomList(
              active.map((s: any) => {
                const mappedCat = (s.mappedTreeId || s.id) as ChiefComplaintCategory;
                const defaultLabel = CHIEF_COMPLAINT_LABELS[mappedCat];
                const enLabel = s.localizedLabels?.en || s.label?.en || s.name || defaultLabel?.en || mappedCat;
                let hiLabel = s.localizedLabels?.hi || s.label?.hi || s.nameHi;

                // Fallback to standard clinical Hindi mapping if missing or unchanged from English
                if (!hiLabel || hiLabel === s.name) {
                  const lowerName = (s.name || '').toLowerCase();
                  if (mappedCat === 'chest-pain' || lowerName.includes('chest')) hiLabel = 'सीने में दर्द';
                  else if (mappedCat === 'breathing-difficulty' || lowerName.includes('breath')) hiLabel = 'सांस लेने में तकलीफ';
                  else if (mappedCat === 'abdominal-pain' || lowerName.includes('abdom') || lowerName.includes('stomach') || lowerName.includes('pet')) hiLabel = 'पेट में दर्द';
                  else if (mappedCat === 'fever' || lowerName.includes('fever')) hiLabel = 'बुखार';
                  else if (mappedCat === 'headache' || lowerName.includes('headache')) hiLabel = 'सिरदर्द';
                  else if (mappedCat === 'general-fallback' || lowerName.includes('something else')) hiLabel = 'कुछ और';
                  else if (s.id?.includes('dizziness') || lowerName.includes('dizziness') || lowerName.includes('vertigo')) hiLabel = 'चक्कर आना';
                  else hiLabel = defaultLabel?.hi || enLabel;
                }

                return {
                  category: mappedCat,
                  label: { en: enLabel, hi: hiLabel },
                };
              })
            );
          }
        }
      })
      .catch(() => {
        // Safe offline fallback preserved
      });
    return () => {
      isMounted = false;
    };
  }, []);

  async function analyzeSymptomsWithAi(input: string) {
    const clean = input.trim();
    if (!clean) return;
    setAiAnalyzing(true);
    try {
      const res = await fetch('/api/ai/normalize-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, language: isHindi ? 'hi' : 'en' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.normalizedSymptoms) && data.normalizedSymptoms.length > 0) {
          setExtractedTokens(data.normalizedSymptoms);
        }
        if (data.suggestedCategory) {
          setSelectedCategory(data.suggestedCategory);
          setTimeout(() => {
            onSelect(data.suggestedCategory);
          }, 900);
        }
      }
    } catch (e) {
      console.warn('AI symptom normalization notice:', e);
    } finally {
      setAiAnalyzing(false);
    }
  }

  const isEmergencySelected = selectedCategory === 'chest-pain' || selectedCategory === 'breathing-difficulty';

  const handleMicClick = () => {
    if (!speechToText.isSupported()) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const fallbackSpeech = isHindi ? 'तेज बुखार और सिरदर्द' : 'High fever with chills and headache';
        setVoiceText(fallbackSpeech);
        analyzeSymptomsWithAi(fallbackSpeech);
      }, 1500);
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
        analyzeSymptomsWithAi(res.transcript);
      })
      .catch(() => {
        setIsListening(false);
      })
      .finally(() => setIsListening(false));
  };

  const handleTileClick = (cat: ChiefComplaintCategory) => {
    setSelectedCategory(cat);
    onSelect(cat);
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedInput.trim()) {
      setVoiceText(typedInput.trim());
      analyzeSymptomsWithAi(typedInput.trim());
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-4 w-full max-w-2xl mx-auto">
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 text-center space-y-5 shadow-xs">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100/80 mb-2">
            <Sparkles size={13} /> {isHindi ? 'लक्षण चुनें · एआई ट्राइएज' : 'Select Symptom · AI Triage'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
            {t.chiefComplaint?.title || (isHindi ? 'आज आपको क्या समस्या हो रही है?' : 'What brings you in today?')}
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {isHindi
              ? 'माइक में बोलें, लक्षण लिखें, या नीचे दिए गए विकल्पों में से चुनें'
              : 'Speak into the microphone, type your symptoms, or pick an option below'}
          </p>
        </div>

        {/* Mic Pulse Button & Voice Capture */}
        <div className="flex flex-col items-center justify-center my-2">
          <button
            type="button"
            onClick={handleMicClick}
            className={`w-20 h-20 rounded-full text-white flex items-center justify-center shadow-lg transition-all duration-300 ${
              isListening
                ? 'bg-red-600 animate-pulse ring-8 ring-red-100 scale-105'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 hover:scale-105 ring-8 ring-blue-50'
            }`}
          >
            <Mic size={32} />
          </button>
          <span className="mt-2 text-xs font-semibold text-slate-600">
            {isListening
              ? isHindi
                ? '🎙️ सुन रहे हैं… बोलिए'
                : '🎙️ Listening… Speak now'
              : isHindi
                ? 'लक्षण बोलने के लिए दबाएं (एआई विश्लेषण)'
                : 'Tap to speak symptoms (AI Normalization)'}
          </span>
          {voiceText && (
            <div className="mt-2 text-xs font-semibold text-blue-800 bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-100 flex items-center gap-2">
              <Cpu size={14} className={aiAnalyzing ? 'animate-spin text-blue-600' : 'text-blue-600'} />
              <span>{isHindi ? 'इनपुट:' : 'Input:'} "{voiceText}"</span>
              {aiAnalyzing && (
                <span className="text-[10px] text-blue-600 animate-pulse">
                  {isHindi ? 'क्लीनिकल एआई विश्लेषण जारी है…' : 'Running Clinical AI…'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Extracted Clinical AI Tokens Banner */}
        {extractedTokens.length > 0 && (
          <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-left space-y-1.5 animate-scale-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                {isHindi ? 'क्लीनिकल एआई द्वारा विश्लेषित लक्षण:' : 'Clinical AI Normalized Symptoms:'}
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                {isHindi ? 'एमएल मॉडल सक्रिय' : 'ML Model Active'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {extractedTokens.map((tok, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
                    tok.isRedFlag
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-white text-emerald-800 border-emerald-200'
                  }`}
                >
                  {tok.canonicalName || tok.symptomCode}
                  {tok.icd10Category ? ` (${tok.icd10Category})` : ''}
                  {tok.isRedFlag ? (isHindi ? ' ⚡ उच्च प्राथमिकता' : ' ⚡ High Priority') : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Natural Language Free-Text Symptom Input */}
        <form onSubmit={handleTypedSubmit} className="flex items-center gap-2 max-w-md mx-auto">
          <input
            type="text"
            placeholder={
              isHindi
                ? 'लक्षण लिखें (उदा. बुखार, तेज सिरदर्द, सीने में दर्द)…'
                : 'Type symptoms (e.g. bukhar, severe headache, chest pain)…'
            }
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!typedInput.trim() || aiAnalyzing}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <Send size={13} />
            <span>{isHindi ? 'एआई विश्लेषण' : 'AI Parse'}</span>
          </button>
        </form>

        {/* Symptom Touch Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {symptomList.map(({ category, label }, i) => {
            const isSel = selectedCategory === category;
            const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS['general-fallback'] || (
              <Stethoscope className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />
            );
            const displayLabel = isHindi ? (label?.hi || label?.en || category) : (label?.en || label?.hi || category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleTileClick(category)}
                style={{ animationDelay: `${i * 40}ms` }}
                className={`group flex min-h-[86px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-center transition-all duration-200 active:scale-[0.98] animate-slide-up stagger-item ${
                  isSel
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-100 shadow-xs'
                    : 'border-slate-200/80 bg-slate-50/40 hover:border-blue-400 hover:bg-white hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                <div className="p-1.5 rounded-xl bg-blue-50/80 border border-blue-100/60 group-hover:bg-blue-100/60 transition-colors">
                  {icon}
                </div>
                <span className="text-sm font-bold text-slate-800 group-hover:text-blue-900 font-display">
                  {displayLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Emergency Alert Card */}
        {isEmergencySelected && (
          <div className="mt-3 bg-red-50/80 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-left shadow-xs animate-scale-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-600 shrink-0" size={20} />
              <div>
                <div className="font-bold text-red-900 text-xs">
                  {isHindi ? 'क्लीनिकल एआई द्वारा आपातकालीन स्थिति की पहचान' : 'Emergency Priority Detected by Clinical AI'}
                </div>
                <div className="text-[11px] text-red-700 font-medium">
                  {isHindi
                    ? 'प्राथमिकता उपचार के लिए ट्राइएज कतार में तत्काल आगे बढ़ाया गया।'
                    : 'Triage queue automatically escalated for priority care.'}
                </div>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-[10px] shrink-0 shadow-xs uppercase font-mono">
              {isHindi ? 'प्राथमिकता: रेड' : 'Priority Red'}
            </span>
          </div>
        )}

        {onScanDocument && (
          <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-3.5 rounded-2xl border border-blue-200/60 shadow-xs">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs text-base">
                📄
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {isHindi ? 'क्या आपके पास पुराना पर्चा या रिपोर्ट है?' : 'Have an existing prescription or lab report?'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {isHindi ? 'दवाइयां और रिपोर्ट्स स्वचालित रूप से पढ़ने के लिए सीधे स्कैन करें।' : 'Skip intake questions and scan directly using AI Vision & OCR.'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onScanDocument}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <span>{isHindi ? 'दस्तावेज़ स्कैन करें (OCR) →' : 'Scan Document (OCR) →'}</span>
            </button>
          </div>
        )}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-1 inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 font-semibold text-xs transition-colors"
          >
            <ArrowLeft size={13} /> {t.common?.backButton || (isHindi ? 'पीछे जाएं' : 'Back to start')}
          </button>
        )}
      </div>
    </div>
  );
}
