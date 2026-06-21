import type { AppTranslationKey, ContactDuplicateReasonKey } from '@mms/shared';

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
};

/** Formats registry-driven custom column values for the contacts table. */
export function formatContactCellValue(
  val: unknown,
  t: (key: AppTranslationKey) => string,
): string {
  if (val === null || val === undefined || val === '') return t('contacts.table.emptyDash');
  if (typeof val === 'boolean') return val ? t('common.yes') : t('common.no');
  if (Array.isArray(val)) return val.join(', ') || t('contacts.table.emptyDash');
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch (err: unknown) {
      console.error('Failed to stringify cell value:', err);
      return t('contacts.table.emptyDash');
    }
  }
  return String(val);
}
