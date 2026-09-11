/**
 * Unified soft-delete lifecycle record builders and timestamp utilities.
 */

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Produces a restored copy of an archived record, clearing soft-delete metadata
 * and stamping restoredAt, restoredBy, and updatedAt.
 */
export function buildRestoredRecord<T extends Record<string, unknown>>(
  existing: T,
  userId?: string,
): T {
  const now = nowIso();
  return {
    ...existing,
    deletedAt: undefined,
    deletedBy: undefined,
    deletionReason: undefined,
    restoredAt: now,
    restoredBy: userId,
    updatedAt: now,
  };
}
