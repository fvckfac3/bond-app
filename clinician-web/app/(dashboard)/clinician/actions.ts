'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { logAuditEvent } from '@/lib/audit';
import { CLINIC_COOKIE, getClinicianContext } from '@/lib/clinic';
import { checkActiveSeats } from '@/lib/institutional';
import { generateInviteToken, hashInviteToken, normalizeEmail } from '@/lib/invite';
import { createClient } from '@/lib/supabase/server';

export async function selectClinic(formData: FormData) {
  const { memberships } = await getClinicianContext();
  const clinicId = String(formData.get('clinicId') ?? '');
  if (!memberships.some((m) => m.clinic_id === clinicId)) {
    return;
  }
  cookies().set(CLINIC_COOKIE, clinicId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/clinician' });
  revalidatePath('/clinician', 'layout');
}

export type InviteState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'created'; code: string; email: string; expiresAt: string };

// The clinic comes from the verified session, never from the form.
export async function inviteCouple(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const { userId, membership } = await getClinicianContext();
  const clinicId = membership.clinic_id;
  const email = normalizeEmail(formData.get('email'));
  if (!email) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }

  const supabase = createClient();
  const seats = await checkActiveSeats(clinicId, supabase);
  if (!seats.canAdd) {
    await logAuditEvent({ actorId: userId, clinicId, action: 'SEAT_LIMIT_BLOCKED', metadata: { used: seats.used, limit: seats.limit } });
    return { status: 'error', message: `All ${seats.limit} active seats are in use. Archive a couple or add seats first.` };
  }

  const token = generateInviteToken();
  const { data, error } = await supabase
    .rpc('create_clinic_invitation', { p_clinic_id: clinicId, p_email: email, p_token_hash: hashInviteToken(token) })
    .single<{ id: string; expires_at: string }>();
  if (error || !data) {
    if (error?.message.includes('seat_limit_reached')) {
      await logAuditEvent({ actorId: userId, clinicId, action: 'SEAT_LIMIT_BLOCKED', metadata: { used: seats.used, limit: seats.limit } });
      return { status: 'error', message: 'All active seats are in use.' };
    }
    return { status: 'error', message: 'The invitation could not be created. Try again.' };
  }

  // If this throws, the code is never shown, so the unlogged invitation can't be used.
  await logAuditEvent({ actorId: userId, clinicId, action: 'INVITED_COUPLE', metadata: { invitation_id: data.id } });
  revalidatePath('/clinician');
  return { status: 'created', code: token, email, expiresAt: data.expires_at };
}
