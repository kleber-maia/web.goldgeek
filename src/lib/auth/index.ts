export {
  createSession,
  getSession,
  getCurrentUser,
  destroySession,
  isAuthenticated,
  isAdmin,
  requireAuth,
  requireAdmin,
  type Session,
} from './session';

export {
  createMagicLink,
  verifyMagicLink,
  cleanupExpiredMagicLinks,
} from './magic-link';
