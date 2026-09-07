import { useState } from 'react';
import { LoginScreen } from './screens/LoginScreen.js';
import { DashboardScreen } from './screens/DashboardScreen.js';
import { SessionDetailScreen } from './screens/SessionDetailScreen.js';
import { ConsultationScreen } from './screens/ConsultationScreen.js';
import { RedFlagsScreen } from './screens/RedFlagsScreen.js';
import { PatientRecordsScreen } from './screens/PatientRecordsScreen.js';
import { getToken } from './lib/authStore.js';

export type View =
  | { name: 'DASHBOARD' }
  | { name: 'SESSION_DETAIL'; sessionId: string }
  | { name: 'CONSULTATION'; sessionId?: string }
  | { name: 'RED_FLAGS' }
  | { name: 'PATIENT_RECORDS' };

export function App() {
  const [loggedIn, setLoggedIn] = useState(() => getToken() !== null);
  const [view, setView] = useState<View>({ name: 'DASHBOARD' });

  if (!loggedIn) {
    return <LoginScreen onLoggedIn={() => setLoggedIn(true)} />;
  }

  if (view.name === 'SESSION_DETAIL') {
    return (
      <SessionDetailScreen
        sessionId={view.sessionId}
        onBack={() => setView({ name: 'DASHBOARD' })}
        onOpenSession={(sessionId) => setView({ name: 'SESSION_DETAIL', sessionId })}
        onOpenConsultation={(sessionId) => setView({ name: 'CONSULTATION', sessionId })}
        onOpenAlerts={() => setView({ name: 'RED_FLAGS' })}
        onOpenRecords={() => setView({ name: 'PATIENT_RECORDS' })}
        onLoggedOut={() => {
          setLoggedIn(false);
          setView({ name: 'DASHBOARD' });
        }}
      />
    );
  }

  if (view.name === 'CONSULTATION') {
    return (
      <ConsultationScreen
        sessionId={view.sessionId}
        onBack={() => setView({ name: 'DASHBOARD' })}
        onOpenPatient360={(sid) => setView({ name: 'SESSION_DETAIL', sessionId: sid || view.sessionId || 'demo_session_001' })}
        onOpenAlerts={() => setView({ name: 'RED_FLAGS' })}
        onOpenRecords={() => setView({ name: 'PATIENT_RECORDS' })}
        onLoggedOut={() => {
          setLoggedIn(false);
          setView({ name: 'DASHBOARD' });
        }}
      />
    );
  }

  if (view.name === 'RED_FLAGS') {
    return (
      <RedFlagsScreen
        onBack={() => setView({ name: 'DASHBOARD' })}
        onOpenSession={(sessionId) => setView({ name: 'SESSION_DETAIL', sessionId })}
        onOpenConsultation={(sessionId) => setView({ name: 'CONSULTATION', sessionId })}
        onOpenRecords={() => setView({ name: 'PATIENT_RECORDS' })}
        onLoggedOut={() => {
          setLoggedIn(false);
          setView({ name: 'DASHBOARD' });
        }}
      />
    );
  }

  if (view.name === 'PATIENT_RECORDS') {
    return (
      <PatientRecordsScreen
        onBack={() => setView({ name: 'DASHBOARD' })}
        onOpenSession={(sessionId) => setView({ name: 'SESSION_DETAIL', sessionId })}
        onOpenConsultation={(sessionId) => setView({ name: 'CONSULTATION', sessionId })}
        onOpenAlerts={() => setView({ name: 'RED_FLAGS' })}
        onLoggedOut={() => {
          setLoggedIn(false);
          setView({ name: 'DASHBOARD' });
        }}
      />
    );
  }

  return (
    <DashboardScreen
      onLoggedOut={() => setLoggedIn(false)}
      onOpenSession={(sessionId) => setView({ name: 'SESSION_DETAIL', sessionId })}
      onOpenConsultation={(sessionId) => setView({ name: 'CONSULTATION', sessionId })}
      onOpenAlerts={() => setView({ name: 'RED_FLAGS' })}
      onOpenRecords={() => setView({ name: 'PATIENT_RECORDS' })}
    />
  );
}


