import React, { useEffect } from 'react';
import { Plus, Pencil, Shield, Lock } from 'lucide-react';
import {
  workspaceRoleDescription,
  workspaceRoleLabel,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { UserRoleBadge } from '@/tenant/features/users/components/UserBadges';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { PermissionMatrix } from '@/tenant/features/users/components/PermissionMatrix';
import { RoleFormModal } from '@/tenant/features/users/components/RoleFormModal';
import { useRolesPermissionsController } from '@/tenant/features/users/hooks/useRolesPermissionsController';

export interface RolesPermissionsProps {
  onDirtyChange?: (dirty: boolean) => void;
  onRegisterDiscard?: (discard: () => void) => void;
}

export function RolesPermissions({
  onDirtyChange,
  onRegisterDiscard,
}: RolesPermissionsProps = {}): React.JSX.Element {
  const {
    t,
    isAdmin,
    visibleModules,
    roles,
    editing,
    requestSelectRole,
    requestEditRole,
    closeRoleForm,
    pendingMatrixLeave,
    clearPendingMatrixLeave,
    confirmPendingMatrixLeave,
    displayRole,
    permDraft,
    permDirty,
    togglePermDraft,
    selectAllDraft,
    clearAllDraft,
    resetPermDraft,
    handleSave,
    savePermissionDraft,
    editTitle,
  } = useRolesPermissionsController();

  useEffect(() => {
    onDirtyChange?.(permDirty);
  }, [permDirty, onDirtyChange]);

  useEffect(() => {
    onRegisterDiscard?.(resetPermDraft);
    return () => {
      onDirtyChange?.(false);
    };
  }, [onRegisterDiscard, resetPermDraft, onDirtyChange]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-foreground">{t('users.permissions.rolesTitle')}</p>
            {isAdmin ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11 px-2 text-xs"
                onClick={() => requestEditRole('new')}
              >
                <Plus className="me-1 h-3 w-3" />
                {t('users.permissions.addRole')}
              </Button>
            ) : null}
          </div>
          {roles.length === 0 ? (
            <EmptyState variant="dashed" title={t('users.permissions.emptyRoles')} compact />
          ) : null}
          {roles.map((workspaceRole) => (
            <div
              key={workspaceRole.id}
              role="button"
              tabIndex={0}
              onClick={() => requestSelectRole(workspaceRole)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  requestSelectRole(workspaceRole);
                }
              }}
              className={`w-full cursor-pointer rounded-xl border-2 p-3 text-start transition-all ${
                displayRole?.id === workspaceRole.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {workspaceRole.isSystem ? (
                      <UserRoleBadge roleId={workspaceRole.id} />
                    ) : (
                      <SettingsMetaBadge variant={workspaceRole.badgeVariant}>{workspaceRoleLabel(workspaceRole, t)}</SettingsMetaBadge>
                    )}
                    {workspaceRole.isSystem ? (
                      <SettingsMetaBadge variant="muted">{t('users.permissions.systemBadge')}</SettingsMetaBadge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {workspaceRoleDescription(workspaceRole, t)}
                  </p>
                </div>
                 {!workspaceRole.isSystem && isAdmin ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      requestEditRole(workspaceRole);
                    }}
                    className="shrink-0 rounded text-muted-foreground transition-colors hover:text-primary shadow-none hover:bg-transparent"
                    aria-label={t('users.permissions.editRoleDetails', { name: workspaceRoleLabel(workspaceRole, t) })}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 lg:col-span-2">
          {displayRole && permDraft ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">
                    {t('users.permissions.matrixTitle', { name: workspaceRoleLabel(displayRole, t) })}
                  </p>
                  {displayRole.isSystem ? <Lock className="h-3 w-3 text-muted-foreground" aria-hidden /> : null}
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    {permDirty ? (
                      <SettingsMetaBadge variant="warning">{t('users.permissions.unsaved')}</SettingsMetaBadge>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!permDirty}
                      onClick={resetPermDraft}
                    >
                      {t('users.permissions.resetPermissions')}
                    </Button>
                    <Button type="button" size="sm" disabled={!permDirty} onClick={savePermissionDraft}>
                      {t('users.permissions.savePermissions')}
                    </Button>
                  </div>
                ) : null}
              </div>
              {isAdmin ? (
                <p className="text-xs text-muted-foreground">{t('users.permissions.editHint')}</p>
              ) : null}
              <PermissionMatrix
                modules={visibleModules}
                perms={permDraft}
                readOnly={!isAdmin}
                onToggle={togglePermDraft}
                onSelectAll={selectAllDraft}
                onClearAll={clearAllDraft}
              />
            </>
          ) : null}
        </div>
      </div>

      <RoleFormModal
        open={!!editing}
        onClose={closeRoleForm}
        title={editTitle}
        role={editing === 'new' ? null : editing}
        visibleModules={visibleModules}
        onSave={handleSave}
      />

      <ConfirmAlertDialog
        open={pendingMatrixLeave !== null}
        onOpenChange={(open) => {
          if (!open) clearPendingMatrixLeave();
        }}
        title={t('settings.unsavedChanges')}
        description={t('users.permissions.discardUnsavedMatrixConfirm')}
        confirmLabel={t('common.yes')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmPendingMatrixLeave}
      />
    </div>
  );
}
