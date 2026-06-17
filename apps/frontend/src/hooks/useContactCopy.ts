import { useCallback } from 'react';
import type { AppTranslationKey } from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';

/** Maps legacy `uiStrings` keys to `appTranslations` keys (contacts migration bridge). */
const CONTACT_UI_I18N: Partial<Record<string, AppTranslationKey>> = {
  cancel: 'common.cancel',
  yes: 'common.yes',
  no: 'common.no',
  addContact: 'contacts.addContact',
  duplicates: 'contacts.duplicates',
  searchPlaceholder: 'contacts.searchPlaceholder',
  sms: 'contacts.sms',
  bulkSmsMessage: 'contacts.bulkSmsMessage',
  openSmsApp: 'contacts.openSmsApp',
  smsManualSendNote: 'contacts.smsManualSendNote',
  smsMessagePlaceholder: 'contacts.smsMessagePlaceholder',
  smsNoPhone: 'contacts.smsNoPhone',
  smsMessageRequired: 'contacts.smsMessageRequired',
  smsOpenFailed: 'contacts.smsOpenFailed',
  smsNoEligibleContacts: 'contacts.smsNoEligibleContacts',
  contactsHavePhone: 'contacts.contactsHavePhone',
  messageTemplate: 'contacts.messageTemplate',
  messageBody: 'contacts.messageBody',
  of: 'contacts.of',
};

/**
 * Resolves contact copy via `t()` when migrated, else tenant `uiStrings` overrides.
 * Prefer this over raw `uiStrings` in new/edited contact UI.
 */
export function useContactCopy(): (key: string, fallback?: string) => string {
  const { t } = useTranslation();
  const { uiStrings } = useContactConfig();

  return useCallback(
    (key: string, fallback?: string) => {
      const i18nKey = CONTACT_UI_I18N[key];
      if (i18nKey) {
        return t(i18nKey);
      }
      const legacy = uiStrings[key];
      if (legacy) return legacy;
      return fallback ?? key;
    },
    [t, uiStrings],
  );
}
