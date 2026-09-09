import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCard,
  PlusCircle,
  Building2,
  BarChart3,
  Settings,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Download,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Key,
  Layers,
  Radio,
  RefreshCw,
  UserCheck,
  Sun,
  Moon,
  Plus,
  X,
  Repeat,
  AlertOctagon,
  History,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  Zap,
  Activity,
  Terminal,
  ArrowRight,
  Tag,
  Copy,
  Usb,
  CheckCheck
} from 'lucide-react';

interface CardItem {
  id: string;
  uid: string;
  cardStatus: string;
  active: boolean;
  issuedAt?: string;
  patient?: {
    id: string;
    fullName: string;
    abhaId?: string;
    phone?: string;
  };
  hospital?: {
    id: string;
    name: string;
    code: string;
  };
}

interface InventoryStats {
  total: number;
  byStatus: Record<string, number>;
}

interface AuditItem {
  id: string;
  action: string;
  entityId: string;
  actorType: string;
  actorId?: string;
  createdAt: string;
  metadata?: any;
}

export interface LiveScanEntry {
  uid: string;
  timestamp: string;
  isRegistered?: boolean;
  patientName?: string;
  status?: string;
  source: 'WEBSOCKET' | 'SERIAL_BRIDGE' | 'WEB_SERIAL' | 'USB_HID' | 'MANUAL';
}

function playRfidBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1900, ctx.currentTime + 0.11);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch {}
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeNav, setActiveNav] = useState('inventory');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({ total: 0, byStatus: {} });
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Realtime RFID Hardware Scanning States
  const [hardwareBridge, setHardwareBridge] = useState<{
    connected: boolean;
    state: string;
    port: string;
    baudRate: number;
  }>({
    connected: false,
    state: 'CONNECTING',
    port: 'COM9',
    baudRate: 9600,
  });
  const [webSerialConnected, setWebSerialConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastScannedTag, setLastScannedTag] = useState<LiveScanEntry | null>(null);
  const [scanHistory, setScanHistory] = useState<LiveScanEntry[]>([]);
  const [recentTapAnimation, setRecentTapAnimation] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [manualInputVal, setManualInputVal] = useState('');

  // Modals & Drawers
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerUid, setRegisterUid] = useState('');

  const [replaceModalCard, setReplaceModalCard] = useState<CardItem | null>(null);
  const [newReplacementUid, setNewReplacementUid] = useState('');

  const [auditModalCard, setAuditModalCard] = useState<CardItem | null>(null);
  const [cardAuditLogs, setCardAuditLogs] = useState<AuditItem[]>([]);

  // Security Audit Tab logs
  const [allRfidAuditLogs, setAllRfidAuditLogs] = useState<AuditItem[]>([]);

  // Enrolment Desk State
  const [patientInput, setPatientInput] = useState('');
  const [ageInput, setAgeInput] = useState('32');
  const [genderInput, setGenderInput] = useState('MALE');
  const [phoneInput, setPhoneInput] = useState('');
  const [abhaInput, setAbhaInput] = useState('');
  const [scannedUid, setScannedUid] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLight = theme === 'light';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Central Tag Detection Dispatcher: auto-fills inputs, plays chime, checks DB
  const handleTagDetected = useCallback(async (rawUid: string, source: LiveScanEntry['source'] = 'SERIAL_BRIDGE') => {
    let cleanUid = rawUid.trim().toUpperCase();
    if (!cleanUid) return;

    // Normalize 8-character compact hex e.g. 2433F006 -> 24:33:F0:06
    if (/^[0-9A-F]{8}$/.test(cleanUid)) {
      cleanUid = cleanUid.match(/.{2}/g)!.join(':');
    }

    if (soundEnabled) {
      playRfidBeep();
    }

    setRecentTapAnimation(true);
    setTimeout(() => setRecentTapAnimation(false), 1200);

    // Auto-fill active context:
    setScannedUid(cleanUid);
    setRegisterUid((prev) => (showRegisterModal ? cleanUid : prev));
    setNewReplacementUid((prev) => (replaceModalCard ? cleanUid : prev));

    // Verify status against CockroachDB live
    let isRegistered = false;
    let patientName = '';
    let cardStatus = 'NEW_CARD';

    try {
      const res = await fetch(`/api/rfid/cards/${encodeURIComponent(cleanUid)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.card) {
          isRegistered = !!data.card.patient;
          patientName = data.card.patient?.fullName || '';
          cardStatus = data.card.cardStatus || (isRegistered ? 'ACTIVE' : 'AVAILABLE');
        }
      }
    } catch {}

    const entry: LiveScanEntry = {
      uid: cleanUid,
      timestamp: new Date().toLocaleTimeString(),
      isRegistered,
      patientName,
      status: cardStatus,
      source,
    };

    setLastScannedTag(entry);
    setScanHistory((prev) => [entry, ...prev.filter((p) => p.uid !== cleanUid).slice(0, 8)]);

    if (isRegistered) {
      showToast(`🏷️ Scanned Card [${cleanUid}] · Assigned to ${patientName} (${cardStatus})`);
    } else {
      showToast(`⚡ Realtime Tag Detected [${cleanUid}] · Ready for Patient Encoding`);
    }
  }, [soundEnabled, showRegisterModal, replaceModalCard]);

  // WebSerial Reader references
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);

  const handleConnectWebSerial = async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial API is supported in Google Chrome & Edge. Please open this portal in Chrome/Edge to connect directly to your USB scanner.');
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      setWebSerialConnected(true);
      serialPortRef.current = port;
      showToast('Direct WebSerial USB Reader connected!');

      const textDecoder = new TextDecoder();
      const reader = port.readable.getReader();
      serialReaderRef.current = reader;

      let buffer = '';
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += textDecoder.decode(value, { stream: true });
              const lines = buffer.split(/[\r\n]+/);
              buffer = lines.pop() || '';
              for (const line of lines) {
                const match = line.match(/(?:RFID_SCAN:|Card UID:\s*|UID tag:\s*|UID:\s*)([0-9a-fA-F:\s]+)/i) || line.match(/^([0-9a-fA-F:\s]{6,})$/);
                if (match) {
                  const uid = match[1].trim().replace(/\s+/g, ':');
                  handleTagDetected(uid, 'WEB_SERIAL');
                }
              }
            }
          }
        } catch {
          setWebSerialConnected(false);
        }
      })();
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        showToast(`WebSerial notice: ${err.message || 'Port active on background terminal bridge'}`);
      }
    }
  };

  // 1. Realtime WebSocket Listener (ws://localhost:4000/ws)
  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimer: any = null;
    let mounted = true;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!mounted) return;
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!mounted) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'RFID_SCANNED' && msg.payload?.uid) {
              handleTagDetected(msg.payload.uid, 'WEBSOCKET');
            } else if (msg.type === 'HARDWARE_STATUS_CHANGED' && msg.payload) {
              setHardwareBridge((prev) => ({
                ...prev,
                connected: msg.payload.status === 'CONNECTED',
                state: msg.payload.status,
              }));
            }
          } catch {}
        };

        ws.onclose = () => {
          if (!mounted) return;
          setWsConnected(false);
          retryTimer = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch {
        retryTimer = setTimeout(connect, 4000);
      }
    }

    connect();

    return () => {
      mounted = false;
      clearTimeout(retryTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [handleTagDetected]);

  // 2. Hardware Status & Fast Latest-Scan Polling Fallback (sub-second sync)
  useEffect(() => {
    let lastHandledTime = Date.now();
    let mounted = true;

    // Check hardware serial bridge status every 4 seconds
    const statusInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/rfid/status');
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setHardwareBridge({
              connected: data.connected || data.state === 'CONNECTED',
              state: data.state || (data.connected ? 'CONNECTED' : 'DISCONNECTED'),
              port: data.port || 'COM9',
              baudRate: data.baudRate || 9600,
            });
          }
        }
      } catch {}
    }, 4000);

    // Fast poll for scans forwarded by Arduino serial bridge (every 800ms)
    const scanInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rfid/latest-scan?since=${lastHandledTime}`);
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.hasScan && data.scan && data.scan.timestamp > lastHandledTime) {
            lastHandledTime = data.scan.timestamp;
            handleTagDetected(data.scan.uid, 'SERIAL_BRIDGE');
          }
        }
      } catch {}
    }, 800);

    return () => {
      mounted = false;
      clearInterval(statusInterval);
      clearInterval(scanInterval);
    };
  }, [handleTagDetected]);

  // 3. USB HID / Keyboard Wedge RFID Scanner Listener (Auto-detects rapid reader keystrokes)
  useEffect(() => {
    let buffer: string[] = [];
    let timer: any = null;

    function processBuffer() {
      if (buffer.length >= 4) {
        const scanned = buffer.join('').trim();
        buffer = [];
        if (/^[0-9A-Fa-f:\s\-]{4,24}$/.test(scanned)) {
          handleTagDetected(scanned, 'USB_HID');
        }
      } else {
        buffer = [];
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.key === 'Enter' && buffer.length >= 6) {
          processBuffer();
        }
        return;
      }

      if (e.key === 'Enter') {
        clearTimeout(timer);
        processBuffer();
      } else if (e.key.length === 1) {
        buffer.push(e.key);
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (buffer.length >= 6) {
            processBuffer();
          } else {
            buffer = [];
          }
        }, 150);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(timer);
    };
  }, [handleTagDetected]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cardsRes, statsRes, auditRes] = await Promise.all([
        fetch('/api/rfid/cards?limit=100'),
        fetch('/api/rfid/inventory'),
        fetch('/api/audit-logs?entityType=RFIDCard&limit=50'),
      ]);

      if (cardsRes.ok) {
        const data = await cardsRes.json();
        setCards(data.cards || []);
      }
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (auditRes.ok) {
        const a = await auditRes.json();
        setAllRfidAuditLogs(a.auditLogs || a.logs || []);
      }
    } catch (err) {
      console.warn('RFID live fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Actions
  const handleRegisterCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUid) return;
    try {
      const res = await fetch('/api/rfid/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: registerUid.trim(), cardType: 'MIFARE_CLASSIC_1K' }),
      });
      if (res.ok) {
        showToast(`Blank RFID card ${registerUid} registered in CockroachDB`);
        setShowRegisterModal(false);
        setRegisterUid('');
        loadData();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to register card'}`);
      }
    } catch {
      showToast('Network error registering card');
    }
  };

  const handleSuspendCard = async (uid: string) => {
    try {
      const res = await fetch(`/api/rfid/cards/${encodeURIComponent(uid)}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Reported temporarily misplaced' }),
      });
      if (res.ok) {
        showToast(`Card ${uid} suspended`);
        loadData();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to suspend'}`);
      }
    } catch {
      showToast('Failed to suspend card');
    }
  };

  const handleReactivateCard = async (uid: string) => {
    try {
      const res = await fetch(`/api/rfid/cards/${encodeURIComponent(uid)}/reactivate`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast(`Card ${uid} reactivated to ACTIVE`);
        loadData();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to reactivate'}`);
      }
    } catch {
      showToast('Failed to reactivate card');
    }
  };

  const handleMarkLost = async (uid: string) => {
    try {
      const res = await fetch(`/api/rfid/cards/${encodeURIComponent(uid)}/mark-lost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Patient reported card lost' }),
      });
      if (res.ok) {
        showToast(`Card ${uid} marked as LOST. Patient eligible for replacement card.`);
        loadData();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to mark lost'}`);
      }
    } catch {
      showToast('Failed to mark card lost');
    }
  };

  const handleExecuteReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceModalCard || !newReplacementUid) return;
    try {
      const res = await fetch(`/api/rfid/cards/${encodeURIComponent(replaceModalCard.uid)}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUid: newReplacementUid.trim() }),
      });
      if (res.ok) {
        showToast(`Old card retired & new card ${newReplacementUid} atomically assigned in CockroachDB!`);
        setReplaceModalCard(null);
        setNewReplacementUid('');
        loadData();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to replace card'}`);
      }
    } catch {
      showToast('Failed to execute card replacement');
    }
  };

  const handleViewAudit = async (card: CardItem) => {
    setAuditModalCard(card);
    try {
      const res = await fetch(`/api/rfid/cards/${encodeURIComponent(card.uid)}/audit`);
      if (res.ok) {
        const d = await res.json();
        setCardAuditLogs(d.history || []);
      }
    } catch {
      setCardAuditLogs([]);
    }
  };

  const handleManualTestTap = (testUid?: string) => {
    const candidate = testUid || `04:${Array.from({ length: 4 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':')}`;
    handleTagDetected(candidate, 'MANUAL');
  };
  const handleSimulateReaderTap = handleManualTestTap;

  const handleDeleteCard = async (uid: string) => {
    if (!window.confirm(`Permanently delete RFID card ${uid} from CockroachDB? This will remove its active assignment and history.`)) return;
    try {
      const res = await fetch(`/api/rfid/cards/${encodeURIComponent(uid)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`Card ${uid} deleted successfully from CockroachDB`);
        loadData();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to delete card'}`);
      }
    } catch {
      showToast('Network error deleting card');
    }
  };

  const handleUnassignCard = async (uid: string) => {
    try {
      const res = await fetch(`/api/rfid/cards/${encodeURIComponent(uid)}/unassign`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast(`Card ${uid} unassigned and returned to available stock`);
        loadData();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to unassign card'}`);
      }
    } catch {
      showToast('Network error unassigning card');
    }
  };

  const handleEnrollCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientInput || !scannedUid || !consentChecked || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/patients/register-kiosk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: patientInput.trim(),
          age: parseInt(ageInput, 10) || 30,
          gender: genderInput || 'MALE',
          phone: phoneInput.trim() || `9198${Math.floor(100000 + Math.random() * 900000)}`,
          abhaId: abhaInput.trim() || `ABHA-91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          rfidUid: scannedUid,
          deviceCode: 'ENCODER-DEL-01',
        }),
      });
      if (res.ok) {
        showToast(`RFID Token ${scannedUid} activated & mapped to ${patientInput} (${ageInput}y, ${genderInput})`);
        setPatientInput('');
        setAgeInput('32');
        setGenderInput('MALE');
        setPhoneInput('');
        setAbhaInput('');
        setConsentChecked(false);
        loadData();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to enroll card'}`);
      }
    } catch {
      showToast('Network error during card issuance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCards = cards.filter(c => {
    const matchesStatus = filterStatus === 'All' || c.cardStatus === filterStatus;
    const matchesSearch = c.uid.toLowerCase().includes(search.toLowerCase()) ||
                          (c.patient?.fullName && c.patient.fullName.toLowerCase().includes(search.toLowerCase())) ||
                          (c.hospital?.name && c.hospital.name.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const SIDEBAR_ITEMS = [
    { id: 'inventory', label: 'Card Inventory & Batches', icon: CreditCard, badge: `${cards.length} Cards` },
    { id: 'enrollment', label: 'Card Encoding Desk', icon: PlusCircle, badge: 'Tap Reader' },
    { id: 'security_audit', label: 'Security & Lifecycle Ledger', icon: ShieldAlert, badge: `${allRfidAuditLogs.length} Events` },
    { id: 'facility_distribution', label: 'Hospital Allocation Grid', icon: Building2 },
    { id: 'hardware_readers', label: 'Reader Antenna Telemetry', icon: Radio, badge: '13.56MHz' },
  ];

  return (
    <div className={`h-screen w-screen overflow-hidden font-display flex transition-colors duration-300 antialiased ${
      isLight ? 'bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white' : 'bg-[#090D16] text-slate-100 selection:bg-blue-600 selection:text-white'
    }`}>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 size={18} className="text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`w-80 h-full border-r backdrop-blur-md flex flex-col shrink-0 overflow-hidden transition-colors duration-300 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/10'
      }`}>
        <div className={`px-5 py-4 flex items-center gap-3 border-b shrink-0 ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            💳
          </div>
          <div>
            <div className={`font-extrabold leading-none text-xs font-heading tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              MediKiosk RFID Token Authority
            </div>
            <div className="text-[10px] text-blue-500 font-semibold leading-none mt-1 font-mono">
              Hardware Security Layer
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1.5 text-xs font-medium overflow-y-auto">
          <div className={`px-3 pb-1 text-[9px] font-bold uppercase tracking-wider font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Token Lifecycle Operations
          </div>
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20 scale-[1.01]'
                    : isLight
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 whitespace-nowrap ${
                    active ? 'bg-white/20 text-white' : isLight ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: Live Hardware Connection Indicator */}
        <div className={`p-3 border-t shrink-0 ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
          <div className={`flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl border ${
            hardwareBridge.connected || webSerialConnected
              ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : wsConnected
                ? isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-2 truncate pr-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                hardwareBridge.connected || webSerialConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : wsConnected
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-amber-500'
              }`} />
              <span className="text-[11px] truncate">
                {webSerialConnected
                  ? 'WebSerial Direct USB'
                  : hardwareBridge.connected
                    ? `Hardware: ${hardwareBridge.port}`
                    : wsConnected
                      ? 'WebSocket Stream Live'
                      : 'Reader Connecting…'}
              </span>
            </div>
            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 shrink-0">
              {hardwareBridge.connected ? '13.56M' : 'ISO14443'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header */}
        <header className={`h-16 border-b flex items-center justify-between px-8 shrink-0 z-30 transition-colors duration-300 ${
          isLight ? 'bg-white/90 border-slate-200/80 backdrop-blur-md' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
        }`}>
          <div className="w-96 max-w-full relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs transition-colors focus:outline-none ${
                isLight
                  ? 'bg-slate-100/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'
                  : 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50'
              }`}
              placeholder="Search UID, patient name, hospital, ABHA..."
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Live Realtime Hardware Scanning Pill */}
            {lastScannedTag ? (
              <div
                onClick={() => {
                  setScannedUid(lastScannedTag.uid);
                  setActiveNav('enrollment');
                }}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all animate-fade-in ${
                  recentTapAnimation
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg scale-105'
                    : isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                }`}
                title="Click to load into Enrolment Desk"
              >
                <Radio size={13} className="text-emerald-500 animate-pulse" />
                <span>Last Tag: <strong>{lastScannedTag.uid}</strong></span>
                {lastScannedTag.patientName && (
                  <span className="text-[10px] opacity-80 truncate max-w-[90px]">({lastScannedTag.patientName})</span>
                )}
              </div>
            ) : (
              <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                hardwareBridge.connected || webSerialConnected
                  ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-400 border-white/10'
              }`}>
                <Radio size={13} className={hardwareBridge.connected || webSerialConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'} />
                <span>{hardwareBridge.connected ? `RC522 Active (${hardwareBridge.port})` : webSerialConnected ? 'WebSerial Active' : 'RFID Reader Listening'}</span>
              </div>
            )}

            {!webSerialConnected && !hardwareBridge.connected && (
              <button
                type="button"
                onClick={handleConnectWebSerial}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-all"
                title="Connect physical USB RC522 scanner directly via browser WebSerial"
              >
                <Usb size={13} />
                <span>Pair USB</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute RFID scan audio chimes' : 'Enable RFID scan audio chimes'}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : isLight ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white/5 text-slate-500 border-white/10'
              }`}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            <button
              onClick={loadData}
              title="Refresh live data from CockroachDB"
              className={`p-2 rounded-xl border transition-all ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-blue-500' : ''} />
            </button>

            <button
              type="button"
              onClick={() => setTheme(isLight ? 'dark' : 'light')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              {isLight ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-blue-400" />}
              <span>{isLight ? 'Light' : 'Dark'}</span>
            </button>

            <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl border ${
              isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <Lock size={14} />
              <span>Zero PHI On Chip</span>
            </div>

            <div className={`flex items-center gap-3 border-l pl-4 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-600 text-xs shadow-inner font-mono">
                DESK
              </div>
              <div className="text-xs">
                <div className={`font-bold leading-none font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>RFID Officer</div>
                <div className="text-[10px] leading-none mt-1 font-mono text-slate-400">ENCODER-DEL-01</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto animate-fade-in">
          {/* TAB 1: INVENTORY & LIFECYCLE */}
          {activeNav === 'inventory' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-6 gap-3">
                {[
                  { label: 'Total Cards in DB', val: `${cards.length}`, lightColor: 'bg-white border-blue-200 text-blue-900', darkColor: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
                  { label: 'Available / Blank', val: `${cards.filter(c => c.cardStatus === 'AVAILABLE' || c.cardStatus === 'MANUFACTURED').length}`, lightColor: 'bg-white border-slate-200 text-slate-900', darkColor: 'border-slate-500/30 bg-slate-500/10 text-slate-300' },
                  { label: 'Assigned / Active', val: `${cards.filter(c => c.cardStatus === 'ACTIVE' || c.cardStatus === 'ASSIGNED').length}`, lightColor: 'bg-white border-emerald-200 text-emerald-900', darkColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
                  { label: 'Suspended', val: `${cards.filter(c => c.cardStatus === 'SUSPENDED').length}`, lightColor: 'bg-white border-amber-200 text-amber-900', darkColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
                  { label: 'Lost / Stolen', val: `${cards.filter(c => c.cardStatus === 'LOST' || c.cardStatus === 'STOLEN').length}`, lightColor: 'bg-white border-rose-200 text-rose-900', darkColor: 'border-rose-500/30 bg-rose-500/10 text-rose-300' },
                  { label: 'Replaced / Retired', val: `${cards.filter(c => c.cardStatus === 'REPLACED' || c.cardStatus === 'RETIRED').length}`, lightColor: 'bg-white border-purple-200 text-purple-900', darkColor: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border text-center transition-all duration-200 hover:scale-[1.02] ${
                      isLight ? `${item.lightColor} shadow-xs` : `${item.darkColor} backdrop-blur-md`
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">{item.label}</span>
                    <span className="text-xl font-extrabold mt-1 block font-mono">{item.val}</span>
                  </div>
                ))}
              </div>

              {/* Master Inventory Table */}
              <div className={`border rounded-2xl p-5 space-y-4 ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className={`text-sm font-bold font-heading flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <Key size={16} className="text-blue-500" />
                      RFID Token Master Inventory & Lifecycle Controls
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      CockroachDB Live
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-slate-200'
                      }`}
                    >
                      <option value="All">All Statuses</option>
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="LOST">LOST</option>
                      <option value="REPLACED">REPLACED</option>
                    </select>

                    <button
                      onClick={() => setShowRegisterModal(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus size={14} /> Register Blank UID
                    </button>
                  </div>
                </div>

                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b font-semibold ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                      <th className="pb-3">13.56MHz UID</th>
                      <th className="pb-3">Patient Identity</th>
                      <th className="pb-3">ABHA Address</th>
                      <th className="pb-3">Hospital Facility</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Lifecycle Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                    {filteredCards.map((c) => (
                      <tr key={c.id || c.uid} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                        <td className="py-3 font-mono font-bold text-blue-600">{c.uid}</td>
                        <td className={`py-3 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {c.patient?.fullName || (c.cardStatus === 'AVAILABLE' ? 'Unassigned Stock Card' : 'Unlinked Identity')}
                        </td>
                        <td className="py-3 text-cyan-600 font-mono font-bold">
                          {c.patient?.abhaId || '—'}
                        </td>
                        <td className={`py-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                          {c.hospital?.name || 'AIIMS New Delhi'}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            c.cardStatus === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : c.cardStatus === 'AVAILABLE'
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : c.cardStatus === 'SUSPENDED'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : c.cardStatus === 'LOST'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-purple-50 text-purple-700 border-purple-300'
                          }`}>
                            {c.cardStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.cardStatus === 'ACTIVE' && (
                              <>
                                <button
                                  onClick={() => handleSuspendCard(c.uid)}
                                  className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold hover:bg-amber-200"
                                >
                                  Suspend
                                </button>
                                <button
                                  onClick={() => handleMarkLost(c.uid)}
                                  className="px-2 py-1 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-bold hover:bg-rose-200"
                                >
                                  Lost
                                </button>
                              </>
                            )}

                            {c.cardStatus === 'SUSPENDED' && (
                              <>
                                <button
                                  onClick={() => handleReactivateCard(c.uid)}
                                  className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold hover:bg-emerald-200"
                                >
                                  Reactivate
                                </button>
                                <button
                                  onClick={() => handleMarkLost(c.uid)}
                                  className="px-2 py-1 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-bold hover:bg-rose-200"
                                >
                                  Lost
                                </button>
                              </>
                            )}

                            {(c.cardStatus === 'LOST' || c.cardStatus === 'SUSPENDED') && c.patient && (
                              <button
                                onClick={() => {
                                  setReplaceModalCard(c);
                                  setNewReplacementUid('');
                                }}
                                className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-bold hover:bg-purple-700 flex items-center gap-1 shadow-xs"
                              >
                                <Repeat size={11} /> Replace
                              </button>
                            )}

                            {c.patient && (
                              <button
                                onClick={() => handleUnassignCard(c.uid)}
                                title="Unassign patient from this card"
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-[10px] font-bold hover:bg-blue-200"
                              >
                                Unassign
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteCard(c.uid)}
                              title="Permanently delete this card record"
                              className="px-2 py-1 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-bold hover:bg-rose-200"
                            >
                              Delete
                            </button>

                            <button
                              onClick={() => handleViewAudit(c)}
                              title="View Cryptographic Audit Trail"
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                              <History size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ENROLLMENT DESK */}
          {activeNav === 'enrollment' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-extrabold font-heading flex items-center gap-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <PlusCircle className="text-blue-500" />
                  RFID Card Encoding & Patient Issuance Desk
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  13.56MHz Hardware Reader Tap → Cryptographic Tokenize → Link ABHA / Phone → DPDP Consent → Instant Activation
                </p>
              </div>

              <div className="grid grid-cols-12 gap-6">
                {/* Hardware Reader Tap Terminal */}
                <div className={`col-span-5 border rounded-2xl p-5 space-y-4 ${
                  isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold font-heading flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <Radio size={16} className="text-emerald-500 animate-pulse" />
                      RC522 / USB RFID Scanner
                    </h3>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                      hardwareBridge.connected || webSerialConnected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {hardwareBridge.connected ? 'Bridge Active' : webSerialConnected ? 'WebSerial' : 'Listening Live'}
                    </span>
                  </div>

                  <div className={`p-6 border rounded-2xl text-center space-y-3 relative overflow-hidden transition-all duration-300 ${
                    recentTapAnimation
                      ? 'bg-emerald-50 border-emerald-400 ring-4 ring-emerald-300/40 shadow-xl'
                      : isLight
                        ? 'bg-gradient-to-tr from-blue-50 via-slate-50 to-indigo-50 border-blue-200'
                        : 'bg-gradient-to-tr from-blue-950/40 via-slate-900 to-indigo-950/40 border-blue-500/30'
                  }`}>
                    {/* Animated Pulsing Sonar Ring */}
                    <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                      <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                        recentTapAnimation ? 'bg-emerald-400' : 'bg-blue-400'
                      }`} />
                      <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center text-3xl shadow-lg transition-all ${
                        recentTapAnimation
                          ? 'bg-emerald-600 border-emerald-300 text-white scale-110 shadow-emerald-500/40'
                          : 'bg-blue-600/20 border-blue-500 text-blue-600 shadow-blue-500/20 animate-pulse'
                      }`}>
                        💳
                      </div>
                    </div>

                    <div>
                      <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {recentTapAnimation ? '⚡ Physical RFID Tag Detected!' : 'Place physical card on USB reader pad'}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Reads automatically via Serial Bridge, WebSerial & USB Wedge
                      </span>
                    </div>

                    {/* Scanned UID Display */}
                    <div className={`p-3 border rounded-xl font-mono text-xs space-y-1 ${
                      scannedUid
                        ? isLight
                          ? 'bg-white border-emerald-300 text-emerald-900 shadow-sm'
                          : 'bg-black/50 border-emerald-500/50 text-emerald-300'
                        : isLight
                          ? 'bg-white/80 border-slate-200 text-slate-400'
                          : 'bg-black/30 border-white/10 text-slate-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Captured UID:</span>
                        {scannedUid && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCheck size={12} /> Active
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-extrabold tracking-wide break-all">
                        {scannedUid ? scannedUid : 'Waiting for card tap…'}
                      </div>

                      {/* Card verification status */}
                      {lastScannedTag && lastScannedTag.uid === scannedUid && (
                        <div className="pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px]">
                          {lastScannedTag.isRegistered ? (
                            <span className="text-amber-600 font-bold truncate max-w-[200px]">
                              ⚠️ Assigned to: {lastScannedTag.patientName}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <Check size={12} /> Blank Stock Token
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">{lastScannedTag.timestamp}</span>
                        </div>
                      )}
                    </div>

                    {/* Hardware Controls & Manual Fallback */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {!webSerialConnected && (
                        <button
                          type="button"
                          onClick={handleConnectWebSerial}
                          className={`px-3 py-1.5 font-bold text-xs rounded-xl border transition-all flex items-center gap-1.5 ${
                            isLight
                              ? 'bg-white hover:bg-slate-100 text-blue-700 border-blue-200 shadow-xs'
                              : 'bg-white/10 hover:bg-white/20 text-blue-300 border-white/20'
                          }`}
                          title="Connect reader via browser Web Serial"
                        >
                          <Usb size={13} />
                          <span>Direct USB Pair</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsManualInputOpen(!isManualInputOpen)}
                        className={`px-3 py-1.5 font-semibold text-xs rounded-xl border transition-all flex items-center gap-1.5 ${
                          isLight
                            ? 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-xs'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                        }`}
                      >
                        <Tag size={13} />
                        <span>Manual UID</span>
                      </button>
                    </div>

                    {/* Collapsible Manual Fallback Input */}
                    {isManualInputOpen && (
                      <div className="p-3 bg-slate-100 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10 text-left space-y-2 animate-fade-in">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Manual Test UID Input (Diagnostic Fallback)
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="e.g. 24:33:F0:06 or 04:A1:B2:C3"
                            value={manualInputVal}
                            onChange={(e) => setManualInputVal(e.target.value.toUpperCase())}
                            className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                              isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/10'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (manualInputVal.trim()) {
                                handleTagDetected(manualInputVal.trim(), 'MANUAL');
                                setManualInputVal('');
                              }
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-500"
                          >
                            Set
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent Realtime Taps Feed */}
                  {scanHistory.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-500 flex items-center gap-1">
                          <Activity size={12} className="text-blue-500" />
                          Recent Realtime Tag Taps ({scanHistory.length})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Live Stream</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {scanHistory.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setScannedUid(item.uid);
                              setLastScannedTag(item);
                            }}
                            className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
                              scannedUid === item.uid
                                ? isLight ? 'bg-blue-50 border-blue-300 text-blue-950 shadow-xs' : 'bg-blue-950/40 border-blue-500 text-blue-200'
                                : isLight ? 'bg-slate-50 border-slate-200 hover:bg-white' : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${item.isRegistered ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                              <span className="font-mono font-bold">{item.uid}</span>
                              {item.patientName && (
                                <span className="text-[10px] text-slate-500 truncate">({item.patientName})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                item.isRegistered ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {item.isRegistered ? 'Assigned' : 'Blank'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Patient Enrollment Form */}
                <form onSubmit={handleEnrollCard} className={`col-span-7 border rounded-2xl p-5 space-y-4 ${
                  isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
                }`}>
                  <h3 className={`text-sm font-bold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Patient Identity & Cryptographic Token Binding
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-semibold block mb-1">Full Patient Name *</label>
                      <input
                        required
                        value={patientInput}
                        onChange={(e) => setPatientInput(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-white/5 border-white/10'}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold block mb-1">Patient Age (Years) *</label>
                        <input
                          required
                          type="number"
                          min="1"
                          max="125"
                          value={ageInput}
                          onChange={(e) => setAgeInput(e.target.value)}
                          placeholder="e.g. 35"
                          className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-white/5 border-white/10'}`}
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Gender *</label>
                        <select
                          value={genderInput}
                          onChange={(e) => setGenderInput(e.target.value)}
                          className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-white/10 text-white'}`}
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold block mb-1">Mobile Phone (Optional)</label>
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-white/5 border-white/10'}`}
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">ABHA ID / Address (Optional)</label>
                        <input
                          value={abhaInput}
                          onChange={(e) => setAbhaInput(e.target.value)}
                          placeholder="e.g. ramesh@abdm or ABHA-91-8821"
                          className={`w-full border rounded-xl px-3 py-2 font-mono ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-white/5 border-white/10'}`}
                        />
                      </div>
                    </div>

                    <div className={`p-3 border rounded-xl space-y-2 ${isLight ? 'bg-blue-50/70 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'}`}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentChecked}
                          onChange={(e) => setConsentChecked(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0"
                        />
                        <span className="font-bold text-[11px] text-blue-900">DPDP 2023 Digital Consent Confirmation</span>
                      </label>
                      <p className="text-[10px] text-slate-600">
                        Patient grants consent for session tokenization. Card contains no sensitive medical or personal health data on chip.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!consentChecked || !patientInput || isSubmitting}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enrolling in CockroachDB...' : 'Activate & Issue RFID Token Card'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & LIFECYCLE LEDGER */}
          {activeNav === 'security_audit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-extrabold font-heading flex items-center gap-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <ShieldAlert className="text-amber-500" />
                    RFID Cryptographic Audit Ledger & Security Sentinel
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Immutable audit stream persisted directly in CockroachDB</p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
                  {allRfidAuditLogs.length} Verified Ledger Events
                </span>
              </div>

              <div className={`border rounded-2xl p-5 space-y-4 ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
              }`}>
                {allRfidAuditLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-mono">
                    No RFID audit events logged yet. Perform card registration, status change, or replacement to generate audit records.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className={`border-b font-semibold ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                        <th className="pb-3">Timestamp</th>
                        <th className="pb-3">Action</th>
                        <th className="pb-3">Entity ID</th>
                        <th className="pb-3">Actor</th>
                        <th className="pb-3 text-right">Cryptographic Details</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-[11px] ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                      {allRfidAuditLogs.map((log) => (
                        <tr key={log.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                          <td className="py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="py-3 font-bold text-blue-600">{log.action}</td>
                          <td className="py-3 text-slate-700">{log.entityId}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                              {log.actorType} ({log.actorId || 'SYSTEM'})
                            </span>
                          </td>
                          <td className="py-3 text-right text-slate-500">
                            {JSON.stringify(log.metadata || {})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FACILITY ALLOCATION */}
          {activeNav === 'facility_distribution' && (
            <div className="space-y-6">
              <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Hospital Reception Desk Allocation Grid</h2>
              <div className="grid grid-cols-3 gap-4 text-xs">
                {[
                  { facility: 'AIIMS New Delhi Main OPD', allocated: `${cards.length} Cards in Pool`, status: 'Active' },
                  { facility: 'KEM Hospital Mumbai', allocated: '8,000 Cards Provisioned', status: 'Active' },
                  { facility: 'Bowring Hospital Bengaluru', allocated: '4,500 Cards Provisioned', status: 'Active' },
                ].map((f, idx) => (
                  <div key={idx} className={`p-4 border rounded-2xl space-y-2 ${isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10'}`}>
                    <span className="font-bold text-sm block font-heading">{f.facility}</span>
                    <span className="text-blue-600 font-mono font-bold block">{f.allocated}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: HARDWARE TELEMETRY */}
          {activeNav === 'hardware_readers' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-extrabold font-heading flex items-center gap-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Radio className="text-emerald-500 animate-pulse" />
                    RC522 / USB Hardware Reader Antenna Telemetry
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Real-time serial communications, WebSocket events, and live token decoders</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConnectWebSerial}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <Usb size={14} />
                    <span>Pair USB WebSerial</span>
                  </button>
                  <button
                    type="button"
                    onClick={playRfidBeep}
                    className={`px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    }`}
                  >
                    <Volume2 size={14} className="text-emerald-500" />
                    <span>Test Chime</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTagDetected('24:33:F0:06', 'MANUAL')}
                    className={`px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    }`}
                  >
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Test Tap Tag</span>
                  </button>
                </div>
              </div>

              {/* Hardware Connection Telemetry Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className={`p-4 border rounded-2xl space-y-1.5 ${isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Serial Bridge (Arduino)</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${hardwareBridge.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="font-bold text-sm">{hardwareBridge.connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Port: <strong>{hardwareBridge.port}</strong> · {hardwareBridge.baudRate} bps</div>
                </div>

                <div className={`p-4 border rounded-2xl space-y-1.5 ${isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">WebSocket Stream</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="font-bold text-sm">{wsConnected ? 'ACTIVE' : 'CONNECTING'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Path: <strong>/ws</strong> · RFID_SCANNED live</div>
                </div>

                <div className={`p-4 border rounded-2xl space-y-1.5 ${isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">WebSerial Direct API</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${webSerialConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className="font-bold text-sm">{webSerialConnected ? 'ACTIVE' : 'STANDBY'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Browser Direct USB Port Stream</div>
                </div>

                <div className={`p-4 border rounded-2xl space-y-1.5 ${isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Antenna Carrier & Protocol</span>
                  <div className="font-bold text-sm text-emerald-600">13.56 MHz HF</div>
                  <div className="text-[11px] text-slate-500">ISO/IEC 14443 Type A (Mifare)</div>
                </div>
              </div>

              {/* Real-time Taps Feed Table */}
              <div className={`border rounded-2xl p-5 space-y-4 ${isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    Live Hardware Reader Event Log (Real-Time Scans)
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-400">{scanHistory.length} Scans Captured</span>
                </div>

                {scanHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-mono">
                    Antenna active. Place any physical RFID smart card or keyfob onto the reader pad to view incoming telemetry packets.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className={`border-b font-semibold ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                        <th className="pb-3">Timestamp</th>
                        <th className="pb-3">Tag UID</th>
                        <th className="pb-3">Capture Source</th>
                        <th className="pb-3">CockroachDB Status</th>
                        <th className="pb-3">Assigned Patient</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-[11px] ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                      {scanHistory.map((item, idx) => (
                        <tr key={idx} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                          <td className="py-3 text-slate-500">{item.timestamp}</td>
                          <td className="py-3 font-bold text-blue-600">{item.uid}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {item.source}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.isRegistered ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.isRegistered ? 'Assigned' : 'Blank Stock'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-700">{item.patientName || '—'}</td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setScannedUid(item.uid);
                                setActiveNav('enrollment');
                              }}
                              className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
                            >
                              Load in Enrolment &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: REGISTER BLANK UID */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm font-heading">Register Blank RFID Card to Inventory</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            {/* Live Antenna Auto-Fill Banner */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 rounded-xl flex items-center justify-between text-xs text-blue-800 dark:text-blue-200">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-blue-600 animate-pulse shrink-0" />
                <span><strong>Live Reader Active:</strong> Tap physical blank card on reader pad to auto-capture UID</span>
              </div>
              {registerUid && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0">
                  <Check size={11} /> Captured
                </span>
              )}
            </div>

            <form onSubmit={handleRegisterCard} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Card UID (Hex format: e.g. 04:A7:88:BB:CC) *</label>
                <input
                  required
                  placeholder="Tap card on reader or type 04:A7:88:BB:CC"
                  value={registerUid}
                  onChange={e => setRegisterUid(e.target.value.toUpperCase())}
                  className={`w-full border rounded-xl px-3 py-2 font-mono ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Register in CockroachDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ATOMIC CARD REPLACEMENT */}
      {replaceModalCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm font-heading">Atomic RFID Card Replacement</h3>
              <button onClick={() => setReplaceModalCard(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            {/* Live Antenna Auto-Fill Banner */}
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 rounded-xl flex items-center justify-between text-xs text-purple-800 dark:text-purple-200">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-purple-600 animate-pulse shrink-0" />
                <span><strong>Live Reader Active:</strong> Tap replacement card on reader pad to auto-capture UID</span>
              </div>
              {newReplacementUid && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0">
                  <Check size={11} /> Captured
                </span>
              )}
            </div>

            <div className="text-xs space-y-2 p-3 bg-purple-50 text-purple-900 border border-purple-200 rounded-xl">
              <div>Retiring Old Card: <strong className="font-mono">{replaceModalCard.uid}</strong></div>
              <div>Assigned Patient: <strong>{replaceModalCard.patient?.fullName}</strong></div>
              <div className="text-[10px] text-purple-700">A Prisma database transaction will retire the old card and bind the new card to the patient.</div>
            </div>
            <form onSubmit={handleExecuteReplace} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1">New Blank UID to Issue *</label>
                <input
                  required
                  placeholder="Tap replacement card on reader or type 04:B8:22:99:FF"
                  value={newReplacementUid}
                  onChange={e => setNewReplacementUid(e.target.value.toUpperCase())}
                  className={`w-full border rounded-xl px-3 py-2 font-mono ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setReplaceModalCard(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Execute Replacement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: CARD AUDIT TRAIL */}
      {auditModalCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm font-heading">Cryptographic Audit Trail for {auditModalCard.uid}</h3>
                <span className="text-[10px] text-slate-500 font-mono">Immutable audit history from CockroachDB</span>
              </div>
              <button onClick={() => setAuditModalCard(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
              {cardAuditLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No audit records found for this card UID.</div>
              ) : (
                cardAuditLogs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-600 font-mono text-[11px]">{log.action}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-slate-600">Actor: {log.actorType} ({log.actorId || 'SYSTEM'})</div>
                    {log.metadata && (
                      <div className="text-[10px] font-mono bg-slate-100 p-1.5 rounded text-slate-700 break-all">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
