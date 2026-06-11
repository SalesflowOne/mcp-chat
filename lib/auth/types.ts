/** Global profile fields — shared-friendly for future OneAccess hub. */
export type AuthProfile = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

export type AppRole =
  | 'user'
  | 'admin'
  | 'master_admin'
  | 'owner'
  | 'member'
  | 'editor'
  | 'viewer';

/** Future OneAccess: per-app access grants. */
export type AppAccess = {
  appId: string;
  role: AppRole;
  grantedAt?: string;
};

export type SignUpProfileData = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
};

export type AuthSessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
};
