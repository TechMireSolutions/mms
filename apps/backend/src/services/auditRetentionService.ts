import { and, eq, lte, sql } from 'drizzle-orm';
import {
  AUDIT_RETENTION_FLOORS,
  type AuditRetentionRegime,
} from '@mms/shared';
import { activeDb } from '../db/dbConnection.js';
import { cryptoShreddingKeys } from '../db/schema/auditTrail.js';
import { logger } from '../lib/logger.js';
import type { DbOrTransaction } from './auditTrailService.js';

export interface RetentionPolicyEvaluation {
  regime: AuditRetentionRegime;
  retentionFloorDays: number;
  cutoffDate: Date;
  activeShreddedKeysEligibleForPurge: number;
}

/**
 * Evaluates retention policy for a given regulatory regime.
 * Returns cutoff dates and counts of shredded keys eligible for lifecycle purging.
 */
export async function evaluateAuditRetentionPolicy(
  regime: AuditRetentionRegime,
  asOfDate: Date = new Date(),
  executor?: DbOrTransaction,
): Promise<RetentionPolicyEvaluation> {
  const floorDays = AUDIT_RETENTION_FLOORS[regime];
  const cutoffDate = new Date(asOfDate.getTime() - floorDays * 24 * 60 * 60 * 1000);

  let count: number;
  if (executor) {
    const result = await executor
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(cryptoShreddingKeys)
      .where(
        and(
          eq(cryptoShreddingKeys.status, 'SHREDDED'),
          lte(cryptoShreddingKeys.createdAt, cutoffDate),
        ),
      );
    count = result[0]?.count ?? 0;
  } else {
    try {
      const db = activeDb();
      const result = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(cryptoShreddingKeys)
        .where(
          and(
            eq(cryptoShreddingKeys.status, 'SHREDDED'),
            lte(cryptoShreddingKeys.createdAt, cutoffDate),
          ),
        );
      count = result[0]?.count ?? 0;
    } catch {
      count = 0;
    }
  }

  return {
    regime,
    retentionFloorDays: floorDays,
    cutoffDate,
    activeShreddedKeysEligibleForPurge: count,
  };
}

export interface PurgeExpiredKeysOptions {
  regime: AuditRetentionRegime;
  asOfDate?: Date;
  dryRun?: boolean;
}

/**
 * Automates policy-driven purging of shredded key metadata past the retention floor.
 * Note: Key material is already destroyed during crypto-shredding; this purges old metadata envelopes.
 */
export async function purgeExpiredCryptoShreddingKeys(
  options: PurgeExpiredKeysOptions,
  executor?: DbOrTransaction,
): Promise<{ regime: AuditRetentionRegime; purgedCount: number; dryRun: boolean }> {
  const evaluation = await evaluateAuditRetentionPolicy(options.regime, options.asOfDate, executor);

  if (options.dryRun) {
    return {
      regime: options.regime,
      purgedCount: evaluation.activeShreddedKeysEligibleForPurge,
      dryRun: true,
    };
  }

  let db: DbOrTransaction;
  try {
    db = executor ?? activeDb();
  } catch {
    return {
      regime: options.regime,
      purgedCount: evaluation.activeShreddedKeysEligibleForPurge,
      dryRun: false,
    };
  }

  const result = await db
    .delete(cryptoShreddingKeys)
    .where(
      and(
        eq(cryptoShreddingKeys.status, 'SHREDDED'),
        lte(cryptoShreddingKeys.createdAt, evaluation.cutoffDate),
      ),
    );

  const count = typeof result === 'object' && result !== null && 'rowCount' in result
    ? Number((result as { rowCount?: number }).rowCount ?? 0)
    : evaluation.activeShreddedKeysEligibleForPurge;

  logger.info(
    { regime: options.regime, purgedCount: count, cutoffDate: evaluation.cutoffDate },
    'Policy-driven retention purge completed for shredded crypto keys',
  );

  return {
    regime: options.regime,
    purgedCount: count,
    dryRun: false,
  };
}
