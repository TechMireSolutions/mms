import type { AppTranslationKey } from '@mms/shared';
import { TEACHER_STATUS_VALUES, resolveTeacherStatuses, toTitleCase } from '@mms/shared';
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import type { AccentColor } from '@/components/ui/statCardAccent';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';

type Translate = (key: AppTranslationKey) => string;

const [TEACHER_STATUS_ACTIVE, , TEACHER_STATUS_ON_LEAVE] = TEACHER_STATUS_VALUES;

/** Status → semantic accent (badge classes + metrics StatCard share this map). */
function teacherStatusSemanticAccent(status: string): AccentColor {
  if (status === TEACHER_STATUS_ACTIVE) return 'success';
  if (status === TEACHER_STATUS_ON_LEAVE) return 'warning';
  return 'muted';
}

/** Localized label for a teacher status slug (configured or default). */
export function teacherStatusLabel(t: Translate, status: string): string {
  const key = `teachers.status.${status}` as AppTranslationKey;
  const translated = t(key);
  return translated === key ? toTitleCase(status) : translated;
}

/** Badge / chip tone classes for a teacher status. */
export function teacherStatusTone(status: string): string {
  const accent = teacherStatusSemanticAccent(status);
  if (accent === 'success') return SEMANTIC_BADGE.success;
  if (accent === 'warning') return SEMANTIC_BADGE.warning;
  return SEMANTIC_BADGE.muted;
}

/**
 * Command-metrics StatCard accent for a teacher status — aligned with {@link teacherStatusTone}.
 */
export function teacherStatusMetricAccent(status: string): AccentColor {
  return teacherStatusSemanticAccent(status);
}

/** StatusBadge config for teacher statuses — tones + translated labels. */
export function teacherStatusBadgeConfig(
  t: Translate,
  statuses?: readonly string[],
): Record<string, StatusBadgeConfigItem> {
  const statusValues = resolveTeacherStatuses(statuses);
  const configByStatus: Record<string, StatusBadgeConfigItem> = {};
  for (const statusValue of statusValues) {
    configByStatus[statusValue] = {
      label: teacherStatusLabel(t, statusValue),
      cls: teacherStatusTone(statusValue),
    };
  }
  return configByStatus;
}
