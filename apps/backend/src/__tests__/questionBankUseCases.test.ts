import { describe, expect, it, vi } from 'vitest';
import { createQuestionBankUseCases } from '../questionBank/use-cases/questionBankUseCases.js';
import type { QuestionBankRepository } from '../questionBank/repository/questionBankRepository.js';
import { runWithTenant } from '../lib/tenantContext.js';

vi.mock('../db/repositories/questionBankModulePreferencesRepository.js', () => ({
  getQuestionBankModulePreferencesForWorkspace: vi.fn().mockResolvedValue(null),
}));

function createFakeRepo(): QuestionBankRepository {
  return {
    listQuestionsByWorkspace: vi.fn().mockResolvedValue([]),
    findQuestionById: vi.fn().mockResolvedValue(null),
    saveQuestion: vi.fn().mockResolvedValue(undefined),
    bulkSaveQuestions: vi.fn().mockResolvedValue(undefined),
    replaceQuestionsForWorkspace: vi.fn().mockResolvedValue(undefined),
    listQuestionsPage: vi.fn().mockResolvedValue({
      questions: [],
      total: 0,
      page: 1,
      limit: 15,
      hasMore: false,
    }),
    listTestsByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveTests: vi.fn().mockResolvedValue(undefined),
    replaceTestsForWorkspace: vi.fn().mockResolvedValue(undefined),
    listResultsByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveResults: vi.fn().mockResolvedValue(undefined),
    replaceResultsForWorkspace: vi.fn().mockResolvedValue(undefined),
    aggregateQuestionBankCommandMetrics: vi.fn().mockResolvedValue({
      total: 4,
      easy: 1,
      medium: 2,
      hard: 1,
      totalTests: 2,
      totalResults: 3,
      categories: 0,
    }),
    aggregateQuestionBankWidgetQueries: vi.fn().mockResolvedValue({}),
    aggregateQuestionBankReport: vi.fn().mockResolvedValue({}),
  };
}

describe('questionBank use-cases (DI with fake repository)', () => {
  it('loadQuestionsPage delegates to the injected repository with the active tenant', async () => {
    const repo = createFakeRepo();
    const useCases = createQuestionBankUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadQuestionsPage({ page: 2, limit: 15 }));

    expect(result).toEqual({ questions: [], total: 0, page: 1, limit: 15, hasMore: false });
    expect(repo.listQuestionsPage).toHaveBeenCalledWith('demo', { page: 2, limit: 15 });
  });

  it('loadQuestionBankCommandMetrics delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createQuestionBankUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadQuestionBankCommandMetrics());

    expect(result.total).toBe(4);
    expect(repo.aggregateQuestionBankCommandMetrics).toHaveBeenCalledWith('demo');
  });

  it('returns empty defaults when no tenant context is bound', async () => {
    const repo = createFakeRepo();
    const useCases = createQuestionBankUseCases(repo);

    const page = await useCases.loadQuestionsPage({ page: 1, limit: 15 });
    const metrics = await useCases.loadQuestionBankCommandMetrics();

    expect(page).toEqual({ questions: [], total: 0, page: 1, limit: 15, hasMore: false });
    expect(metrics.total).toBe(0);
    expect(repo.listQuestionsPage).not.toHaveBeenCalled();
    expect(repo.aggregateQuestionBankCommandMetrics).not.toHaveBeenCalled();
  });
});
