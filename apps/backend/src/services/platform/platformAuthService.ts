import type { FastifyReply } from 'fastify';
import type { JWT } from '@fastify/jwt';
import type { PlatformUser } from '@mms/shared';
import { clearAuthCookies } from '../auth/authCookieService.js';
import { clearPlatformAccessCookie, setPlatformAccessCookie } from './platformCookieService.js';

const PLATFORM_ACCESS_TTL = '8h';

export function issuePlatformSession(
  user: PlatformUser,
  jwtSigner: JWT,
  reply: FastifyReply,
  sessionVersion = 0,
): PlatformUser {
  clearAuthCookies(reply);

  const accessToken = jwtSigner.sign(
    {
      ...user,
      role: user.role,
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
): Promise<PlatformUser | null> {
  const { findPlatformUserByEmail, validatePlatformCredentials } =
    await import('./platformUserService.js');
  const stored = await findPlatformUserByEmail(email);
  if (!stored) return null;
  const user = await validatePlatformCredentials(email, password);
  if (!user) return null;
  return issuePlatformSession(user, jwtSigner, reply, stored.sessionVersion);
}

export function logoutPlatformUser(reply: FastifyReply): void {
  clearPlatformAccessCookie(reply);
  clearAuthCookies(reply);
}
