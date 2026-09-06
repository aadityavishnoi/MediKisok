import { useEffect, useRef, useState } from 'react';
import { getDictionary } from '@medikiosk/ui';
import type { Language } from '@medikiosk/shared-types';

const WARN_AFTER_MS = 150_000; // 2.5 minutes of inactivity
const COUNTDOWN_SECONDS = 30;

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

export interface IdleTimeoutGuardProps {
  language: Language;
  /** Called once the countdown reaches zero - the caller decides how to reset state. */
  onTimeout: () => void;
}

export function IdleTimeoutGuard({ language, onTimeout }: IdleTimeoutGuardProps) {
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTimers() {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }

  function armWarnTimer() {
    warnTimer.current = setTimeout(() => {
      setWarning(true);
      setSecondsLeft(COUNTDOWN_SECONDS);
      countdownTimer.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearTimers();
            onTimeout();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }, WARN_AFTER_MS);
  }

  function resetActivity() {
    if (warning) return;
    clearTimers();
    armWarnTimer();
  }

  useEffect(() => {
    armWarnTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetActivity));
    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetActivity));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStillHere() {
    setWarning(false);
    clearTimers();
    armWarnTimer();
  }

  if (!warning) return null;

  const t = getDictionary(language).common;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" role="alertdialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <h2 className="mb-2 text-xl font-bold text-neutral-900">{t.idleTitle}</h2>
        <p className="mb-4 text-base text-neutral-600">{t.idleBody}</p>
        <p className="mb-6 text-3xl font-bold text-danger-600">
          {secondsLeft} <span className="text-base font-normal text-neutral-500">{t.idleSecondsRemaining}</span>
        </p>
        <button
          type="button"
          className="w-full rounded-xl bg-primary-700 px-4 py-3 text-lg font-semibold text-white"
          onClick={handleStillHere}
        >
          {t.idleContinue}
        </button>
      </div>
    </div>
  );
}

