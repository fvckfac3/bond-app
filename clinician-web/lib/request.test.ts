import { describe, expect, it } from 'vitest';
import { clientIpFrom } from './request';

const h = (entries: Record<string, string>) => new Headers(entries);

describe('clientIpFrom', () => {
  it('takes the first x-forwarded-for entry', () => {
    expect(clientIpFrom(h({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7');
  });
  it('falls back to x-real-ip', () => {
    expect(clientIpFrom(h({ 'x-real-ip': '2001:db8::1' }))).toBe('2001:db8::1');
  });
  it('returns null for anything that is not an IP', () => {
    expect(clientIpFrom(h({ 'x-forwarded-for': 'unknown' }))).toBeNull();
    expect(clientIpFrom(h({ 'x-forwarded-for': '999.1.1.1' }))).toBeNull();
    expect(clientIpFrom(h({}))).toBeNull();
  });
});
