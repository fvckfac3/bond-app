'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface LoginState {
  error: string | null;
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) {
    return { error: 'Enter your email and password.' };
  }
  const { error } = await createClient().auth.signInWithPassword({ email, password });
  if (error) {
    return { error: 'Those details did not match an account.' };
  }
  redirect('/clinician');
}

export async function signOut() {
  await createClient().auth.signOut();
  redirect('/login');
}
