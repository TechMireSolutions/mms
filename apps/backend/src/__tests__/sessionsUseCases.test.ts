import { describe, expect, it, vi } from 'vitest';
import { createSessionsUseCases } from '../sessions/use-cases/sessionsUseCases.js';
import type { SessionsRepository } from '../sessions/repository/sessionsRepository.js';
import { runWithTenant } from '../lib/tenantContext.js';

function createFakeRepo(): SessionsRepository {
  return {
    listSessionsByWorkspace: vi.fn().mockResolvedValue([]),
    findSessionById: vi.fn().mockResolvedValue(null),
    findSessionsByIds: vi.fn().mockResolvedValue([]),
    saveSession: vi.fn().mockResolvedValue(undefined),
    listSessionsPage: vi.fn().mockResolvedValue({
      sessions: [],
      total: 0,
      page: 1,
      limit: 12,
      hasMore: false,
    }),
    countSessionsActive: vi.fn().mockResolvedValue(3),
    aggregateSessionsCommandMetrics: vi.fn().mockResolvedValue({
      total: 3,
      active: 2,
      upcoming: 1,
      completed: 0,
      cancelled: 0,
      totalEnrolled: 0,
      totalCapacity: 0,
      totalClasses: 0,
      sessionsThisWeek: 0,
      sessionsLastWeek: 0,
    }),
    bulkUpdateSessionsStatus: vi.fn().mockResolvedValue({ succeeded: 2, failed: 0 }),
    aggregateSessionsWidgetQueries: vi.fn().mockResolvedValue({}),
    loadSessionsReportAggregates: vi.fn().mockResolvedValue({
      capacity: [],
      enrollmentTrends: [],
      todaysSessions: [],
    }),
  };
}

describe('sessions use-cases (DI with fake repository)', () => {
  it('countSessions delegates to the injected repository with the active tenant', async () => {
    const repo = createFakeRepo();
    const useCases = createSessionsUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.countSessions());

    expect(result).toBe(3);
    expect(repo.countSessionsActive).toHaveBeenCalledWith('demo');
  });

  it('loadSessionsPage delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createSessionsUseCases(repo);

    const result = await runWithTenant('demo', () =>
      useCases.loadSessionsPage({ page: 2, limit: 12 }),
    );

    expect(result).toEqual({ sessions: [], total: 0, page: 1, limit: 12, hasMore: false });
    expect(repo.listSessionsPage).toHaveBeenCalledWith('demo', { page: 2, limit: 12 });
  });

  it('bulkUpdateSessionsStatus delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createSessionsUseCases(repo);

    const result = await runWithTenant('demo', () =>
      useCases.bulkUpdateSessionsStatus(['s1', 's2'], 'active'),
    );

    expect(result).toEqual({ succeeded: 2, failed: 0 });
    expect(repo.bulkUpdateSessionsStatus).toHaveBeenCalledWith('demo', ['s1', 's2'], 'active');
  });

  it('returns empty defaults when no tenant context is bound', async () => {
    const repo = createFakeRepo();
    const useCases = createSessionsUseCases(repo);

    const count = await useCases.countSessions();
    const page = await useCases.loadSessionsPage({ page: 1, limit: 12 });

    expect(count).toBe(0);
    expect(page).toEqual({ sessions: [], total: 0, page: 1, limit: 12, hasMore: false });
    expect(repo.countSessionsActive).not.toHaveBeenCalled();
    expect(repo.listSessionsPage).not.toHaveBeenCalled();
  });
});
