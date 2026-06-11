'use server';

import { z } from 'zod';

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

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/** Legacy stubs — use /login for authentication */
export const googleLogin = async () => {
  throw new Error('Use /login for authentication');
};

export const login = async (): Promise<LoginActionState> => {
  return { status: 'failed' };
};

export const register = async (): Promise<RegisterActionState> => {
  return { status: 'failed' };
};
