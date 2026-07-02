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
  return contacts.filter((contact) => !isContactDeleted(contact)).length;
}

/** Contacts created on or after the rolling window start. */
export function countContactsCreatedSince(contacts: Contact[], days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return contacts.filter((contact) => {
    if (!contact.createdAt || isContactDeleted(contact)) return false;
    return new Date(contact.createdAt) >= cutoff;
  }).length;
}

/** Server/client command-centre metric bundle (globle1 §2.1). */
export function computeContactsCommandMetrics(
  contacts: Contact[],
  options: {
    fieldConfig: FieldConfig;
    duplicateDetectionPreferences?: Pick<
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
  const activeContacts = contacts.filter((contact) => !isContactDeleted(contact));
  const periodDays = options.periodDays ?? CONTACT_METRICS_DEFAULT_PERIOD_DAYS;
  return {
    total: activeContacts.length,
    newThisPeriod: countContactsCreatedSince(activeContacts, periodDays),
    whatsappCount: activeContacts.filter((contact) => hasWhatsApp(contact)).length,
    incompleteCount: activeContacts.filter((contact) => calculateProfileCompleteness(contact, options.fieldConfig) < 100).length,
    duplicatePairCount: findContactDuplicatePairs(activeContacts, options.duplicateDetectionPreferences ?? {}).length,
  };
}
