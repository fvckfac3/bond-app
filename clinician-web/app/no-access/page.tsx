import { signOut } from '../login/actions';

export default function NoAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold">No clinic access</h1>
        <p className="mt-2 text-sm text-slate-600">
          This account isn&apos;t a member of any clinic. Ask your clinic administrator to add you.
        </p>
        <form action={signOut} className="mt-6">
          <button type="submit" className="text-sm font-medium text-bond-700 underline">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
