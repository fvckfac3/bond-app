import Link from 'next/link';
import { Heart, LayoutDashboard, LogOut } from 'lucide-react';
import { ClinicSwitcher } from '@/components/ClinicSwitcher';
import { SeatUsageBar } from '@/components/SeatUsageBar';
import { TierBadge } from '@/components/TierBadge';
import { getClinicianContext } from '@/lib/clinic';
import { checkActiveSeats } from '@/lib/institutional';
import { signOut } from '@/app/login/actions';

export const dynamic = 'force-dynamic';

export default async function ClinicianLayout({ children }: { children: React.ReactNode }) {
  const { membership, memberships } = await getClinicianContext();
  const seats = await checkActiveSeats(membership.clinic_id);
  const { clinic } = membership;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-bond-600" aria-hidden />
            <span className="font-semibold">Bond for Clinicians</span>
          </div>
          <div>
            <div className="text-sm font-medium">{clinic.name}</div>
            <div className="mt-1">
              <TierBadge tier={clinic.tier} />
            </div>
          </div>
          <SeatUsageBar usage={seats} />
          <ClinicSwitcher
            current={membership.clinic_id}
            options={memberships.map((m) => ({ clinicId: m.clinic_id, name: m.clinic.name, role: m.role }))}
          />
          <nav className="flex gap-2 lg:flex-col">
            <Link href="/clinician" className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100">
              <LayoutDashboard className="h-4 w-4" aria-hidden /> Overview
            </Link>
          </nav>
          <div className="border-t border-slate-200 pt-4 text-sm">
            <div className="font-medium">{membership.full_name ?? 'Clinician'}</div>
            <div className="text-xs capitalize text-slate-600">{membership.role}</div>
            <form action={signOut} className="mt-2">
              <button type="submit" className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900">
                <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
