import type { FastifyReply } from 'fastify';
import type { JWT } from '@fastify/jwt';
import type { PlatformUser } from '@mms/shared';
import { clearAuthCookies } from '../auth/authCookieService.js';
import { clearPlatformAccessCookie, setPlatformAccessCookie } from './platformCookieService.js';

const PLATFORM_ACCESS_TTL = '8h';

export type PlatformLoginFailure = 'invalid_credentials' | 'account_disabled';

export type PlatformLoginResult =
  | { ok: true; user: PlatformUser }
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
    },
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
  const {
    findPlatformUserByEmail,
    toPublicPlatformUser,
    verifyPlatformUserPassword,
  } = await import('./platformUserService.js');

  const stored = await findPlatformUserByEmail(email);
  if (!stored) {
    return { ok: false, type: 'invalid_credentials' };
  }

  const passwordOk = await verifyPlatformUserPassword(stored.id, password);
  if (!passwordOk) {
    return { ok: false, type: 'invalid_credentials' };
  }

  if (stored.disabledAt) {
    return { ok: false, type: 'account_disabled' };
  }

  const user = issuePlatformSession(
    toPublicPlatformUser(stored),
    jwtSigner,
    reply,
    stored.sessionVersion,
  );
  return { ok: true, user };
}

export function logoutPlatformUser(reply: FastifyReply): void {
  clearPlatformAccessCookie(reply);
  clearAuthCookies(reply);
}
