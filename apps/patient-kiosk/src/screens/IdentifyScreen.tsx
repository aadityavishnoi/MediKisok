import { useState } from 'react';
import { BigButton, KioskLayout, en } from '@medikiosk/ui';
import { ApiClientError, simulateRfidScan } from '@medikiosk/api-client';
import type { WsConnectionState } from '@medikiosk/api-client';

const t = en.identify;
const tc = en.common;

export interface IdentifyScreenProps {
  wsState: WsConnectionState;
  error: string | null;
  onError: (message: string) => void;
}

export function IdentifyScreen({ wsState, error, onError }: IdentifyScreenProps) {
  const [simulating, setSimulating] = useState<string | null>(null);

  async function simulate(uid: string) {
    setSimulating(uid);
    try {
      // The WS RFID_SCANNED event (not this response) is what actually moves the kiosk
      // forward - see useKioskSession - so this exercises the same path a real card tap does.
      await simulateRfidScan({ uid });
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : t.cardNotRecognized;
      onError(message);
    } finally {
      setSimulating(null);
    }
  }

  return (
    <KioskLayout>
      <div className="flex flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-2 text-xl text-slate-600">{t.subtitle}</p>
        </div>

        <div className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-blue-700 text-6xl">
          🪪
        </div>

        <p className="text-2xl font-medium text-slate-800">{t.tapCard}</p>
        <p className="text-base text-slate-500">
          {wsState === 'open' ? t.waitingForCard : tc.loading}
        </p>

        {error && (
          <div role="alert" className="w-full rounded-xl bg-red-50 px-4 py-3 text-lg text-red-800">
            {error}
          </div>
        )}

        <div className="mt-6 w-full rounded-2xl border-2 border-dashed border-slate-300 p-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            {t.simulateSectionTitle}
          </p>
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
    </KioskLayout>
  );
}
