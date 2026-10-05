'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { UserPlus, X } from 'lucide-react';
import { inviteCouple, type InviteState } from '@/app/(dashboard)/clinician/actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-bond-600 px-4 py-2 text-sm font-medium text-white hover:bg-bond-700 disabled:opacity-60">
      {pending ? 'Checking seats…' : 'Create invitation'}
    </button>
  );
}

export function InviteCoupleModal({ seatsAvailable }: { seatsAvailable: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [formKey, setFormKey] = useState(0);
  useEffect(() => {
    const d = dialog.current;
    const reset = () => setFormKey((k) => k + 1);
    d?.addEventListener('close', reset);
    return () => d?.removeEventListener('close', reset);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        disabled={!seatsAvailable}
        title={seatsAvailable ? undefined : 'All active seats are in use'}
        className="inline-flex items-center gap-2 rounded-md bg-bond-600 px-3 py-2 text-sm font-medium text-white hover:bg-bond-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        Invite couple
      </button>
      <dialog ref={dialog} className="w-full max-w-md rounded-xl p-0 backdrop:bg-slate-900/40" aria-labelledby="invite-title">
        <InviteForm key={formKey} onClose={() => dialog.current?.close()} />
      </dialog>
    </>
  );
}

// Remounted (fresh form state) each time the dialog closes, so a shown code never reappears.
function InviteForm({ onClose }: { onClose: () => void }) {
  const [state, action] = useFormState<InviteState, FormData>(inviteCouple, { status: 'idle' });
  return (
    <div className="p-6">
      <div className="mb-4 flex items-start justify-between">
        <h2 id="invite-title" className="text-lg font-semibold">
          Invite a couple
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-800">
          <X className="h-5 w-5" />
        </button>
      </div>
      {state.status === 'created' ? (
        <div className="space-y-3 text-sm">
          <p>
            Invitation created for <strong>{state.email}</strong>. Give them this code; it works once and expires{' '}
            {new Date(state.expiresAt).toLocaleDateString()}.
          </p>
          <code className="block break-all rounded-md bg-slate-100 p-3 font-mono text-xs">{state.code}</code>
          <p className="text-slate-600">
            The code is shown only now. Both partners must accept in Bond before you can see anything they share.
          </p>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <p className="text-sm text-slate-600">
            Enter one partner&apos;s Bond account email. Seats are checked before the invitation is created.
          </p>
          <label className="block text-sm font-medium">
            Partner email
            <input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          {state.status === 'error' && (
            <p role="alert" className="text-sm text-red-700">
              {state.message}
            </p>
          )}
          <div className="flex justify-end">
            <Submit />
          </div>
        </form>
      )}
    </div>
  );
}
