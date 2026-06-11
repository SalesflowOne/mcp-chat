'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseAuthConfigured } from '@/lib/supabase/config';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = credentialsSchema.extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

function authNotConfigured() {
  return { error: 'Authentication is not configured. Contact support.' };
}

export async function signInWithPasswordAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  if (!isSupabaseAuthConfigured()) {
    return authNotConfigured();
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: 'Enter a valid email and password.' };
  }

  const returnTo = String(formData.get('returnTo') ?? '/');
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect(returnTo.startsWith('/') ? returnTo : '/');
}

export async function signUpWithPasswordAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  if (!isSupabaseAuthConfigured()) {
    return authNotConfigured();
  }

  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName') || undefined,
    lastName: formData.get('lastName') || undefined,
  });

  if (!parsed.success) {
    return { error: 'Check your details and use a password of at least 8 characters.' };
  }

  const returnTo = String(formData.get('returnTo') ?? '/');
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://agentops.one';

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        display_name: [parsed.data.firstName, parsed.data.lastName]
          .filter(Boolean)
          .join(' '),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');

  if (data.session) {
    redirect(returnTo.startsWith('/') ? returnTo : '/');
  }

  redirect('/login?registered=1');
}

export async function signOutAction() {
  if (!isSupabaseAuthConfigured()) {
    redirect('/');
  }

  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

/** Legacy stubs */
export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const googleLogin = async () => {
  throw new Error('Use /login for authentication');
};

export const login = async (): Promise<LoginActionState> => {
  return { status: 'failed' };
};

export const register = async (): Promise<RegisterActionState> => {
  return { status: 'failed' };
};
