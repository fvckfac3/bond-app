import { describe, expect, it } from 'vitest';
import { generateInviteToken, hashInviteToken, normalizeEmail } from './invite';

describe('invite tokens', () => {
  it('hashes exactly like Postgres encode(sha256(...), hex)', () => {
    // Same pair is asserted in supabase/tests/021_institutional_rls_test.sql.
    expect(hashInviteToken('bond-test-token')).toBe('d80a91f0c5f73c2ffdc35c74f6663c718d43eaa808302b721e6fb456f93a8694');
  });
  it('generates unique 256-bit tokens', () => {
    const a = generateInviteToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateInviteToken()).not.toBe(a);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Partner@Example.COM ')).toBe('partner@example.com');
  });
  it('rejects non-emails', () => {
    expect(normalizeEmail('nope')).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail('a b@example.com')).toBeNull();
  });
});
