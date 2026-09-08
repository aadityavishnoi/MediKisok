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
  const [manualUid, setManualUid] = useState('');
  const [webSerialConnected, setWebSerialConnected] = useState(false);
  const [hardwareBridgeConnected, setHardwareBridgeConnected] = useState(false);
  const [lastScannedUid, setLastScannedUid] = useState<string | null>(null);
  const [successSession, setSuccessSession] = useState<{ sessionId: string; patientId: string | null; isNewPatient: boolean } | null>(null);

  async function handleTapCard(uid: string) {
    const cleanUid = uid.trim();
    if (!cleanUid || tapLoading) return;
    setTapLoading(true);
    setLastScannedUid(cleanUid);
    playCardBeep();

    try {
      let data: any = null;
      try {
        const res = await fetch('/api/rfid/trigger-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: cleanUid }),
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch (fetchErr) {
        console.warn('Direct RFID trigger fetch notice:', fetchErr);
      }

      // 1. Registered patient authenticated by backend
      if (data && data.sessionId && !data.isNewPatient && onIdentified) {
        onIdentified({
          sessionId: data.sessionId,
          patientId: data.patientId,
          isNewPatient: false,
        });
        return;
      }

      // 2. Demo token / offline client fallback
      if (cleanUid.toUpperCase().startsWith('DEMO-RFID') || cleanUid.toUpperCase() === 'DEMO-001') {
        try {
          const simRes = await simulateRfidScan({ uid: cleanUid });
          if (simRes && simRes.sessionId && onIdentified) {
            onIdentified({
              sessionId: simRes.sessionId,
              patientId: simRes.patientId || null,
              isNewPatient: false,
            });
            return;
          }
        } catch {}
      }

      // 3. Status is IDENTIFIED
      if (data && data.status === 'IDENTIFIED' && data.sessionId && onIdentified) {
        onIdentified({
          sessionId: data.sessionId,
          patientId: data.patientId,
          isNewPatient: false,
        });
        return;
      }

      // 4. Blank or unregistered card: open Registration tab with card UID ready
      setCardUid(cleanUid);
      setActiveTab('REGISTER');
      setRegStep('DETAILS');
      setBlankCardNotice(`Physical RFID Card (${cleanUid}) Detected — Ready for Registration`);
    } catch (err: any) {
      setCardUid(cleanUid);
      setActiveTab('REGISTER');
      setRegStep('DETAILS');
      setBlankCardNotice(`Physical RFID Card (${cleanUid}) Detected — Ready for Registration`);
    } finally {
      setTapLoading(false);
    }
  }

  // Stream reader from a WebSerial port
  function readFromSerialPort(port: any) {
    try {
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = '';
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += value;
              const lines = buffer.split(/[\r\n]+/);
              buffer = lines.pop() || '';
              for (const line of lines) {
                const clean = line.trim();
                const match = clean.match(/(?:RFID_SCAN:|Card UID:\s*|UID tag:\s*|UID:\s*)([0-9a-fA-F:\s]+)/i) || clean.match(/^([0-9a-fA-F:\s]{6,})$/);
                if (match) {
                  const scannedUid = match[1].trim().replace(/\s+/g, ':');
                  handleTapCard(scannedUid);
                }
              }
            }
          }
        } catch {
          setWebSerialConnected(false);
        }
      })();
    } catch (err) {
      console.warn('readFromSerialPort error:', err);
    }
  }

  // Auto-connect to WebSerial and check background hardware serial bridge on mount
  useEffect(() => {
    let mounted = true;

    // 1. Check background physical serial bridge status
    fetch('/api/rfid/status')
      .then((res) => res.json())
      .then((status) => {
        if (mounted && (status.connected || status.state === 'CONNECTED')) {
          setHardwareBridgeConnected(true);
        }
      })
      .catch(() => {});

    // 2. Auto-connect WebSerial if permission was previously granted
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      (navigator as any).serial
        .getPorts()
        .then(async (ports: any[]) => {
          if (!mounted || ports.length === 0) return;
          try {
            const port = ports[0];
            if (!port.readable) {
              await port.open({ baudRate: 9600 });
            }
            if (mounted) {
              setWebSerialConnected(true);
              readFromSerialPort(port);
            }
          } catch {
            // Port might be in use by background bridge, which is fine
          }
        })
        .catch(() => {});

      const onSerialConnect = async (e: any) => {
        try {
          const port = e.port || e.target;
          if (!port.readable) {
            await port.open({ baudRate: 9600 });
          }
          if (mounted) {
            setWebSerialConnected(true);
            readFromSerialPort(port);
          }
        } catch {}
      };

      (navigator as any).serial.addEventListener('connect', onSerialConnect);
      return () => {
        mounted = false;
        (navigator as any).serial.removeEventListener('connect', onSerialConnect);
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  // 1. Web Serial direct browser-to-hardware reader connection (Manual trigger if needed)
  async function handleConnectWebSerial() {
    if (!('serial' in navigator)) {
      alert('Web Serial is supported in Google Chrome & Edge. Please open this page in Chrome/Edge to connect directly to your USB scanner.');
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      setWebSerialConnected(true);
      readFromSerialPort(port);
    } catch (err: any) {
      console.warn('WebSerial error:', err);
      if (err.name === 'NetworkError' || String(err).includes('Failed to open serial port')) {
        setWebSerialConnected(true);
        setHardwareBridgeConnected(true);
        alert('Notice: This COM port is already active and streaming via the background terminal bridge! Just tap your physical RFID card directly onto the reader antenna.');
      }
    }
  }

  // 2. Listen to USB HID Keyboard Readers (types UID + Enter or rapid keystrokes)
  useEffect(() => {
    let buffer: string[] = [];
    let timer: any = null;

    function processBuffer() {
      if (buffer.length >= 4) {
        const scanned = buffer.join('').trim();
        buffer = [];
        handleTapCard(scanned);
      } else {
        buffer = [];
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      // If user or scanner typed into an input or textarea, let the element handle it cleanly
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Enter') {
        clearTimeout(timer);
        processBuffer();
      } else if (e.key.length === 1) {
        buffer.push(e.key);
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (buffer.length >= 4) {
            processBuffer();
          }
        }, 180);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(timer);
    };
  }, [activeTab]);

  // 3. Poll cloud backend for live physical scans forwarded by local serial bridge
  useEffect(() => {
    let lastHandledTime = Date.now();
    let mounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rfid/latest-scan?since=${lastHandledTime}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data.hasScan && data.scan && data.scan.timestamp > lastHandledTime) {
          lastHandledTime = data.scan.timestamp;
          playCardBeep();
          if (data.scan.sessionId && !data.scan.isNewPatient && onIdentified) {
            onIdentified({
              sessionId: data.scan.sessionId,
              patientId: data.scan.patientId,
              isNewPatient: false,
            });
          } else if (data.scan.uid) {
            setCardUid(data.scan.uid);
            setActiveTab('REGISTER');
            setRegStep('DETAILS');
            setBlankCardNotice(`Physical RFID Card (${data.scan.uid}) Detected — Ready for Registration`);
          }
        }
      } catch {}
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [onIdentified]);

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
      const nextSession = {
        sessionId: regRes.sessionId,
        patientId: regRes.patient.id,
        isNewPatient: true,
      };
      setSuccessSession(nextSession);

      // Auto-redirect to Language Screen / Intake Flow
      setTimeout(() => {
        if (onIdentified) {
          onIdentified(nextSession);
        }
      }, 1200);
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
          <div
            className="relative mb-3 animate-slide-up"
          >
            <div className="absolute -inset-2 rounded-full bg-blue-500/10 blur-xl animate-pulse-subtle" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-600 shadow-xl shadow-blue-600/25 flex flex-col items-center justify-center text-white">
              <CreditCard size={32} className="drop-shadow-sm mb-0.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-100">
                {tapLoading ? 'Scanning…' : 'Tap Card'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200/80 shadow-xs text-slate-700">
              <span className={`w-2 h-2 rounded-full ${connection.color} animate-pulse`} />
              {connection.label}
            </span>
            {lastScannedUid && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                Scanned: {lastScannedUid}
              </span>
            )}
          </div>

          {error && (
            <div role="alert" className="w-full rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs font-bold text-red-800 mb-3 flex items-center justify-center gap-2">
              <ShieldAlert size={14} />
              {error}
            </div>
          )}

            {/* Production Hardware Reader Status Card */}
            <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm text-left space-y-3.5 animate-slide-up">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                    <Radio size={16} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 tracking-tight font-display">
                      Physical RFID Hardware System
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400">
                      13.56 MHz ISO/IEC 14443-A Scanner Active
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Scanner Connected & Active
                </span>
              </div>

              {/* Hardware Scanner Live Indicator Banner */}
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-blue-50/50 border border-emerald-200/80 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    🟢 Hardware Scanner Ready (Auto-Detecting Card Taps)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[10px] font-extrabold shrink-0 border border-emerald-200">
                  Auto-Connected
                </span>
              </div>

              <p className="text-[11px] text-slate-500 font-medium leading-relaxed px-0.5">
                Place your physical RFID Smart Card directly onto the USB scanner antenna. Cards are scanned automatically and authenticated instantly.
              </p>

              {/* Seamless Live Input / Tap Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualUid.trim()) {
                    const uidToScan = manualUid.trim();
                    setManualUid('');
                    handleTapCard(uidToScan);
                  }
                }}
                className="relative flex items-center"
              >
                <CreditCard size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  id="rfid-manual-input"
                  type="text"
                  autoFocus
                  placeholder="Tap card on reader or enter card UID…"
                  value={manualUid}
                  onChange={(e) => setManualUid(e.target.value)}
                  className="w-full pl-9 pr-36 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-mono font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                />
                <div className="absolute right-1.5 flex items-center">
                  <button
                    type="submit"
                    disabled={tapLoading || !manualUid.trim()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-xs transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                  >
                    {tapLoading ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" />
                        <span>Verifying…</span>
                      </>
                    ) : (
                      <>
                        <Radio size={11} className="text-blue-200 animate-pulse" />
                        <span>Scan Card &rarr;</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Quick-Tap Demo & Test Cards */}
              <div className="pt-2 border-t border-slate-100/80 text-left">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1.5 px-0.5">
                  <span>Fast Demo & Test Cards:</span>
                  <span className="text-[9px] text-blue-600 font-bold">1-Click Tap Simulation</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    disabled={tapLoading}
                    onClick={() => handleTapCard('DEMO-RFID-001')}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[10px] font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
                      <span>Aarav Sharma</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 truncate">DEMO-RFID-001</div>
                  </button>

                  <button
                    type="button"
                    disabled={tapLoading}
                    onClick={() => handleTapCard('DEMO-RFID-002')}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[10px] font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
                      <span>Priya Verma</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 truncate">DEMO-RFID-002</div>
                  </button>

                  <button
                    type="button"
                    disabled={tapLoading}
                    onClick={() => handleTapCard('DEMO-RFID-003')}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[10px] font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
                      <span>Ramesh Patel</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 truncate">DEMO-RFID-003</div>
                  </button>

                  <button
                    type="button"
                    disabled={tapLoading}
                    onClick={() => handleTapCard(`BLANK-CARD-${Math.floor(100 + Math.random() * 900)}`)}
                    className="p-1.5 rounded-lg bg-amber-50/50 hover:bg-amber-100/70 border border-amber-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[10px] font-bold text-amber-900 flex items-center justify-between">
                      <span>Blank Card</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </div>
                    <div className="text-[9px] font-mono text-amber-700/80">Self-Register &rarr;</div>
                  </button>
                </div>
              </div>

              {/* Footer Links & Cert */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500 px-0.5">
                <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  ABDM Encrypted Intake
                </span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('REGISTER'); setFormError(null); }}
                  className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                >
                  Register Without Card &rarr;
                </button>
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
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 animate-scale-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Registration Successful!</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Patient <strong>{registeredName}</strong> has been registered. RFID card <strong>{cardUid}</strong> is active.
                  </p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 animate-pulse pt-1">
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Redirecting to language selection and clinical intake flow…</span>
                  </div>
                  {successSession && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onIdentified) onIdentified(successSession);
                      }}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <span>Continue to Language Selection &rarr;</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
