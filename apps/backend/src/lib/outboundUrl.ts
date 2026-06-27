import { isIP } from 'node:net';

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === 'metadata.google.internal') return true;

  const ipVersion = isIP(host);
  if (ipVersion === 4) {
    const parts = host.split('.').map(Number);
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  if (ipVersion === 6) {
    return host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:');
  }
  return false;
}

export function safeExternalHttpUrl(raw: string, label = 'URL'): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${label} must be a valid HTTP(S) URL`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${label} must use HTTP or HTTPS`);
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new Error(`${label} host is not allowed`);
  }
  return parsed.toString().replace(/\/$/, '');
}

export function safeOptionalExternalHttpUrl(raw: string | undefined, label = 'URL'): string | undefined {
  const trimmed = raw?.trim();
  return trimmed ? safeExternalHttpUrl(trimmed, label) : undefined;
}

export const OUTBOUND_FETCH_TIMEOUT_MS = 15_000;
