import type { SupabaseClient } from '@supabase/supabase-js';

export type Tier = 'private_practice' | 'clinical_group' | 'treatment_center' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';

export interface TierSchedule {
  label: string;
  /** USD per month, billed monthly. null = contract pricing. */
  monthlyPrice: number | null;
  /** USD per month, billed annually. null = contract pricing. */
  annualMonthlyPrice: number | null;
  /** Seats included. null = set per contract (clinics.base_seat_limit). */
  baseSeats: number | null;
  /** USD per extra seat per month. null = contract pricing. */
  extraSeatPrice: number | null;
}

// Must match the clinics_tier_base_seats CHECK in supabase/migrations/021.
export const TIERS: Record<Tier, TierSchedule> = {
  private_practice: { label: 'Private Practice', monthlyPrice: 49, annualMonthlyPrice: 39, baseSeats: 10, extraSeatPrice: 5 },
  clinical_group: { label: 'Clinical Group', monthlyPrice: 199, annualMonthlyPrice: 159, baseSeats: 50, extraSeatPrice: 4 },
  treatment_center: { label: 'Treatment Center', monthlyPrice: 499, annualMonthlyPrice: 399, baseSeats: 150, extraSeatPrice: 3 },
  enterprise: { label: 'Enterprise', monthlyPrice: null, annualMonthlyPrice: null, baseSeats: null, extraSeatPrice: null },
};

export const SEAT_ALERT_THRESHOLD = 0.9;

function assertSeats(n: number, name: string) {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
}

/** Effective seat limit. Enterprise needs its contract base (clinics.base_seat_limit). */
export function seatLimitFor(tier: Tier, extraSeats: number, contractBaseSeats?: number): number {
  assertSeats(extraSeats, 'extraSeats');
  const base = TIERS[tier].baseSeats ?? contractBaseSeats;
  if (base === undefined || base === null) {
    throw new RangeError('enterprise seat limit is set by contract');
  }
  assertSeats(base, 'baseSeats');
  return base + extraSeats;
}

/** Monthly charge in USD for a tier, cycle and purchased extra seats; null for enterprise. */
export function monthlyPriceFor(tier: Tier, cycle: BillingCycle, extraSeats: number): number | null {
  assertSeats(extraSeats, 'extraSeats');
  const t = TIERS[tier];
  const base = cycle === 'annual' ? t.annualMonthlyPrice : t.monthlyPrice;
  if (base === null || t.extraSeatPrice === null) {
    return null;
  }
  return base + extraSeats * t.extraSeatPrice;
}

export interface SeatUsage {
  used: number;
  limit: number;
  remaining: number;
  canAdd: boolean;
  /** At or above SEAT_ALERT_THRESHOLD of the limit. */
  nearLimit: boolean;
}

export function seatUsage(used: number, limit: number): SeatUsage {
  const remaining = Math.max(limit - used, 0);
  return {
    used,
    limit,
    remaining,
    canAdd: used < limit,
    nearLimit: limit > 0 && used / limit >= SEAT_ALERT_THRESHOLD,
  };
}

/**
 * Seats in use for a clinic: couples with status 'active' and activity in the last 30 days.
 * Counting is done only by the clinic_active_seat_count SQL function; the seat trigger on
 * clinic_couples is the real guard, so this is a pre-check for the UI.
 */
export async function checkActiveSeats(clinicId: string, supabase?: SupabaseClient): Promise<SeatUsage> {
  const client = supabase ?? (await import('./supabase/server')).createClient();
  const { data, error } = await client.rpc('clinic_active_seat_count', { p_clinic_id: clinicId }).single<{
    used: number;
    seat_limit: number;
  }>();
  if (error || !data) {
    throw new Error(`seat count failed: ${error?.message ?? 'no data'}`);
  }
  return seatUsage(data.used, data.seat_limit);
}
