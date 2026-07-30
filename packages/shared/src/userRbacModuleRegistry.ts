import { SYSTEM_MODULES_BY_ID, normalizeEnabledModules } from './settingsTypes.js';
import type { RbacModuleDef } from './userEntityTypes.js';

export const RBAC_MODULE_REGISTRY: readonly RbacModuleDef[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard' },
  { id: 'students', labelKey: 'nav.students' },
  { id: 'teachers', labelKey: 'nav.teachers' },
  { id: 'enrollments', labelKey: 'nav.enrollments' },
  { id: 'sessions', labelKey: 'nav.sessions' },
  { id: 'attendance', labelKey: 'nav.attendance' },
  { id: 'finance', labelKey: 'nav.finance' },
  { id: 'hasanat', labelKey: 'nav.hasanatCards' },
  { id: 'examinations', labelKey: 'nav.examinations' },
  { id: 'questionBank', labelKey: 'nav.questionBank' },
  { id: 'users', labelKey: 'nav.users' },
  { id: 'settings', labelKey: 'nav.settings' },
] as const;

/**
 * Maps RBAC matrix row ids to `global_settings.enabledModules` keys where they differ.
 * (e.g. RBAC `enrollments` ↔ system module `enrollment`.)
 */
export const RBAC_SYSTEM_MODULE_ID: Record<string, string> = {
  enrollments: 'enrollment',
  examinations: 'examination',
};

/** Resolves the system-modules settings key for an RBAC permission row. */
export function rbacModuleSystemId(rbacModuleId: string): string {
  return RBAC_SYSTEM_MODULE_ID[rbacModuleId] ?? rbacModuleId;
}

/**
 * Whether an RBAC module row should appear in the permissions matrix
 * (respects Settings → System Modules toggles).
 */
export function isRbacModuleEnabled(
  rbacModuleId: string,
  enabledModules?: Record<string, boolean> | null,
): boolean {
  if (rbacModuleId === 'settings') return true;
  const normalized = normalizeEnabledModules(enabledModules);
  const systemId = rbacModuleSystemId(rbacModuleId);
  if (!SYSTEM_MODULES_BY_ID[systemId]) return true;
  return normalized[systemId] !== false;
}

/** RBAC registry rows visible for the current workspace module toggles. */
export function filterRbacModulesForSettings(
  enabledModules?: Record<string, boolean> | null,
): RbacModuleDef[] {
  return RBAC_MODULE_REGISTRY.filter((m) => isRbacModuleEnabled(m.id, enabledModules));
}
