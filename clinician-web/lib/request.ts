const IPV4 = /^(\d{1,3})(\.\d{1,3}){3}$/;
const IPV6 = /^[0-9a-f:.]+$/i;

function validIp(value: string): string | null {
  const v = value.trim();
  if (IPV4.test(v) && v.split('.').every((p) => Number(p) <= 255)) return v;
  if (v.includes(':') && IPV6.test(v)) return v;
  return null;
}

/**
 * Client IP from proxy headers: the first x-forwarded-for entry, else x-real-ip. Returns null
 * for anything that isn't an IP so the audit insert (an INET column) never fails on it.
 */
export function clientIpFrom(headers: Pick<Headers, 'get'>): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = validIp(forwarded.split(',')[0] ?? '');
    if (ip) return ip;
  }
  const real = headers.get('x-real-ip');
  return real ? validIp(real) : null;
}
