import { useMemo } from 'react';
import {
  getMessageCategoryLabelKey,
  MESSAGING_MODULE_MANIFEST,
} from '@mms/shared';
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';

export function useMessagingPageOptions() {
  const { t } = useTranslation();

  const categorySelectOptions = useMemo(() => [
    { value: 'all', label: t('messaging.category.all') },
    ...MESSAGING_MODULE_MANIFEST.categoryOptions.map((option) => ({
      value: option.value,
      label: t(option.labelKey),
    })),
  ], [t]);

  const templateCategorySelectOptions = useMemo(
    () => MESSAGING_MODULE_MANIFEST.categoryOptions.map((option) => ({
      value: option.value,
      label: t(option.labelKey),
    })),
    [t],
  );

  const channelSelectOptions = useMemo(
    () => MESSAGING_MODULE_MANIFEST.channelOptions.map((option) => ({
      value: option.value,
      label: t(option.labelKey),
    })),
    [t],
  );

  const roleOptions = useMemo(
    () => MESSAGING_MODULE_MANIFEST.roleOptions.map((option) => ({
      value: option.value,
      label: t(option.labelKey),
    })),
    [t],
  );

  const genderOptions = useMemo(
    () => MESSAGING_MODULE_MANIFEST.genderOptions.map((option) => ({
      value: option.value,
      label: t(option.labelKey),
    })),
    [t],
  );

  const statusOptions = useMemo(
    () => MESSAGING_MODULE_MANIFEST.statusOptions.map((option) => ({
      value: option.value,
      label: t(option.labelKey),
    })),
    [t],
  );

  const categoryBadgeConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    general: { label: t(getMessageCategoryLabelKey('general')), cls: SEMANTIC_BADGE.muted },
    academic: { label: t(getMessageCategoryLabelKey('academic')), cls: SEMANTIC_BADGE.info },
    financial: { label: t(getMessageCategoryLabelKey('financial')), cls: SEMANTIC_BADGE.success },
    attendance: { label: t(getMessageCategoryLabelKey('attendance')), cls: SEMANTIC_BADGE.warning },
    emergency: { label: t(getMessageCategoryLabelKey('emergency')), cls: SEMANTIC_BADGE.destructive },
  }), [t]);

  const logStatusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    sent: { label: t('messaging.status.sent'), cls: SEMANTIC_BADGE.success },
    delivered: { label: t('messaging.status.delivered'), cls: SEMANTIC_BADGE.successStrong },
    failed: { label: t('messaging.status.failed'), cls: SEMANTIC_BADGE.destructive },
    skipped: { label: t('messaging.status.skipped'), cls: SEMANTIC_BADGE.muted },
  }), [t]);

  return {
    categorySelectOptions,
    templateCategorySelectOptions,
    channelSelectOptions,
    roleOptions,
    genderOptions,
    statusOptions,
    categoryBadgeConfig,
    logStatusConfig,
  };
}
