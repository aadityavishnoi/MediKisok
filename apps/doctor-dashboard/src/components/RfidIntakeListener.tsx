import React, { useEffect, useState, useRef } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Radio,
  RefreshCw,
  Sparkles,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  connectWs,
  lookupRfidPatient,
  simulateRfidScan,
  getRfidReaderStatus,
  type WsConnectionState,
} from '@medikiosk/api-client';

export interface RfidNotification {
  status: 'DETECTED' | 'SUCCESS' | 'ERROR';
  message: string;
  uid: string;
  patientName?: string;
  abhaId?: string;
  sessionId?: string;
}

export const DEMO_RFID_CARDS = [
  {
    uid: 'DEMO-RFID-001',
    name: 'Aarav Sharma',
    department: 'Cardiology OPD',
    complaint: 'Chest pain',
    badge: 'Cardiology',
    color: 'border-blue-300 bg-blue-50/70 text-blue-900',
  },
  {
    uid: 'DEMO-RFID-002',
    name: 'Priya Verma',
    department: 'Pulmonology OPD',
    complaint: 'Severe breathlessness',
    badge: 'Pulmonology',
    color: 'border-purple-300 bg-purple-50/70 text-purple-900',
  },
  {
    uid: 'DEMO-RFID-004',
    name: 'Sunita Devi',
    department: 'General Medicine',
    complaint: 'Severe Abdominal Pain',
    badge: 'Emergency Triage',
    color: 'border-amber-300 bg-amber-50/70 text-amber-900',
  },
  {
    uid: 'UNKNOWN-RFID-999',
    name: 'Unregistered Test Card',
    department: 'Unassigned Stock',
    complaint: 'Unlinked Token',
    badge: 'Unknown Card',
    color: 'border-red-300 bg-red-50/70 text-red-900',
  },
];

export interface RfidIntakeListenerProps {
  onOpenSession: (sessionId: string) => void;
  activeSessionId?: string;
}

