import 'server-only';
import { headers } from 'next/headers';
import { createAdminClient } from './supabase/admin';
import { clientIpFrom } from './request';

export type AuditAction =
  | 'VIEWED_DASHBOARD'
  | 'VIEWED_COUPLE_RECORDS'
  | 'VIEWED_SHARED_REFLECTIONS'
  | 'INVITED_COUPLE'
  | 'SEAT_LIMIT_BLOCKED';

export interface AuditEvent {
  /** Must come from the verified session (getClinicianContext), never from client input. */
  actorId: string;
  clinicId: string;
  subjectCoupleUnitId?: string | null;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  /** Defaults to the request's client IP. */
  ipAddress?: string | null;
}

/**
 * Appends one row to audit_logs with the service role. Throws on failure so callers fail closed:
 * a protected read whose access could not be recorded must not be rendered.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  const ipAddress = event.ipAddress === undefined ? clientIpFrom(headers()) : event.ipAddress;
  const { error } = await createAdminClient()
    .from('audit_logs')
    .insert({
      clinic_id: event.clinicId,
      actor_id: event.actorId,
      subject_couple_unit_id: event.subjectCoupleUnitId ?? null,
      action: event.action,
      metadata: event.metadata ?? {},
      ip_address: ipAddress,
    });
  if (error) {
    throw new Error(`audit log write failed: ${error.message}`);
  }
}
