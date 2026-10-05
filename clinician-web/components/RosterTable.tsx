import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { RosterRow } from '@/lib/types';
import { StatusBadge } from './StatusBadge';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export function RosterTable({ rows, showClinician }: { rows: RosterRow[]; showClinician: boolean }) {
  if (rows.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No couples yet. Invite one to get started.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Couple</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Last active</th>
            {showClinician && <th scope="col" className="px-4 py-3">Clinician</th>}
            <th scope="col" className="px-4 py-3">Unread shared</th>
            <th scope="col" className="px-4 py-3"><span className="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.clinic_couple_id}>
              <td className="px-4 py-3 font-medium">{r.partner_names ? r.partner_names.join(' & ') : <span className="text-slate-500">Hidden until both partners consent</span>}</td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3 text-slate-600">{r.status === 'active' ? formatDate(r.last_active_at) : '—'}</td>
              {showClinician && <td className="px-4 py-3 text-slate-600">{r.primary_clinician_name ?? 'Unassigned'}</td>}
              <td className="px-4 py-3">{r.unread_shared_reflections > 0 ? <span className="font-semibold text-bond-700">{r.unread_shared_reflections}</span> : '0'}</td>
              <td className="px-4 py-3 text-right">
                {r.status === 'active' && (
                  // prefetch off: opening this page writes an audit record, so it must only render on a real visit.
                  <Link prefetch={false} href={`/clinician/couples/${r.couple_unit_id}`} className="inline-flex items-center gap-1 text-bond-700 hover:underline">
                    View <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
