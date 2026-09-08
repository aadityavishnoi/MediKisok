/**
 * @deprecated This module is kept for backward compatibility.
 * New code should import from './userAuth.js' instead.
 */
export {
  requireAuth as requireDoctorAuth,
  requireRole,
  requireFacilityScope,
  type UserTokenPayload as DoctorTokenPayload,
  type RequestWithUser as RequestWithDoctor,
} from './userAuth.js';
