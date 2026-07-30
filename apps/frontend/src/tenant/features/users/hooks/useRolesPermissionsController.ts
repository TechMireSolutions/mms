import { useEffect, useMemo, useState } from 'react';
import {
  filterRbacModulesForSettings,
  workspaceRoleLabel,
  type WorkspaceRole,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { useIsAdminViewer } from '@/tenant/hooks/useViewerRole';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { useUsersConfig } from '@/hooks/useStandardModuleConfig';
import { notify } from '@/lib/notify';
import { useRolesPermissionDraft } from '@/tenant/features/users/hooks/useRolesPermissionDraft';

export function useRolesPermissionsController() {
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

  useEffect(() => {
    if (!editing) {
      setRoles(loadedRoles);
    }
  }, [loadedRoles, editing]);

  const displayRole = selected ?? roles[0] ?? null;

  const {
    permDraft,
    permDirty,
    togglePermDraft,
    selectAllDraft,
    clearAllDraft,
    resetPermDraft,
  } = useRolesPermissionDraft(displayRole);

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

  return {
    t,
    isAdmin,
    visibleModules,
    roles,
    editing,
    setEdit,
    setSel,
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
  };
}
