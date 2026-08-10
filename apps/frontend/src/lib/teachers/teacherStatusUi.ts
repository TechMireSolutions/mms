import { resolveTeacherStatusRoles, resolveTeacherStatuses } from '@mms/shared';
import type { AccentColor } from '@/components/ui/statCardAccent';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { createModuleStatusUi } from '@/lib/moduleStatusUi';

const { active: TEACHER_STATUS_ACTIVE, onLeave: TEACHER_STATUS_ON_LEAVE } =
  resolveTeacherStatusRoles();

/** Status → semantic accent (badge classes + metrics StatCard share this map). */
function teacherStatusSemanticAccent(status: string): AccentColor {
  if (status === TEACHER_STATUS_ACTIVE) return 'success';
  if (status === TEACHER_STATUS_ON_LEAVE) return 'warning';
  return 'muted';
}

/** Status slug → SEMANTIC_BADGE tone class (aligned with the accent map). */
function teacherStatusTone(status: string): string {
  const accent = teacherStatusSemanticAccent(status);
  if (accent === 'success') return SEMANTIC_BADGE.success;
  if (accent === 'warning') return SEMANTIC_BADGE.warning;
  return SEMANTIC_BADGE.muted;
}

const teacherStatusUi = createModuleStatusUi({
  translationPrefix: 'teachers.status',
  resolveStatuses: resolveTeacherStatuses,
  toneForStatus: teacherStatusTone,
  metricAccentForStatus: teacherStatusSemanticAccent,
});

export const teacherStatusLabel = teacherStatusUi.statusLabel;
export const teacherStatusOptions = teacherStatusUi.statusOptions;
export const teacherStatusBadgeConfig = teacherStatusUi.statusBadgeConfig;
export const teacherStatusMetricAccent = teacherStatusUi.statusMetricAccent;
