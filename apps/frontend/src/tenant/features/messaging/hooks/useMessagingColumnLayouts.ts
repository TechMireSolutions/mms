import {
  MESSAGING_MODULE_MANIFEST,
  buildMessagingRecipientsWorkColumnRegistry,
  buildMessagingHistoryWorkColumnRegistry,
  buildMessagingTemplatesWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

export function useMessagingRecipientsColumnLayout() {
  const { t } = useTranslation();

  const tenantRegistry = (() =>
      buildMessagingRecipientsWorkColumnRegistry({
        recipient: t('messaging.recipient'),
        phone: t('contacts.form.primaryPhone'),
        email: t('contacts.form.primaryEmail'),
      }))();

  return useModuleColumnLayout({
    moduleId: `${MESSAGING_MODULE_MANIFEST.moduleId}_recipients`,
    tenantRegistry,
    apiPath: `${MESSAGING_MODULE_MANIFEST.restBasePath}/recipients`,
    translationPrefix: 'messaging.columns',
  });
}

export function useMessagingHistoryColumnLayout() {
  const { t } = useTranslation();

  const tenantRegistry = (() =>
      buildMessagingHistoryWorkColumnRegistry({
        recipient: t('messaging.recipient'),
        channel: t('messaging.channel'),
        body: t('messaging.messageBody'),
        dateSent: t('messaging.dateSent'),
      }))();

  return useModuleColumnLayout({
    moduleId: `${MESSAGING_MODULE_MANIFEST.moduleId}_history`,
    tenantRegistry,
    apiPath: `${MESSAGING_MODULE_MANIFEST.restBasePath}/history`,
    translationPrefix: 'messaging.columns',
  });
}

export function useMessagingTemplatesColumnLayout() {
  const { t } = useTranslation();

  const tenantRegistry = (() =>
      buildMessagingTemplatesWorkColumnRegistry({
        label: t('messaging.templateLabel'),
        category: t('messaging.category'),
        body: t('messaging.templateCopy'),
      }))();

  return useModuleColumnLayout({
    moduleId: `${MESSAGING_MODULE_MANIFEST.moduleId}_templates`,
    tenantRegistry,
    apiPath: `${MESSAGING_MODULE_MANIFEST.restBasePath}/templates`,
    translationPrefix: 'messaging.columns',
  });
}
