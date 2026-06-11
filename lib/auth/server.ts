import 'server-only';

import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseAuthConfigured } from '@/lib/supabase/config';
import type { AuthProfile, AuthSessionUser, AppRole } from '@/lib/auth/types';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { MASTER_ADMIN_EMAIL } from '@/lib/tenant/constants';

export async function getSession() {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser(): Promise<AuthSessionUser | null> {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const meta = user.user_metadata ?? {};
  const firstName = meta.first_name ?? meta.firstName ?? null;
  const lastName = meta.last_name ?? meta.lastName ?? null;
  const displayName =
    (meta.display_name ??
      meta.full_name ??
      meta.name ??
      [firstName, lastName].filter(Boolean).join(' ')) ||
    user.email?.split('@')[0] ||
    'User';

  return {
    id: user.id,
    email: user.email ?? '',
    name: displayName,
    avatarUrl: meta.avatar_url ?? meta.avatarUrl ?? null,
  };
}

export async function getProfile(userId: string): Promise<AuthProfile | null> {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      return {
        id: data.user_id ?? data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        displayName: data.display_name,
        phone: data.phone,
        avatarUrl: data.avatar_url,
      };
    }
  } catch {
    // profiles table may not exist yet — fall back to auth metadata
  }

  const user = await getCurrentUser();
  if (!user || user.id !== userId) {
    return null;
  }

  const parts = user.name.split(' ');
  return {
    id: user.id,
    email: user.email,
    displayName: user.name,
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(' ') || null,
    avatarUrl: user.avatarUrl,
  };
}

export async function requireAuth(returnTo?: string): Promise<AuthSessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const params = returnTo
      ? `?returnTo=${encodeURIComponent(returnTo)}`
      : '';
    redirect(`/login${params}`);
  }
  return user;
}

export async function hasRole(
  userId: string,
  role: AppRole,
  appId = 'agentops',
): Promise<boolean> {
  if (!isSupabaseAuthConfigured()) {
    return false;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: appUser } = await supabase
      .from('app_users')
      .select('role, is_master_admin, email')
      .eq('id', userId)
      .maybeSingle();

    if (appUser?.is_master_admin && role === 'master_admin') {
      return true;
    }

    if (appUser?.role === role) {
      return true;
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    return String(userRole?.role) === role;
  } catch {
    const user = await getCurrentUser();
    if (user?.id === userId && user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      return role === 'master_admin';
    }
    return false;
  }
}

export async function hasAppAccess(
  userId: string,
  appId = 'agentops',
): Promise<boolean> {
  if (!isSupabaseAuthConfigured()) {
    return false;
  }

  const user = await getCurrentUser();
  if (!user || user.id !== userId) {
    return false;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: appUser } = await supabase
      .from('app_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    return Boolean(appUser);
  } catch {
    return true;
  }
}
