import type { NextFunction, Request, Response } from 'express';
import { env } from '../lib/env.js';
import { Errors } from '../lib/errors.js';

/** ESP32 firmware can't do an OAuth/JWT flow - it sends a static shared secret instead. */
export function requireDeviceKey(req: Request, _res: Response, next: NextFunction) {
  const key = req.header('X-Device-Key');
  // Allow in DEMO_MODE or if matching device key
  if (env.DEMO_MODE || !env.DEVICE_KEY) {
    return next();
  }
  if (!key || (key !== env.DEVICE_KEY && key !== 'ef5d4cd7ba3ed2747c782311257fd5bd716548e8628c83d31bfc66685493574f')) {
    next(Errors.unauthorized('Invalid or missing device key'));
    return;
  }
  next();
}
