import { computeExaminationsCommandMetrics, type ExaminationsCommandMetricsSnapshot } from '@mms/shared';
import { loadExams, loadExamResults } from './examinationService.js';

export async function loadExaminationsCommandMetrics(): Promise<ExaminationsCommandMetricsSnapshot> {
  const exams = await loadExams();
  const results = await loadExamResults();
  return computeExaminationsCommandMetrics(
    exams as Array<{ status?: string }>,
    results as Array<{ examId?: string }>,
  );
}
