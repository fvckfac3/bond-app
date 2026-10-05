import { createHash, randomBytes } from 'node:crypto';

/** 32 random bytes, base64url: the secret in an invitation. Only its hash is stored. */
export function generateInviteToken(): string {
  return randomBytes(32).toString('base64url');
}

/** sha256 hex, identical to encode(sha256(convert_to(token, 'UTF8')), 'hex') in Postgres. */
export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const email = input.trim().toLowerCase();
  return email.length <= 254 && EMAIL.test(email) ? email : null;
}
