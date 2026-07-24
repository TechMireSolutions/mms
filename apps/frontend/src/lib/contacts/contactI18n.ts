import {
  formatDate,
  calcAge,
  parsePhoneNumber,
  getPrimaryPhone,
  getPrimaryEmail,
  toTitleCase,
  type AppTranslationKey,
  type ContactDuplicateReasonKey,
  type Contact,
  type ContactPreferences,
} from '@mms/shared';

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
  stage_change: 'contacts.detail.activityStageChange',
  system: 'contacts.detail.activitySystem',
  sms: 'contacts.sms',
  whatsapp: 'contacts.whatsapp',
};

/** Formats contact Date of Birth with inline age. */
export function formatContactDobWithAge(
  dob: string | undefined | null,
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string,
): string {
  if (!dob) return '';
  const dateStr = formatDate(dob);
  const age = calcAge(dob);
  const ageStr = age !== null ? t('contacts.table.inlineAge', { count: age }) : '';
  return `${t('contacts.table.dobLabel')} ${dateStr}${ageStr}`;
}

/** Standardized phone display formatter for contacts tables and cards. */
export function formatContactPhoneDisplay(
  rawNumber: string | undefined | null,
  countryCodeFallback = '+92',
): { countryCode: string; formattedNumber: string } {
  if (!rawNumber) return { countryCode: countryCodeFallback, formattedNumber: '' };
  const parsed = parsePhoneNumber(rawNumber, countryCodeFallback);
  return { countryCode: parsed.countryCode, formattedNumber: parsed.number || rawNumber };
}

/** Formats tel: link href for telephone actions. */
export function formatTelHref(phoneStr: string | undefined | null): string {
  if (!phoneStr) return '#';
  const p = parsePhoneNumber(phoneStr);
  const num = `${p.countryCode}${p.number}`;
  return `tel:${num || phoneStr}`;
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

/** Resolves fallback country code based on contact preferences and code mapping. */
export function getFallbackCountryCode(
  prefs?: Partial<ContactPreferences>,
  countryCodesMap?: Record<string, string>,
): string {
  if (!prefs || !countryCodesMap) return '+92';
  const defaultCountry = prefs.defaultCountry;
  if (defaultCountry && countryCodesMap[defaultCountry]) {
    return countryCodesMap[defaultCountry];
  }
  return countryCodesMap['Pakistan'] || countryCodesMap['PK'] || '+92';
}

/** Resolves primary phone, country code, and formatted display for a contact. */
export function resolveContactPhoneDisplay(
  contact: Contact,
  prefs?: Partial<ContactPreferences>,
  countryCodesMap?: Record<string, string>,
): { phone: string | null; countryCode: string; phoneDisplay: string } {
  const primaryPhone = getPrimaryPhone(contact);
  const firstPhoneObj = (contact.phones || []).find((p) => (p.number || '').trim().length > 0) || contact.phones?.[0];
  const defaultCountryCode = getFallbackCountryCode(prefs, countryCodesMap);
  const { countryCode, formattedNumber: phoneDisplay } = formatContactPhoneDisplay(
    firstPhoneObj?.number || primaryPhone,
    firstPhoneObj?.countryCode || defaultCountryCode,
  );
  return {
    phone: primaryPhone,
    countryCode,
    phoneDisplay,
  };
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

/** Resolves localized or config-driven label for a phone entry with default fallbacks. */
export function resolvePhoneLabel(
  label: string | undefined | null,
  phoneLabels: string[] | undefined,
  t: (key: AppTranslationKey) => string,
): string {
  return label || phoneLabels?.[0] || t('contacts.detail.mobileLabel');
}

/** Resolves localized or config-driven label for an email entry with default fallbacks. */
export function resolveEmailLabel(
  label: string | undefined | null,
  emailLabels: string[] | undefined,
  t: (key: AppTranslationKey) => string,
): string {
  return label || emailLabels?.[0] || t('contacts.detail.personalLabel');
}

/** Resolves localized or config-driven label for an address entry with default fallbacks. */
export function resolveAddressLabel(
  label: string | undefined | null,
  addressLabels: string[] | undefined,
  t: (key: AppTranslationKey) => string,
): string {
  return label || addressLabels?.[0] || t('contacts.detail.homeLabel');
}

/** Resolves localized or config-driven platform label for a social link entry with default fallbacks. */
export function resolveSocialPlatformLabel(
  platform: string | undefined | null,
  socialPlatforms: string[] | undefined,
  t: (key: AppTranslationKey) => string,
): string {
  return platform || socialPlatforms?.[0] || t('contacts.detail.socialFallback');
}



