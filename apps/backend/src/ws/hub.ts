import type { WsEvent } from '@medikiosk/shared-types';
import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';

interface ClientRecord {
  ws: WebSocket;
  facilityId: string | null; // null = CENTRAL_ADMIN (receives all events)
  role: string;
  sub: string;
}

/**
 * Facility-scoped WebSocket hub.
 *
 * Clients join by sending a JSON auth message after connection:
 *   { type: "AUTH", token: "<JWT>" }
 *
 * Events are then delivered based on facility scope:
 * - broadcastToFacility(facilityId, event) → only clients of that facility + CENTRAL_ADMIN clients
 * - broadcast(event) → all clients (used for national-level events only)
 *
 * Clients that have not authenticated are NOT in the client set (dropped after 10s timeout).
 */
class WsHub {
  private clients = new Set<ClientRecord>();

  attach(server: Server) {
    const wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (socket) => {
      let record: ClientRecord | null = null;
      let authTimeout: ReturnType<typeof setTimeout>;

      // Give the client 10 seconds to send an AUTH message
      authTimeout = setTimeout(() => {
        if (!record) {
          socket.close(4001, 'Auth timeout');
        }
      }, 10_000);

      socket.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString()) as Record<string, unknown>;

          if (msg.type === 'AUTH') {
            const token = msg.token as string | undefined;
            if (!token) {
              socket.close(4003, 'No token provided');
              return;
            }

            try {
              const payload = jwt.verify(token, env.JWT_SECRET) as {
                sub: string;
                role: string;
                facilityId?: string | null;
              };

              clearTimeout(authTimeout);
              record = {
                ws: socket,
                sub: payload.sub,
                role: payload.role,
                // CENTRAL_ADMIN and ADMIN get null facilityId → receive all events
                facilityId:
                  payload.role === 'CENTRAL_ADMIN' || payload.role === 'ADMIN'
                    ? null
                    : payload.facilityId ?? null,
              };
              this.clients.add(record);
              socket.send(JSON.stringify({ type: 'AUTH_OK', facilityId: record.facilityId }));
            } catch {
              socket.close(4003, 'Invalid token');
            }
            return;
          }
        } catch {
          // Non-JSON messages are ignored
        }
      });

      socket.on('close', () => {
        if (record) this.clients.delete(record);
        clearTimeout(authTimeout);
      });

      socket.on('error', () => {
        if (record) this.clients.delete(record);
        clearTimeout(authTimeout);
      });
    });

    return wss;
  }

  /**
   * Sends an event to:
   * - All clients that belong to the specified facilityId
   * - All CENTRAL_ADMIN clients (facilityId === null)
   *
   * Use this for all patient-flow events (RFID_SCANNED, SESSION_UPDATED, etc.)
   */
  broadcastToFacility(facilityId: string | null, event: WsEvent) {
    const payload = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.ws.readyState !== client.ws.OPEN) continue;
      // Deliver if: same facility, OR client is CENTRAL_ADMIN (facilityId === null)
      if (client.facilityId === null || client.facilityId === facilityId) {
        client.ws.send(payload);
      }
    }
  }

  /**
   * Sends an event to ALL connected authenticated clients.
   * Use sparingly — only for truly global events (system announcements, national alerts).
   */
  broadcast(event: WsEvent) {
    const payload = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.ws.readyState === client.ws.OPEN) {
        client.ws.send(payload);
      }
    }
  }

  get clientCount() {
    return this.clients.size;
  }

  get facilityClientCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const c of this.clients) {
      const key = c.facilityId ?? 'CENTRAL';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }
}

export const wsHub = new WsHub();
