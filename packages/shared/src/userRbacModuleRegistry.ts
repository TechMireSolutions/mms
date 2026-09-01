/**
 * @file userRbacModuleRegistry.ts
 * @description Single source of truth for RBAC permission modules and system-settings integration.
 */

import { SYSTEM_MODULES_BY_ID, normalizeEnabledModules } from './settingsTypes.js';
import type { RbacModuleDef } from './userEntityTypes.js';

/** Canonical tuple of all 16 RBAC module identifiers. */
export const RBAC_MODULE_IDS = [
  'dashboard',
  'contacts',
  'messaging',
  'students',
  'teachers',
  'sessions',
  'attendance',
  'enrollments',
  'hasanat',
  'examinations',
  'questionBank',
  'finance',
  'accounting',
  'obligations',
  'users',
  'settings',
] as const;

export type RbacModuleId = (typeof RBAC_MODULE_IDS)[number];

export const RBAC_MODULE_REGISTRY: readonly RbacModuleDef[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard' },
  { id: 'contacts', labelKey: 'nav.contacts' },
  { id: 'messaging', labelKey: 'nav.messaging' },
  { id: 'students', labelKey: 'nav.students' },
  { id: 'teachers', labelKey: 'nav.teachers' },
  { id: 'sessions', labelKey: 'nav.sessions' },
  { id: 'attendance', labelKey: 'nav.attendance' },
  { id: 'enrollments', labelKey: 'nav.enrollments' },
  { id: 'hasanat', labelKey: 'nav.hasanatCards' },
  { id: 'examinations', labelKey: 'nav.examinations' },
  { id: 'questionBank', labelKey: 'nav.questionBank' },
  { id: 'finance', labelKey: 'nav.finance' },
  { id: 'accounting', labelKey: 'nav.accounting' },
  { id: 'obligations', labelKey: 'nav.obligations' },
  { id: 'users', labelKey: 'nav.users' },
  { id: 'settings', labelKey: 'nav.settings' },
] as const;

/** Fast O(1) module definition lookup map. */
export const RBAC_MODULES_BY_ID: Readonly<Record<string, RbacModuleDef>> = Object.freeze(
  Object.fromEntries(RBAC_MODULE_REGISTRY.map((m) => [m.id, m])),
);

/** Retrieves module definition for a given RBAC module ID. */
export function getRbacModuleDef(id: string): RbacModuleDef | undefined {
  return RBAC_MODULES_BY_ID[id];
}

/** Type guard verifying if a string is a valid RbacModuleId. */
export function isValidRbacModuleId(id: unknown): id is RbacModuleId {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(RBAC_MODULES_BY_ID, id);
}

/**
 * Maps RBAC matrix row ids to `global_settings.enabledModules` keys where they differ.
 * (e.g. RBAC `enrollments` ↔ system module `enrollment`.)
 */
export const RBAC_SYSTEM_MODULE_ID: Readonly<Record<string, string>> = Object.freeze({
  enrollments: 'enrollment',
  examinations: 'examination',
  obligations: 'finance',
});

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
  const normalized = normalizeEnabledModules(enabledModules);
  return RBAC_MODULE_REGISTRY.filter((m) => {
    if (m.id === 'settings') return true;
    const systemId = rbacModuleSystemId(m.id);
    if (!SYSTEM_MODULES_BY_ID[systemId]) return true;
    return normalized[systemId] !== false;
  });
}
