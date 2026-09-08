import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureApiClient } from '@medikiosk/api-client';
import { App } from './App.js';
import { getToken } from './lib/authStore.js';
import './index.css';

const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
configureApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? (isProd ? `${window.location.origin}/api` : 'http://localhost:4000/api'),
  wsUrl: import.meta.env.VITE_WS_URL ?? (isProd ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws` : 'ws://localhost:4000/ws'),
  getToken,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
