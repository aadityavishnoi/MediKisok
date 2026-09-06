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
  let retryDelay = 1000;

  function connect() {
    if (stopped) return;
    onStateChange?.('connecting');
    socket = new WebSocket(getWsUrl());

    socket.onopen = () => {
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
      onStateChange?.('closed');
      if (stopped) return;
      setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 15000);
    };

    socket.onerror = () => {
      socket?.close();
    };
  }

  connect();

  return () => {
    stopped = true;
    socket?.close();
  };
}
