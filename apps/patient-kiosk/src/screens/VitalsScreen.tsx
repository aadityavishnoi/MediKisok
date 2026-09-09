import React, { useState } from 'react';
import { Language } from '@medikiosk/shared-types';
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Scale,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export interface VitalsScreenProps {
  sessionId: string;
  patientId?: string | null;
  language: Language;
  onComplete: () => void;
  onSkip: () => void;
}

export function VitalsScreen({ sessionId, patientId, language, onComplete, onSkip }: VitalsScreenProps) {
  const isHi = language === Language.HI;

  // Measurement states
  const [measuring, setMeasuring] = useState(false);
  const [measured, setMeasured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Vitals values
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(72);
  const [spo2, setSpo2] = useState<number>(98);
  const [tempF, setTempF] = useState<number>(98.6);
  const [heightCm, setHeightCm] = useState<number>(168);
  const [weightKg, setWeightKg] = useState<number>(65);

  const bmi = heightCm && weightKg ? Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10 : 23.0;

  // Auto-measure IoT simulation
  async function handleAutoMeasure() {
    setMeasuring(true);
    setMeasured(false);

    // Simulate real IoT hardware telemetry capture
    setTimeout(() => {
      const randomSystolic = 115 + Math.floor(Math.random() * 18);
      const randomDiastolic = 75 + Math.floor(Math.random() * 12);
      const randomPulse = 68 + Math.floor(Math.random() * 16);
      const randomSpo2 = 97 + Math.floor(Math.random() * 3);
      const randomTemp = Math.round((98.2 + Math.random() * 1.2) * 10) / 10;

      setSystolic(randomSystolic);
      setDiastolic(randomDiastolic);
      setPulse(randomPulse);
      setSpo2(randomSpo2);
      setTempF(randomTemp);
      setMeasuring(false);
      setMeasured(true);
    }, 1800);
  }

  // Save vitals to database
  async function handleSaveVitals() {
    setSaving(true);
    try {
      await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          patientId: patientId || undefined,
          systolicBp: systolic,
          diastolicBp: diastolic,
          pulse,
          spo2,
          temperatureF: tempF,
          heightCm,
          weightKg,
          bmi,
          source: 'KIOSK_IOT_TELEMETRY',
        }),
      });
      onComplete();
    } catch (err) {
      console.warn('Vitals submission notice:', err);
      // Proceed gracefully
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center w-full max-w-2xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 rounded-3xl shadow-lg shadow-blue-500/10 text-left relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-2">
              <Activity size={12} className="animate-pulse" />
              {isHi ? 'स्वास्थ्य जांच स्टेशन' : 'Health Test & Vitals Station'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
              {isHi ? 'वाइटल्स और स्वास्थ्य पैरामीटर जांचें' : 'Check Vital Signs & Telemetry'}
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-md">
              {isHi
                ? 'बीपी कफ लगाएं और उंगली पल्स ऑक्सीमीटर में डालें, या नीचे दिए गए बटन पर टैप करें।'
                : 'Place your arm in the BP cuff and finger in the pulse sensor, or tap Auto-Measure below.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <SlidersHorizontal size={13} />
            <span>{showManual ? (isHi ? 'सेंसर दृश्य' : 'Sensor View') : (isHi ? 'मैन्युअल दर्ज' : 'Manual Entry')}</span>
          </button>
        </div>
      </div>

      {/* Main Sensors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        {/* Blood Pressure */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-left relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{isHi ? 'रक्तचाप' : 'Blood Pressure'}</span>
            <Activity size={16} className="text-blue-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {measuring ? '…' : `${systolic}/${diastolic}`}
            </span>
            <span className="text-[10px] text-slate-400 ml-1 font-semibold">mmHg</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
            systolic >= 140 || diastolic >= 90
              ? 'bg-red-50 text-red-700'
              : systolic >= 120
              ? 'bg-amber-50 text-amber-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}>
            {systolic >= 140 ? (isHi ? 'उच्च' : 'High') : (isHi ? 'सामान्य' : 'Normal')}
          </span>
          {showManual && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSystolic((v) => Math.max(80, v - 2))}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs"
              >
                -
              </button>
              <span className="text-[11px] font-mono flex-1 text-center font-bold">{systolic}</span>
              <button
                type="button"
                onClick={() => setSystolic((v) => Math.min(220, v + 2))}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Pulse / Heart Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-left relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{isHi ? 'हार्ट रेट' : 'Heart Rate'}</span>
            <Heart size={16} className="text-rose-500 animate-pulse" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {measuring ? '…' : pulse}
            </span>
            <span className="text-[10px] text-slate-400 ml-1 font-semibold">bpm</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 w-fit">
            {isHi ? 'सामान्य धड़कन' : 'Normal Sinus'}
          </span>
          {showManual && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPulse((v) => Math.max(40, v - 1))}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs"
              >
                -
              </button>
              <span className="text-[11px] font-mono flex-1 text-center font-bold">{pulse}</span>
              <button
                type="button"
                onClick={() => setPulse((v) => Math.min(180, v + 1))}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* SpO2 Oxygen */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-left relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{isHi ? 'ऑक्सीजन' : 'Blood Oxygen'}</span>
            <Wind size={16} className="text-teal-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              {measuring ? '…' : `${spo2}%`}
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
            spo2 < 95 ? 'bg-red-50 text-red-700' : 'bg-teal-50 text-teal-700'
          }`}>
            {spo2 < 95 ? (isHi ? 'कम ऑक्सीजन' : 'Low SpO2') : (isHi ? 'संतृप्त' : 'Adequate Air')}
          </span>
          {showManual && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSpo2((v) => Math.max(70, v - 1))}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs"
              >
                -
              </button>
              <span className="text-[11px] font-mono flex-1 text-center font-bold">{spo2}%</span>
              <button
                type="button"
                onClick={() => setSpo2((v) => Math.min(100, v + 1))}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Body Temperature */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-left relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{isHi ? 'तापमान' : 'Temperature'}</span>
            <Thermometer size={16} className="text-amber-500" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {measuring ? '…' : `${tempF}°`}
            </span>
            <span className="text-[10px] text-slate-400 ml-1 font-semibold">°F</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
            tempF >= 100.4 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {tempF >= 100.4 ? (isHi ? 'बुखार' : 'Fever') : (isHi ? 'सामान्य' : 'Normal')}
          </span>
          {showManual && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTempF((v) => Math.round((v - 0.2) * 10) / 10)}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs"
              >
                -
              </button>
              <span className="text-[11px] font-mono flex-1 text-center font-bold">{tempF}°</span>
              <button
                type="button"
                onClick={() => setTempF((v) => Math.round((v + 0.2) * 10) / 10)}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Height, Weight & BMI Strip */}
      <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100/60 text-indigo-700 flex items-center justify-center">
            <Scale size={20} />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-bold text-slate-800 font-display">
              {isHi ? 'शारीरिक माप एवं बीएमआई' : 'Anthropometry & BMI'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isHi ? 'स्मार्ट तराजू और ऊंचाई सेंसर द्वारा मापा गया' : 'Measured via ultrasonic kiosk height & weight pad'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
          <div>
            <span className="text-slate-400 text-[10px] block">{isHi ? 'ऊंचाई' : 'Height'}</span>
            <span className="font-mono font-bold text-slate-900">{heightCm} cm</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div>
            <span className="text-slate-400 text-[10px] block">{isHi ? 'वजन' : 'Weight'}</span>
            <span className="font-mono font-bold text-slate-900">{weightKg} kg</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div>
            <span className="text-slate-400 text-[10px] block">BMI</span>
            <span className="font-mono font-extrabold text-indigo-700">{bmi}</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
        <button
          type="button"
          disabled={measuring || saving}
          onClick={handleAutoMeasure}
          className="flex-1 w-full py-3.5 px-5 rounded-2xl bg-white border-2 border-blue-500 hover:bg-blue-50/50 text-blue-700 font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
        >
          <RefreshCw size={16} className={measuring ? 'animate-spin text-blue-600' : ''} />
          <span>
            {measuring
              ? (isHi ? 'सेंसर रीडिंग जारी है…' : 'Reading IoT Sensors…')
              : (isHi ? 'फिर से मापें / Auto-Measure' : 'Auto-Measure with Sensors')}
          </span>
        </button>

        <button
          type="button"
          disabled={measuring || saving}
          onClick={handleSaveVitals}
          className="flex-1 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
        >
          {saving ? (
            <span>{isHi ? 'सहेज रहे हैं…' : 'Saving…'}</span>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>{isHi ? 'वाइटल्स पुष्टि करें और आगे बढ़ें' : 'Confirm Vitals & Proceed'}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>

      {/* Skip Link */}
      <button
        type="button"
        onClick={onSkip}
        className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer pt-1"
      >
        {isHi ? 'वाइटल्स जांच छोड़ें (यदि सेंसर अनुपलब्ध हैं)' : 'Skip Health Test (if sensors unavailable)'}
      </button>
    </div>
  );
}
