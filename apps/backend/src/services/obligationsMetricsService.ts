import { computeObligationsCommandMetrics, type ObligationsCommandMetricsSnapshot } from '@mms/shared';
import { loadObligationCollections, loadObligationTypes } from './obligationService.js';

export async function loadObligationsCommandMetrics(): Promise<ObligationsCommandMetricsSnapshot> {
  const collections = await loadObligationCollections();
  const types = await loadObligationTypes();
  return computeObligationsCommandMetrics(
    collections as Array<{ amount?: number; payment_mode?: string; received_date?: string }>,
    types.length,
  );
}
