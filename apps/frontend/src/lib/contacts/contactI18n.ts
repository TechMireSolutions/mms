import {
  formatDate,
  calcAge,
  calculateDetailedSolarAge,
  getPrimaryPhone,
  getPrimaryEmail,
  toTitleCase,
  CONTACT_SYNC_FIELD_LABEL_KEYS,
  type AppTranslationKey,
  type ContactDuplicateReasonKey,
  type Contact,
  type ContactPreferences,
} from '@mms/shared';

export {
  formatContactPhoneDisplay,
  formatTelHref,
  getFallbackCountryCode,
  resolveContactPhoneDisplay,
} from '@/lib/contacts/contactPhoneDisplay';

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

/** Maps stored English option values → i18n keys (EditableSelect / detail display). */
export const CONTACT_OPTION_LABEL_KEYS: Record<string, AppTranslationKey> = {
  male: 'contacts.gender.male',
  female: 'contacts.gender.female',
  other: 'contacts.gender.other',
  unspecified: 'contacts.gender.unspecified',
  Mobile: 'contacts.options.phone.mobile',
  Home: 'contacts.options.address.home',
  Work: 'contacts.options.phone.work',
  WhatsApp: 'contacts.options.phone.whatsapp',
  Other: 'contacts.options.phone.other',
  Personal: 'contacts.options.email.personal',
  Billing: 'contacts.options.address.billing',
  Facebook: 'contacts.options.social.facebook',
  'Twitter / X': 'contacts.options.social.x',
  Instagram: 'contacts.options.social.instagram',
  LinkedIn: 'contacts.options.social.linkedin',
  TikTok: 'contacts.options.social.tiktok',
  YouTube: 'contacts.options.social.youtube',
  Telegram: 'contacts.options.social.telegram',
  Snapchat: 'contacts.options.social.snapchat',
  Father: 'contacts.options.relationship.father',
  Mother: 'contacts.options.relationship.mother',
  Parent: 'contacts.options.relationship.parent',
  Son: 'contacts.options.relationship.son',
  Daughter: 'contacts.options.relationship.daughter',
  Child: 'contacts.options.relationship.child',
  Brother: 'contacts.options.relationship.brother',
  Sister: 'contacts.options.relationship.sister',
  Sibling: 'contacts.options.relationship.sibling',
  Grandfather: 'contacts.options.relationship.grandfather',
  Grandmother: 'contacts.options.relationship.grandmother',
  Grandparent: 'contacts.options.relationship.grandparent',
  Grandson: 'contacts.options.relationship.grandson',
  Granddaughter: 'contacts.options.relationship.granddaughter',
  Grandchild: 'contacts.options.relationship.grandchild',
  Uncle: 'contacts.options.relationship.uncle',
  Aunt: 'contacts.options.relationship.aunt',
  'Aunt/Uncle': 'contacts.options.relationship.auntUncle',
  Nephew: 'contacts.options.relationship.nephew',
  Niece: 'contacts.options.relationship.niece',
  'Niece/Nephew': 'contacts.options.relationship.nieceNephew',
  Cousin: 'contacts.options.relationship.cousin',
  'Father-In-Law': 'contacts.options.relationship.fatherInLaw',
  'Mother-In-Law': 'contacts.options.relationship.motherInLaw',
  'Parent-In-Law': 'contacts.options.relationship.parentInLaw',
  'Son-In-Law': 'contacts.options.relationship.sonInLaw',
  'Daughter-In-Law': 'contacts.options.relationship.daughterInLaw',
  'Child-In-Law': 'contacts.options.relationship.childInLaw',
  'Brother-In-Law': 'contacts.options.relationship.brotherInLaw',
  'Sister-In-Law': 'contacts.options.relationship.sisterInLaw',
  'Sibling-In-Law': 'contacts.options.relationship.siblingInLaw',
  Guardian: 'contacts.options.relationship.guardian',
  Dependent: 'contacts.options.relationship.dependent',
  Spouse: 'contacts.options.relationship.spouse',
  Friend: 'contacts.options.relationship.friend',
  Colleague: 'contacts.options.relationship.colleague',
};

/** Localizes a known contact option value; returns the raw value for custom options. */
export function formatContactOptionLabel(
  option: string | undefined | null,
  t: (key: AppTranslationKey) => string,
): string {
  if (!option) return '';
  const key = CONTACT_OPTION_LABEL_KEYS[option];
  return key ? t(key) : option;
}

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

/** Resolves localized or config-driven label for a phone entry with default fallbacks. */
export function resolvePhoneLabel(
  label: string | undefined | null,
  phoneLabels: string[] | undefined,
  t: (key: AppTranslationKey) => string,
): string {
  const raw = label || phoneLabels?.[0] || '';
  return formatContactOptionLabel(raw, t) || t('contacts.detail.mobileLabel');
}

/** Resolves localized or config-driven label for an email entry with default fallbacks. */
export function resolveEmailLabel(
  label: string | undefined | null,
  emailLabels: string[] | undefined,
  t: (key: AppTranslationKey) => string,
): string {
  const raw = label || emailLabels?.[0] || '';
  return formatContactOptionLabel(raw, t) || t('contacts.detail.personalLabel');
}

/** Resolves localized or config-driven label for an address entry with default fallbacks. */
export function resolveAddressLabel(
  label: string | undefined | null,
  addressLabels: string[] | undefined,
  t: (key: AppTranslationKey) => string,
): string {
  const raw = label || addressLabels?.[0] || '';
  return formatContactOptionLabel(raw, t) || t('contacts.detail.homeLabel');
}

/** Resolves localized or config-driven platform label for a social link entry with default fallbacks. */
export function resolveSocialPlatformLabel(
  platform: string | undefined | null,
  socialPlatforms: string[] | undefined,
  t: (key: AppTranslationKey) => string,
): string {
  const raw = platform || socialPlatforms?.[0] || '';
  return formatContactOptionLabel(raw, t) || t('contacts.detail.socialFallback');
}

/** Resolves a registry entry label via labelKey when present (custom entries keep English label). */
export function resolveRegistryLabel(
  entry: { label: string; labelKey?: AppTranslationKey | string },
  t: (key: AppTranslationKey) => string,
): string {
  if (entry.labelKey) {
    return t(entry.labelKey as AppTranslationKey);
  }
  return entry.label;
}

/** Resolves a registry field description via descriptionKey when present. */
export function resolveRegistryDescription(
  entry: { description?: string; descriptionKey?: AppTranslationKey | string },
  t: (key: AppTranslationKey) => string,
): string {
  if (entry.descriptionKey) {
    return t(entry.descriptionKey as AppTranslationKey);
  }
  return entry.description || '';
}

/** Resolves localized label for sync conflict fields based on single-source CONTACT_SYNC_FIELD_LABEL_KEYS. */
export function resolveSyncFieldLabel(
  field: string,
  t: (key: AppTranslationKey) => string,
): string {
  const key = CONTACT_SYNC_FIELD_LABEL_KEYS[field as keyof typeof CONTACT_SYNC_FIELD_LABEL_KEYS];
  return key ? t(key as AppTranslationKey) : field;
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

