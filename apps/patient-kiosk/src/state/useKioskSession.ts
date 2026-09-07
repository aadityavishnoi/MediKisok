import { useCallback, useEffect, useRef, useState } from 'react';
import { connectWs, type WsConnectionState } from '@medikiosk/api-client';
import type { WsEvent } from '@medikiosk/shared-types';

export type KioskStage =
  | { name: 'IDENTIFY' }
  | { name: 'IDENTIFIED'; sessionId: string; patientId: string | null; isNewPatient: boolean };

interface UseKioskSessionResult {
  stage: KioskStage;
  wsState: WsConnectionState;
  identifyError: string | null;
  blankCardUid: string | null;
  clearIdentifyError: () => void;
  reportIdentifyError: (message: string) => void;
}

/**
 * The kiosk transitions off the Identify screen only in response to a real
 * registered RFID card scan or completed registration.
 * Blank/unregistered cards are captured and forwarded to the registration flow.
 */
export function useKioskSession(): UseKioskSessionResult {
  const [stage, setStage] = useState<KioskStage>({ name: 'IDENTIFY' });
  const [wsState, setWsState] = useState<WsConnectionState>('connecting');
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [blankCardUid, setBlankCardUid] = useState<string | null>(null);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  useEffect(() => {
    const disconnect = connectWs({
      onStateChange: setWsState,
      onEvent: (event: WsEvent) => {
        if (event.type === 'RFID_SCANNED' && stageRef.current.name === 'IDENTIFY') {
          // If this is a blank / unregistered physical card (no sessionId or marked unverified)
          if (!event.payload.sessionId || (event.payload as any).isRegistered === false) {
            setBlankCardUid(event.payload.uid);
            setIdentifyError(null);
            return;
          }

          setIdentifyError(null);
          setStage({
            name: 'IDENTIFIED',
            sessionId: event.payload.sessionId,
            patientId: event.payload.patientId,
            isNewPatient: event.payload.isNewPatient,
          });
        }
      },
    });
    return disconnect;
  }, []);

  return {
    stage,
    wsState,
    identifyError,
    blankCardUid,
    clearIdentifyError: useCallback(() => setIdentifyError(null), []),
    reportIdentifyError: useCallback((message: string) => setIdentifyError(message), []),
  };
}
