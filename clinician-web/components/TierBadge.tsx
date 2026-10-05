import { TIERS, type Tier } from '@/lib/institutional';

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className="inline-flex items-center rounded-full bg-bond-100 px-2.5 py-0.5 text-xs font-medium text-bond-700">
      {TIERS[tier].label}
    </span>
  );
}
