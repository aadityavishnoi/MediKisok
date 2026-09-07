import { KioskShell } from './components/KioskShell.js';
import { IdentifyScreen } from './screens/IdentifyScreen.js';
import { PatientFlow } from './screens/PatientFlow.js';
import { useKioskSession } from './state/useKioskSession.js';

export function App() {
  const { stage, wsState, identifyError, reportIdentifyError, blankCardUid } = useKioskSession();

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
