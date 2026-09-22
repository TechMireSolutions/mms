import {
  createContactLookupMap,
  hydrateFacultyFromContact,
  type Contact,
  type Faculty,
} from '@mms/shared';
import { loadContactsByIdsForTenant } from '../../services/contactService.js';

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
      const { findTeachersByIds } = await import('../../db/repositories/facultyRepository.js');
      const supervisors = await findTeachersByIds(tenant, [...supervisorIds]);
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

  return rows.map((row) => {
    const hydrated = hydrateFacultyFromContact(row, contactMap as never);
    if (hydrated.reportingFacultyId && supervisorNameMap.has(String(hydrated.reportingFacultyId))) {
      hydrated.reportingFacultyName = supervisorNameMap.get(String(hydrated.reportingFacultyId));
    }
    return hydrated;
  });
}

export const hydrateTeachersFromContacts = hydrateFacultyFromContacts;

