import type { NextFunction, Request, Response } from 'express';
import { env } from '../lib/env.js';
import { Errors } from '../lib/errors.js';

/** ESP32 firmware can't do an OAuth/JWT flow - it sends a static shared secret instead. */
export function requireDeviceKey(req: Request, _res: Response, next: NextFunction) {
  const key = req.header('X-Device-Key');
  if (!key || key !== env.DEVICE_KEY) {
    next(Errors.unauthorized('Invalid or missing device key'));
    return;
  }
  next();
}
