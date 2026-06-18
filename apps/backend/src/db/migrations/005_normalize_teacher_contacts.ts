import {
  DEMO_TEACHER_CONTACT_BY_ID,
  normalizeStoredTeacher,
  parseTenantScopedStorageKey,
  tenantCollectionKey,
  WORKSPACES_COLLECTION,
  type Workspace,
} from '@mms/shared';
import {
  getCollectionByStorageName,
  listCollectionStorageNames,
  saveCollection,
} from '../database.js';

interface LegacyTeacherRow {
  id: string | number;
  contactId?: string | number | null;
  name?: string;
  phone?: string;
  email?: string;
  gender?: string;
  [key: string]: unknown;
}

interface ContactRow {
  id: string | number;
  name?: string;
}

function resolveContactId(
  teacher: LegacyTeacherRow,
  contacts: ContactRow[],
): string | number | null {
  if (teacher.contactId != null && teacher.contactId !== '') {
    return teacher.contactId;
  }
  const demo = DEMO_TEACHER_CONTACT_BY_ID[String(teacher.id)];
  if (demo != null) return demo;
  if (teacher.name) {
    const match = contacts.find((c) => c.name === teacher.name);
    if (match) return match.id;
  }
  return null;
}

function normalizeTenantTeachers(
  teachers: LegacyTeacherRow[],
  contacts: ContactRow[],
): { next: LegacyTeacherRow[]; changed: boolean } {
  let changed = false;
  const next = teachers.map((teacher) => {
    const contactId = resolveContactId(teacher, contacts);
    const withContact = contactId != null ? { ...teacher, contactId } : teacher;
    const normalized = normalizeStoredTeacher(withContact) as LegacyTeacherRow;
    if (JSON.stringify(normalized) !== JSON.stringify(teacher)) {
      changed = true;
    }
    return normalized;
  });
  return { next, changed };
}

async function discoverTenantSubdomains(): Promise<Set<string>> {
  const subdomains = new Set<string>();
  const names = await listCollectionStorageNames();
  for (const name of names) {
    const parsed = parseTenantScopedStorageKey(name);
    if (parsed) subdomains.add(parsed.subdomain);
  }

  const workspaces = await getCollectionByStorageName(WORKSPACES_COLLECTION);
  if (Array.isArray(workspaces)) {
    for (const entry of workspaces) {
      const subdomain = (entry as Workspace).subdomain;
      if (subdomain) subdomains.add(subdomain);
    }
  }

  return subdomains;
}

/**
 * Links legacy teacher rows to contacts and strips duplicated contact fields.
 */
export async function runMigration005(): Promise<void> {
  const subdomains = await discoverTenantSubdomains();
  let changed = false;

  const normalizeStorage = async (teachersKey: string, contactsKey: string) => {
    const teachers = await getCollectionByStorageName(teachersKey);
    if (!Array.isArray(teachers) || teachers.length === 0) return;

    const contacts = (await getCollectionByStorageName(contactsKey)) as ContactRow[] | null;
    const { next, changed: rowChanged } = normalizeTenantTeachers(
      teachers as LegacyTeacherRow[],
      Array.isArray(contacts) ? contacts : [],
    );
    if (!rowChanged) return;

    await saveCollection(teachersKey, next);
    changed = true;
  };

  if (subdomains.size === 0) {
    await normalizeStorage('teachers', 'contacts');
  } else {
    for (const subdomain of subdomains) {
      await normalizeStorage(
        tenantCollectionKey(subdomain, 'teachers'),
        tenantCollectionKey(subdomain, 'contacts'),
      );
    }
  }

  if (changed) {
    console.log('[Migration 005] Linked teachers to contacts and removed duplicate profile fields.');
  }
}
