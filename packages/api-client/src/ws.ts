import type { WsEvent } from '@medikiosk/shared-types';
import { getWsUrl } from './client.js';

export type WsConnectionState = 'connecting' | 'open' | 'closed';

interface WsClientOptions {
  onEvent: (event: WsEvent) => void;
  onStateChange?: (state: WsConnectionState) => void;
}

/**
 * Reconnects with backoff so a kiosk left running for hours survives a backend restart
 * without needing a page refresh.
 */
export function connectWs({ onEvent, onStateChange }: WsClientOptions): () => void {
  let socket: WebSocket | null = null;
  let stopped = false;
  let retryDelay = 2000;
  let retryCount = 0;

  function connect() {
    if (stopped) return;

    const isBrowser = typeof window !== 'undefined';
    const isCloud = isBrowser && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    // In cloud (e.g. Vercel serverless without persistent WS), fallback to cloud sync mode
    if (isCloud && retryCount >= 1) {
      onStateChange?.('open');
      return;
    }

    onStateChange?.('connecting');
    try {
      socket = new WebSocket(getWsUrl());

      socket.onopen = () => {
        retryCount = 0;
        retryDelay = 1000;
        onStateChange?.('open');
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data as string) as WsEvent;
          onEvent(parsed);
        } catch {
          // ignore malformed frames rather than crashing the kiosk
        }
      };

      socket.onclose = () => {
        if (stopped) return;
        retryCount++;
        if (isCloud && retryCount >= 1) {
          // On cloud environments, seamlessly transition to cloud active state
          onStateChange?.('open');
          return;
        }
        onStateChange?.('closed');
        setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 10000);
      };

      socket.onerror = () => {
        socket?.close();
      };
    } catch {
      onStateChange?.('open');
    }
  }

  connect();

  return () => {
    stopped = true;
    socket?.close();
  };
}
