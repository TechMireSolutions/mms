import {
  applyTitleCaseToContact,
  normalizeToE164,
  parsePhoneNumber,
  stripContactClientSoftDeleteFields,
  stripContactRetiredClassificationFields,
  syncContactScalarFields,
  type Contact,
} from '@mms/shared';
import { loadContactLookupKind } from '../../lib/contactLookupsService.js';
import { loadContactRuntimeDefaults } from './contactLoadUseCases.js';

export function stripClientSoftDeleteFields(contact: Contact): Contact {
  return stripContactClientSoftDeleteFields(contact as unknown as Record<string, unknown>) as Contact;
}

export class ContactPermissionError extends Error {
  readonly code = 'forbidden' as const;

  constructor(message = 'Permission denied') {
    super(message);
    this.name = 'ContactPermissionError';
  }
}

/** Merge a client patch onto an existing contact, ignoring undefined keys. */
export function mergeContactPatch(existing: Contact, patch: Contact): Contact {
  const next: Contact = { ...existing };
  for (const [key, value] of Object.entries(patch) as [keyof Contact, Contact[keyof Contact]][]) {
    if (value !== undefined) {
      (next as Record<string, unknown>)[key as string] = value;
    }
  }
  return next;
}

async function normalizeContactPhones(contact: Contact): Promise<Contact> {
  let phones = contact.phones;
  // Explicit `phones: []` means clear — do not rebuild from legacy scalar.
  // Scalar `phone` is synced afterward via syncContactScalarFields.
  const phonesProvided = Array.isArray(contact.phones);
  const scalarPhone = typeof contact.phone === 'string' ? contact.phone.trim() : '';
  const { defaultPhoneCountryCode, phoneLabel } = await loadContactRuntimeDefaults();
  const dialDefault = defaultPhoneCountryCode || '';
  const labelDefault = phoneLabel || '';

  if (!phonesProvided && scalarPhone) {
    phones = [{
      label: labelDefault,
      number: scalarPhone,
      countryCode: dialDefault,
      isPrimary: true,
    }];
  }

  if (!phones?.length) {
    return { ...contact, phones: phones || [] };
  }

  const countryCodes = (await loadContactLookupKind('countryCodes')) || [];
  const knownCodes = (countryCodes as Array<{ code?: string } | string>)
    .map((row) => (row && typeof row === 'object' && typeof row.code === 'string' ? String(row.code) : ''))
    .filter(Boolean);

  return {
    ...contact,
    phones: phones.map((phone) => {
      const fallbackCode = phone.countryCode || dialDefault;
      const trimmedNumber = (phone.number || '').trim();
      const parsedRaw = parsePhoneNumber(trimmedNumber, fallbackCode, knownCodes);
      const e164 = normalizeToE164(parsedRaw.countryCode, parsedRaw.number);
      const parsed = parsePhoneNumber(e164, parsedRaw.countryCode, knownCodes);
      return {
        ...phone,
        countryCode: parsed.countryCode,
        number: parsed.number,
      };
    }),
  };
}

export async function prepareContactRecord(contact: Contact, id?: string | number): Promise<Contact> {
  const stripped = stripClientSoftDeleteFields(contact);
  const withPhones = await normalizeContactPhones(stripped);
  const withScalars = syncContactScalarFields(withPhones) as Contact;
  const resolvedId = id ?? withScalars.id ?? `temp-${Date.now()}`;
  const titled = applyTitleCaseToContact({ ...withScalars, id: resolvedId }) as Contact;
  return stripContactRetiredClassificationFields({ ...titled }) as Contact;
}
