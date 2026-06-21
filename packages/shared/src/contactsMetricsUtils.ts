import type { Contact, ContactPreferences, FieldConfig } from './contactTypes.js';
import { isContactDeleted } from './contactSoftDelete.js';
import { findContactDuplicatePairs } from './contactDuplicateUtils.js';
import { calculateProfileCompleteness } from './contactProfileCompleteness.js';
import { hasWhatsApp } from './utils.js';

/** Default period for "new records" command-centre metrics (globle1 §2.1). */
export const CONTACT_METRICS_DEFAULT_PERIOD_DAYS = 30;

export interface ContactsCommandMetricsSnapshot {
  total: number;
  newThisPeriod: number;
  whatsappCount: number;
  incompleteCount: number;
  duplicatePairCount: number;
}

/** Active directory rows — excludes soft-deleted contacts. */
export function countActiveContacts(contacts: Contact[]): number {
  return contacts.filter((c) => !isContactDeleted(c)).length;
}

/** Contacts created on or after the rolling window start. */
export function countContactsCreatedSince(contacts: Contact[], days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return contacts.filter((c) => {
    if (!c.createdAt || isContactDeleted(c)) return false;
    return new Date(c.createdAt) >= cutoff;
  }).length;
}

/** Server/client command-centre metric bundle (globle1 §2.1). */
export function computeContactsCommandMetrics(
  contacts: Contact[],
  options: {
    fieldConfig: FieldConfig;
    prefs?: Pick<
      ContactPreferences,
      | 'namePrefixesToIgnore'
      | 'duplicateDetectionScoreDefault'
      | 'duplicateDetectionScorePhoneEmail'
      | 'duplicateDetectionScoreNamePhone'
      | 'duplicateDetectionScoreNameEmail'
      | 'duplicateDetectionScorePhone'
      | 'duplicateDetectionScoreEmail'
      | 'duplicateDetectionScoreName'
    >;
    periodDays?: number;
  },
): ContactsCommandMetricsSnapshot {
  const active = contacts.filter((c) => !isContactDeleted(c));
  const periodDays = options.periodDays ?? CONTACT_METRICS_DEFAULT_PERIOD_DAYS;
  return {
    total: active.length,
    newThisPeriod: countContactsCreatedSince(active, periodDays),
    whatsappCount: active.filter((c) => hasWhatsApp(c)).length,
    incompleteCount: active.filter((c) => calculateProfileCompleteness(c, options.fieldConfig) < 100).length,
    duplicatePairCount: findContactDuplicatePairs(active, options.prefs ?? {}).length,
  };
}
