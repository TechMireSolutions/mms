import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Contact, ContactsListPageResult, ContactsListQuery } from '@mms/shared';
import type { ContactsRepository } from '../contacts/repository/contactsRepository.js';

vi.mock('../db/repositories/messagingRepository.js', () => ({
  listMessageTemplatesByWorkspace: vi.fn(),
  replaceMessageTemplatesForWorkspace: vi.fn(),
  bulkSaveMessageTemplates: vi.fn(),
  deleteMessageTemplateById: vi.fn(),
  findMessageTemplateById: vi.fn(),
  listMessageLogsByWorkspace: vi.fn(),
  replaceMessageLogsForWorkspace: vi.fn(),
  insertMessageLogs: vi.fn(),
  queryFilteredMessageLogs: vi.fn(),
  queryMessagingMetrics: vi.fn(),
  softDeleteActiveMessageLogs: vi.fn(),
}));

vi.mock('../contacts/repository/contactsRepositoryAdapter.js', () => ({
  contactsRepository: {},
}));

import {
  loadMessagingRecipients,
  matchMessagingRecipients,
  resolveMessagingRecipients,
} from '../services/messagingService.js';

function fakeContact(id: string, overrides: Partial<Contact> = {}): Contact {
  return {
    id,
    name: `Contact ${id}`,
    firstName: `Contact`,
    lastName: id,
    relationshipContacts: [],
    relationships: [],
    ...overrides,
  };
}

/** In-memory fake repo — the DI seam the recipient resolvers are designed against. */
function createFakeRepo() {
  const store = new Map<string, Contact>();
  return {
    repo: {
      findByIds: vi.fn(async (_tenant: string, ids: string[]) =>
        ids.map((id) => store.get(id)).filter((c): c is Contact => Boolean(c)),
      ),
      listPage: vi.fn(async (_tenant: string, query: ContactsListQuery) => {
        const rows = [...store.values()].filter((c) => c.deletedAt === undefined);
        const page = query.page ?? 1;
        const limit = query.limit ?? 50;
        const start = (page - 1) * limit;
        return {
          contacts: rows.slice(start, start + limit),
          total: rows.length,
          page,
          limit,
          hasMore: start + limit < rows.length,
        };
      }),
    } as unknown as ContactsRepository,
    store,
  };
}

describe('messaging recipient resolvers (DI composition)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolveMessagingRecipients filters deleted rows and converts survivors', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeContact('a', { phones: [{ label: 'Mobile', number: '3001234567', isPrimary: true }] }));
    store.set('gone', fakeContact('gone', { deletedAt: '2026-07-27T00:00:00.000Z' }));
    store.set('b', fakeContact('b', { emails: [{ label: 'Primary', address: 'b@example.com' }] }));

    const recipients = await resolveMessagingRecipients('demo', ['a', 'gone', 'b'], repo);
    expect(repo.findByIds).toHaveBeenCalledWith('demo', ['a', 'gone', 'b']);
    expect(recipients.map((r) => r.id)).toEqual(['a', 'b']);
    expect(recipients[0]).toMatchObject({ name: 'Contact a', phone: '+92 3001234567' });
    expect(recipients[1]).toMatchObject({ name: 'Contact b', email: 'b@example.com' });
  });

  it('resolveMessagingRecipients returns [] for empty input without touching the repo', async () => {
    const { repo } = createFakeRepo();
    expect(await resolveMessagingRecipients('demo', [], repo)).toEqual([]);
    expect(repo.findByIds).not.toHaveBeenCalled();
  });

  it('loadMessagingRecipients maps role and reachability onto the listPage query', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeContact('a'));

    await loadMessagingRecipients(
      'demo',
      {
        role: 'students',
        gender: 'male',
        search: 'ali',
        page: 2,
        pageSize: 25,
        hasPhone: true,
        hasEmail: undefined,
      },
      repo,
    );
    expect(repo.listPage).toHaveBeenCalledWith('demo', {
      page: 2,
      limit: 25,
      search: 'ali',
      gender: 'male',
      hasPhone: true,
      moduleLinkFilter: 'students',
    });
  });

  it('loadMessagingRecipients uses unlinked filter for the contacts role', async () => {
    const { repo } = createFakeRepo();
    await loadMessagingRecipients(
      'demo',
      { role: 'contacts', gender: 'all', page: 1, pageSize: 50, hasPhone: undefined, hasEmail: undefined },
      repo,
    );
    expect(repo.listPage).toHaveBeenCalledWith(
      'demo',
      expect.objectContaining({ moduleLinkFilter: 'unlinked' }),
    );
  });

  it('loadMessagingRecipients falls back to hasReachable and no role filter', async () => {
    const { repo } = createFakeRepo();
    await loadMessagingRecipients(
      'demo',
      { role: 'all', gender: 'all', page: 1, pageSize: 50, hasPhone: undefined, hasEmail: undefined },
      repo,
    );
    expect(repo.listPage).toHaveBeenCalledWith(
      'demo',
      expect.objectContaining({ hasReachable: true }),
    );
    expect(repo.listPage).toHaveBeenCalledWith(
      'demo',
      expect.not.objectContaining({ moduleLinkFilter: expect.anything() }),
    );
  });

  it('matchMessagingRecipients stops on the final page and reports truncation', async () => {
    const { repo } = createFakeRepo();
    const pageResult: ContactsListPageResult = {
      contacts: [
        fakeContact('a', { phones: [{ label: 'Mobile', number: '3001111' }] }),
        fakeContact('b', { phones: [{ label: 'Mobile', number: '3002222' }] }),
      ],
      total: 900,
      page: 1,
      limit: 500,
      hasMore: false,
    };
    vi.mocked(repo.listPage).mockResolvedValue(pageResult);

    const result = await matchMessagingRecipients(
      'demo',
      { role: 'all', gender: 'all', kind: 'phone' },
      repo,
    );
    expect(repo.listPage).toHaveBeenCalledWith(
      'demo',
      expect.objectContaining({ page: 1, limit: 500, hasPhone: true }),
    );
    expect(result.recipients).toHaveLength(2);
    expect(result.total).toBe(900);
    expect(result.truncated).toBe(true);
  });

  it('matchMessagingRecipients pages until hasMore is false', async () => {
    const { repo } = createFakeRepo();
    const makePage = (page: number, ids: string[]): ContactsListPageResult => ({
      contacts: ids.map((id) => fakeContact(id, { phones: [{ label: 'Mobile', number: id }] })),
      total: 4,
      page,
      limit: 2,
      hasMore: page === 1,
    });
    vi.mocked(repo.listPage)
      .mockResolvedValueOnce(makePage(1, ['a', 'b']))
      .mockResolvedValueOnce(makePage(2, ['c', 'd']));

    const result = await matchMessagingRecipients(
      'demo',
      { role: 'all', gender: 'all', kind: 'email' },
      repo,
    );
    expect(repo.listPage).toHaveBeenCalledTimes(2);
    expect(result.recipients.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(result.truncated).toBe(false);
  });
});
