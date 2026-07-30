import React from 'react';
import { Check, X } from 'lucide-react';
import {
  PERMISSION_ACTIONS,
  type RbacModuleDef,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { PermCell } from '@/tenant/features/users/components/RolesPermCell';
import type { PermissionMatrixActions } from '@/tenant/features/users/components/PermissionMatrixRow';

type PermissionMatrixMobileRowProps = PermissionMatrixActions & {
  mod: RbacModuleDef;
};

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
