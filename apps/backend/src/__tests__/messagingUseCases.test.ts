import { describe, expect, it, vi } from 'vitest';
import { createMessagingUseCases } from '../messaging/use-cases/messagingUseCases.js';
import type { MessagingRepository } from '../messaging/repository/messagingRepository.js';

function createFakeRepo(): MessagingRepository {
  return {
    listMessageTemplatesByWorkspace: vi.fn().mockResolvedValue([]),
    findMessageTemplateById: vi.fn().mockResolvedValue(null),
    bulkSaveMessageTemplates: vi.fn().mockResolvedValue(undefined),
    replaceMessageTemplatesForWorkspace: vi.fn().mockResolvedValue(undefined),
    deleteMessageTemplateById: vi.fn().mockResolvedValue(true),
    listMessageLogsByWorkspace: vi.fn().mockResolvedValue([]),
    replaceMessageLogsForWorkspace: vi.fn().mockResolvedValue(undefined),
    insertMessageLogs: vi.fn().mockResolvedValue(undefined),
    queryFilteredMessageLogs: vi.fn().mockResolvedValue({
      logs: [],
      total: 0,
      page: 1,
      pageSize: 50,
      hasMore: false,
    }),
    queryMessagingMetrics: vi.fn().mockResolvedValue({
      total: 0,
      smsCount: 0,
      whatsappCount: 0,
      emailCount: 0,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      skippedCount: 0,
      queuedCount: 0,
      successRate: 100,
      categoryBreakdown: {
        general: 0,
        academic: 0,
        financial: 0,
        attendance: 0,
        emergency: 0,
      },
    }),
    softDeleteActiveMessageLogs: vi.fn().mockResolvedValue(undefined),
  };
}

describe('messaging use-cases (DI with fake repository)', () => {
  it('loadFilteredMessageLogs delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createMessagingUseCases(repo);

    const result = await useCases.loadFilteredMessageLogs('demo', { page: 1 });

    expect(result).toEqual({ logs: [], total: 0, page: 1, pageSize: 50, hasMore: false });
    expect(repo.queryFilteredMessageLogs).toHaveBeenCalledWith('demo', { page: 1 });
  });

  it('recordMessageLogs delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createMessagingUseCases(repo);
    const log = { id: 'm-1', channel: 'sms' } as never;

    const result = await useCases.recordMessageLogs('demo', [log]);

    expect(result).toEqual([log]);
    expect(repo.insertMessageLogs).toHaveBeenCalledWith('demo', [log]);
  });

  it('computeMessagingMetrics delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createMessagingUseCases(repo);

    const result = await useCases.computeMessagingMetrics('demo', { startDate: '2026-01-01' });

    expect(result.total).toBe(0);
    expect(repo.queryMessagingMetrics).toHaveBeenCalledWith('demo', { startDate: '2026-01-01' });
  });

  it('returns empty defaults when no workspace is provided', async () => {
    const repo = createFakeRepo();
    const useCases = createMessagingUseCases(repo);

    const page = await useCases.loadFilteredMessageLogs();
    const metrics = await useCases.computeMessagingMetrics();

    expect(page).toEqual({ logs: [], total: 0, page: 1, pageSize: 50, hasMore: false });
    expect(metrics.total).toBe(0);
    expect(repo.queryFilteredMessageLogs).not.toHaveBeenCalled();
    expect(repo.queryMessagingMetrics).not.toHaveBeenCalled();
  });
});
