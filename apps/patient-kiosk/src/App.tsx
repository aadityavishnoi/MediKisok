import { useEffect } from 'react';
import { KioskShell } from './components/KioskShell.js';
import { IdentifyScreen } from './screens/IdentifyScreen.js';
import { PatientFlow } from './screens/PatientFlow.js';
import { useKioskSession } from './state/useKioskSession.js';

export function App() {
  const { stage, wsState, identifyError, reportIdentifyError, blankCardUid } = useKioskSession();

  // Clear any residual dev mode settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medikiosk_dev_scan_mode');
    }
  }, []);

  if (stage.name === 'IDENTIFY') {
    return (
      <KioskShell step="IDENTIFY" language={null} wsState={wsState}>
        <IdentifyScreen
          wsState={wsState}
          error={identifyError}
          onError={reportIdentifyError}
          detectedCardUid={blankCardUid}
        />
      </KioskShell>
    );
  }

  return <PatientFlow sessionId={stage.sessionId} wsState={wsState} />;
}
