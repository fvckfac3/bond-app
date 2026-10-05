import { describe, expect, it } from 'vitest';
import { checkActiveSeats, monthlyPriceFor, seatLimitFor, seatUsage, TIERS } from './institutional';

describe('TIERS', () => {
  it('matches the institutional schedule', () => {
    expect(TIERS.private_practice).toMatchObject({ monthlyPrice: 49, annualMonthlyPrice: 39, baseSeats: 10, extraSeatPrice: 5 });
    expect(TIERS.clinical_group).toMatchObject({ monthlyPrice: 199, annualMonthlyPrice: 159, baseSeats: 50, extraSeatPrice: 4 });
    expect(TIERS.treatment_center).toMatchObject({ monthlyPrice: 499, annualMonthlyPrice: 399, baseSeats: 150, extraSeatPrice: 3 });
    expect(TIERS.enterprise).toMatchObject({ monthlyPrice: null, baseSeats: null });
  });
});

describe('seatLimitFor', () => {
  it('adds purchased extra seats to the tier base', () => {
    expect(seatLimitFor('private_practice', 0)).toBe(10);
    expect(seatLimitFor('clinical_group', 5)).toBe(55);
    expect(seatLimitFor('treatment_center', 0)).toBe(150);
  });
  it('needs a contract base for enterprise', () => {
    expect(() => seatLimitFor('enterprise', 0)).toThrow(RangeError);
    expect(seatLimitFor('enterprise', 10, 400)).toBe(410);
  });
  it('rejects negative or fractional seats', () => {
    expect(() => seatLimitFor('private_practice', -1)).toThrow(RangeError);
    expect(() => seatLimitFor('private_practice', 1.5)).toThrow(RangeError);
  });
});

describe('monthlyPriceFor', () => {
  it('prices monthly and annual billing with extra seats', () => {
    expect(monthlyPriceFor('private_practice', 'monthly', 0)).toBe(49);
    expect(monthlyPriceFor('private_practice', 'annual', 0)).toBe(39);
    expect(monthlyPriceFor('private_practice', 'monthly', 3)).toBe(64);
    expect(monthlyPriceFor('clinical_group', 'annual', 10)).toBe(199);
    expect(monthlyPriceFor('treatment_center', 'monthly', 2)).toBe(505);
  });
  it('returns null for enterprise contract pricing', () => {
    expect(monthlyPriceFor('enterprise', 'annual', 0)).toBeNull();
  });
});

describe('seatUsage', () => {
  it('allows adding below the limit', () => {
    expect(seatUsage(9, 10)).toEqual({ used: 9, limit: 10, remaining: 1, canAdd: true, nearLimit: true });
  });
  it('blocks at and above the limit', () => {
    expect(seatUsage(10, 10)).toMatchObject({ canAdd: false, remaining: 0 });
    expect(seatUsage(12, 10)).toMatchObject({ canAdd: false, remaining: 0 });
  });
  it('flags near-limit at 90%', () => {
    expect(seatUsage(44, 50).nearLimit).toBe(false);
    expect(seatUsage(45, 50).nearLimit).toBe(true);
  });
});

describe('checkActiveSeats', () => {
  function fakeClient(result: { data: unknown; error: unknown }) {
    const calls: unknown[] = [];
    const client = {
      rpc: (fn: string, args: unknown) => {
        calls.push([fn, args]);
        return { single: async () => result };
      },
    };
    return { client: client as never, calls };
  }

  it('reads the count from the SQL function', async () => {
    const { client, calls } = fakeClient({ data: { used: 38, seat_limit: 50 }, error: null });
    await expect(checkActiveSeats('clinic-1', client)).resolves.toMatchObject({ used: 38, limit: 50, canAdd: true, remaining: 12 });
    expect(calls).toEqual([['clinic_active_seat_count', { p_clinic_id: 'clinic-1' }]]);
  });
  it('throws when the count cannot be read', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'not_clinic_member' } });
    await expect(checkActiveSeats('clinic-1', client)).rejects.toThrow('not_clinic_member');
  });
});
