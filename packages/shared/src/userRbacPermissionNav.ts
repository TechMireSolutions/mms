import type { AppTranslationKey } from './appTranslations.js';
import type { RbacModuleDef } from './userEntityTypes.js';

/** Standalone RBAC row in the permissions matrix nav layout. */
export interface RbacPermissionNavModule {
  type: 'module';
  rbacId: string;
}

/** Grouped RBAC rows — mirrors sidebar Academics section. */
export interface RbacPermissionNavGroup {
  type: 'group';
  labelKey: AppTranslationKey;
  rbacIds: readonly string[];
}

export type RbacPermissionNavEntry = RbacPermissionNavModule | RbacPermissionNavGroup;

/**
 * Permissions matrix section order — aligned with `NAV_ITEMS` / `SYSTEM_MODULE_NAV`
 * (standalone items + Academics group; RBAC ids where they differ from `moduleId`).
 */
export const RBAC_PERMISSION_NAV: readonly RbacPermissionNavEntry[] = [
  { type: 'module', rbacId: 'dashboard' },
  {
    type: 'group',
    labelKey: 'nav.academics',
    rbacIds: ['students', 'teachers', 'sessions', 'attendance', 'enrollments', 'hasanat', 'examinations', 'questionBank'],
  },
  { type: 'module', rbacId: 'finance' },
  { type: 'module', rbacId: 'users' },
  { type: 'module', rbacId: 'settings' },
] as const;

/** One render section in the permissions matrix (optional group heading + module rows). */
export interface RbacPermissionMatrixGroup {
  labelKey?: AppTranslationKey;
  modules: RbacModuleDef[];
}

/** Orders visible RBAC modules into sidebar-aligned groups for the permissions matrix. */
export function groupRbacModulesForPermissionsNav(
  visibleModules: readonly RbacModuleDef[],
): RbacPermissionMatrixGroup[] {
  const moduleById = new Map(visibleModules.map((moduleDefinition) => [moduleDefinition.id, moduleDefinition]));
  const placed = new Set<string>();
  const groups: RbacPermissionMatrixGroup[] = [];

  const pushStandalone = (rbacId: string): void => {
    const moduleDefinition = moduleById.get(rbacId);
    if (!moduleDefinition || placed.has(rbacId)) return;
    placed.add(rbacId);
    groups.push({ modules: [moduleDefinition] });
  };

  for (const entry of RBAC_PERMISSION_NAV) {
    if (entry.type === 'module') {
      pushStandalone(entry.rbacId);
      continue;
    }
    const mods: RbacModuleDef[] = [];
    for (const rbacId of entry.rbacIds) {
      const moduleDefinition = moduleById.get(rbacId);
      if (moduleDefinition && !placed.has(rbacId)) {
        mods.push(moduleDefinition);
        placed.add(rbacId);
      }
    }
    if (mods.length > 0) {
      groups.push({ labelKey: entry.labelKey, modules: mods });
    }
  }

  for (const mod of visibleModules) {
    if (!placed.has(mod.id)) {
      groups.push({ modules: [mod] });
    }
  }

  return groups;
}
