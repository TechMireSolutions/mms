import type { AppTranslationKey } from '@mms/shared';
import { toTitleCase } from '@mms/shared';
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';

type Translate = (key: AppTranslationKey) => string;

/** Localized label for a student status slug (configured or default). */
export function studentStatusLabel(t: Translate, status: string): string {
  const key = `students.form.status.${status}` as AppTranslationKey;
  const translated = t(key);
  return translated === key ? toTitleCase(status) : translated;
}

/** StatusBadge config for student statuses — tones + translated labels. */
export function studentStatusBadgeConfig(t: Translate): Record<string, StatusBadgeConfigItem> {
  return {
    active: { label: studentStatusLabel(t, 'active'), cls: SEMANTIC_BADGE.success },
    inactive: { label: studentStatusLabel(t, 'inactive'), cls: SEMANTIC_BADGE.muted },
    suspended: { label: studentStatusLabel(t, 'suspended'), cls: SEMANTIC_BADGE.warning },
    graduated: { label: studentStatusLabel(t, 'graduated'), cls: SEMANTIC_BADGE.info },
    transferred: { label: studentStatusLabel(t, 'transferred'), cls: SEMANTIC_BADGE.infoStrong },
  };
}
