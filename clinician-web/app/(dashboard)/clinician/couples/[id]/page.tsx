import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ConnectionRatingChart, DailyActivityChart, WeeklyExerciseChart } from '@/components/charts';
import { logAuditEvent } from '@/lib/audit';
import { getClinicianContext } from '@/lib/clinic';
import { createClient } from '@/lib/supabase/server';
import type { DailyConnectionRow, ExerciseCompletionRow, RosterRow, SharedReflection } from '@/lib/types';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CoupleDetail({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound();
  const coupleUnitId = params.id;
  const { userId, membership } = await getClinicianContext();
  const supabase = createClient();

  // 1. Access check (admin of, or primary clinician for, an active consented link).
  const { data: allowed, error: accessError } = await supabase.rpc('clinician_can_view_couple', { p_couple_unit_id: coupleUnitId });
  if (accessError) throw new Error('access check failed');
  if (!allowed) notFound();

  // 2. Record the access before any record is read. A failed write throws: nothing renders.
  await logAuditEvent({ actorId: userId, clinicId: membership.clinic_id, subjectCoupleUnitId: coupleUnitId, action: 'VIEWED_COUPLE_RECORDS' });

  // 3. Records. RLS limits shared_reflections to 'shared_with_clinician' for clinicians; the
  //    status filter here only narrows what the query asks for.
  const [reflectionsRes, rosterRes, exercisesRes, dailyRes] = await Promise.all([
    supabase
      .from('shared_reflections')
      .select('id, exercise_title, content, synced_at, clinician_read_at')
      .eq('couple_unit_id', coupleUnitId)
      .eq('status', 'shared_with_clinician')
      .order('synced_at', { ascending: false }),
    supabase.rpc('clinic_roster', { p_clinic_id: membership.clinic_id }),
    supabase.rpc('couple_exercise_completions', { p_couple_unit_id: coupleUnitId, p_weeks: 8 }),
    supabase.rpc('couple_daily_connection', { p_couple_unit_id: coupleUnitId, p_days: 30 }),
  ]);
  if (reflectionsRes.error || rosterRes.error || exercisesRes.error || dailyRes.error) {
    throw new Error('could not load couple records');
  }
  const reflections = (reflectionsRes.data ?? []) as SharedReflection[];
  const couple = ((rosterRes.data ?? []) as RosterRow[]).find((r) => r.couple_unit_id === coupleUnitId);
  const exercises = (exercisesRes.data ?? []) as ExerciseCompletionRow[];
  const daily = (dailyRes.data ?? []) as DailyConnectionRow[];

  const unread = reflections.filter((r) => !r.clinician_read_at).length;
  if (unread > 0) {
    await logAuditEvent({
      actorId: userId,
      clinicId: membership.clinic_id,
      subjectCoupleUnitId: coupleUnitId,
      action: 'VIEWED_SHARED_REFLECTIONS',
      metadata: { reflection_ids: reflections.filter((r) => !r.clinician_read_at).map((r) => r.id) },
    });
    await supabase.rpc('mark_shared_reflections_read', { p_couple_unit_id: coupleUnitId });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/clinician" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Overview
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{couple?.partner_names?.join(' & ') ?? 'Couple'}</h1>
        <p className="text-sm text-slate-600">
          Only what this couple chose to share with you, and activity counts since they consented. Nothing they keep private is shown.
        </p>
      </div>

      <section aria-labelledby="reflections-title" className="space-y-3">
        <h2 id="reflections-title" className="text-lg font-semibold">
          Shared reflections
        </h2>
        {reflections.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">Nothing has been shared with you yet.</p>
        ) : (
          <ul className="space-y-3">
            {reflections.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span className="font-medium text-slate-800">{r.exercise_title ?? 'Reflection'}</span>
                  <span>
                    {new Date(r.synced_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    {!r.clinician_read_at && <span className="ml-2 rounded-full bg-bond-100 px-2 py-0.5 font-medium text-bond-700">New</span>}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{r.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="exercises-title" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 id="exercises-title" className="text-lg font-semibold">
          Exercise completions by week
        </h2>
        <p className="mb-3 text-xs text-slate-600">
          &ldquo;Gottman-informed&rdquo; marks exercises whose content draws on the Gottman Method. It is a content tag, not a clinical measure.
        </p>
        <WeeklyExerciseChart rows={exercises} />
      </section>

      <section aria-labelledby="daily-title" className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 id="daily-title" className="mb-3 text-lg font-semibold">
            Daily connection activity (30 days)
          </h2>
          <DailyActivityChart rows={daily} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Check-in connection rating</h2>
          <ConnectionRatingChart rows={daily} />
        </div>
      </section>
    </div>
  );
}
