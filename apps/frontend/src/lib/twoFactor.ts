import { apiJson } from './apiClient';

const CHALLENGE_KEY = 'mms_2fa_challenge';
const VERIFIED_KEY = 'mms_2fa_verified';

export function getPendingChallengeId(): string | null {
  return sessionStorage.getItem(CHALLENGE_KEY);
}

export function setPendingChallengeId(challengeId: string): void {
  sessionStorage.setItem(CHALLENGE_KEY, challengeId);
}

export function is2FAVerified(): boolean {
  return sessionStorage.getItem(VERIFIED_KEY) === '1';
}

export function mark2FAVerified(): void {
  sessionStorage.setItem(VERIFIED_KEY, '1');
  sessionStorage.removeItem(CHALLENGE_KEY);
}

export function clear2FAState(): void {
  sessionStorage.removeItem(CHALLENGE_KEY);
  sessionStorage.removeItem(VERIFIED_KEY);
}

export function is2FAPending(): boolean {
  return Boolean(getPendingChallengeId()) && !is2FAVerified();
}

export async function verify2FACode(challengeId: string, code: string): Promise<boolean> {
  try {
    await apiJson<{ user: unknown }>('/api/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ challengeId, code }),
    });
    mark2FAVerified();
    return true;
  } catch {
    return false;
  }
}

export async function resend2FACode(challengeId: string): Promise<boolean> {
  try {
    await apiJson('/api/auth/2fa/resend', {
      method: 'POST',
      body: JSON.stringify({ challengeId }),
    });
    return true;
  } catch {
    return false;
  }
}

/** @deprecated Server dispatches codes on login; kept for API compatibility. */
export function start2FAChallenge(): string {
  const existing = getPendingChallengeId();
  return existing ?? '';
}

/** @deprecated */
export async function dispatch2FACode(): Promise<void> {
  const challengeId = getPendingChallengeId();
  if (challengeId) {
    await resend2FACode(challengeId);
  }
}
