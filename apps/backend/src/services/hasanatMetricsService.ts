import { computeHasanatCommandMetrics, type HasanatCommandMetricsSnapshot } from '@mms/shared';
import { fetchCollection } from './dbSyncService.js';

export async function loadHasanatCommandMetrics(): Promise<HasanatCommandMetricsSnapshot> {
  const batchesRaw = (await fetchCollection('hasanat_batches')) ?? [];
  const distributionsRaw = (await fetchCollection('hasanat_distributions')) ?? [];
  const denomsRaw = (await fetchCollection('hasanat_denoms')) ?? [];
  const batches = Array.isArray(batchesRaw) ? batchesRaw : [];
  const distributions = Array.isArray(distributionsRaw) ? distributionsRaw : [];
  const denoms = Array.isArray(denomsRaw) ? denomsRaw : [];
  return computeHasanatCommandMetrics(
    batches as Array<{ quantity?: number; remaining?: number }>,
    distributions as Array<{ status?: string; quantity?: number }>,
    denoms as Array<{ active?: boolean }>,
  );
}
