'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SignUpProfileData } from '@/lib/auth/types';

function getClient() {
  return createSupabaseBrowserClient();
}

export async function signIn(email: string, password: string) {
  const supabase = getClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(
  email: string,
  password: string,
  profileData?: SignUpProfileData,
) {
  const supabase = getClient();
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? 'https://agentops.one';

  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        first_name: profileData?.firstName,
        last_name: profileData?.lastName,
        display_name:
          profileData?.displayName ??
          [profileData?.firstName, profileData?.lastName]
            .filter(Boolean)
            .join(' '),
        phone: profileData?.phone,
      },
    },
  });
}

export async function signOut() {
  const supabase = getClient();
  return supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  const supabase = getClient();
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? 'https://agentops.one';

  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
}

export async function updatePassword(newPassword: string) {
  const supabase = getClient();
  return supabase.auth.updateUser({ password: newPassword });
}

export async function getClientSession() {
  const supabase = getClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getClientUser() {
  const supabase = getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function updateProfile(input: {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
}) {
  const supabase = getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const displayName =
    input.displayName ??
    [input.firstName, input.lastName].filter(Boolean).join(' ');

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      first_name: input.firstName,
      last_name: input.lastName,
      display_name: displayName,
      phone: input.phone,
      avatar_url: input.avatarUrl,
    },
  });

  if (authError) {
    return { error: authError };
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      user_id: user.id,
      email: user.email ?? '',
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      display_name: displayName ?? null,
      phone: input.phone ?? null,
      avatar_url: input.avatarUrl ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  return { error: profileError };
}
