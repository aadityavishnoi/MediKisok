import { useState, type ReactNode } from 'react';
import { getDictionary, type Dictionary } from '@medikiosk/ui';
import type { Language } from '@medikiosk/shared-types';
import type { WsConnectionState } from '@medikiosk/api-client';


const STEP_ORDER = ['IDENTIFY', 'LANGUAGE', 'CONSENT', 'CHIEF_COMPLAINT', 'HISTORY', 'DONE'] as const;
export type KioskStepId = (typeof STEP_ORDER)[number];

function stepLabel(t: Dictionary, id: KioskStepId): string {
  return {
    IDENTIFY: t.steps.identify,
    LANGUAGE: t.steps.language,
    CONSENT: t.steps.consent,
    CHIEF_COMPLAINT: t.steps.complaint,
    HISTORY: t.steps.history,
    DONE: t.steps.done,
  }[id];
}

function ConnectionDot({ wsState, t }: { wsState: WsConnectionState; t: Dictionary }) {
  const config = {
    open: { color: 'bg-success-500', label: t.common.connected },
    connecting: { color: 'bg-warning-400', label: t.common.connecting },
    closed: { color: 'bg-danger-500', label: t.common.reconnecting },
  }[wsState];

  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
      <span className={`h-2 w-2 rounded-full ${config.color} ${wsState !== 'open' ? 'motion-safe:animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
}

export interface KioskShellProps {
  step: KioskStepId;
  language: Language | null;
  onLanguageChange?: (language: Language) => void;
  wsState: WsConnectionState;
  sessionId?: string;
  children: ReactNode;
}

/**
 * Persistent chrome around every kiosk screen: brand + step indicator + connection
 * status in the header, privacy/session/help in the footer. Screens render only their
 * inner content and are wrapped here exactly once, instead of each screen building its
 * own layout shell.
 */
export function KioskShell({ step, language, onLanguageChange, wsState, sessionId, children }: KioskShellProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const t = getDictionary(language);
  const stepIndex = STEP_ORDER.indexOf(step);


  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <span className="text-lg font-bold text-neutral-900">MediKiosk</span>
        </div>

        <ol className="hidden items-center gap-2 sm:flex" aria-label="Progress">
          {STEP_ORDER.map((id, i) => (
            <li key={id} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  i < stepIndex
                    ? 'bg-primary-700 text-white'
                    : i === stepIndex
                      ? 'bg-primary-100 text-primary-800 ring-2 ring-primary-700'
                      : 'bg-neutral-100 text-neutral-400'
                }`}
                aria-current={i === stepIndex ? 'step' : undefined}
              >
                {i < stepIndex ? '✓' : i + 1}
              </span>
              <span className={`text-xs font-medium ${i === stepIndex ? 'text-primary-800' : 'text-neutral-400'}`}>
                {stepLabel(t, id)}
              </span>
              {i < STEP_ORDER.length - 1 && <span className="mx-1 h-px w-4 bg-neutral-200" />}
            </li>
          ))}
        </ol>

        <div className="flex items-center gap-4">
          <ConnectionDot wsState={wsState} t={t} />
          {language && onLanguageChange && (
            <div className="flex overflow-hidden rounded-full border border-neutral-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => onLanguageChange('EN')}
                className={`px-2.5 py-1 ${language === 'EN' ? 'bg-primary-700 text-white' : 'text-neutral-500'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('HI')}
                className={`px-2.5 py-1 ${language === 'HI' ? 'bg-primary-700 text-white' : 'text-neutral-500'}`}
              >
                हि
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-xl">{children}</div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 bg-white px-6 py-3 text-xs text-neutral-400">
        <span className="flex items-center gap-1.5">🔒 {t.common.privacyNote}</span>
        <span>{t.common.hospitalPlaceholder}</span>
        <div className="flex items-center gap-4">
          {sessionId && (
            <span>
              {t.common.sessionLabel}: {sessionId.slice(0, 8)}
            </span>
          )}
          <button type="button" className="font-semibold text-primary-700 underline" onClick={() => setHelpOpen(true)}>
            {t.common.needHelp}
          </button>
        </div>
      </footer>

      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-xl font-bold text-neutral-900">{t.common.helpTitle}</h2>
            <p className="mb-6 text-base text-neutral-600">{t.common.helpBody}</p>
            <button
              type="button"
              className="w-full rounded-xl bg-primary-700 px-4 py-3 text-base font-semibold text-white"
              onClick={() => setHelpOpen(false)}
            >
              {t.common.closeButton}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
