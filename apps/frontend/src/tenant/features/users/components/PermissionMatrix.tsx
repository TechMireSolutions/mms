import React from 'react';
import { BookOpen } from 'lucide-react';
import {
  groupRbacModulesForPermissionsNav,
  PERMISSION_ACTIONS,
  type PermissionAction,
  type PermissionMap,
  type RbacModuleDef,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { PermissionMatrixRow } from '@/tenant/features/users/components/PermissionMatrixRow';
import { PermissionMatrixMobileRow } from '@/tenant/features/users/components/PermissionMatrixMobileRow';

interface PermissionMatrixProps {
  modules: readonly RbacModuleDef[];
  perms: PermissionMap;
  readOnly: boolean;
  onToggle: (moduleId: string, action: PermissionAction) => void;
  onSelectAll: (moduleId: string) => void;
  onClearAll: (moduleId: string) => void;
}

export function PermissionMatrix({
  modules,
  perms,
  readOnly,
  onToggle,
  onSelectAll,
  onClearAll,
}: PermissionMatrixProps): React.JSX.Element {
  const { t } = useTranslation();
  const groups = groupRbacModulesForPermissionsNav(modules);
  const colSpan = PERMISSION_ACTIONS.length + 1 + (readOnly ? 0 : 1);
  const matrixActions = { perms, readOnly, onToggle, onSelectAll, onClearAll };

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="space-y-4 p-3 md:hidden">
        {groups.map((group, groupIndex) => (
          <section key={group.labelKey ?? `standalone-${group.modules[0]?.id ?? groupIndex}`} className="space-y-2">
            {group.labelKey ? (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                  <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden />
                </div>
                <h3 className="text-xs font-bold text-foreground">{t(group.labelKey)}</h3>
              </div>
            ) : null}
            {group.modules.map((moduleItem) => (
              <PermissionMatrixMobileRow
                key={moduleItem.id}
                mod={moduleItem}
                {...matrixActions}
              />
            ))}
          </section>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/60">
            <tr>
              <th className="min-w-[8.75rem] px-3 py-2.5 text-start text-xs font-semibold uppercase text-muted-foreground">
                {t('users.permissions.colModule')}
              </th>
              {PERMISSION_ACTIONS.map((permissionAction) => (
                <th
                  key={permissionAction}
                  className="w-16 px-2 py-2.5 text-center text-xs font-semibold uppercase text-muted-foreground"
                >
                  {t(`users.permission.${permissionAction}`)}
                </th>
              ))}
              {!readOnly ? (
                <th className="px-2 py-2.5 text-center text-xs font-semibold uppercase text-muted-foreground">
                  {t('users.permissions.colAll')}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {groups.map((group, groupIndex) => (
              <React.Fragment key={group.labelKey ?? `standalone-${group.modules[0]?.id ?? groupIndex}`}>
                {group.labelKey ? (
                  <tr className="bg-muted/25">
                    <td colSpan={colSpan} className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                          <BookOpen className="h-3 w-3 text-primary" aria-hidden />
                        </div>
                        <span className="text-xs font-bold text-foreground">{t(group.labelKey)}</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {group.modules.map((moduleItem) => (
                  <PermissionMatrixRow
                    key={moduleItem.id}
                    mod={moduleItem}
                    inGroup={!!group.labelKey}
                    {...matrixActions}
                  />
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { PermissionMatrixRow } from '@/tenant/features/users/components/PermissionMatrixRow';
export { PermissionMatrixMobileRow } from '@/tenant/features/users/components/PermissionMatrixMobileRow';
