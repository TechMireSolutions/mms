import type {
  Contact,
  ContactsDuplicatePairsPageResult,
  ContactsListQuery,
  ContactsListPageResult,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import type { ContactsRepository } from '../repository/contactsRepository.js';
import { contactsRepository } from '../repository/contactsRepositoryAdapter.js';

/** Active (or deleted-only) contact count via SQL — avoids loading every row. */
export async function countContacts(
  options?: { includeDeleted?: boolean },
  repo: ContactsRepository = contactsRepository,
): Promise<number> {
  const tenant = getRequestTenant();
  if (!tenant) return 0;
  const deleted = options?.includeDeleted ? 'deleted' : 'active';
  return repo.countByWorkspace(tenant, { deleted });
}

export async function loadContactsPage(
  query: ContactsListQuery,
  repo: ContactsRepository = contactsRepository,
): Promise<ContactsListPageResult> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { contacts: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 50, hasMore: false };
  }

  // excludeLinkedModules is applied as SQL NOT EXISTS inside the repository page.
  return repo.listPage(tenant, query);
}

export async function loadContactsByIds(
  ids: string[],
  repo: ContactsRepository = contactsRepository,
): Promise<Contact[]> {
  if (ids.length === 0) return [];
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const matched = await repo.findByIds(tenant, ids);
  return matched.filter((contact) => !contact.deletedAt);
}

export async function loadContactDuplicatePairsPage(
  query: { page?: number; limit?: number },
  repo: ContactsRepository = contactsRepository,
): Promise<ContactsDuplicatePairsPageResult> {
  const { loadDuplicatePairsPage } = await import('../../services/contactDuplicateScanService.js');
  return loadDuplicatePairsPage(query, repo);
}

export async function getContactById(
  id: string,
  includeDeleted = false,
  repo: ContactsRepository = contactsRepository,
): Promise<Contact | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const found = await repo.findById(tenant, id);
  if (!found) return null;
  if (!includeDeleted && found.deletedAt) return null;
  return found;
}
