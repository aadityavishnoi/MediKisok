import { useState } from 'react';
import { BigButton, en } from '@medikiosk/ui';
import { simulateRfidScan } from '@medikiosk/api-client';
import type { WsConnectionState } from '@medikiosk/api-client';
import { toUserMessage } from '../lib/errors.js';

const t = en.identify;
const tc = en.common;

export interface IdentifyScreenProps {
  wsState: WsConnectionState;
  error: string | null;
  onError: (message: string) => void;
}

const CONNECTION_CONFIG: Record<WsConnectionState, { color: string; label: string }> = {
  open: { color: 'bg-success-500', label: tc.connected },
  connecting: { color: 'bg-warning-400', label: tc.connecting },
  closed: { color: 'bg-danger-500', label: tc.reconnecting },
};

export function IdentifyScreen({ wsState, error, onError }: IdentifyScreenProps) {
  const [simulating, setSimulating] = useState<string | null>(null);
  const connection = CONNECTION_CONFIG[wsState];

  async function simulate(uid: string) {
    setSimulating(uid);
    try {
      // The WS RFID_SCANNED event (not this response) is what actually moves the kiosk
      // forward - see useKioskSession - so this exercises the same path a real card tap does.
      await simulateRfidScan({ uid });
    } catch (err) {
      onError(toUserMessage(err, en));
    } finally {
      setSimulating(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <h1 className="text-4xl font-bold text-neutral-900">{t.title}</h1>
        <p className="mt-2 text-xl text-neutral-600">{t.subtitle}</p>
      </div>

      <div
        className={`flex h-40 w-40 items-center justify-center rounded-full border-8 text-6xl ${
          wsState === 'open' ? 'border-primary-700' : 'border-neutral-300'
        }`}
      >
        🪪
      </div>

      <p className="text-2xl font-medium text-neutral-800">{t.tapCard}</p>

      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm">
        <span className={`h-2.5 w-2.5 rounded-full ${connection.color} ${wsState !== 'open' ? 'motion-safe:animate-pulse' : ''}`} />
        {connection.label}
      </div>

      {error && (
        <div role="alert" className="w-full rounded-xl bg-danger-50 px-4 py-3 text-lg text-danger-800">
          {error}
        </div>
      )}

      <div className="mt-2 w-full rounded-2xl border-2 border-dashed border-neutral-300 bg-white/50 p-4">
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          {t.simulateSectionTitle}
        </p>
        <p className="mb-3 text-xs text-neutral-400">{t.hardwareNotConnected}</p>
        <div className="flex flex-col gap-3">
          <BigButton
            variant="secondary"
            disabled={simulating !== null}
            onClick={() => simulate('DEMO-RFID-001')}
          >
            {simulating === 'DEMO-RFID-001' ? tc.loading : t.simulateNormal}
          </BigButton>
          <BigButton
            variant="secondary"
            disabled={simulating !== null}
            onClick={() => simulate('DEMO-RFID-002')}
          >
            {simulating === 'DEMO-RFID-002' ? tc.loading : t.simulateEmergency}
          </BigButton>
        </div>
      </div>
    </div>
  );
}
