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
} from 'lucide-react';
import { toUserMessage } from '../lib/errors.js';

const tc = en.common;

export interface IdentifyScreenProps {
  wsState: WsConnectionState;
  error: string | null;
  onError: (message: string) => void;
}

const CONNECTION_CONFIG: Record<WsConnectionState, { color: string; label: string }> = {
  open: { color: 'bg-emerald-500', label: tc.connected },
  connecting: { color: 'bg-amber-400', label: tc.connecting },
  closed: { color: 'bg-red-500', label: tc.reconnecting },
};

const DEMO_PATIENTS = [
  {
    uid: 'DEMO-RFID-001',
    name: 'Aarav Sharma',
    label: 'Demo Patient 001',
    age: 34,
    gender: 'Male',
    abhaId: '91-4820-9102-3819',
    bloodGroup: 'O+',
    lastVisit: 'Cardiology OPD',
  },
  {
    uid: 'DEMO-RFID-002',
    name: 'Priya Patel',
    label: 'Demo Patient 002',
    age: 28,
    gender: 'Female',
    abhaId: '91-1029-4829-5710',
    bloodGroup: 'B+',
    lastVisit: 'General Medicine',
  },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export function IdentifyScreen({ wsState, error, onError }: IdentifyScreenProps) {
  // Mode: 'TAP' | 'REGISTER'
  const [activeTab, setActiveTab] = useState<'TAP' | 'REGISTER'>('TAP');

  // Existing Patient Simulation
  const [simulating, setSimulating] = useState<string | null>(null);
  const [lastScannedPatient, setLastScannedPatient] = useState<(typeof DEMO_PATIENTS)[0] | null>(null);
  const connection = CONNECTION_CONFIG[wsState];

  // Registration Form State
  const [regStep, setRegStep] = useState<'DETAILS' | 'OTP' | 'SUCCESS'>('DETAILS');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<string>('32');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [abhaId, setAbhaId] = useState('');
  const [cardUid, setCardUid] = useState('');

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

  async function simulate(patient: (typeof DEMO_PATIENTS)[0]) {
    setSimulating(patient.uid);
    setLastScannedPatient(patient);
    try {
      await simulateRfidScan({ uid: patient.uid });
    } catch (err) {
      onError(toUserMessage(err, en));
      setLastScannedPatient(null);
    } finally {
      setSimulating(null);
    }
  }

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
      setCardUid(`RFID-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${cleanPhone.slice(-4)}`);
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
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 text-center max-w-xl mx-auto w-full">
      {/* Badge */}
      <div className="mb-2 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100/80">
          <Sparkles size={13} /> MediKiosk Smart Intake Terminal
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-1 tracking-tight font-display animate-slide-up">
        Welcome to MediKiosk
      </h1>
      <p className="text-slate-500 mb-6 text-sm font-medium leading-relaxed">
        Quick OPD Check-In & AI-Assisted Clinical History
      </p>

      {/* Segmented Mode Selector */}
      <div className="flex p-1.5 bg-slate-100/90 rounded-2xl w-full max-w-md border border-slate-200/80 mb-6 shadow-xs">
        <button
          type="button"
          onClick={() => { setActiveTab('TAP'); setFormError(null); }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'TAP'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard size={15} />
          <span>कार्ड टैप करें / Tap Card</span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('REGISTER'); setFormError(null); }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'REGISTER'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus size={15} />
          <span>नया पंजीकरण / New (OTP)</span>
        </button>
      </div>

      {/* TAB 1: TAP CARD */}
      {activeTab === 'TAP' && (
        <div className="w-full flex flex-col items-center animate-fade-in">
          {/* Glowing RFID Tap Ring */}
          <div className="relative mb-6 group cursor-pointer animate-slide-up">
            <div className="absolute -inset-2 rounded-full bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all animate-pulse-subtle" />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-600 shadow-xl shadow-blue-600/25 flex flex-col items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
              <CreditCard size={38} className="drop-shadow-sm mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Tap Card</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200/80 shadow-xs text-slate-700">
              <span className={`w-2 h-2 rounded-full ${connection.color} animate-pulse`} />
              {connection.label}
            </span>
          </div>

          {/* Patient Profile Card Preview */}
          {lastScannedPatient && (
            <div className="w-full bg-white border border-emerald-200 rounded-3xl p-5 mb-6 text-left shadow-lg shadow-emerald-500/5 animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm font-display">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>Card Verified: {lastScannedPatient.name}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                  {lastScannedPatient.bloodGroup}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div><span className="font-semibold text-slate-400">ABHA:</span> {lastScannedPatient.abhaId}</div>
                <div><span className="font-semibold text-slate-400">Age:</span> {lastScannedPatient.age}y ({lastScannedPatient.gender})</div>
                <div className="col-span-2"><span className="font-semibold text-slate-400">Department:</span> {lastScannedPatient.lastVisit}</div>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="w-full rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs font-bold text-red-800 mb-6 flex items-center justify-center gap-2">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          {/* Clean Demo Actions */}
          <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs text-center space-y-2.5">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Simulate RFID Card Reader (Demo)
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {DEMO_PATIENTS.map((p) => (
                <button
                  key={p.uid}
                  type="button"
                  disabled={simulating !== null}
                  onClick={() => simulate(p)}
                  className="flex-1 py-2.5 px-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50/60 hover:border-blue-300 text-slate-800 font-semibold text-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-between"
                >
                  <div className="text-left">
                    <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                    <div className="text-[10px] text-slate-400">{p.lastVisit}</div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-600">
                    {simulating === p.uid ? 'Scanning…' : `Tap — ${p.label}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIRST TIME REGISTRATION (OTP) */}
      {activeTab === 'REGISTER' && (
        <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm text-left animate-fade-in">
          {formError && (
            <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
              <ShieldAlert size={15} />
              <span>{formError}</span>
            </div>
          )}

          {/* STEP 1: PATIENT DETAILS */}
          {regStep === 'DETAILS' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Step 1: Patient Demographic Details</span>
                  </h2>
                  <p className="text-xs text-slate-500">Enter details to generate your RFID smart health card</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    Step 1 of 2
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name / पूरा नाम *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number / मोबाइल नंबर *</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit number"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Age / उम्र</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender / लिंग</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      <option value="Male">Male (पुरुष)</option>
                      <option value="Female">Female (महिला)</option>
                      <option value="Other">Other (अन्य)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group / रक्त समूह</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ABHA ID (Optional)</label>
                  <input
                    type="text"
                    value={abhaId}
                    onChange={(e) => setAbhaId(e.target.value)}
                    placeholder="91-XXXX-XXXX-XXXX"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Sending OTP…</span>
                    </>
                  ) : (
                    <>
                      <span>Generate OTP & Proceed / ओटीपी भेजें</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION & RFID CARD BIND */}
          {regStep === 'OTP' && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 2: Verify Mobile & Assign Card</h2>
                  <p className="text-xs text-slate-500">
                    OTP sent to <span className="font-bold text-slate-800">+91-******{phone.slice(-4)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRegStep('DETAILS')}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft size={13} /> Edit Details
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit OTP / ओटीपी दर्ज करें *</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm tracking-widest font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Touch Keypad for Kiosk Touchscreen */}
                <div className="mt-3 grid grid-cols-3 gap-1.5 max-w-xs mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '⌫'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (k === 'Clear') setOtpCode('');
                        else if (k === '⌫') setOtpCode((c) => c.slice(0, -1));
                        else if (otpCode.length < 6) setOtpCode((c) => c + k);
                      }}
                      className="py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs"
                    >
                      {k}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Valid for: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Resend OTP / पुनः भेजें
                  </button>
                </div>
              </div>

              {/* Card UID Assignment Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-blue-600" />
                    Assigned Smart RFID Card UID
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Ready to Bind
                  </span>
                </div>
                <div className="font-mono text-xs font-semibold text-slate-800">
                  {cardUid}
                </div>
                <p className="text-[10px] text-slate-400">
                  This blank health card is automatically mapped to {fullName || 'patient'}.
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Verifying & Linking Card…</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Verify OTP & Launch Kiosk Intake</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS FEEDBACK */}
          {regStep === 'SUCCESS' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 animate-scale-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Registration Successful!</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Patient <strong>{registeredName}</strong> has been registered. RFID card <strong>{cardUid}</strong> is active.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 animate-pulse pt-2">
                <RefreshCw size={14} className="animate-spin" />
                <span>Launching language selection and clinical intake flow…</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
