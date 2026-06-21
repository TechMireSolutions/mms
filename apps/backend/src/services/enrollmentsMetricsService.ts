import { computeEnrollmentsCommandMetrics, type EnrollmentsCommandMetricsSnapshot } from '@mms/shared';
import { fetchCollection } from './dbSyncService.js';

export async function loadEnrollmentsCommandMetrics(): Promise<EnrollmentsCommandMetricsSnapshot> {
  const raw = (await fetchCollection('enrollments')) ?? [];
  const enrollments = Array.isArray(raw) ? raw : [];
  return computeEnrollmentsCommandMetrics(
    enrollments as Array<{ status?: string; finalFee?: number; enrolledDate?: string }>,
  );
}
