import type { SeatUsage } from '@/lib/institutional';

export function SeatUsageBar({ usage }: { usage: SeatUsage }) {
  const pct = usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 100;
  const color = !usage.canAdd ? 'bg-red-600' : usage.nearLimit ? 'bg-amber-500' : 'bg-emerald-600';
  return (
    <div className="w-full">
      <div className="mb-1 text-xs text-slate-600">
        {usage.used}/{usage.limit} active seats used
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={usage.limit}
        aria-valuenow={usage.used}
        aria-label="Active seat usage"
      >
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
