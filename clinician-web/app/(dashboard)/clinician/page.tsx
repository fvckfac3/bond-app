import { AlertTriangle, HeartHandshake, MessageSquareText, Users } from 'lucide-react';
import { InviteCoupleModal } from '@/components/InviteCoupleModal';
import { MetricCard } from '@/components/MetricCard';
import { RosterTable } from '@/components/RosterTable';
import { logAuditEvent } from '@/lib/audit';
import { getClinicianContext } from '@/lib/clinic';
import { checkActiveSeats } from '@/lib/institutional';
import { createClient } from '@/lib/supabase/server';
import type { DashboardMetrics, RosterRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ClinicianOverview() {
  const { userId, membership } = await getClinicianContext();
  const clinicId = membership.clinic_id;

  // The roster includes partner names, so record the view before loading it.
  await logAuditEvent({ actorId: userId, clinicId, action: 'VIEWED_DASHBOARD' });

  const supabase = createClient();
  const [seats, metricsRes, rosterRes] = await Promise.all([
    checkActiveSeats(clinicId, supabase),
    supabase.rpc('clinic_dashboard_metrics', { p_clinic_id: clinicId }).single<DashboardMetrics>(),
    supabase.rpc('clinic_roster', { p_clinic_id: clinicId }),
  ]);
  if (metricsRes.error || rosterRes.error) {
    throw new Error('could not load the dashboard');
  }
  const metrics = metricsRes.data;
  const roster = (rosterRes.data ?? []) as RosterRow[];

  const seatTone = !seats.canAdd ? 'danger' : seats.nearLimit ? 'warning' : 'default';
  const seatHint = !seats.canAdd
    ? 'Seat limit reached. New couples cannot be activated.'
    : seats.nearLimit
      ? `${seats.remaining} seat${seats.remaining === 1 ? '' : 's'} left.`
      : `${seats.remaining} seats available.`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <InviteCoupleModal seatsAvailable={seats.canAdd} />
      </div>

      <section aria-label="Metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active couples" value={metrics.active_couples} icon={Users} hint={membership.role === 'admin' ? 'Across the clinic' : 'Assigned to you'} />
        <MetricCard label="Connection activities this week" value={metrics.connection_activities_this_week} icon={HeartHandshake} hint="Completed since Monday" />
        <MetricCard label="Unread shared reflections" value={metrics.unread_shared_reflections} icon={MessageSquareText} hint="Shared with you by a partner" />
        <MetricCard label="Seat quota" value={`${seats.used}/${seats.limit}`} icon={AlertTriangle} tone={seatTone} hint={seatHint} />
      </section>

      <section aria-labelledby="roster-title" className="space-y-3">
        <h2 id="roster-title" className="text-lg font-semibold">
          {membership.role === 'admin' ? 'Couples' : 'Your couples'}
        </h2>
        <RosterTable rows={roster} showClinician={membership.role === 'admin'} />
      </section>
    </div>
  );
}
