import type { FastifyReply, FastifyRequest } from 'fastify';
import { secureCookieBase } from '../../lib/cookieOptions.js';

export const PLATFORM_ACCESS_COOKIE = 'mms_platform_access';
const PLATFORM_ACCESS_TTL_SEC = 8 * 60 * 60;

export function attachPlatformTokenFromCookie(request: FastifyRequest): void {
  const cookies = request.cookies as Record<string, string | undefined> | undefined;
  const token = cookies?.[PLATFORM_ACCESS_COOKIE];
  if (token && !request.headers.authorization) {
    request.headers.authorization = `Bearer ${token}`;
  }
}

export function setPlatformAccessCookie(reply: FastifyReply, accessToken: string): void {
  reply.setCookie(PLATFORM_ACCESS_COOKIE, accessToken, {
    ...secureCookieBase(),
    maxAge: PLATFORM_ACCESS_TTL_SEC,
  });
}

export function clearPlatformAccessCookie(reply: FastifyReply): void {
  reply.clearCookie(PLATFORM_ACCESS_COOKIE, secureCookieBase());
}
