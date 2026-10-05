import type { LucideIcon } from 'lucide-react';

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: 'default' | 'warning' | 'danger';
}) {
  const toneClass = tone === 'danger' ? 'border-red-200 bg-red-50' : tone === 'warning' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white';
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{label}</span>
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
    </div>
  );
}
