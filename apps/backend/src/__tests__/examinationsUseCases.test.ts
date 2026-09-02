import { describe, expect, it, vi } from 'vitest';
import { createExaminationsUseCases } from '../examinations/use-cases/examinationsUseCases.js';
import type { ExaminationsRepository } from '../examinations/repository/examinationsRepository.js';
import { runWithTenant } from '../lib/tenantContext.js';

function createFakeRepo(): ExaminationsRepository {
  return {
    listExamsByWorkspace: vi.fn().mockResolvedValue([]),
    findExamById: vi.fn().mockResolvedValue(null),
    saveExam: vi.fn().mockResolvedValue(undefined),
    bulkSaveExams: vi.fn().mockResolvedValue(undefined),
    replaceExamsForWorkspace: vi.fn().mockResolvedValue(undefined),
    listExamsPage: vi.fn().mockResolvedValue({
      exams: [],
      total: 0,
      page: 1,
      limit: 12,
      hasMore: false,
    }),
    listExamResultsByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveExamResults: vi.fn().mockResolvedValue(undefined),
    replaceExamResultsForWorkspace: vi.fn().mockResolvedValue(undefined),
    aggregateExaminationsCommandMetrics: vi.fn().mockResolvedValue({
      total: 3,
      upcoming: 1,
      ongoing: 1,
      completed: 1,
      scheduled: 0,
      cancelled: 0,
      totalResults: 2,
      examsWithResults: 1,
      passRate: 80,
    }),
    aggregateExaminationsWidgetQueries: vi.fn().mockResolvedValue({}),
    loadExaminationsReportAggregates: vi.fn().mockResolvedValue({}),
  };
}

describe('examinations use-cases (DI with fake repository)', () => {
  it('loadExamsPage delegates to the injected repository with the active tenant', async () => {
    const repo = createFakeRepo();
    const useCases = createExaminationsUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadExamsPage({ page: 2, limit: 12 }));

    expect(result).toEqual({ exams: [], total: 0, page: 1, limit: 12, hasMore: false });
    expect(repo.listExamsPage).toHaveBeenCalledWith('demo', { page: 2, limit: 12 });
  });

  it('loadExaminationsCommandMetrics delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createExaminationsUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadExaminationsCommandMetrics());

    expect(result.total).toBe(3);
    expect(repo.aggregateExaminationsCommandMetrics).toHaveBeenCalledWith('demo');
  });

  it('returns empty defaults when no tenant context is bound', async () => {
    const repo = createFakeRepo();
    const useCases = createExaminationsUseCases(repo);

    const page = await useCases.loadExamsPage({ page: 1, limit: 12 });
    const metrics = await useCases.loadExaminationsCommandMetrics();

    expect(page).toEqual({ exams: [], total: 0, page: 1, limit: 12, hasMore: false });
    expect(metrics.total).toBe(0);
    expect(repo.listExamsPage).not.toHaveBeenCalled();
    expect(repo.aggregateExaminationsCommandMetrics).not.toHaveBeenCalled();
  });
});
