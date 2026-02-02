export {
  createSession,
  getSession,
  getAdminUser,
  getCurrentCustomer,
  destroySession,
  isAuthenticated,
  isAdmin,
  requireAuth,
  requireAdmin,
  requireCustomer,
  type Session,
} from './session';

export {
  createMagicLink,
  verifyMagicLink,
  cleanupExpiredMagicLinks,
  type AuthType,
  type MagicLinkResult,
  type VerifyResult,
} from './magic-link';
