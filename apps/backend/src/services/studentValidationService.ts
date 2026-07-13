import { z } from 'zod';
import {
  buildDynamicStudentSchema,
  normalizeStudentsSettings,
  verifyBlueprintVersion,
  type StudentsSettings,
  type Contact,
} from '@mms/shared';
import { fetchObject } from './dbSyncService.js';
import { loadContacts } from './contactService.js';

const CONFIG_KEY = 'students_settings';

// Cache compiled schema by tenant and config version: `${tenant}:${configVersion}`
const schemaCache = new Map<string, z.ZodTypeAny>();

function getSubmittedBlueprintId(student: unknown): unknown {
  if (!student || typeof student !== 'object' || Array.isArray(student)) {
    return undefined;
  }
  return (student as Record<string, unknown>)._blueprintId;
}

async function hydrateStudentValidationSubject(
  student: unknown,
  getContacts: () => Promise<Contact[]>,
): Promise<unknown> {
  if (!student || typeof student !== 'object' || Array.isArray(student)) {
    return student;
  }

  const studentRecord = student as Record<string, unknown>;
  const contactId = studentRecord.contactId;
  if (contactId == null || contactId === '') {
    return studentRecord;
  }

  const contacts = await getContacts();
  const contact = contacts.find((candidateContact) => String(candidateContact.id) === String(contactId));
  if (!contact) {
    return studentRecord;
  }

  return {
    ...studentRecord,
    name: studentRecord.name ?? contact.name,
    gender: studentRecord.gender ?? contact.gender,
    dob: studentRecord.dob ?? contact.dob,
    phone: studentRecord.phone ?? contact.phone ?? contact.phones?.[0]?.number,
    email: studentRecord.email ?? contact.email ?? contact.emails?.[0]?.address,
    city: studentRecord.city ?? contact.city,
  };
}

/**
 * Validates one or more student records against the current tenant's dynamic field blueprint.
 *
 * @param tenant - The workspace subdomain/tenant.
 * @param student - The student record or array of student records to validate.
 * @param language - Optional language code for error message translation.
 * @throws {Error} if validation fails.
 */
export async function validateStudentDynamic(
  tenant: string,
  student: unknown,
  language = 'en',
): Promise<void> {
  const raw = await fetchObject(CONFIG_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return; // No config, nothing to validate.
  }
  const settings = normalizeStudentsSettings(raw) as StudentsSettings;

  // Version Lock check (Rule 16.3 / CS-6)
  const submittedBlueprintId = getSubmittedBlueprintId(student);
  verifyBlueprintVersion(submittedBlueprintId, settings.version || 0);

  const cacheKey = `${tenant}:${settings.version || 0}`;
  let schema = schemaCache.get(cacheKey);

  if (!schema) {
    const enabledTabIds = new Set(settings.enabledTabs || []);
    const requiredTabIds = new Set(settings.requiredTabs || []);
    const fields = settings.fields || {};

    schema = buildDynamicStudentSchema(
      settings,
      enabledTabIds,
      requiredTabIds,
      fields,
      language,
    );
    schemaCache.set(cacheKey, schema);
  }

  let cachedContacts: Contact[] | undefined;
  const getContacts = async () => {
    if (!cachedContacts) {
      cachedContacts = await loadContacts();
    }
    return cachedContacts;
  };

  const validationSubject = Array.isArray(student)
    ? await Promise.all(student.map((item) => hydrateStudentValidationSubject(item, getContacts)))
    : await hydrateStudentValidationSubject(student, getContacts);

  const { validateOrThrow } = await import('../lib/zodRequest.js');
  validateOrThrow(schema, validationSubject);
}
