import { IdentifyScreen } from './screens/IdentifyScreen.js';
import { PatientFlow } from './screens/PatientFlow.js';
import { useKioskSession } from './state/useKioskSession.js';

export function App() {
  const { stage, wsState, identifyError, reportIdentifyError } = useKioskSession();

  if (stage.name === 'IDENTIFY') {
    return <IdentifyScreen wsState={wsState} error={identifyError} onError={reportIdentifyError} />;
  }

  return <PatientFlow sessionId={stage.sessionId} />;
}
