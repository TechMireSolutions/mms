import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { User } from '@mms/shared';
import { secureCookieBase } from '../../lib/cookieOptions.js';

const ACCESS_COOKIE = 'mms_access';
const REFRESH_COOKIE = 'mms_refresh';

const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;

export interface JwtUserClaims extends User {
  twoFactorVerified: boolean;
  tokenType: 'access' | 'refresh';
  jti?: string;
}

export function extractBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7).trim() || null;
  }
  const cookies = request.cookies as Record<string, string | undefined> | undefined;
  return cookies?.[ACCESS_COOKIE] ?? null;
}

export function attachAccessTokenFromCookie(request: FastifyRequest): void {
  const token = extractBearerToken(request);
  if (token && !request.headers.authorization) {
    request.headers.authorization = `Bearer ${token}`;
  }
}

export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
): void {
  const base = secureCookieBase();
  reply.setCookie(ACCESS_COOKIE, accessToken, { ...base, maxAge: ACCESS_TTL_SEC });
  reply.setCookie(REFRESH_COOKIE, refreshToken, { ...base, maxAge: REFRESH_TTL_SEC });
}

export function clearAuthCookies(reply: FastifyReply): void {
  const base = secureCookieBase();
  reply.clearCookie(ACCESS_COOKIE, base);
  reply.clearCookie(REFRESH_COOKIE, base);
}

export function hashOtpCode(code: string): string {
  const secret = process.env.JWT_SECRET ?? 'dev-insecure';
  return createHmac('sha256', secret).update(code).digest('hex');
}

export function verifyOtpCode(code: string, hash: string): boolean {
  const computed = hashOtpCode(code);
  try {
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 1_000_000));
}

export function hashRefreshToken(token: string): string {
  const pepper = process.env.JWT_SECRET ?? 'dev-insecure';
  return scryptSync(token, pepper, 32).toString('hex');
}

export function createRefreshTokenValue(): string {
  return randomBytes(32).toString('hex');
}

export { ACCESS_COOKIE, REFRESH_COOKIE, ACCESS_TTL_SEC, REFRESH_TTL_SEC };
