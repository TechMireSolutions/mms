import type { Contact, FieldDefinition, TabDefinition } from './contactTypes.js';
import { canViewContactField, canViewContactTab } from './contactFieldAccess.js';

export interface ContactFieldConfigSnapshot {
  fields: Record<string, FieldDefinition[]>;
  tabs: TabDefinition[];
}

const TAB_COLLECTION_KEYS: Record<string, (keyof Contact)[]> = {
  phones: ['phones', 'phone'],
  emails: ['emails', 'email'],
  addresses: ['addresses', 'city', 'state', 'country'],
  socials: ['socials'],
  emergency: ['emergencyContacts'],
  relationships: ['relationships'],
};

function tabEnabled(tabs: TabDefinition[], tabId: string): boolean {
  const tab = tabs.find((t) => t.key === tabId);
  return tab ? tab.enabled !== false : true;
}

function fieldVisible(viewerRole: string, field: FieldDefinition | undefined): boolean {
  if (!field || !field.enabled) return false;
  return canViewContactField(viewerRole, field);
}

/** Strips contact properties the viewer role cannot read (API + export guard). */
export function sanitizeContactForViewer(
  contact: Contact,
  viewerRole: string,
  config: ContactFieldConfigSnapshot,
): Contact {
  const sanitizedContact: Contact = { ...contact };
  const { fields, tabs } = config;

  for (const [tabId, keys] of Object.entries(TAB_COLLECTION_KEYS)) {
    const tab = tabs.find((candidateTab) => candidateTab.key === tabId);
    const tabDef = tab ?? { key: tabId, label: tabId, enabled: false, order: 0 };
    if (!tabEnabled(tabs, tabId) || !canViewContactTab(viewerRole, tabDef)) {
      for (const key of keys) {
        delete sanitizedContact[key];
      }
      continue;
    }
    if (tabId === 'phones' && !fieldVisible(viewerRole, fields.phones?.find((field) => field.key === 'number'))) {
      delete sanitizedContact.phones;
      delete sanitizedContact.phone;
    }
    if (tabId === 'emails' && !fieldVisible(viewerRole, fields.emails?.find((field) => field.key === 'address'))) {
      delete sanitizedContact.emails;
      delete sanitizedContact.email;
    }
  }

  for (const [tabId, tabFields] of Object.entries(fields)) {
    if (TAB_COLLECTION_KEYS[tabId]) continue;
    if (!tabEnabled(tabs, tabId)) {
      for (const field of tabFields) {
        delete sanitizedContact[field.key];
      }
      continue;
    }
    for (const field of tabFields) {
      if (!fieldVisible(viewerRole, field)) {
        delete sanitizedContact[field.key];
      }
    }
  }

  if (!fieldVisible(viewerRole, fields.basic?.find((field) => field.key === 'firstName'))) {
    const mutableContact = sanitizedContact as Record<string, unknown>;
    delete mutableContact.firstName;
    delete mutableContact.name;
  }
  if (!fieldVisible(viewerRole, fields.basic?.find((field) => field.key === 'lastName'))) {
    delete (sanitizedContact as Record<string, unknown>).lastName;
  }

  return sanitizedContact;
}

export function sanitizeContactsForViewer(
  contacts: Contact[],
  viewerRole: string,
  config: ContactFieldConfigSnapshot,
): Contact[] {
  return contacts.map((contact) => sanitizeContactForViewer(contact, viewerRole, config));
}

/** Summarises changed top-level keys for audit (globle1 §1.3). */
export function summarizeContactFieldChanges(before: Contact, after: Contact): string {
  const skip = new Set(['updatedAt', 'activities']);
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (skip.has(key)) continue;
    const a = before[key as keyof Contact];
    const b = after[key as keyof Contact];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changed.push(key);
    }
  }
  if (changed.length === 0) return 'Updated contact (no field diff)';
  const preview = changed.slice(0, 8).join(', ');
  return changed.length > 8 ? `Changed: ${preview}, +${changed.length - 8} more` : `Changed: ${preview}`;
}
