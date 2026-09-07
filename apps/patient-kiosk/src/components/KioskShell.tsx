import { useEffect, useState, type ReactNode } from 'react';
import { getDictionary, SUPPORTED_LANGUAGES, type Dictionary } from '@medikiosk/ui';
import type { WsConnectionState } from '@medikiosk/api-client';
import { ShieldCheck, HelpCircle, PhoneCall, Wifi } from 'lucide-react';

const STEP_ORDER = ['IDENTIFY', 'LANGUAGE', 'CONSENT', 'CHIEF_COMPLAINT', 'HISTORY', 'SCAN', 'DONE'] as const;
export type KioskStepId = (typeof STEP_ORDER)[number];

function stepLabel(t: Dictionary, id: KioskStepId): string {
  if (id === 'SCAN') return 'Scan Document';
  return {
    IDENTIFY: t.steps.identify,
    LANGUAGE: t.steps.language,
    CONSENT: t.steps.consent,
    CHIEF_COMPLAINT: t.steps.complaint,
    HISTORY: t.steps.history,
    DONE: t.steps.done,
  }[id];
}

function ConnectionBadge({ wsState }: { wsState: WsConnectionState }) {
  const isOnline = wsState === 'open';
  return (
    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200/80 text-slate-700">
      <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-500 animate-pulse'}`} />
      <span className="font-mono text-[11px]">{isOnline ? '13.56 MHz Reader' : 'Connecting…'}</span>
    </div>
  );
}

export interface KioskShellProps {
  step: KioskStepId;
  language: string | null;
  onLanguageChange?: (language: string) => void;
  wsState: WsConnectionState;
  sessionId?: string;
  children: ReactNode;
}

export function KioskShell({ step, language, onLanguageChange, wsState, sessionId, children }: KioskShellProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const t = getDictionary(language ?? 'EN');
  const stepIndex = STEP_ORDER.indexOf(step);
  const isRtl = SUPPORTED_LANGUAGES.find((l) => l.code === language)?.rtl === true;

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    return () => {
      document.documentElement.dir = 'ltr';
    };
  }, [isRtl]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-slate-50 to-blue-50/30 font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Serene Glass Header */}
      <header className="flex items-center justify-between gap-6 border-b border-slate-200/70 bg-white/90 backdrop-blur-md px-8 py-4 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
            🏥
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display">MediKiosk</span>
            <p className="text-[11px] font-semibold text-slate-400 leading-none mt-0.5">Patient Self-Intake</p>
          </div>
        </div>

        {/* Minimalist Step Sequence */}
        <ol className="hidden items-center gap-2 md:flex bg-slate-100/80 px-4 py-2 rounded-2xl border border-slate-200/60" aria-label="Progress">
          {STEP_ORDER.map((id, i) => {
            const isCompleted = i < stepIndex;
            const isCurrent = i === stepIndex;
            return (
              <li key={id} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs scale-105'
                        : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : i + 1}
                </span>
                <span className={`text-xs font-semibold ${isCurrent ? 'text-slate-900 font-bold' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                  {stepLabel(t, id)}
                </span>
                {i < STEP_ORDER.length - 1 && <span className="h-0.5 w-3 bg-slate-200 rounded-full" />}
              </li>
            );
          })}
        </ol>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          <ConnectionBadge wsState={wsState} />
          {language && onLanguageChange && (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              aria-label={t.steps.language}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Main Screen Canvas */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl">{children}</div>
      </main>

      {/* Ultra-Clean Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/70 bg-white px-8 py-3.5 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2 text-slate-600">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>ABDM Digital Health Certified · Encrypted Session</span>
        </div>
        <span>{t.common.hospitalPlaceholder}</span>
        <div className="flex items-center gap-4">
          {sessionId && (
            <span className="font-mono text-slate-400 text-[11px]">
              Session #{sessionId.slice(0, 8)}
            </span>
          )}
          <button
            type="button"
            className="flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800 transition-colors"
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle size={14} />
            {t.common.needHelp}
          </button>
        </div>
      </footer>

      {/* Clean Assistance Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs px-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-slate-100 text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center shadow-inner">
              <PhoneCall size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 font-display">{t.common.helpTitle}</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{t.common.helpBody}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Hospital Triage Counter</span>
                <span className="text-blue-600 font-mono font-bold">Counter #3</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Duty Nursing Officer</span>
                <span className="text-emerald-600 font-bold">Available</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
                onClick={() => setHelpOpen(false)}
              >
                Call Nurse to Kiosk
              </button>
              <button
                type="button"
                className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
                onClick={() => setHelpOpen(false)}
              >
                {t.common.closeButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


