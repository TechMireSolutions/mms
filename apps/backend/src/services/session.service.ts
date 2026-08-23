import { redisDel, redisExists, redisGet, redisSet } from '../lib/redis.js';

const REVOKED_TOKEN_PREFIX = 'session:revoked:';
const USER_REVOKED_AT_PREFIX = 'user:revoked_at:';
const TENANT_BLOCKED_PREFIX = 'tenant:blocked:';

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

/**
 * Revokes a specific JWT token by its unique JWT ID (jti).
 */
export async function revokeToken(
  jti: string,
  ttlSeconds: number = DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
): Promise<void> {
  if (!jti) return;
  const key = `${REVOKED_TOKEN_PREFIX}${jti}`;
  await redisSet(key, 'revoked', ttlSeconds);
}

/**
 * Checks if a JWT token has been revoked by its JWT ID (jti).
 */
export async function isTokenRevoked(jti?: string): Promise<boolean> {
  if (!jti) return false;
  const key = `${REVOKED_TOKEN_PREFIX}${jti}`;
  return redisExists(key);
}

/**
 * Revokes all sessions for a user by recording a revocation timestamp.
 */
export async function revokeAllUserSessions(
  userId: string,
  ttlSeconds: number = 7 * 24 * 60 * 60, // 7 days (max refresh token lifetime)
): Promise<void> {
  if (!userId) return;
  const key = `${USER_REVOKED_AT_PREFIX}${userId}`;
  const now = Date.now().toString();
  await redisSet(key, now, ttlSeconds);
}

/**
 * Checks if a token issued at `issuedAtMs` has been invalidated by a whole-user session revocation.
 */
export async function isUserSessionRevoked(
  userId?: string,
  issuedAtMs?: number,
): Promise<boolean> {
  if (!userId || !issuedAtMs) return false;
  const key = `${USER_REVOKED_AT_PREFIX}${userId}`;
  const revokedAtStr = await redisGet(key);
  if (!revokedAtStr) return false;
  const revokedAt = Number.parseInt(revokedAtStr, 10);
  return !Number.isNaN(revokedAt) && issuedAtMs < revokedAt;
}

/**
 * Halts all in-flight requests immediately for a tenant workspace.
 */
export async function blockTenant(tenantId: string): Promise<void> {
  if (!tenantId) return;
  const key = `${TENANT_BLOCKED_PREFIX}${tenantId.toLowerCase()}`;
  await redisSet(key, 'blocked');
}

/**
 * Restores tenant workspace access.
 */
export async function unblockTenant(tenantId: string): Promise<void> {
  if (!tenantId) return;
  const key = `${TENANT_BLOCKED_PREFIX}${tenantId.toLowerCase()}`;
  await redisDel(key);
}

/**
 * Checks if a tenant workspace is currently blocked/suspended.
 */
export async function isTenantBlocked(tenantId?: string): Promise<boolean> {
  if (!tenantId) return false;
  const key = `${TENANT_BLOCKED_PREFIX}${tenantId.toLowerCase()}`;
  return redisExists(key);
}
