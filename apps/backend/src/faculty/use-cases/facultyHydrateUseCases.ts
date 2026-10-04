import {
  createContactLookupMap,
  hydrateFacultyFromContact,
  type Contact,
  type Faculty,
  type FacultyDesignationAssignment,
  type FacultyDesignationHolding,
} from '@mms/shared';
import { loadContactsByIdsForTenant } from '../../services/contactService.js';
import {
  listCurrentFacultyDesignationAssignments,
  listCurrentFacultyDesignationHoldings,
} from '../../db/repositories/facultyDesignationRepository.js';

/**
 * Single-pass hydrate: loads the linked contacts through the contacts composition
 * root (never raw Drizzle) and fills display profile fields on the faculty rows.
 * Also enriches supervisor display names if reportingFacultyId is present.
 * The tenant is passed explicitly so hydration works outside a tenant-scoped
 * request (background jobs, scripts, tests).
 */
export async function hydrateFacultyFromContacts(
  tenant: string,
  rows: Faculty[],
): Promise<Faculty[]> {
  if (rows.length === 0) return [];

  const ids = new Set<string>();
  const supervisorIds = new Set<string>();
  for (const row of rows) {
    if (row.contactId != null && row.contactId !== '') ids.add(String(row.contactId));
    if (row.reportingFacultyId != null && String(row.reportingFacultyId).trim() !== '') {
      supervisorIds.add(String(row.reportingFacultyId).trim());
    }
  }

  let contactMap = new Map();
  if (ids.size > 0) {
    const contacts = (await loadContactsByIdsForTenant(tenant, [...ids])) as Contact[];
    contactMap = createContactLookupMap(contacts as never);
  }

  let supervisorNameMap = new Map<string, string>();
  if (supervisorIds.size > 0) {
    try {
      const { findFacultyByIds } = await import('../../db/repositories/facultyRepository.js');
      const supervisors = await findFacultyByIds(tenant, [...supervisorIds]);
      const supContactIds = supervisors.map((s) => s.contactId).filter(Boolean);
      if (supContactIds.length > 0) {
        const supContacts = (await loadContactsByIdsForTenant(tenant, supContactIds as string[])) as Contact[];
        const supContactMap = createContactLookupMap(supContacts as never);
        const hydratedSupervisors = supervisors.map((s) => hydrateFacultyFromContact(s, supContactMap as never));
        supervisorNameMap = new Map(
          hydratedSupervisors.map((s) => [String(s.id), s.name || s.employeeId || String(s.id)]),
        );
      }
    } catch {
      // Non-blocking in decoupled unit tests
    }
  }

  let currentDesignations = new Map<string, FacultyDesignationAssignment>();
  let designationHoldings = new Map<string, FacultyDesignationHolding[]>();
  try {
    const facultyIds = rows.map((row) => String(row.id));
    [currentDesignations, designationHoldings] = await Promise.all([
      listCurrentFacultyDesignationAssignments(tenant, facultyIds),
      listCurrentFacultyDesignationHoldings(tenant, facultyIds),
    ]);
  } catch {
    // Legacy databases may be read during the expand phase before migration.
  }

  return rows.map((row) => {
    const hydrated = hydrateFacultyFromContact(row, contactMap as never);
    const facultyId = String(row.id);
    const holdings = designationHoldings.get(facultyId);
    if (holdings?.length) {
      hydrated.designations = holdings;
    }
    const currentDesignation = currentDesignations.get(facultyId);
    if (currentDesignation) {
      hydrated.designation = currentDesignation.designationName;
      hydrated.designationId = currentDesignation.designationId;
      hydrated.designationStartsOn = currentDesignation.startsOn;
      hydrated.designationEndsOn = currentDesignation.endsOn ?? null;
      hydrated.designationAssignableRoles = currentDesignation.assignableRoles ?? [];
      hydrated.hierarchyRank = currentDesignation.hierarchyRank ?? hydrated.hierarchyRank;
    } else if (holdings?.length) {
      const fallback = holdings.find((h) => h.status === 'active') ?? holdings[0];
      if (fallback) {
        hydrated.designation = fallback.designationName;
        hydrated.designationId = fallback.designationId;
        hydrated.designationStartsOn = fallback.startsOn;
        hydrated.designationEndsOn = fallback.endsOn ?? null;
        hydrated.designationAssignableRoles = fallback.assignableRoles ?? [];
      }
    }
    const primaryHolding =
      holdings?.find((h) => h.isPrimary && h.status === 'active')
      ?? holdings?.find((h) => h.status === 'active')
      ?? holdings?.[0];
    if (primaryHolding) {
      if (primaryHolding.departmentName) hydrated.department = primaryHolding.departmentName;
      if (primaryHolding.departmentId) hydrated.departmentId = primaryHolding.departmentId;
    }
    if (hydrated.reportingFacultyId && supervisorNameMap.has(String(hydrated.reportingFacultyId))) {
      hydrated.reportingFacultyName = supervisorNameMap.get(String(hydrated.reportingFacultyId));
    }
    return hydrated;
  });
}
