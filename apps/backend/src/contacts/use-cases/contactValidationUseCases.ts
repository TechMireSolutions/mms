import {
  applyTitleCaseToContact,
  cleanContactDraft,
  normalizeToE164,
  parsePhoneNumber,
  stripContactClientSoftDeleteFields,
  stripContactRetiredClassificationFields,
  syncContactScalarFields,
  collectUniqueContactFieldValues,
  findContactUniqueFieldConflicts,
  listUniqueContactFieldRefs,
  buildDynamicContactSchema,
  resolveContactEnabledTabIds,
  verifyBlueprintVersion,
  type Contact,
  type ValidationError,
} from '@mms/shared';
import { createHash } from 'node:crypto';
import type { z } from 'zod';
import { loadContactLookupKind } from '../../lib/contactLookupsService.js';
import { loadContactFieldConfig } from '../../lib/contactConfigService.js';
import { loadContactRuntimeDefaults } from './contactLoadUseCases.js';
import type { ContactsRepository } from '../repository/contactsRepository.js';
import { contactsRepository } from '../repository/contactsRepositoryAdapter.js';

export function stripClientSoftDeleteFields(contact: Contact): Contact {
  return stripContactClientSoftDeleteFields(contact);
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
  const phonesProvided = Array.isArray(contact.phones);
  const { defaultPhoneCountryCode, phoneLabel } = await loadContactRuntimeDefaults();
  const dialDefault = defaultPhoneCountryCode || '';
  const labelDefault = phoneLabel || 'Mobile';

  // phones: undefined (not provided) + scalar phone present → rebuild a single row
  if (!phonesProvided && (contact.phone || '').trim()) {
    phones = [
      {
        label: labelDefault,
        number: (contact.phone || '').trim(),
        countryCode: dialDefault,
        isPrimary: true,
      },
    ];
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
  const cleaned = cleanContactDraft(contact);
  const withPhones = await normalizeContactPhones(cleaned as Contact);
  const withScalars = syncContactScalarFields(withPhones);
  const resolvedId = id ?? withScalars.id ?? `temp-${Date.now()}`;
  const titled = applyTitleCaseToContact({ ...withScalars, id: resolvedId });
  return stripContactRetiredClassificationFields({ ...titled });
}

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

interface AssertContactUniqueFieldsOptions {
  language?: string;
  excludeContactIds?: Array<string | number>;
  /** Extra peers not yet persisted (e.g. Google sync batch). */
  additionalPeers?: ReadonlyArray<Contact>;
  /**
   * Take transaction-scoped advisory locks on normalized unique values before peer checks.
   * Callers must already be inside `runInTransaction` / tenant tx for locks to cover the write.
   * @default true
   */
  acquireLocks?: boolean;
}

/**
 * Transaction-scoped advisory locks for Setup-unique values (closes check-then-write races).
 * Keys are sorted for stable lock order across concurrent writers.
 * The lock SQL lives in the repository adapter — a storage concern, not domain orchestration.
 */
async function acquireContactUniqueValueLocks(
  tenant: string,
  lockKeys: string[],
  repo: ContactsRepository,
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  const sorted = [...new Set(lockKeys.map((key) => key.trim()).filter(Boolean))].sort();
  await repo.acquireUniqueValueLocks(subdomain, sorted);
}

/**
 * Rejects save when any enabled Setup `unique` field collides with another active contact
 * (or is duplicated within the candidate).
 *
 * Peer lookup is scoped to contacts matching candidate unique values (SQL), not a full-tenant dump.
 * Acquires advisory locks on normalized unique values before the peer read (TOCTOU guard).
 */
export async function assertContactUniqueFields(
  tenant: string,
  contact: Contact,
  languageOrOptions: string | AssertContactUniqueFieldsOptions = 'en',
  excludeContactIdsArg: Array<string | number> = [],
  repo: ContactsRepository = contactsRepository,
): Promise<void> {
  const options: AssertContactUniqueFieldsOptions =
    typeof languageOrOptions === 'string'
      ? { language: languageOrOptions, excludeContactIds: excludeContactIdsArg }
      : languageOrOptions;
  const language = options.language ?? 'en';
  const excludeContactIds = options.excludeContactIds ?? excludeContactIdsArg;
  const additionalPeers = options.additionalPeers ?? [];
  const acquireLocks = options.acquireLocks !== false;

  const fieldConfig = await loadContactFieldConfig();
  const fields = fieldConfig?.fields;
  if (!fields) return;

  const uniqueFields = listUniqueContactFieldRefs(fields);
  if (uniqueFields.length === 0) return;

  const { defaultPhoneCountryCode } = await loadContactRuntimeDefaults();
  const collectOptions = { defaultPhoneCountryCode };
  const candidateValues = collectUniqueContactFieldValues(contact, uniqueFields, collectOptions);

  // Intra-candidate duplicates need no peer load.
  const intraErrors = findContactUniqueFieldConflicts(contact, [], fields, language, {
    defaultPhoneCountryCode,
    excludeContactIds,
  });

  if (candidateValues.length === 0) {
    if (intraErrors.length > 0) {
      throw new ContactUniqueFieldError(intraErrors);
    }
    return;
  }

  if (acquireLocks) {
    const lockKeys = candidateValues.map(
      (value) => `${value.tabId}:${value.fieldKey}:${value.normalized}`,
    );
    await acquireContactUniqueValueLocks(tenant, lockKeys, repo);
  }

  const phoneDigits = candidateValues
    .filter((value) => value.tabId === 'phones' && value.fieldKey === 'number')
    .map((value) => value.normalized);
  const emails = candidateValues
    .filter((value) => value.tabId === 'emails' && value.fieldKey === 'address')
    .map((value) => value.normalized);
  const scalars = candidateValues
    .filter(
      (value) =>
        !(value.tabId === 'phones' && value.fieldKey === 'number') &&
        !(value.tabId === 'emails' && value.fieldKey === 'address'),
    )
    .map((value) => ({ fieldKey: value.fieldKey, normalized: value.normalized }));

  const excludeIds = [
    ...excludeContactIds,
    ...(contact.id != null ? [contact.id] : []),
  ];
  const peers = await repo.findActiveContactsMatchingUniqueValues(
    tenant,
    { phoneDigits, emails, scalars },
    excludeIds,
  );

  const errors = findContactUniqueFieldConflicts(
    contact,
    [...peers, ...additionalPeers],
    fields,
    language,
    {
      defaultPhoneCountryCode,
      excludeContactIds: excludeIds,
    },
  );
  if (errors.length > 0) {
    throw new ContactUniqueFieldError(errors);
  }
}

// Cache compiled schemas by tenant and active blueprint fingerprint.
const schemaCache = new Map<string, z.ZodTypeAny>();

function getBlueprintCacheKey(tenant: string, fieldConfig: unknown, viewerRole?: string): string {
  const fingerprint = createHash('sha256')
    .update(JSON.stringify(fieldConfig))
    .digest('hex');
  return `${tenant}:${fingerprint}:${viewerRole || ''}`;
}

/**
 * Validates one or more contact records against the current tenant's dynamic field blueprint.
 *
 * @param tenant - The workspace subdomain/tenant.
 * @param contact - The contact record or array of contact records to validate.
 * @param language - Optional language code for error message translation.
 * @param viewerRole - Optional role of the current viewer.
 * @throws {Error} if validation fails.
 */
export async function validateContactDynamic(
  tenant: string,
  contact: unknown,
  language = 'en',
  viewerRole?: string,
): Promise<void> {
  const fieldConfig = await loadContactFieldConfig();
  if (!fieldConfig) {
    return; // No config, nothing to validate.
  }

  // Version Lock check (Rule 16.3 / CS-6)
  let submittedBlueprintId: unknown;
  if (contact && typeof contact === 'object' && !Array.isArray(contact)) {
    submittedBlueprintId = (contact as Record<string, unknown>)._blueprintId;
  }
  verifyBlueprintVersion(submittedBlueprintId, fieldConfig.version);

  const cacheKey = getBlueprintCacheKey(tenant, fieldConfig, viewerRole);
  let schema = schemaCache.get(cacheKey);

  if (!schema) {
    const enabledTabIds = resolveContactEnabledTabIds(fieldConfig, viewerRole || '');
    const requiredTabIds = new Set(fieldConfig.requiredTabs || []);
    const fields = fieldConfig.fields || {};

    schema = buildDynamicContactSchema(
      fieldConfig,
      enabledTabIds,
      requiredTabIds,
      fields,
      language,
      viewerRole,
    );
    schemaCache.set(cacheKey, schema);
  }

  const { validateOrThrow } = await import('../../lib/zodRequest.js');
  validateOrThrow(schema, contact);
}
