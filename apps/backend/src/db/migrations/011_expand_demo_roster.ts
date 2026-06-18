import {
  DEFAULT_STUDENTS_SETTINGS,
  DEFAULT_TEACHERS_SETTINGS,
  DEMO_STUDENT_CONTACTS_ALL,
  DEMO_STUDENT_COUNT,
  DEMO_STUDENTS,
  DEMO_TEACHER_CONTACTS,
  DEMO_TEACHER_COUNT,
  DEMO_TEACHERS,
  WORKSPACES_COLLECTION,
  parseTenantScopedStorageKey,
  tenantCollectionKey,
  tenantObjectKey,
  type Contact,
  type Workspace,
} from '@mms/shared';
import {
  getCollectionByStorageName,
  getObjectByStorageKey,
  listCollectionStorageNames,
  saveCollection,
  saveObject,
} from '../database.js';

const STUDENTS_COLLECTION = 'students';
const TEACHERS_COLLECTION = 'teachers';
const CONTACTS_COLLECTION = 'contacts';
const STUDENTS_SETTINGS_KEY = 'students_settings';
const TEACHERS_SETTINGS_KEY = 'teachers_settings';

function mergeContactsById(existing: Contact[], demo: Contact[]): Contact[] {
  const byId = new Map<string, Contact>();
  for (const row of existing) {
    byId.set(String(row.id), row);
  }
  for (const row of demo) {
    const key = String(row.id);
    if (!byId.has(key)) {
      byId.set(key, row);
    }
  }
  return [...byId.values()];
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

async function expandTenantRoster(
  studentsKey: string,
  teachersKey: string,
  contactsKey: string,
  studentsSettingsKey: string,
  teachersSettingsKey: string,
): Promise<boolean> {
  let changed = false;

  const existingStudents = await getCollectionByStorageName(studentsKey);
  const studentCount = Array.isArray(existingStudents) ? existingStudents.length : 0;
  if (studentCount < DEMO_STUDENT_COUNT) {
    await saveCollection(studentsKey, [...DEMO_STUDENTS]);
    changed = true;
  }

  const existingTeachers = await getCollectionByStorageName(teachersKey);
  const teacherCount = Array.isArray(existingTeachers) ? existingTeachers.length : 0;
  if (teacherCount < DEMO_TEACHER_COUNT) {
    await saveCollection(teachersKey, [...DEMO_TEACHERS]);
    changed = true;
  }

  const existingContacts = await getCollectionByStorageName(contactsKey);
  const merged = mergeContactsById(
    Array.isArray(existingContacts) ? (existingContacts as Contact[]) : [],
    [...DEMO_TEACHER_CONTACTS, ...DEMO_STUDENT_CONTACTS_ALL],
  );
  if (!Array.isArray(existingContacts) || merged.length !== existingContacts.length) {
    await saveCollection(contactsKey, merged);
    changed = true;
  }

  if ((await getObjectByStorageKey(studentsSettingsKey)) === null) {
    await saveObject(studentsSettingsKey, DEFAULT_STUDENTS_SETTINGS);
    changed = true;
  }

  if ((await getObjectByStorageKey(teachersSettingsKey)) === null) {
    await saveObject(teachersSettingsKey, DEFAULT_TEACHERS_SETTINGS);
    changed = true;
  }

  return changed;
}

/**
 * Expands minimal demo rosters to {@link DEMO_STUDENT_COUNT} students and
 * {@link DEMO_TEACHER_COUNT} teachers (with linked contacts).
 */
export async function runMigration011(): Promise<void> {
  const subdomains = await discoverTenantSubdomains();
  let changed = false;

  if (subdomains.size === 0) {
    if (
      await expandTenantRoster(
        STUDENTS_COLLECTION,
        TEACHERS_COLLECTION,
        CONTACTS_COLLECTION,
        STUDENTS_SETTINGS_KEY,
        TEACHERS_SETTINGS_KEY,
      )
    ) {
      console.log('[Migration 011] Expanded demo roster (legacy storage)');
      changed = true;
    }
  } else {
    for (const subdomain of subdomains) {
      if (
        await expandTenantRoster(
          tenantCollectionKey(subdomain, STUDENTS_COLLECTION),
          tenantCollectionKey(subdomain, TEACHERS_COLLECTION),
          tenantCollectionKey(subdomain, CONTACTS_COLLECTION),
          tenantObjectKey(subdomain, STUDENTS_SETTINGS_KEY),
          tenantObjectKey(subdomain, TEACHERS_SETTINGS_KEY),
        )
      ) {
        console.log(`[Migration 011] Expanded demo roster for tenant "${subdomain}"`);
        changed = true;
      }
    }
  }

  if (changed) {
    console.log('[Migration 011] Demo roster expansion completed.');
  }
}
