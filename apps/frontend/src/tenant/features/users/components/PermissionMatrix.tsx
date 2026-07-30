import React from 'react';
import { BookOpen, Check, X } from 'lucide-react';
import {
  groupRbacModulesForPermissionsNav,
  PERMISSION_ACTIONS,
  type PermissionAction,
  type PermissionMap,
  type RbacModuleDef,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { PermCell } from '@/tenant/features/users/components/RolesPermCell';

interface PermissionMatrixProps {
  modules: readonly RbacModuleDef[];
  perms: PermissionMap;
  readOnly: boolean;
  onToggle: (moduleId: string, action: PermissionAction) => void;
  onSelectAll: (moduleId: string) => void;
  onClearAll: (moduleId: string) => void;
}

interface PermissionMatrixActions {
  perms: PermissionMap;
  readOnly: boolean;
  onToggle: (moduleId: string, action: PermissionAction) => void;
  onSelectAll: (moduleId: string) => void;
  onClearAll: (moduleId: string) => void;
}

interface PermissionMatrixRowProps extends PermissionMatrixActions {
  mod: RbacModuleDef;
  inGroup: boolean;
}

export function PermissionMatrixRow({
  mod,
  perms,
  readOnly,
  inGroup,
  onToggle,
  onSelectAll,
  onClearAll,
}: PermissionMatrixRowProps): React.JSX.Element {
  const { t } = useTranslation();
  const currentActions = perms[mod.id] || [];
  const allChecked = PERMISSION_ACTIONS.every((permissionAction) => currentActions.includes(permissionAction));
  const hasAny = currentActions.length > 0;

  return (
    <tr
      className={`transition-colors ${hasAny || !readOnly ? 'hover:bg-muted/10' : 'opacity-40'}`}
    >
      <td
        className={`px-3 py-2.5 text-xs font-semibold text-foreground ${inGroup ? 'ps-8' : ''}`}
      >
        {t(mod.labelKey)}
      </td>
      {PERMISSION_ACTIONS.map((permissionAction) => (
        <td key={permissionAction} className="px-2 py-2.5">
          {readOnly ? (
            <div
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg border-2 ${
                currentActions.includes(permissionAction)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-transparent'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
            </div>
          ) : (
            <PermCell
              checked={currentActions.includes(permissionAction)}
              onChange={() => onToggle(mod.id, permissionAction)}
              ariaLabel={`${t(mod.labelKey)}: ${t(`users.permission.${permissionAction}`)}`}
            />
          )}
        </td>
      ))}
      {!readOnly ? (
        <td className="px-2 py-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => (allChecked ? onClearAll(mod.id) : onSelectAll(mod.id))}
            aria-label={`${t('users.permissions.colAll')}: ${t(mod.labelKey)}`}
            className={`mx-auto flex min-h-11 min-w-11 items-center justify-center rounded-lg border-2 text-xs font-bold transition-all p-0 shadow-none ${
              allChecked
                ? 'border-primary bg-primary/15 text-primary hover:bg-primary/25'
                : 'border-primary/30 text-primary/60 hover:bg-primary/10'
            }`}
          >
            {allChecked ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
          </Button>
        </td>
      ) : null}
    </tr>
  );
}

type PermissionMatrixMobileRowProps = Omit<PermissionMatrixRowProps, 'inGroup'>;

export function PermissionMatrixMobileRow({
  mod,
  perms,
  readOnly,
  onToggle,
  onSelectAll,
  onClearAll,
}: PermissionMatrixMobileRowProps): React.JSX.Element {
  const { t } = useTranslation();
  const currentActions = perms[mod.id] || [];
  const allChecked = PERMISSION_ACTIONS.every((permissionAction) => currentActions.includes(permissionAction));
  const hasAny = currentActions.length > 0;

  return (
    <article className={`space-y-3 rounded-xl border border-border bg-card p-3 ${hasAny || !readOnly ? '' : 'opacity-40'}`}>
      <div className="flex items-center justify-between gap-3">
        <h4 className="min-w-0 text-sm font-semibold text-foreground">{t(mod.labelKey)}</h4>
        {!readOnly ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => (allChecked ? onClearAll(mod.id) : onSelectAll(mod.id))}
            aria-label={`${t('users.permissions.colAll')}: ${t(mod.labelKey)}`}
            className="shrink-0"
          >
            {allChecked ? <X className="h-3.5 w-3.5" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
            {t('users.permissions.colAll')}
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PERMISSION_ACTIONS.map((permissionAction) => (
          <div key={permissionAction} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-muted/40 p-2">
            <span className="truncate text-xs font-medium text-muted-foreground">
              {t(`users.permission.${permissionAction}`)}
            </span>
            {readOnly ? (
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 ${
                  currentActions.includes(permissionAction)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-transparent'
                }`}
                aria-label={`${t(mod.labelKey)}: ${t(`users.permission.${permissionAction}`)}`}
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
              </div>
            ) : (
              <PermCell
                checked={currentActions.includes(permissionAction)}
                onChange={() => onToggle(mod.id, permissionAction)}
                ariaLabel={`${t(mod.labelKey)}: ${t(`users.permission.${permissionAction}`)}`}
              />
            )}
          </div>
        ))}
      </div>
    </article>
  );
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
                perms={perms}
                readOnly={readOnly}
                onToggle={onToggle}
                onSelectAll={onSelectAll}
                onClearAll={onClearAll}
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
                    perms={perms}
                    readOnly={readOnly}
                    inGroup={!!group.labelKey}
                    onToggle={onToggle}
                    onSelectAll={onSelectAll}
                    onClearAll={onClearAll}
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
