import { activeDb } from '../db/dbConnection.js';
import { workspaces } from '../db/schema/platform.js';
import {
  verifyTenantAuditChain,
  computeAndPublishMerkleCheckpoint,
} from './auditVerificationService.js';

const DEFAULT_VERIFICATION_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface AuditVerificationSchedulerOptions {
  intervalMs?: number;
  runImmediate?: boolean;
}

/**
 * Section 3 & 6: Automated Cryptographic Verification Scheduler.
 * Periodically verifies shard chains for all active workspaces, alerts on tampering,
 * breaks or sequence gaps, and rolls up latest shard heads into Merkle root checkpoints.
 */
export function startAuditVerificationScheduler(
  log: { info: (obj: unknown, msg?: string) => void; error: (obj: unknown, msg?: string) => void; warn: (obj: unknown, msg?: string) => void },
  options?: AuditVerificationSchedulerOptions,
): () => void {
  const intervalMs = options?.intervalMs ?? DEFAULT_VERIFICATION_INTERVAL_MS;

  const tick = async (): Promise<void> => {
    try {
      const db = activeDb();
      const tenants = await db
        .select({ subdomain: workspaces.subdomain })
        .from(workspaces);

      // Verify all tenant shards concurrently instead of serially — prevents
      // blocking the event loop when tenants > 1 (mms-performance §2).
      const results = await Promise.allSettled(
        tenants.map((tenant) => verifyTenantAuditChain(tenant.subdomain)),
      );

      for (const result of results) {
        if (result.status === 'rejected') {
          log.warn({ err: result.reason instanceof Error ? result.reason.message : String(result.reason) }, 'Audit chain verification failed for a tenant shard');
          continue;
        }
        const { value } = result;
        if (value.status !== 'VERIFIED') {
          log.error(
            {
              workspaceSubdomain: value.workspaceSubdomain,
              status: value.status,
              discrepanciesCount: value.discrepancies.length,
              discrepancies: value.discrepancies,
            },
            'CRITICAL: Background audit trail verification detected integrity compromise!',
          );
        }
      }

      // Rollup shard heads into Merkle root
      const checkpoint = await computeAndPublishMerkleCheckpoint();
      log.info(
        {
          merkleCheckpointId: checkpoint.id,
          rootHash: checkpoint.rootHash,
          shardCount: checkpoint.shardCount,
        },
        'Merkle transparency root published by scheduled verifier',
      );
    } catch (error) {
      log.warn({ err: error instanceof Error ? error.message : String(error) }, 'Audit verification scheduler run failed');
    }
  };

  if (options?.runImmediate) {
    void tick();
  }

  const timer = setInterval(() => {
    void tick();
  }, intervalMs);
  timer.unref?.();

  log.info({ intervalMs }, 'Audit verification & Merkle root scheduler started');

  return () => {
    clearInterval(timer);
  };
}
