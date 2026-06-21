import { computeExaminationsCommandMetrics, type ExaminationsCommandMetricsSnapshot } from '@mms/shared';
import { fetchCollection } from './dbSyncService.js';

export async function loadExaminationsCommandMetrics(): Promise<ExaminationsCommandMetricsSnapshot> {
  const examsRaw = (await fetchCollection('exams')) ?? [];
  const resultsRaw = (await fetchCollection('exam_results')) ?? [];
  const exams = Array.isArray(examsRaw) ? examsRaw : [];
  const results = Array.isArray(resultsRaw) ? resultsRaw : [];
  return computeExaminationsCommandMetrics(
    exams as Array<{ status?: string }>,
    results as Array<{ examId?: string }>,
  );
}
