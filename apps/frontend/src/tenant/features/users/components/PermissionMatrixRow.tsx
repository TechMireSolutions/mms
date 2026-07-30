import React from 'react';
import { Check, X } from 'lucide-react';
import {
  PERMISSION_ACTIONS,
  type PermissionAction,
  type PermissionMap,
  type RbacModuleDef,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { PermCell } from '@/tenant/features/users/components/RolesPermCell';

export interface PermissionMatrixActions {
  perms: PermissionMap;
  readOnly: boolean;
  onToggle: (moduleId: string, action: PermissionAction) => void;
  onSelectAll: (moduleId: string) => void;
  onClearAll: (moduleId: string) => void;
}

export interface PermissionMatrixRowProps extends PermissionMatrixActions {
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
