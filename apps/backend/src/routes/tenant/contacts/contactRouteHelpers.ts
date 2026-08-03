import type { Contact, ContactsSavedReportViewer, User } from '@mms/shared';
import {
  CONTACTS_MODULE_MANIFEST,
  buildContactWriteSchema,
  collectContactWriteExtraFieldKeys,
  roleHasPermission,
  sanitizeContactForViewer,
  sanitizeContactsForViewer,
} from '@mms/shared';
import type { ZodType } from 'zod';
import { recordAudit } from '../../../services/auditService.js';
import { loadContactFieldConfig } from '../../../services/contactConfigService.js';
import { parseRequest } from '../../../lib/zodRequest.js';

type ContactWriteZod = ZodType<unknown>;

export function savedReportViewer(user: User): ContactsSavedReportViewer {
  return {
    id: String(user.id),
    role: user.role,
    isAdmin: roleHasPermission(user.role, CONTACTS_MODULE_MANIFEST.permissions.setupWrite),
  };
}

async function getFieldConfigViewerOptions() {
  const fieldConfig = await loadContactFieldConfig();
  if (!fieldConfig) return null;
  return {
    fields: fieldConfig.fields,
    tabs: fieldConfig.formTabs ?? [],
  };
}

/** Tenant write schema: system keys ∪ enabled Setup custom field keys (strict). */
export async function loadContactWriteSchema(): Promise<ContactWriteZod> {
  const fieldConfig = await loadContactFieldConfig();
  return buildContactWriteSchema(collectContactWriteExtraFieldKeys(fieldConfig));
}

export async function parseContactWriteBody(
  body: unknown,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const schema = await loadContactWriteSchema();
  const parsed = parseRequest(schema, body);
  if (!parsed.ok) return parsed;
  return { ok: true, data: parsed.data as Record<string, unknown> };
}

export async function sanitizeForUser(contacts: Contact[], user: User): Promise<Contact[]> {
  const options = await getFieldConfigViewerOptions();
  if (!options) return contacts;
  return sanitizeContactsForViewer(contacts, user.role, options);
}

export async function sanitizeOneForUser(contact: Contact, user: User): Promise<Contact> {
  const options = await getFieldConfigViewerOptions();
  if (!options) return contact;
  return sanitizeContactForViewer(contact, user.role, options);
}

export async function auditContact(
  user: User,
  action: string,
  summary: string,
  entityId = 'contacts',
): Promise<void> {
  await recordAudit({
    userId: user.id,
    userEmail: user.email,
    action,
    entityType: 'collection',
    entityId,
    summary,
  });
}
