import { and, isNull, asc, inArray } from 'drizzle-orm';
import { activeDb } from '../../db/dbConnection.js';
import { outboxEvents } from '../../db/schema/outboxEvents.js';
import { redisGet, redisSet, redisDelPattern } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import type { SearchIndexAdapter } from '../adapters/searchIndexAdapter.js';
import type { SoftDeletedPayload, RestoredPayload } from '../../services/outboxEventService.js';

const BATCH_SIZE = 100;
/**
 * Redis key for tracking the last successfully processed version per entity.
 * Pattern: `mms:{tenantId}:search:version:{entityType}:{entityId}`
 */
function versionKey(tenantId: string, entityType: string, entityId: string): string {
  return `mms:${tenantId}:search:version:${entityType}:${entityId}`;
}

/**
 * Redis cache eviction pattern for all entity-type keys in a tenant.
 * Evicts list pages, single-record caches, and KPI aggregates.
 */
function cacheEvictPattern(tenantId: string, entityType: string): string {
  return `mms:${tenantId}:${entityType}:*`;
}

/**
 * Processes a bounded batch of unprocessed CDC outbox events.
 * Reads up to BATCH_SIZE rows, applies version guard, drives search index
 * mutations and Redis cache eviction, then marks each row processed.
 *
 * Idempotent: rows already marked `processed_at IS NOT NULL` are never
 * returned by the query (partial index).
 *
 * @param searchAdapter - Injectable search index adapter (real or stub).
 */
export async function processOutboxCdcBatch(
  searchAdapter: SearchIndexAdapter,
): Promise<{ processed: number; skipped: number }> {
  const db = activeDb();
  let processed = 0;
  let skipped = 0;

  // Select up to BATCH_SIZE unprocessed events, lock rows to avoid concurrent
  // worker collisions (SKIP LOCKED prevents blocking under contention).
  const rows = await db
    .select()
    .from(outboxEvents)
    .where(isNull(outboxEvents.processedAt))
    .orderBy(asc(outboxEvents.createdAt))
    .limit(BATCH_SIZE)
    .for('update', { skipLocked: true });

  if (rows.length === 0) return { processed, skipped };

  for (const row of rows) {
    const payload = row.payload as Record<string, unknown>;
    const incomingVersion = typeof payload['version'] === 'number'
      ? (payload['version'] as number)
      : 0;

    // Monotonic version guard — discard stale out-of-order events
    const vk = versionKey(row.workspaceSubdomain, row.entityType, row.entityId);
    const stored = await redisGet(vk);
    const existingVersion = stored !== null ? Number(stored) : 0;

    if (incomingVersion <= existingVersion) {
      logger.warn(
        {
          eventId: row.id,
          eventType: row.eventType,
          entityType: row.entityType,
          entityId: row.entityId,
          incomingVersion,
          existingVersion,
        },
        '[OutboxCdc] Dropping stale/out-of-order event — version guard',
      );
      // Mark processed so it is not retried (stale = permanently stale)
      await db
        .update(outboxEvents)
        .set({ processedAt: new Date() })
        .where(and(inArray(outboxEvents.id, [row.id])));
      skipped += 1;
      continue;
    }

    try {
      if (row.eventType === 'entity.soft_deleted') {
        const p = payload as unknown as SoftDeletedPayload;
        // 1. Tombstone search index
        await searchAdapter.deleteDocument(p.entityType, p.entityId);
        // 2. Evict all tenant entity cache keys
        await redisDelPattern(cacheEvictPattern(row.workspaceSubdomain, p.entityType));

      } else if (row.eventType === 'entity.restored') {
        const p = payload as unknown as RestoredPayload;
        // 1. Re-index document (snapshot payload used if available)
        await searchAdapter.indexDocument(p.entityType, p.entityId, payload);
        // 2. Evict stale cache entries so next read is fresh
        await redisDelPattern(cacheEvictPattern(row.workspaceSubdomain, p.entityType));

      } else {
        // entity.hard_purge or unknown — just evict cache
        await redisDelPattern(cacheEvictPattern(row.workspaceSubdomain, row.entityType));
      }

      // Advance the monotonic version tracker for this entity
      await redisSet(vk, String(incomingVersion));

      // Mark the outbox row as processed
      await db
        .update(outboxEvents)
        .set({ processedAt: new Date() })
        .where(and(inArray(outboxEvents.id, [row.id])));

      processed += 1;
    } catch (err) {
      logger.error(
        { err, eventId: row.id, eventType: row.eventType, entityId: row.entityId },
        '[OutboxCdc] Failed to process CDC event — will retry on next poll',
      );
      // Do NOT mark as processed; leave for next poll cycle
    }
  }

  return { processed, skipped };
}
