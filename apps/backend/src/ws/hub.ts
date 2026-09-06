import type { WsEvent } from '@medikiosk/shared-types';
import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'node:http';

/**
 * Minimal broadcast hub: every connected client receives every event. Good enough for a
 * kiosk + a doctor dashboard + an admin dashboard in a single-hospital-desk demo; a
 * per-session room model would be the next step if this needed to scale to many kiosks.
 */
class WsHub {
  private clients = new Set<WebSocket>();

  attach(server: Server) {
    const wss = new WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (socket) => {
      this.clients.add(socket);
      socket.on('close', () => this.clients.delete(socket));
      socket.on('error', () => this.clients.delete(socket));
    });
    return wss;
  }

  broadcast(event: WsEvent) {
    const payload = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  }

  get clientCount() {
    return this.clients.size;
  }
}

export const wsHub = new WsHub();
