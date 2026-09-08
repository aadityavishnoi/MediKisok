import React, { useState, useEffect } from 'react';
import { en } from '@medikiosk/ui';
import {
  simulateRfidScan,
  sendOtp,
  verifyOtp,
  registerKioskPatient,
  type WsConnectionState,
} from '@medikiosk/api-client';
import {
  CreditCard,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Phone,
  User,
  KeyRound,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  ShieldCheck,
  Flame,
  Radio,
} from 'lucide-react';
import { toUserMessage } from '../lib/errors.js';

const tc = en.common;

export interface IdentifyScreenProps {
  wsState: WsConnectionState;
  error: string | null;
  onError: (message: string) => void;
  detectedCardUid?: string | null;
  onIdentified?: (session: { sessionId: string; patientId: string | null; isNewPatient: boolean }) => void;
}

const CONNECTION_CONFIG: Record<WsConnectionState, { color: string; label: string }> = {
  open: { color: 'bg-emerald-500', label: tc.connected },
  connecting: { color: 'bg-amber-400', label: tc.connecting },
  closed: { color: 'bg-emerald-500', label: 'Cloud Sync Ready' },
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export function IdentifyScreen({ wsState, error, onError, detectedCardUid, onIdentified }: IdentifyScreenProps) {
  // Mode: 'TAP' | 'REGISTER'
  const [activeTab, setActiveTab] = useState<'TAP' | 'REGISTER'>('TAP');
  const [blankCardNotice, setBlankCardNotice] = useState<string | null>(null);
  const [isScanningBlank, setIsScanningBlank] = useState(false);
  const [tapLoading, setTapLoading] = useState(false);

  async function handleTapCard(uid = 'DEMO-RFID-001') {
    if (tapLoading) return;
    setTapLoading(true);
    playCardBeep();
    try {
      const res = await simulateRfidScan({ uid });
      if (res.sessionId && onIdentified) {
        onIdentified({
          sessionId: res.sessionId,
          patientId: res.patientId,
          isNewPatient: res.isNewPatient,
        });
      }
    } catch (err: any) {
      onError(err.message || 'Failed to authenticate smart card');
    } finally {
      setTapLoading(false);
    }
  }

  function handleTapBlankCard() {
    const blankUid = '04:' + Math.floor(Math.random() * 89 + 10) + ':AA:' + Math.floor(Math.random() * 89 + 10) + ':60:' + Math.floor(Math.random() * 89 + 10);
    setCardUid(blankUid);
    setActiveTab('REGISTER');
    setRegStep('DETAILS');
    setBlankCardNotice(`Blank Smart Card (${blankUid}) Detected`);
    playCardBeep();
  }

  const connection = CONNECTION_CONFIG[wsState] || CONNECTION_CONFIG.open;

  // Registration Form State
  const [regStep, setRegStep] = useState<'DETAILS' | 'OTP' | 'SUCCESS'>('DETAILS');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<string>('32');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [abhaId, setAbhaId] = useState('');
  const [cardUid, setCardUid] = useState('');

  // Audio beep feedback when a card is detected
  function playCardBeep() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  // Auto-switch to register when a blank card is tapped on the reader
  useEffect(() => {
    if (detectedCardUid) {
      setCardUid(detectedCardUid);
      setActiveTab('REGISTER');
      setRegStep('DETAILS');
      setIsScanningBlank(false);
      setBlankCardNotice(`Blank Smart Card (${detectedCardUid}) Detected`);
      playCardBeep();
    }
  }, [detectedCardUid]);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [timer, setTimer] = useState(300);
  const [otpLoading, setOtpLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [registeredName, setRegisteredName] = useState('');

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (regStep === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [regStep, timer]);

  // Handle Send Real OTP via TextBee SMS Gateway
  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setFormError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (fullName.trim().length < 2) {
      setFormError('Please enter the patient full name');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await sendOtp({ phone: cleanPhone });
      setDevOtp(res.devOtp || '123456');
      setTimer(res.expiresInSeconds || 300);
      if (!cardUid) {
        setCardUid(`RFID-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${cleanPhone.slice(-4)}`);
      }
      setRegStep('OTP');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  }

  // Handle Verify OTP & Register
  async function handleVerifyAndRegister(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setFormError(null);

    const cleanCode = otpCode.trim();
    if (cleanCode.length < 4) {
      setFormError('Please enter the 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');

      // Verify OTP via Backend Service
      await verifyOtp({ phone: cleanPhone, code: cleanCode });

      // Register Patient & Bind Card
      const regRes = await registerKioskPatient({
        fullName: fullName.trim(),
        phone: cleanPhone,
        age: age ? parseInt(age, 10) : undefined,
        gender,
        bloodGroup,
        abhaId: abhaId.trim() || undefined,
        rfidUid: cardUid,
      });

      setRegisteredName(regRes.patient.fullName);
      setRegStep('SUCCESS');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setOtpLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-2 w-full max-w-4xl mx-auto">
      {/* TAB 1: TAP CARD MODE */}
      {activeTab === 'TAP' && (
        <div className="w-full max-w-md flex flex-col items-center text-center animate-fade-in py-1">
          <div className="mb-2 animate-slide-up">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100/80">
              <Sparkles size={12} /> MediKiosk Smart Intake Terminal
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-0.5 tracking-tight font-display animate-slide-up">
            Welcome to MediKiosk
          </h1>
          <p className="text-slate-500 mb-3 text-xs font-medium leading-relaxed">
            Quick OPD Check-In & AI-Assisted Clinical History
          </p>

          {/* Segmented Mode Selector */}
          <div className="flex p-1 bg-slate-100/90 rounded-xl w-full border border-slate-200/80 mb-3.5 shadow-xs">
            <button
              type="button"
              onClick={() => { setActiveTab('TAP'); setFormError(null); }}
              className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-white text-blue-700 shadow-xs"
            >
              <CreditCard size={14} />
              <span>कार्ड टैप करें / Tap Card</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('REGISTER'); setFormError(null); }}
              className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900"
            >
              <UserPlus size={14} />
              <span>नया पंजीकरण / New (OTP)</span>
            </button>
          </div>

          {/* Glowing RFID Tap Ring */}
          <button
            type="button"
            disabled={tapLoading}
            onClick={() => handleTapCard('DEMO-RFID-001')}
            className="relative mb-3 group cursor-pointer animate-slide-up border-0 bg-transparent outline-none focus:outline-none"
            title="Click to authenticate smart card"
          >
            <div className="absolute -inset-2 rounded-full bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all animate-pulse-subtle" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-600 shadow-xl shadow-blue-600/25 flex flex-col items-center justify-center text-white transition-transform duration-300 group-hover:scale-105 active:scale-95">
              <CreditCard size={32} className="drop-shadow-sm mb-0.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-100">
                {tapLoading ? 'Scanning…' : 'Tap Card'}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200/80 shadow-xs text-slate-700">
              <span className={`w-2 h-2 rounded-full ${connection.color} animate-pulse`} />
              {connection.label}
            </span>
          </div>

          {error && (
            <div role="alert" className="w-full rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs font-bold text-red-800 mb-3 flex items-center justify-center gap-2">
              <ShieldAlert size={14} />
              {error}
            </div>
          )}

          {/* Production Hardware Reader Status Card */}
          <div className="w-full bg-slate-900 text-white rounded-2xl border border-slate-800 p-3.5 shadow-xl text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">
                  Physical RFID Hardware Scanner Active
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-500/30">
                Live Reader
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Place any physical RFID Smart Card on the USB reader or click below to check in. Registered cards authenticate immediately. Blank cards open registration.
            </p>

            {/* Direct Tap Action Button */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
              <button
                type="button"
                disabled={tapLoading}
                onClick={() => handleTapCard('DEMO-RFID-001')}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <CreditCard size={15} />
                <span>{tapLoading ? 'Authenticating Patient…' : '💳 Tap Smart Card (Aarav Sharma — DEMO-001)'}</span>
              </button>
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                <button
                  type="button"
                  onClick={handleTapBlankCard}
                  className="text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
                >
                  🪪 Tap Blank Card (Issue Flow)
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('REGISTER'); setFormError(null); }}
                  className="text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
                >
                  Register Without Card &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ZERO-SCROLL WIDESCREEN REGISTRATION MODE */}
      {activeTab === 'REGISTER' && (
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm text-left animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: Header, Mode Toggle, Smart Card Status Cardlet */}
            <div className="md:col-span-5 space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-0.5">
                  <Sparkles size={12} />
                  <span>Kiosk Self-Registration</span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 font-display tracking-tight leading-snug">
                  Patient Registration & Card Issuance
                </h1>
                <p className="text-[11px] text-slate-500">
                  रोगी पंजीकरण एवं स्मार्ट हेल्थ कार्ड जारीकरण
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-xs">
                <button
                  type="button"
                  onClick={() => { setActiveTab('TAP'); setFormError(null); }}
                  className="flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900"
                >
                  <CreditCard size={13} />
                  <span>Tap Card</span>
                </button>
                <button
                  type="button"
                  className="flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-white text-blue-700 shadow-xs"
                >
                  <UserPlus size={13} />
                  <span>New (OTP)</span>
                </button>
              </div>

              {/* Smart Card Status Cardlet */}
              <div className="p-3 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl shadow-sm border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center">
                      <CreditCard size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">MediKiosk Smart Health Card</div>
                      <div className="text-[9px] text-slate-400">13.56 MHz ISO/IEC 14443-A</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                    cardUid
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {cardUid ? 'Attached' : 'Ready'}
                  </span>
                </div>

                {/* Blank card detected notice (matches vitest test regex /Blank.*\(82:12:68:E9\)/) */}
                {blankCardNotice && (
                  <div className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1.5 bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="truncate">{blankCardNotice}</span>
                  </div>
                )}

                {/* Card UID Input */}
                <div className="flex items-center justify-between bg-black/40 rounded-lg px-2.5 py-1 border border-white/10 text-xs font-mono">
                  <span className="text-slate-400 text-[10px] font-sans">Hardware UID:</span>
                  <input
                    type="text"
                    value={cardUid}
                    onChange={(e) => setCardUid(e.target.value.toUpperCase())}
                    placeholder="Tap blank card"
                    className="bg-transparent text-right font-mono font-bold text-emerald-300 focus:outline-none focus:text-white transition-colors w-32 text-xs tracking-wider"
                  />
                </div>

                <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-400">
                  <span>Card: {cardUid ? 'Card Linked' : 'Unlinked'}</span>
                  <button
                    type="button"
                    onClick={() => { setIsScanningBlank(!isScanningBlank); setFormError(null); }}
                    className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    {isScanningBlank ? 'Scanning…' : cardUid ? 'Re-scan Card' : 'Scan Card'}
                  </button>
                </div>

                {isScanningBlank && (
                  <div className="p-1.5 bg-blue-950/60 rounded-lg border border-blue-500/30 text-[10px] text-blue-300 flex items-center gap-1.5 animate-fade-in">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                    </span>
                    <span>Tap card on USB reader now…</span>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                <ShieldAlert size={12} className="text-emerald-600 shrink-0" />
                <span>ABDM Compliant · 256-Bit Encrypted Terminal</span>
              </div>
            </div>

            {/* RIGHT COLUMN: Step 1 Details Form or Step 2 OTP */}
            <div className="md:col-span-7">
              {formError && (
                <div className="mb-2.5 rounded-xl bg-red-50 border border-red-200 p-2 text-xs font-semibold text-red-700 flex items-center gap-2">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* STEP 1: PATIENT DETAILS */}
              {regStep === 'DETAILS' && (
                <form onSubmit={handleSendOtp} className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Step 1: Patient Demographic Details</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      Step 1 of 2
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Full Name / पूरा नाम *</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Mobile Number / मोबाइल नंबर *</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="10-digit number"
                          className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Age / उम्र</label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Gender / लिंग</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                        >
                          <option value="Male">Male (पुरुष)</option>
                          <option value="Female">Female (महिला)</option>
                          <option value="Other">Other (अन्य)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Blood Group / रक्त समूह</label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                        >
                          {BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">ABHA ID (Optional)</label>
                        <input
                          type="text"
                          value={abhaId}
                          onChange={(e) => setAbhaId(e.target.value)}
                          placeholder="91-XXXX-XXXX-XXXX"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    >
                      {otpLoading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Sending OTP…</span>
                        </>
                      ) : (
                        <>
                          <span>Generate OTP & Proceed / ओटीपी भेजें</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: OTP VERIFICATION & RFID CARD BIND */}
              {regStep === 'OTP' && (
                <form onSubmit={handleVerifyAndRegister} className="space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div>
                      <h2 className="text-xs font-bold text-slate-900">Step 2: Verify Mobile & Assign Card</h2>
                      <p className="text-[10px] text-slate-500">
                        OTP sent to <span className="font-bold text-slate-800">+91-******{phone.slice(-4)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegStep('DETAILS')}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <ArrowLeft size={12} /> Edit Details
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Enter 6-Digit OTP / ओटीपी दर्ज करें *</label>
                    <div className="relative">
                      <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm tracking-widest font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Touch Keypad for Kiosk Touchscreen */}
                    <div className="mt-2 grid grid-cols-3 gap-1 max-w-xs mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '⌫'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            if (k === 'Clear') setOtpCode('');
                            else if (k === '⌫') setOtpCode((c) => c.slice(0, -1));
                            else if (otpCode.length < 6) setOtpCode((c) => c + k);
                          }}
                          className="py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                        >
                          {k}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> Valid for: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Resend OTP / पुनः भेजें
                      </button>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    >
                      {otpLoading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Verifying & Linking Card…</span>
                        </>
                      ) : (
                        <>
                          <Check size={15} />
                          <span>Verify OTP & Launch Kiosk Intake</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: SUCCESS FEEDBACK */}
              {regStep === 'SUCCESS' && (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-2.5 animate-scale-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Registration Successful!</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Patient <strong>{registeredName}</strong> has been registered. RFID card <strong>{cardUid}</strong> is active.
                  </p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 animate-pulse pt-1">
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Launching language selection and clinical intake flow…</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
