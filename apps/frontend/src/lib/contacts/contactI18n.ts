import {
  formatDate,
  calcAge,
  calculateDetailedSolarAge,
  getPrimaryPhone,
  getPrimaryEmail,
  toTitleCase,
  type AppTranslationKey,
  type ContactDuplicateReasonKey,
  type Contact,
} from '@mms/shared';

export {
  formatContactPhoneDisplay,
  formatTelHref,
  getFallbackCountryCode,
  resolveContactPhoneDisplay,
} from '@/lib/contacts/contactPhoneDisplay';

export {
  CONTACT_OPTION_LABEL_KEYS,
  formatContactOptionLabel,
  resolvePhoneLabel,
  resolveEmailLabel,
  resolveAddressLabel,
  resolveSocialPlatformLabel,
  resolveRegistryLabel,
  resolveRegistryDescription,
  resolveSyncFieldLabel,
} from '@/lib/contacts/contactOptionI18n';

export const DUPLICATE_REASON_I18N: Record<ContactDuplicateReasonKey, AppTranslationKey> = {
  phoneEmail: 'contacts.duplicates.reason.phoneEmail',
  namePhone: 'contacts.duplicates.reason.namePhone',
  phone: 'contacts.duplicates.reason.phone',
  nameEmail: 'contacts.duplicates.reason.nameEmail',
  email: 'contacts.duplicates.reason.email',
  name: 'contacts.duplicates.reason.name',
};

export const DUPLICATE_FIELD_I18N: Record<string, AppTranslationKey> = {
  name: 'contacts.duplicates.field.name',
  phone: 'contacts.duplicates.field.phone',
  email: 'contacts.duplicates.field.email',
  gender: 'contacts.duplicates.field.gender',
  dob: 'contacts.duplicates.field.dob',
};

export const ACTIVITY_TYPE_I18N: Record<string, AppTranslationKey> = {
  note: 'contacts.detail.activityNote',
  stage_change: 'contacts.detail.activityStatusChange',
  system: 'contacts.detail.activitySystem',
  sms: 'contacts.sms',
  whatsapp: 'contacts.whatsapp',
  email: 'contacts.detail.activityEmail',
  call: 'contacts.detail.activityCall',
  task: 'contacts.detail.activityTask',
};

/** Formats contact Date of Birth with inline age or detailed solar age. */
export function formatContactDobWithAge(
  dob: string | undefined | null,
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string,
  options?: { showDetailedSolarAge?: boolean; language?: string },
): string {
  if (!dob) return '';
  const dateStr = formatDate(dob);
  if (options?.showDetailedSolarAge) {
    const detailedAge = calculateDetailedSolarAge(dob, options.language ?? 'en');
    return detailedAge ? `${t('contacts.table.dobLabel')} ${dateStr} (${detailedAge})` : `${t('contacts.table.dobLabel')} ${dateStr}`;
  }
  const age = calcAge(dob);
  const ageStr = age !== null ? t('contacts.table.inlineAge', { count: age }) : '';
  return `${t('contacts.table.dobLabel')} ${dateStr}${ageStr}`;
}

/** Formats registry-driven custom column values for the contacts table. */
export function formatContactCellValue(
  value: unknown,
  t: (key: AppTranslationKey) => string,
): string {
  if (value === null || value === undefined || value === '') return t('contacts.table.emptyDash');
  if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no');
  if (Array.isArray(value)) return value.join(', ') || t('contacts.table.emptyDash');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return t('contacts.table.emptyDash');
    }
  }
  return String(value);
}

/** Formats gender with i18n lookup and fallback to TitleCase. */
export function formatContactGenderLabel(
  gender: string | undefined | null,
  t: (key: AppTranslationKey) => string,
): string {
  if (!gender) return '';
  const key = `contacts.gender.${gender.toLowerCase()}` as AppTranslationKey;
  const translated = t(key);
  return translated === key ? toTitleCase(gender) : translated;
}

/** Resolves border accent indicator styling for contact cards based on selection and gender. */
export function getContactAccentBarClass(isSelected: boolean, gender?: string | null): string {
  if (isSelected) return 'bg-primary/70 group-hover:bg-primary';
  const g = gender?.toLowerCase();
  if (g === 'male') return 'bg-info/50 group-hover:bg-info';
  if (g === 'female') return 'bg-secondary/50 group-hover:bg-secondary';
  return 'bg-muted-foreground/35 group-hover:bg-muted-foreground/60';
}

/** Resolves localized label for duplicate detection fields. */
export function getDuplicateFieldLabel(
  field: string,
  t: (key: AppTranslationKey) => string,
): string {
  const key = DUPLICATE_FIELD_I18N[field];
  return key ? t(key) : field;
}

/** Resolves value display string for duplicate detection fields. */
export function getDuplicateFieldValue(
  field: string,
  contact: Contact,
  t: (key: AppTranslationKey) => string,
): string {
  const emptyDash = t('contacts.table.emptyDash');
  if (field === 'phone') {
    return getPrimaryPhone(contact) || emptyDash;
  }
  if (field === 'email') {
    return getPrimaryEmail(contact) || (contact.emails || []).find((e) => e.address?.trim())?.address || emptyDash;
  }
  if (field === 'gender') {
    return formatContactGenderLabel(contact.gender, t) || emptyDash;
  }
  if (field === 'dob') {
    return contact.dob ? formatDate(contact.dob) : emptyDash;
  }
  const fieldValue = contact[field as keyof Contact];
  return (fieldValue as string) || emptyDash;
}

/** Resolves localized label for sync conflict kinds (upsert, update, delete). */
export function getSyncConflictKindLabel(
  kind: 'upsert' | 'update' | 'delete',
  t: (key: 'contacts.sync.conflictKindCreate' | 'contacts.sync.conflictKindUpdate' | 'contacts.sync.conflictKindDelete') => string,
): string {
  if (kind === 'upsert') return t('contacts.sync.conflictKindCreate');
  if (kind === 'update') return t('contacts.sync.conflictKindUpdate');
  return t('contacts.sync.conflictKindDelete');
}

/** Builds an id-to-Contact Map efficiently from an array of contacts. */
export function buildContactsMap(contacts?: Contact[]): Map<string, Contact> | null {
  if (!contacts || contacts.length === 0) return null;
  const map = new Map<string, Contact>();
  for (const c of contacts) {
    if (c.id) map.set(String(c.id), c);
  }
  return map;
}
