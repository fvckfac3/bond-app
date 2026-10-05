import { Heart } from 'lucide-react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Heart className="h-6 w-6 text-bond-600" aria-hidden />
          <h1 className="text-xl font-semibold">Bond for Clinicians</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
