import type { FastifyReply } from 'fastify';
import type { JWT } from '@fastify/jwt';
import type { PlatformUser, PlatformUserProfile } from '@mms/shared';
import { verifyPassword } from '../auth/passwordService.js';
import { clearAuthCookies } from '../auth/authCookieService.js';
import {
  findPlatformUserByEmail,
  toPlatformUserProfile,
  toPublicPlatformUser,
} from './platformUserService.js';
import { clearPlatformAccessCookie, setPlatformAccessCookie } from './platformCookieService.js';

const PLATFORM_ACCESS_TTL = '8h';

/** Minimal JWT claims for platform access cookies. */
export interface PlatformAccessTokenPayload {
  id: string;
  tokenType: 'platform_access';
  sessionVersion?: number;
}

export type PlatformLoginFailure = 'invalid_credentials' | 'account_disabled';

export type PlatformLoginResult =
  | { ok: true; user: PlatformUserProfile }
  | { ok: false; type: PlatformLoginFailure };

export function issuePlatformSession(
  user: PlatformUser,
  jwtSigner: JWT,
  reply: FastifyReply,
  sessionVersion = 0,
): PlatformUser {
  clearAuthCookies(reply);

  // Minimal claims only — role/permissions reload from DB on each authenticatePlatform.
  const accessToken = jwtSigner.sign(
    {
      id: user.id,
      tokenType: 'platform_access',
      sessionVersion,
    } satisfies PlatformAccessTokenPayload,
    { expiresIn: PLATFORM_ACCESS_TTL },
  );
  setPlatformAccessCookie(reply, accessToken);
  return user;
}

export async function loginPlatformUser(
  email: string,
  password: string,
  jwtSigner: JWT,
  reply: FastifyReply,
): Promise<PlatformLoginResult> {
  const stored = await findPlatformUserByEmail(email);
  if (!stored) {
    return { ok: false, type: 'invalid_credentials' };
  }

  const passwordOk = await verifyPassword(password, stored.passwordHash);
  if (!passwordOk) {
    return { ok: false, type: 'invalid_credentials' };
  }

  if (stored.disabledAt) {
    return { ok: false, type: 'account_disabled' };
  }

  issuePlatformSession(toPublicPlatformUser(stored), jwtSigner, reply, stored.sessionVersion);
  return { ok: true, user: toPlatformUserProfile(stored) };
}

export function logoutPlatformUser(reply: FastifyReply): void {
  clearPlatformAccessCookie(reply);
  clearAuthCookies(reply);
}
