import { computeObligationsCommandMetrics, type ObligationsCommandMetricsSnapshot } from '@mms/shared';
import { fetchCollection } from './dbSyncService.js';

export async function loadObligationsCommandMetrics(): Promise<ObligationsCommandMetricsSnapshot> {
  const collectionsRaw = (await fetchCollection('obligation_collections')) ?? [];
  const typesRaw = (await fetchCollection('obligation_types')) ?? [];
  const collections = Array.isArray(collectionsRaw) ? collectionsRaw : [];
  const types = Array.isArray(typesRaw) ? typesRaw : [];
  return computeObligationsCommandMetrics(
    collections as Array<{ amount?: number; payment_mode?: string; received_date?: string }>,
    types.length,
  );
}
