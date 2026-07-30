import type { Contact, ContactsSavedReportViewer, User } from '@mms/shared';
import {
  sanitizeContactForViewer,
  sanitizeContactsForViewer,
} from '@mms/shared';
import { recordAudit } from '../../../services/auditService.js';
import { loadContactFieldConfig } from '../../../services/contactConfigService.js';

export function savedReportViewer(user: User): ContactsSavedReportViewer {
  return {
    id: String(user.id),
    role: user.role,
    isAdmin: user.role === 'admin',
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
