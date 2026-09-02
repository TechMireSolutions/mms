import { describe, expect, it, vi } from 'vitest';
import { createEnrollmentsUseCases } from '../enrollments/use-cases/enrollmentsUseCases.js';
import type { EnrollmentsRepository } from '../enrollments/repository/enrollmentsRepository.js';
import { runWithTenant } from '../lib/tenantContext.js';

function createFakeRepo(): EnrollmentsRepository {
  return {
    listEnrollmentsByWorkspace: vi.fn().mockResolvedValue([]),
    findEnrollmentById: vi.fn().mockResolvedValue(null),
    findEnrollmentsByIds: vi.fn().mockResolvedValue([]),
    saveEnrollment: vi.fn().mockResolvedValue(undefined),
    listEnrollmentsPage: vi.fn().mockResolvedValue({
      enrollments: [],
      total: 0,
      page: 1,
      limit: 12,
      hasMore: false,
    }),
    countEnrollmentsActive: vi.fn().mockResolvedValue(5),
    aggregateEnrollmentsCommandMetrics: vi.fn().mockResolvedValue({
      total: 5,
      confirmed: 3,
      pending: 1,
      cancelled: 0,
      completed: 1,
      revenue: 0,
      newThisPeriod: 2,
    }),
    aggregateEnrollmentsWidgetQueries: vi.fn().mockResolvedValue({}),
    loadEnrollmentsReportAggregates: vi.fn().mockResolvedValue({
      capacity: [],
      enrollmentTrends: [],
      todaysSessions: [],
    }),
  };
}

describe('enrollments use-cases (DI with fake repository)', () => {
  it('countEnrollments delegates to the injected repository with the active tenant', async () => {
    const repo = createFakeRepo();
    const useCases = createEnrollmentsUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.countEnrollments());

    expect(result).toBe(5);
    expect(repo.countEnrollmentsActive).toHaveBeenCalledWith('demo');
  });

  it('loadEnrollmentsPage delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createEnrollmentsUseCases(repo);

    const result = await runWithTenant('demo', () =>
      useCases.loadEnrollmentsPage({ page: 2, limit: 12 }),
    );

    expect(result).toEqual({ enrollments: [], total: 0, page: 1, limit: 12, hasMore: false });
    expect(repo.listEnrollmentsPage).toHaveBeenCalledWith('demo', { page: 2, limit: 12 });
  });

  it('loadEnrollmentsCommandMetrics delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createEnrollmentsUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadEnrollmentsCommandMetrics());

    expect(result.total).toBe(5);
    expect(repo.aggregateEnrollmentsCommandMetrics).toHaveBeenCalledWith('demo');
  });

  it('returns empty defaults when no tenant context is bound', async () => {
    const repo = createFakeRepo();
    const useCases = createEnrollmentsUseCases(repo);

    const count = await useCases.countEnrollments();
    const page = await useCases.loadEnrollmentsPage({ page: 1, limit: 12 });

    expect(count).toBe(0);
    expect(page).toEqual({ enrollments: [], total: 0, page: 1, limit: 12, hasMore: false });
    expect(repo.countEnrollmentsActive).not.toHaveBeenCalled();
    expect(repo.listEnrollmentsPage).not.toHaveBeenCalled();
  });
});
