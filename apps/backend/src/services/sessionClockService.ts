import { redisDel, redisGet, redisSet } from '../lib/redis.js';
import { revokeToken } from './session.service.js';

const SESSION_ACTIVITY_PREFIX = 'session:idle:';

/**
 * In-process touch throttle: avoids a Redis write on every authenticated request.
 * Reads still hit Redis, so idle enforcement stays correct/cluster-wide; only the
 * write frequency is reduced.
 */
const touchThrottle = new Map<string, number>();
const TOUCH_THROTTLE_MS = 60_000;

interface SessionClockRecord {
  /** last-activity epoch ms. */
  a: number;
  /** session started-at epoch ms (for the absolute lifetime cap). */
  s: number;
}

function activityKey(scope: string): string {
  return `${SESSION_ACTIVITY_PREFIX}${scope}`;
}

async function readClock(scope: string): Promise<SessionClockRecord | null> {
  const raw = await redisGet(activityKey(scope));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionClockRecord;
    if (Number.isFinite(parsed.a) && Number.isFinite(parsed.s)) return parsed;
    const legacyTs = Number.parseInt(raw, 10);
    return Number.isNaN(legacyTs) ? null : { a: legacyTs, s: legacyTs };
  } catch {
    return null;
  }
}

/** Canonical idle-clock scope for a tenant workspace user. */
export function tenantSessionScope(subdomain: string, userId: string): string {
  return `tn:${subdomain.trim().toLowerCase()}:${userId}`;
}

/** Canonical idle-clock scope for a platform operator. */
export function platformSessionScope(userId: string): string {
  return `plat:${userId}`;
}

/** Records `now` as the last-activity time, preserving the session start. */
export async function touchSession(
  scope: string,
  idleMs: number,
  force = false,
): Promise<void> {
  if (!scope) return;
  const now = Date.now();
  const last = touchThrottle.get(scope);
  if (!force && last !== undefined && now - last < TOUCH_THROTTLE_MS) return;
  touchThrottle.set(scope, now);

  const existing = await readClock(scope);
  const record: SessionClockRecord = {
    a: now,
    s: existing?.s ?? now, // first activity establishes the session start
  };
  const ttlSeconds = Math.max(60, Math.ceil(idleMs / 1000));
  await redisSet(activityKey(scope), JSON.stringify(record), ttlSeconds);
}

/** Returns the last-activity timestamp (ms epoch), or null if never set. */
export async function sessionLastActivityMs(scope: string): Promise<number | null> {
  const record = await readClock(scope);
  return record?.a ?? null;
}

/** Returns the session started-at timestamp (ms epoch), or null if never set. */
export async function sessionStartedAtMs(scope: string): Promise<number | null> {
  const record = await readClock(scope);
  return record?.s ?? null;
}

/**
 * True when the session has been idle for >= `idleMs`. When no record exists
 * (e.g. a mid-flight session), returns false so the access-token TTL remains the
 * backstop rather than spuriously expiring an active session.
 */
export async function isSessionIdleExpired(scope: string, idleMs: number): Promise<boolean> {
  const last = await sessionLastActivityMs(scope);
  if (last === null) return false;
  return Date.now() - last >= idleMs;
}

/**
 * True when the session has exceeded its absolute maximum lifetime. Always false
 * when `absoluteMs` is null/0 or the session start is unknown.
 */
export async function isSessionAbsoluteExpired(
  scope: string,
  absoluteMs?: number | null,
): Promise<boolean> {
  if (!absoluteMs || absoluteMs <= 0) return false;
  const started = await sessionStartedAtMs(scope);
  if (started === null) return false;
  return Date.now() - started >= absoluteMs;
}

/** Clears the idle clock and revokes the underlying access token (jti). */
export async function revokeSession(scope: string, jti?: string): Promise<void> {
  touchThrottle.delete(scope);
  await redisDel(activityKey(scope));
  if (jti) await revokeToken(jti);
}

/** Test helper — clears the in-process throttle map. */
export function clearSessionClockThrottleForTests(): void {
  touchThrottle.clear();
}
