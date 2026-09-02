import { type z } from 'zod';
import {
  buildDynamicStudentSchema,
  verifyBlueprintVersion,
  getPrimaryPhone,
  getPrimaryEmail,
  resolveStudentGuardianLinks,
  type Contact,
  type FieldDefinition,
} from '@mms/shared';
import { loadStudentsSettingsCombined } from './studentConfigService.js';
import { loadContactsByIds } from './contactService.js';
import { validateOrThrow } from '../lib/zodRequest.js';

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
    phone: studentRecord.phone ?? getPrimaryPhone(contact),
    email: studentRecord.email ?? getPrimaryEmail(contact),
    city: studentRecord.city ?? contact.addresses?.[0]?.city ?? null,
    ...resolveStudentGuardianLinks(
      studentRecord as {
        fatherContactId?: string | number;
        motherContactId?: string | number;
        guardianContactId?: string | number;
      },
      contact,
    ),
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
  const settings = await loadStudentsSettingsCombined();

  // Version Lock check (Rule 16.3 / CS-6)
  const submittedBlueprintId = getSubmittedBlueprintId(student);
  verifyBlueprintVersion(submittedBlueprintId, settings.version || 0);

  const cacheKey = `${tenant}:${settings.version || 0}`;
  let schema = schemaCache.get(cacheKey);

  if (!schema) {
    const enabledTabIds = new Set(settings.enabledTabs || []);
    const requiredTabIds = new Set(settings.requiredTabs || []);
    const fields = (settings.fields || {}) as unknown as Record<string, FieldDefinition[]>;

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
      const subjects = Array.isArray(student) ? student : [student];
      const ids = [
        ...new Set(
          subjects
            .map((item) =>
              item && typeof item === 'object' && !Array.isArray(item)
                ? (item as Record<string, unknown>).contactId
                : undefined,
            )
            .filter((id): id is string | number => id != null && id !== '')
            .map(String),
        ),
      ];
      cachedContacts = ids.length === 0 ? [] : await loadContactsByIds(ids);
    }
    return cachedContacts;
  };

  const validationSubject = Array.isArray(student)
    ? await Promise.all(student.map((item) => hydrateStudentValidationSubject(item, getContacts)))
    : await hydrateStudentValidationSubject(student, getContacts);

  validateOrThrow(schema, validationSubject);
}
