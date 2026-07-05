import { computeHasanatCommandMetrics, type HasanatCommandMetricsSnapshot } from '@mms/shared';
import { loadBatches, loadDistributions, loadDenoms } from './hasanatService.js';

export async function loadHasanatCommandMetrics(): Promise<HasanatCommandMetricsSnapshot> {
  const batches = await loadBatches();
  const distributions = await loadDistributions();
  const denoms = await loadDenoms();
  return computeHasanatCommandMetrics(
    batches as Array<{ quantity?: number; remaining?: number }>,
    distributions as Array<{ status?: string; quantity?: number }>,
    denoms as Array<{ active?: boolean }>,
  );
}
