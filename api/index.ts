import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../apps/backend/src/app.js';

let app: any = null;

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = createApp();
  }
  return app(req, res);
}
