import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureApiClient } from '@medikiosk/api-client';
import { App } from './App.js';
import './index.css';

const isBrowser = typeof window !== 'undefined';
const isNative = isBrowser && typeof (window as any).Capacitor !== 'undefined' && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform();

const defaultBaseUrl = isNative
  ? 'https://medikiosk-xa4l.onrender.com/api'
  : '/api';

const defaultWsUrl = isNative
  ? 'wss://medikiosk-xa4l.onrender.com/ws'
  : (isBrowser ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws` : 'wss://medikiosk-xa4l.onrender.com/ws');

configureApiClient({
  baseUrl: (import.meta as any).env?.VITE_API_BASE_URL || defaultBaseUrl,
  wsUrl: (import.meta as any).env?.VITE_WS_URL || defaultWsUrl,
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
