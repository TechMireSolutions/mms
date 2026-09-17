import { resolveTeacherStatusRoles, resolveTeacherStatuses, resolveFacultyStatusRoles, resolveFacultyStatuses } from '@mms/shared';
import type { AccentColor } from '@/components/ui/statCardAccent';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { createModuleStatusUi } from '@/lib/moduleStatusUi';

const resolveRoles = resolveFacultyStatusRoles || resolveTeacherStatusRoles;
const resolveStatuses = resolveFacultyStatuses || resolveTeacherStatuses;

const { active: FACULTY_STATUS_ACTIVE, onLeave: FACULTY_STATUS_ON_LEAVE } = resolveRoles();

/** Status → semantic accent (badge classes + metrics StatCard share this map). */
function facultyStatusSemanticAccent(status: string): AccentColor {
  if (status === FACULTY_STATUS_ACTIVE) return 'success';
  if (status === FACULTY_STATUS_ON_LEAVE) return 'warning';
  return 'muted';
}

/** Status slug → SEMANTIC_BADGE tone class (aligned with the accent map). */
function facultyStatusTone(status: string): string {
  const accent = facultyStatusSemanticAccent(status);
  if (accent === 'success') return SEMANTIC_BADGE.success;
  if (accent === 'warning') return SEMANTIC_BADGE.warning;
  return 'muted';
}

const facultyStatusUi = createModuleStatusUi({
  translationPrefix: 'teachers.status',
  resolveStatuses,
  toneForStatus: facultyStatusTone,
  metricAccentForStatus: facultyStatusSemanticAccent,
});

export const facultyStatusLabel = facultyStatusUi.statusLabel;
export const facultyStatusOptions = facultyStatusUi.statusOptions;
export const facultyStatusBadgeConfig = facultyStatusUi.statusBadgeConfig;
export const facultyStatusMetricAccent = facultyStatusUi.statusMetricAccent;

export const teacherStatusLabel = facultyStatusLabel;
export const teacherStatusOptions = facultyStatusOptions;
export const teacherStatusBadgeConfig = facultyStatusBadgeConfig;
export const teacherStatusMetricAccent = facultyStatusMetricAccent;
