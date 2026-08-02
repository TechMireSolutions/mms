import {
  findContactUniqueFieldConflicts,
  type Contact,
  type ValidationError,
} from '@mms/shared';
import { listContactsByWorkspace } from '../db/repositories/contactRepository.js';
import { loadContactFieldConfig } from './contactConfigService.js';
import { loadContactRuntimeDefaults } from './contactServiceLoad.js';

/** Thrown when a contact reuses a Setup-unique field value. */
export class ContactUniqueFieldError extends Error {
  readonly code = 'unique_conflict' as const;
  readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const message = errors.map((error) => error.message).join('; ') || 'Unique field conflict';
    super(message);
    this.name = 'ContactUniqueFieldError';
    this.errors = errors;
  }
}

/**
 * Rejects save when any enabled Setup `unique` field collides with another active contact
 * (or is duplicated within the candidate).
 */
export async function assertContactUniqueFields(
  tenant: string,
  contact: Contact,
  language = 'en',
  excludeContactIds: Array<string | number> = [],
): Promise<void> {
  const fieldConfig = await loadContactFieldConfig();
  const fields = fieldConfig?.fields;
  if (!fields) return;

  const { defaultPhoneCountryCode } = await loadContactRuntimeDefaults();
  const peers = await listContactsByWorkspace(tenant, { deleted: 'active' });
  const errors = findContactUniqueFieldConflicts(contact, peers, fields, language, {
    defaultPhoneCountryCode,
    excludeContactIds,
  });
  if (errors.length > 0) {
    throw new ContactUniqueFieldError(errors);
  }
}
