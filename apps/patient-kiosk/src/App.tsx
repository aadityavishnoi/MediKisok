import { KioskLayout, en } from '@medikiosk/ui';
import { IdentifyScreen } from './screens/IdentifyScreen.js';
import { useKioskSession } from './state/useKioskSession.js';

const t = en.identify;

export function App() {
  const { stage, wsState, identifyError, reportIdentifyError } = useKioskSession();

  if (stage.name === 'IDENTIFY') {
    return <IdentifyScreen wsState={wsState} error={identifyError} onError={reportIdentifyError} />;
  }

  // Placeholder until Slice 2 (Consent -> Language -> History) replaces this screen.
  return (
    <KioskLayout>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-6xl">✅</div>
        <h1 className="text-3xl font-bold text-slate-900">{t.identifiedSuccess}</h1>
        <p className="text-lg text-slate-600">Session: {stage.sessionId}</p>
        <p className="text-lg text-slate-600">
          Patient: {stage.patientId ?? '(new patient - registration required)'}
        </p>
      </div>
    </KioskLayout>
  );
}
