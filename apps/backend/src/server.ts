import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './lib/env.js';
import { wsHub } from './ws/hub.js';

const app = createApp();
const server = createServer(app);
wsHub.attach(server);

server.listen(env.PORT, () => {
  console.log(`[medikiosk-backend] listening on http://localhost:${env.PORT}`);
  console.log(`[medikiosk-backend] websocket path ws://localhost:${env.PORT}/ws`);
  console.log(`[medikiosk-backend] DEMO_MODE=${env.DEMO_MODE} AI_PROVIDER=${env.AI_PROVIDER}`);
});
