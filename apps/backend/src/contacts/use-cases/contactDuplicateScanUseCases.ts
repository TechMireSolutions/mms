import { getRequestTenant } from '../../lib/tenantContext.js';
import type { ContactDuplicateCandidateKeys } from '../../db/repositories/contactRepository.js';
import type { ContactsRepository } from '../repository/contactsRepository.js';
import { contactsRepository } from '../repository/contactsRepositoryAdapter.js';

/** Active contact ids sharing any normalized duplicate key with the candidate. */
export async function loadContactDuplicateCandidateIds(
  keys: ContactDuplicateCandidateKeys,
  excludeIds: Array<string | number> = [],
  repo: ContactsRepository = contactsRepository,
): Promise<string[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return repo.findContactDuplicateCandidateIds(tenant, keys, excludeIds);
}

/** Distinct active contact ids that could participate in any duplicate pair. */
export async function loadContactDuplicateBlockedIds(
  namePrefixes: string[],
  repo: ContactsRepository = contactsRepository,
): Promise<string[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return repo.findContactDuplicateBlockedIds(tenant, namePrefixes);
}
