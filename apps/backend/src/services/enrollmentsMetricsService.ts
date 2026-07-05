import { computeEnrollmentsCommandMetrics, type EnrollmentsCommandMetricsSnapshot } from '@mms/shared';
import { loadEnrollments } from './enrollmentService.js';

export async function loadEnrollmentsCommandMetrics(): Promise<EnrollmentsCommandMetricsSnapshot> {
  const enrollments = await loadEnrollments();
  return computeEnrollmentsCommandMetrics(
    enrollments as Array<{ status?: string; finalFee?: number; enrolledDate?: string }>,
  );
}
