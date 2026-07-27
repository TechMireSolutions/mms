import { useMemo } from 'react';
import {
  MESSAGING_MODULE_CONTRACT,
  buildMessagingRecipientsWorkColumnRegistry,
  buildMessagingHistoryWorkColumnRegistry,
  buildMessagingTemplatesWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

export function useMessagingRecipientsColumnLayout() {
  const { t } = useTranslation();

  const tenantRegistry = useMemo(
    () =>
      buildMessagingRecipientsWorkColumnRegistry({
        recipient: t('messaging.recipient'),
        phone: t('contacts.form.primaryPhone'),
        email: t('contacts.form.primaryEmail'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: `${MESSAGING_MODULE_CONTRACT.moduleId}_recipients`,
    tenantRegistry,
    translationPrefix: 'messaging.columns',
  });
}

export function useMessagingHistoryColumnLayout() {
  const { t } = useTranslation();

  const tenantRegistry = useMemo(
    () =>
      buildMessagingHistoryWorkColumnRegistry({
        recipient: t('messaging.recipient'),
        channel: t('messaging.channel'),
        body: t('messaging.messageBody'),
        dateSent: t('messaging.dateSent'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: `${MESSAGING_MODULE_CONTRACT.moduleId}_history`,
    tenantRegistry,
    translationPrefix: 'messaging.columns',
  });
}

export function useMessagingTemplatesColumnLayout() {
  const { t } = useTranslation();

  const tenantRegistry = useMemo(
    () =>
      buildMessagingTemplatesWorkColumnRegistry({
        label: t('messaging.templateLabel'),
        category: t('messaging.category'),
        body: t('messaging.templateCopy'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: `${MESSAGING_MODULE_CONTRACT.moduleId}_templates`,
    tenantRegistry,
    translationPrefix: 'messaging.columns',
  });
}
