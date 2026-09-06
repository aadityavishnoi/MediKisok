import { useState } from 'react';
import { LoginScreen } from './screens/LoginScreen.js';
import { DashboardScreen } from './screens/DashboardScreen.js';
import { SessionDetailScreen } from './screens/SessionDetailScreen.js';
import { getToken } from './lib/authStore.js';

type View = { name: 'DASHBOARD' } | { name: 'SESSION_DETAIL'; sessionId: string };

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
    />
  );
}
