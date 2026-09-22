import type {
  Teacher,
  TeachersListPageResult,
  TeachersListQuery,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import type { TeachersRepository } from '../repository/facultyRepository.js';
import { teachersRepository } from '../repository/facultyRepositoryAdapter.js';
import { hydrateTeachersFromContacts } from './facultyHydrateUseCases.js';

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
    teachers: await hydrateTeachersFromContacts(tenant, page.teachers),
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
  const [hydrated] = await hydrateTeachersFromContacts(tenant, [found]);
  if (hydrated) {
    hydrated.subordinateCount = repo.countSubordinates
      ? await repo.countSubordinates(tenant, id)
      : 0;
  }
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
  return hydrateTeachersFromContacts(tenant, matched.filter((teacher: Teacher) => !teacher.deletedAt));
}

export async function loadTeacherLinkedContactIds(
  excludeTeacherId?: string,
  repo: TeachersRepository = teachersRepository,
): Promise<Array<string | number>> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return repo.listLinkedContactIds(tenant, excludeTeacherId);
}

export async function loadHierarchyTree(
  repo: TeachersRepository = teachersRepository,
): Promise<{ nodes: import('@mms/shared').FacultyHierarchyNode[] }> {
  const tenant = getRequestTenant();
  if (!tenant) return { nodes: [] };

  const pageResult = await repo.listPage(tenant, { limit: 1000 });
  const hydrated = await hydrateTeachersFromContacts(tenant, pageResult.teachers);

  const nodeMap = new Map<string, import('@mms/shared').FacultyHierarchyNode>();
  for (const f of hydrated) {
    nodeMap.set(String(f.id), {
      id: String(f.id),
      contactId: f.contactId,
      name: f.name || f.employeeId || String(f.id),
      employeeId: f.employeeId,
      department: f.department,
      designation: f.designation,
      hierarchyRank: (f as { hierarchyRank?: number }).hierarchyRank ?? 10,
      status: f.status,
      avatar: f.avatar,
      reportingFacultyId: (f as { reportingFacultyId?: string | null }).reportingFacultyId ?? null,
      subordinates: [],
    });
  }

  const rootNodes: import('@mms/shared').FacultyHierarchyNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.reportingFacultyId && nodeMap.has(node.reportingFacultyId) && node.reportingFacultyId !== node.id) {
      const parent = nodeMap.get(node.reportingFacultyId)!;
      parent.subordinates.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  const sortNodes = (nodes: import('@mms/shared').FacultyHierarchyNode[]) => {
    nodes.sort((a, b) => a.hierarchyRank - b.hierarchyRank || a.name.localeCompare(b.name));
    for (const n of nodes) {
      if (n.subordinates.length > 0) {
        sortNodes(n.subordinates);
      }
    }
  };

  sortNodes(rootNodes);
  return { nodes: rootNodes };
}

export const countFaculty = countTeachers;
export const loadFacultyPage = loadTeachersPage;
export const loadFacultyById = loadTeacherById;
export const loadFacultyByIds = loadTeachersByIds;
export const loadFacultyLinkedContactIds = loadTeacherLinkedContactIds;
export const loadFacultyHierarchyTree = loadHierarchyTree;


