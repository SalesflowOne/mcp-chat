export type {
  AppAccess,
  AppRole,
  AuthProfile,
  AuthSessionUser,
  SignUpProfileData,
} from '@/lib/auth/types';

export {
  getCurrentUser,
  getProfile,
  getSession,
  hasAppAccess,
  hasRole,
  requireAuth,
} from '@/lib/auth/server';

export {
  getClientSession,
  getClientUser,
  resetPassword,
  signIn,
  signOut,
  signUp,
  updatePassword,
  updateProfile,
} from '@/lib/auth/client';
