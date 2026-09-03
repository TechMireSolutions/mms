import type { StoredPlatformUser } from '@mms/shared';
import {
  createArtifactId,
  deleteAuthArtifact,
  getAuthArtifact,
  putAuthArtifact,
  takeAuthArtifact,
} from '../auth/authArtifactService.js';
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpCode,
} from '../auth/authCookieService.js';
import { getStoredPlatformUserById } from './platformUserService.js';
import { dispatchPlatformOtp } from './platformOtpService.js';

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export interface PlatformTwoFactorChallengePayload {
  userId: string;
  codeHash: string;
  attempts: number;
}

/** True when platform login requires an OTP step (opt-in via env). */
export function isPlatformTwoFactorRequired(): boolean {
  return process.env.PLATFORM_REQUIRE_2FA === 'true';
}

/**
 * Creates an OTP challenge for a platform login and dispatches the code by email.
 * Returns the challenge id, or null if the code could not be delivered.
 */
export async function createPlatformTwoFactorChallenge(
  user: StoredPlatformUser,
): Promise<string | null> {
  const code = generateOtpCode();
  const challengeId = createArtifactId();

  await putAuthArtifact<PlatformTwoFactorChallengePayload>(
    'platform_two_factor_challenge',
    {
      userId: user.id,
      codeHash: hashOtpCode(code),
      attempts: 0,
    },
    CHALLENGE_TTL_MS,
    challengeId,
  );

  const dispatch = await dispatchPlatformOtp({
    email: user.email,
    code,
    subject: 'Your MMS platform verification code',
    bodyLines: ['Use this verification code to finish signing in to the MMS platform:'],
    ttlMinutes: CHALLENGE_TTL_MS / 60_000,
    logLabel: 'Platform 2FA code',
  });

  if (!dispatch.sent && process.env.NODE_ENV === 'production') {
    await takeAuthArtifact(challengeId, 'platform_two_factor_challenge');
    return null;
  }

  return challengeId;
}

/**
 * Regenerates the OTP for an existing platform 2FA challenge and re-dispatches it.
 * Resets the attempt counter. Returns ok=false when the challenge is missing/expired
 * or the code could not be delivered in production.
 */
export async function resendPlatformTwoFactorChallenge(
  challengeId: string,
): Promise<{ ok: boolean; devCode?: string }> {
  const entry = await getAuthArtifact<PlatformTwoFactorChallengePayload>(
    challengeId,
    'platform_two_factor_challenge',
  );
  if (!entry) return { ok: false };

  const user = await getStoredPlatformUserById(entry.payload.userId);
  if (!user || user.disabledAt) return { ok: false };

  const code = generateOtpCode();
  const updated: PlatformTwoFactorChallengePayload = {
    ...entry.payload,
    codeHash: hashOtpCode(code),
    attempts: 0,
  };
  await deleteAuthArtifact(challengeId);
  await putAuthArtifact('platform_two_factor_challenge', updated, CHALLENGE_TTL_MS, challengeId);

  const dispatch = await dispatchPlatformOtp({
    email: user.email,
    code,
    subject: 'Your MMS platform verification code',
    bodyLines: ['Use this verification code to finish signing in to the MMS platform:'],
    ttlMinutes: CHALLENGE_TTL_MS / 60_000,
    logLabel: 'Platform 2FA code',
  });

  if (!dispatch.sent && process.env.NODE_ENV === 'production') {
    await deleteAuthArtifact(challengeId);
    return { ok: false };
  }

  return { ok: true, devCode: dispatch.devCode };
}

/**
 * Verifies an OTP against a platform 2FA challenge. Consumes the challenge on
 * success; on repeated failures the challenge is invalidated.
 */
export async function verifyPlatformTwoFactorChallenge(
  challengeId: string,
  code: string,
): Promise<StoredPlatformUser | null> {
  const entry = await takeAuthArtifact<PlatformTwoFactorChallengePayload>(
    challengeId,
    'platform_two_factor_challenge',
  );
  if (!entry) return null;

  const normalizedCode = code.replace(/\s/g, '');
  if (!verifyOtpCode(normalizedCode, entry.payload.codeHash)) {
    const attempts = (entry.payload.attempts ?? 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      return null;
    }
    await putAuthArtifact<PlatformTwoFactorChallengePayload>(
      'platform_two_factor_challenge',
      { ...entry.payload, attempts },
      CHALLENGE_TTL_MS,
      challengeId,
    );
    return null;
  }

  const user = await getStoredPlatformUserById(entry.payload.userId);
  if (!user || user.disabledAt) return null;
  return user;
}
