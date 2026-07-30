import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Shield, Lock } from 'lucide-react';
import {
  filterRbacModulesForSettings,
  PERMISSION_ACTIONS,
  workspaceRoleDescription,
  workspaceRoleLabel,
  type PermissionAction,
  type PermissionMap,
  type WorkspaceRole,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { useIsAdminViewer } from '@/tenant/hooks/useViewerRole';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { useUsersConfig } from '@/hooks/useStandardModuleConfig';
import { notify } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { UserRoleBadge } from '@/tenant/features/users/components/UserBadges';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { PermissionMatrix } from '@/tenant/features/users/components/PermissionMatrix';
import { RoleFormModal } from '@/tenant/features/users/components/RoleFormModal';

export function RolesPermissions(): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, updateSettings } = useUsersConfig();
  const globalSettings = useGlobalSettings();
  const isAdmin = useIsAdminViewer();
  const loadedRoles = useWorkspaceRoles();
  const visibleModules = useMemo(
    () => filterRbacModulesForSettings(globalSettings.enabledModules),
    [globalSettings.enabledModules],
  );
  const [roles, setRoles] = useState<WorkspaceRole[]>(loadedRoles);
  const [editing, setEdit] = useState<WorkspaceRole | 'new' | null>(null);
  const [selected, setSel] = useState<WorkspaceRole | null>(null);
  const [permDraft, setPermDraft] = useState<PermissionMap | null>(null);
  const [permDraftRoleId, setPermDraftRoleId] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setRoles(loadedRoles);
    }
  }, [loadedRoles, editing]);

  const displayRole = selected ?? roles[0] ?? null;

  useEffect(() => {
    if (!displayRole) {
      setPermDraft(null);
      setPermDraftRoleId(null);
      return;
    }
    if (displayRole.id !== permDraftRoleId) {
      setPermDraft(structuredClone(displayRole.permissions));
      setPermDraftRoleId(displayRole.id);
    }
  }, [displayRole, permDraftRoleId]);

  const permDirty = useMemo(() => {
    if (!displayRole || !permDraft) return false;
    return JSON.stringify(permDraft) !== JSON.stringify(displayRole.permissions);
  }, [displayRole, permDraft]);

  const togglePermDraft = (moduleId: string, action: PermissionAction): void => {
    setPermDraft((previousPermissions) => {
      if (!previousPermissions) return previousPermissions;
      const currentActions = previousPermissions[moduleId] || [];
      const updatedActions = currentActions.includes(action)
        ? currentActions.filter((permissionAction) => permissionAction !== action)
        : [...currentActions, action];
      return { ...previousPermissions, [moduleId]: updatedActions };
    });
  };

  const selectAllDraft = (moduleId: string): void => {
    setPermDraft((previousPermissions) => (previousPermissions ? { ...previousPermissions, [moduleId]: [...PERMISSION_ACTIONS] } : previousPermissions));
  };

  const clearAllDraft = (moduleId: string): void => {
    setPermDraft((previousPermissions) => (previousPermissions ? { ...previousPermissions, [moduleId]: [] } : previousPermissions));
  };

  const resetPermDraft = (): void => {
    if (displayRole) {
      setPermDraft(structuredClone(displayRole.permissions));
    }
  };

  const commitRole = (role: WorkspaceRole, toastKey: 'role' | 'permissions'): void => {
    setRoles((previousRoles) => {
      const existingRole = previousRoles.find((workspaceRole) => workspaceRole.id === role.id);
      const updatedRoles = existingRole
        ? previousRoles.map((workspaceRole) => (workspaceRole.id === role.id ? role : workspaceRole))
        : [...previousRoles, role];
      updateSettings({ ...settings, workspaceRoles: updatedRoles });
      return updatedRoles;
    });
    setEdit(null);
    setSel(role);
    if (toastKey === 'permissions') {
      notify.success(t('users.permissions.permissionsSaved'), {
        description: t('users.permissions.permissionsSavedDesc', { name: workspaceRoleLabel(role, t) }),
      });
    } else {
      notify.success(t('users.permissions.roleSaved'), {
        description: t('users.permissions.roleSavedDesc', { name: workspaceRoleLabel(role, t) }),
      });
    }
  };

  const handleSave = (role: WorkspaceRole): void => {
    commitRole(role, 'role');
  };

  const savePermissionDraft = (): void => {
    if (!displayRole || !permDraft || !isAdmin) return;
    commitRole({ ...displayRole, permissions: structuredClone(permDraft) }, 'permissions');
  };

  const editTitle = editing
    ? editing === 'new'
      ? t('users.permissions.createTitle')
      : t('users.permissions.editTitle', { name: workspaceRoleLabel(editing, t) })
    : '';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-foreground">{t('users.permissions.rolesTitle')}</p>
            {isAdmin ? (
              <Button type="button" variant="ghost" size="sm" className="min-h-11 px-2 text-xs" onClick={() => setEdit('new')}>
                <Plus className="me-1 h-3 w-3" />
                {t('users.permissions.addRole')}
              </Button>
            ) : null}
          </div>
          {roles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              {t('users.permissions.emptyRoles')}
            </div>
          ) : null}
          {roles.map((workspaceRole) => (
            <div
              key={workspaceRole.id}
              role="button"
              tabIndex={0}
              onClick={() => setSel(workspaceRole)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSel(workspaceRole);
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
                      setEdit(workspaceRole);
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
        onClose={() => setEdit(null)}
        title={editTitle}
        role={editing === 'new' ? null : editing}
        visibleModules={visibleModules}
        onSave={handleSave}
      />
    </div>
  );
}
