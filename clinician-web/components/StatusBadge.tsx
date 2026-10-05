const STYLES = {
  active: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  archived: 'bg-slate-200 text-slate-700',
} as const;

const LABELS = {
  active: 'Active',
  pending: 'Awaiting consent',
  archived: 'Archived',
} as const;

export function StatusBadge({ status }: { status: keyof typeof STYLES }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>{LABELS[status]}</span>;
}