export function RfidIntakeListener({ onOpenSession, activeSessionId }: RfidIntakeListenerProps) {
  const [readerConnected, setReaderConnected] = useState<boolean | null>(null);
  const [readerPort, setReaderPort] = useState<string>('COM3');
  const [notification, setNotification] = useState<RfidNotification | null>(null);
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);
  const [simulatingUid, setSimulatingUid] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch initial hardware connectivity status
  useEffect(() => {
    getRfidReaderStatus()
      .then((res) => {
        setReaderConnected(res.connected);
        if (res.port) setReaderPort(res.port);
      })
      .catch(() => {
        setReaderConnected(false);
      });
  }, []);

  // 2. Listen to WebSocket events for real-time RFID scans and hardware status changes
  useEffect(() => {
    const disconnect = connectWs({
      onEvent: async (event) => {
        // A. Hardware status update from Arduino serial bridge
        if (event.type === 'HARDWARE_STATUS_CHANGED') {
          setReaderConnected(event.payload.status === 'CONNECTED');
        }

        // B. RFID Scan Event (from physical Arduino Nano or Simulator)
        if (event.type === 'RFID_SCANNED') {
          const { uid, sessionId, patientId } = event.payload;
          handleCardScanEvent(uid, sessionId);
        }
      },
    });

    return disconnect;
  }, [onOpenSession]);

  // Handle outside click to close simulate menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSimulateMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardScanEvent = async (uid: string, fallbackSessionId?: string) => {
    if (notifTimeoutRef.current) {
      clearTimeout(notifTimeoutRef.current);
    }

    // Step 4: Show "RFID Card Detected" immediately
    setNotification({
      status: 'DETECTED',
      message: 'RFID Card Detected',
      uid,
    });

    try {
      // Step 2: Call the RFID patient lookup API (GET /api/rfid/patient/:uid)
      const lookup = await lookupRfidPatient(uid);

      if (lookup.success && lookup.patient) {
        // Step 3: Card is registered -> Show match & auto-open Patient 360 / active encounter
        setNotification({
          status: 'SUCCESS',
          message: `RFID Card Verified: ${lookup.patient.fullName}`,
          uid,
          patientName: lookup.patient.fullName,
          abhaId: lookup.patient.abhaId || undefined,
          sessionId: lookup.encounter?.id || fallbackSessionId,
        });

        const targetSessionId = lookup.encounter?.id || fallbackSessionId;
        if (targetSessionId) {
          // Auto open Patient 360 without manual typing
          setTimeout(() => {
            onOpenSession(targetSessionId);
          }, 750);
        }

        notifTimeoutRef.current = setTimeout(() => {
          setNotification(null);
        }, 5000);
      } else {
        // Step 5: Show clear error if the card is not registered
        setNotification({
          status: 'ERROR',
          message: lookup.message || 'RFID card is not registered',
          uid,
        });

        notifTimeoutRef.current = setTimeout(() => {
          setNotification(null);
        }, 6000);
      }
    } catch (err: any) {
      // Step 5: Handle lookup failure / unregistered response
      setNotification({
        status: 'ERROR',
        message: err.message || 'RFID card is not registered',
        uid,
      });

      notifTimeoutRef.current = setTimeout(() => {
        setNotification(null);
      }, 6000);
    }
  };

  // Trigger SIH Demo simulation
  const handleSimulate = async (card: (typeof DEMO_RFID_CARDS)[0]) => {
    setSimulatingUid(card.uid);
    setShowSimulateMenu(false);
    try {
      // Calls POST /api/rfid/simulate which triggers the exact backend RFID pipeline
      await simulateRfidScan({ uid: card.uid });
    } catch (err: any) {
      // Fallback direct event trigger for offline/demo resilience
      handleCardScanEvent(card.uid, `session-${card.uid.toLowerCase()}`);
    } finally {
      setSimulatingUid(null);
    }
  };

  return (
    <div className="relative">
      {/* Top Header Bar RFID Controls & Status */}
      <div className="flex items-center gap-3">
        {/* Step 6: Show "RFID Reader Disconnected" if Arduino is unavailable */}
        <div
          title={readerConnected ? `Connected on ${readerPort}` : 'Plug Arduino Nano into USB port'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            readerConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              readerConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <Radio size={13} className={readerConnected ? 'text-emerald-600' : 'text-amber-600'} />
          <span>{readerConnected ? `RFID Ready (${readerPort})` : 'RFID Reader Disconnected'}</span>
        </div>

        {/* Demo / SIH Simulation Dropdown Button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowSimulateMenu(!showSimulateMenu)}
            disabled={simulatingUid !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all shadow-xs active:scale-[0.98]"
          >
            <Sparkles size={13} className="text-blue-600" />
            <span>{simulatingUid ? 'Simulating Scan…' : 'Simulate RFID Scan'}</span>
            <ChevronDown size={13} />
          </button>

          {/* Interactive Simulation Menu */}
          {showSimulateMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-fade-in space-y-2">
              <div className="flex items-center justify-between px-2 pt-1 pb-1 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  SIH 2024 RFID Simulator
                </span>
                <span className="text-[10px] font-mono text-blue-600 font-bold">13.56 MHz</span>
              </div>
              <p className="text-[11px] text-slate-500 px-2">
                Select a demo card to trigger the real hardware scan pipeline into Patient 360:
              </p>

              <div className="space-y-1.5">
                {DEMO_RFID_CARDS.map((card) => (
                  <button
                    key={card.uid}
                    type="button"
                    onClick={() => handleSimulate(card)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all hover:scale-[1.01] hover:shadow-xs flex items-center justify-between ${card.color}`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <CreditCard size={14} />
                        <span>{card.name}</span>
                      </div>
                      <div className="text-[10px] font-mono opacity-80 mt-0.5">UID: {card.uid}</div>
                      <div className="text-[10px] opacity-75">{card.complaint}</div>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border bg-white/80 shrink-0">
                      {card.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating RFID Detection & Notification Toast */}
      {notification && (
        <aside
          aria-label="RFID Notification"
          className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slide-up"
        >
          <div
            className={`rounded-2xl border p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all ${
              notification.status === 'SUCCESS'
                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
                : notification.status === 'ERROR'
                ? 'bg-red-50/95 border-red-300 text-red-950'
                : 'bg-blue-50/95 border-blue-300 text-blue-950'
            }`}
          >
            <div className="p-2 rounded-xl bg-white/80 shadow-xs shrink-0 mt-0.5">
              {notification.status === 'SUCCESS' ? (
                <CheckCircle2 size={20} className="text-emerald-600" />
              ) : notification.status === 'ERROR' ? (
                <AlertTriangle size={20} className="text-red-600" />
              ) : (
                <CreditCard size={20} className="text-blue-600 animate-pulse" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-xs">
              <div className="font-extrabold text-sm flex items-center gap-2">
                <span>{notification.message}</span>
              </div>
              <div className="font-mono text-[11px] opacity-80 mt-0.5">Card UID: {notification.uid}</div>

              {notification.status === 'SUCCESS' && (
                <div className="mt-2 pt-2 border-t border-emerald-200/80 flex items-center justify-between text-[11px] font-bold text-emerald-800">
                  <span>Opening Patient 360 & active encounter…</span>
                  <ExternalLink size={13} />
                </div>
              )}

              {notification.status === 'ERROR' && (
                <div className="mt-1 text-[11px] text-red-700 font-medium">
                  Card not recognized. Please assign this card to a registered patient in the RFID Portal.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X size={14} />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
