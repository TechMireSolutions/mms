import type {
  Teacher,
  TeachersListPageResult,
  TeachersListQuery,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import type { TeachersRepository } from '../repository/teachersRepository.js';
import { teachersRepository } from '../repository/teachersRepositoryAdapter.js';
import { hydrateTeachersFromContacts } from './teacherHydrateUseCases.js';

/** Teacher count via SQL — avoids loading every row (active by default). */
export async function countTeachers(
  options?: { includeDeleted?: boolean },
  repo: TeachersRepository = teachersRepository,
): Promise<number> {
  const tenant = getRequestTenant();
  if (!tenant) return 0;
  return repo.countByWorkspace(tenant, { includeDeleted: options?.includeDeleted });
}

export async function loadTeachersPage(
  query: TeachersListQuery,
  repo: TeachersRepository = teachersRepository,
): Promise<TeachersListPageResult> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { teachers: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 50, hasMore: false };
  }
  const page = await repo.listPage(tenant, query);
  return {
    ...page,
    teachers: await hydrateTeachersFromContacts(page.teachers),
  };
}

export async function loadTeacherById(
  id: string,
  includeDeleted = false,
  repo: TeachersRepository = teachersRepository,
): Promise<Teacher | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const found = await repo.findById(tenant, id);
  if (!found) return null;
  if (!includeDeleted && found.deletedAt) return null;
  const [hydrated] = await hydrateTeachersFromContacts([found]);
  return hydrated ?? null;
}

export async function loadTeachersByIds(
  ids: string[],
  repo: TeachersRepository = teachersRepository,
): Promise<Teacher[]> {
  if (ids.length === 0) return [];
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const matched = await repo.findByIds(tenant, ids);
  return hydrateTeachersFromContacts(matched);
}

export async function loadTeacherLinkedContactIds(
  excludeTeacherId?: string,
  repo: TeachersRepository = teachersRepository,
): Promise<Array<string | number>> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return repo.listLinkedContactIds(tenant, excludeTeacherId);
}
