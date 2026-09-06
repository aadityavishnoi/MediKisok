import { useState } from 'react';
import { LoginScreen } from './screens/LoginScreen.js';
import { DashboardScreen } from './screens/DashboardScreen.js';
import { getToken } from './lib/authStore.js';

export function App() {
  const [loggedIn, setLoggedIn] = useState(() => getToken() !== null);

  if (!loggedIn) {
    return <LoginScreen onLoggedIn={() => setLoggedIn(true)} />;
  }

  return <DashboardScreen onLoggedOut={() => setLoggedIn(false)} />;
}
