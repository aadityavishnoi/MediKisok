import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import { Errors } from '../lib/errors.js';

/**
 * JWT payload carried by all authenticated users (doctors, admins, RFID officers, etc.)
 * All portal types share this same token structure. The `role` field determines
 * what the user can do; `facilityId` scopes their data access.
 */
export interface UserTokenPayload {
  sub: string;
  role: string;
  name: string;
  /** The hospital/facility this user belongs to. Null for CENTRAL_ADMIN / SUPER_ADMIN. */
  facilityId?: string | null;
  email?: string;
}

/** @deprecated Use UserTokenPayload instead */
export type DoctorTokenPayload = UserTokenPayload;

export type RequestWithUser = Request & { user?: UserTokenPayload };
/** @deprecated Use RequestWithUser */
export type RequestWithDoctor = RequestWithUser;

/**
 * Verifies the Bearer JWT and attaches the decoded payload to `req.user`.
 * Does NOT check roles — use `requireRole()` for that.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    next(Errors.unauthorized('Missing bearer token'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as UserTokenPayload;
    (req as RequestWithUser).user = payload;
    next();
  } catch {
    next(Errors.unauthorized('Invalid or expired token'));
  }
}

/** Backward-compat alias used by existing doctor routes */
export const requireDoctorAuth = requireAuth;

/**
 * Middleware factory that checks the user has one of the specified roles.
 * Must be used AFTER requireAuth.
 *
 * @example
 * router.get('/admin/metrics', requireAuth, requireRole('CENTRAL_ADMIN', 'ADMIN'), handler)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as RequestWithUser).user;
    if (!user) {
      next(Errors.unauthorized('Not authenticated'));
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      next(Errors.forbidden(`Role '${user.role}' is not permitted for this endpoint`));
      return;
    }
    next();
  };
}

/**
 * Checks that the user's facilityId matches the requested resource's facilityId
 * (from req.params.hospitalId, req.params.facilityId, or req.body.hospitalId).
 * CENTRAL_ADMIN and ADMIN bypass this check.
 */
export function requireFacilityScope(req: Request, _res: Response, next: NextFunction) {
  const user = (req as RequestWithUser).user;
  if (!user) {
    next(Errors.unauthorized('Not authenticated'));
    return;
  }

  const bypassRoles = ['CENTRAL_ADMIN', 'ADMIN', 'SUPER_ADMIN'];
  if (bypassRoles.includes(user.role)) {
    return next();
  }

  const requestedId =
    (req.params as Record<string, string>).hospitalId ||
    (req.params as Record<string, string>).facilityId ||
    req.body?.hospitalId;

  if (requestedId && user.facilityId && requestedId !== user.facilityId) {
    next(Errors.forbidden('You do not have access to this facility'));
    return;
  }

  next();
}
