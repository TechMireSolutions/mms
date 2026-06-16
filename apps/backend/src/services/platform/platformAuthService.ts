import type { FastifyReply } from 'fastify';
import type { JWT } from '@fastify/jwt';
import type { PlatformUser } from '@mms/shared';
import { validatePlatformCredentials } from './platformUserService.js';
import { clearAuthCookies } from '../auth/authCookieService.js';
import { clearPlatformAccessCookie, setPlatformAccessCookie } from './platformCookieService.js';

const PLATFORM_ACCESS_TTL = '8h';

export async function loginPlatformUser(
  email: string,
  password: string,
  jwtSigner: JWT,
  reply: FastifyReply,
): Promise<PlatformUser | null> {
  const user = await validatePlatformCredentials(email, password);
  if (!user) return null;

  clearAuthCookies(reply);

  const accessToken = jwtSigner.sign(
    {
      ...user,
      role: 'platform_super',
      tokenType: 'platform_access',
    },
    { expiresIn: PLATFORM_ACCESS_TTL },
  );
  setPlatformAccessCookie(reply, accessToken);
  return user;
}

export function logoutPlatformUser(reply: FastifyReply): void {
  clearPlatformAccessCookie(reply);
}
