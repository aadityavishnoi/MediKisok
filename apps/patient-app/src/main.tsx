import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureApiClient } from '@medikiosk/api-client';
import { App } from './App.js';
import './index.css';

// Configure API client baseUrl for mobile & web
const isBrowser = typeof window !== 'undefined';
const isProdWeb = isBrowser && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

configureApiClient({
  baseUrl: (import.meta as any).env?.VITE_API_BASE_URL ?? (isProdWeb ? `${window.location.origin}/api` : 'https://medikiosk-xa4l.onrender.com/api'),
  wsUrl: (import.meta as any).env?.VITE_WS_URL ?? (isProdWeb ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws` : 'wss://medikiosk-xa4l.onrender.com/ws'),
  getToken: () => localStorage.getItem('medikiosk_patient_token'),
});

// Register PWA service worker if available
if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost.test')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => console.log('MediKiosk App SW registered:', reg.scope))
      .catch((err) => console.warn('SW registration warning:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
