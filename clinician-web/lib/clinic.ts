import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import type { Membership } from './types';

export const CLINIC_COOKIE = 'bond_clinic';

export interface ClinicianContext {
  userId: string;
  membership: Membership;
  memberships: Membership[];
}

/**
 * The signed-in user and the clinic they are working in (cookie-selected, else their first).
 * Redirects to /login without a session and to /no-access without a clinicians row.
 * Identity comes from supabase.auth.getUser(), which verifies the session with Supabase Auth.
 */
export const getClinicianContext = cache(async (): Promise<ClinicianContext> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data, error } = await supabase
    .from('clinicians')
    .select('id, clinic_id, role, full_name, clinic:clinics(id, name, tier, base_seat_limit, extra_seats, billing_cycle)')
    .eq('user_id', user.id)
    .order('created_at');
  if (error) {
    throw new Error(`could not load clinician memberships: ${error.message}`);
  }
  const memberships = (data ?? []) as unknown as Membership[];
  if (memberships.length === 0) {
    redirect('/no-access');
  }

  const selected = cookies().get(CLINIC_COOKIE)?.value;
  const membership = memberships.find((m) => m.clinic_id === selected) ?? memberships[0];
  return { userId: user.id, membership, memberships };
});
