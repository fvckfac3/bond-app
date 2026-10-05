'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signIn, type LoginState } from './actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-bond-600 px-4 py-2 font-medium text-white hover:bg-bond-700 disabled:opacity-60"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState<LoginState, FormData>(signIn, { error: null });
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input name="password" type="password" autoComplete="current-password" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  );
}
