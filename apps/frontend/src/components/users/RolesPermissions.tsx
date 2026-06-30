import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Shield, Check, X, Lock, BookOpen } from 'lucide-react';
import {
  DEFAULT_USERS_SETTINGS,
  filterRbacModulesForSettings,
  groupRbacModulesForPermissionsNav,
  PERMISSION_ACTIONS,
  workspaceRoleDescription,
  workspaceRoleLabel,
  type PermissionAction,
  type PermissionMap,
  type RbacModuleDef,
  type UsersSettings,
  type WorkspaceRole,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { useIsAdminViewer } from '@/hooks/useViewerRole';
import { useWorkspaceRoles } from '@/hooks/useWorkspaceRoles';
import { getObject, saveObject } from '@/lib/db';
import { notify } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormModal } from '@/components/ui/FormModal';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { UserRoleBadge } from './UserBadges';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';

interface PermCellProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function PermCell({ checked, onChange, disabled = false }: PermCellProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-all p-0 shadow-none hover:bg-transparent ${
        checked
          ? 'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
          : 'border-border bg-card text-transparent hover:border-primary/50'
      } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
    >
      <Check className="h-3.5 w-3.5" />
    </Button>
  );
}

interface RoleFormModalProps {
  open: boolean;
  title: string;
  role?: WorkspaceRole | null;
  visibleModules: readonly RbacModuleDef[];
  onSave: (role: WorkspaceRole) => void;
  onClose: () => void;
}

function RoleFormModal({ open, title, role, visibleModules, onSave, onClose }: RoleFormModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [name, setName] = useState(role?.customLabel ?? '');
  const [desc, setDesc] = useState(role?.customDescription ?? '');
  const [perms, setPerms] = useState<PermissionMap>(
    role?.permissions ? structuredClone(role.permissions) : {},
  );
  const [error, setError] = useState('');

  useEffect(() => {
    setName(role?.customLabel ?? '');
    setDesc(role?.customDescription ?? '');
    setPerms(role?.permissions ? structuredClone(role.permissions) : {});
    setError('');
  }, [role, open]);

  const togglePerm = (moduleId: string, action: PermissionAction): void => {
    setPerms((prev) => {
      const currentActions = prev[moduleId] || [];
      const next = currentActions.includes(action)
        ? currentActions.filter((permissionAction) => permissionAction !== action)
        : [...currentActions, action];
      return { ...prev, [moduleId]: next };
    });
  };

  const selectAll = (moduleId: string): void => {
    setPerms((prev) => ({ ...prev, [moduleId]: [...PERMISSION_ACTIONS] }));
  };

  const clearAll = (moduleId: string): void => {
    setPerms((prev) => ({ ...prev, [moduleId]: [] }));
  };

  const handleSave = (): void => {
    if (!name.trim()) {
      setError(t('users.permissions.errorNameRequired'));
      return;
    }
    onSave({
      id: role?.id ?? `role_${Date.now()}`,
      labelKey: 'users.role.custom',
      descriptionKey: 'users.role.customDesc',
      customLabel: name.trim(),
      customDescription: desc.trim(),
      permissions: perms,
      isSystem: false,
      badgeVariant: 'primary',
    });
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={title}
      size="xl"
      tall
      cancelLabel={t('users.cancel')}
      saveLabel={t('users.permissions.saveRole')}
      onSave={handleSave}
      error={error || undefined}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={FORM_LABEL} htmlFor="role-name">
              {t('users.permissions.fieldName')}
            </label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('users.permissions.fieldNamePlaceholder')}
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="role-desc">
              {t('users.permissions.fieldDescription')}
            </label>
            <Input
              id="role-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={t('users.permissions.fieldDescriptionPlaceholder')}
            />
          </div>
        </div>

        <PermissionMatrix
          modules={visibleModules}
          perms={perms}
          readOnly={false}
          onToggle={togglePerm}
          onSelectAll={selectAll}
          onClearAll={clearAll}
        />
      </div>
    </FormModal>
  );
}

function persistWorkspaceRoles(roles: WorkspaceRole[]): void {
  const settings = getObject<UsersSettings>('users_settings', DEFAULT_USERS_SETTINGS);
  saveObject('users_settings', { ...settings, workspaceRoles: roles });
}

interface PermissionMatrixProps {
  modules: readonly RbacModuleDef[];
  perms: PermissionMap;
  readOnly: boolean;
  onToggle: (moduleId: string, action: PermissionAction) => void;
  onSelectAll: (moduleId: string) => void;
  onClearAll: (moduleId: string) => void;
}

function PermissionMatrixRow({
  mod,
  perms,
  readOnly,
  inGroup,
  onToggle,
  onSelectAll,
  onClearAll,
}: {
  mod: RbacModuleDef;
  perms: PermissionMap;
  readOnly: boolean;
  inGroup: boolean;
  onToggle: (moduleId: string, action: PermissionAction) => void;
  onSelectAll: (moduleId: string) => void;
  onClearAll: (moduleId: string) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const currentActions = perms[mod.id] || [];
  const allChecked = PERMISSION_ACTIONS.every((permissionAction) => currentActions.includes(permissionAction));
  const hasAny = currentActions.length > 0;

  return (
    <tr
      className={`transition-colors ${hasAny || !readOnly ? 'hover:bg-muted/10' : 'opacity-40'}`}
    >
      <td
        className={`px-3 py-2.5 text-xs font-semibold text-foreground ${inGroup ? 'pl-8' : ''}`}
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
            <PermCell checked={currentActions.includes(permissionAction)} onChange={() => onToggle(mod.id, permissionAction)} />
          )}
        </td>
      ))}
      {!readOnly ? (
        <td className="px-2 py-2.5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (allChecked ? onClearAll(mod.id) : onSelectAll(mod.id))}
            className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg border-2 text-xs font-bold transition-all p-0 h-7 w-7 shadow-none ${
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

function PermissionMatrix({
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/60">
            <tr>
              <th className="min-w-[140px] px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-muted-foreground">
                {t('users.permissions.colModule')}
              </th>
              {PERMISSION_ACTIONS.map((a) => (
                <th
                  key={a}
                  className="w-16 px-2 py-2.5 text-center text-[11px] font-semibold uppercase text-muted-foreground"
                >
                  {t(`users.permission.${a}`)}
                </th>
              ))}
              {!readOnly ? (
                <th className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase text-muted-foreground">
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
                {group.modules.map((m) => (
                  <PermissionMatrixRow
                    key={m.id}
                    mod={m}
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

export function RolesPermissions(): React.JSX.Element {
  const { t } = useTranslation();
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
    setPermDraft((prev) => {
      if (!prev) return prev;
      const currentActions = prev[moduleId] || [];
      const next = currentActions.includes(action)
        ? currentActions.filter((permissionAction) => permissionAction !== action)
        : [...currentActions, action];
      return { ...prev, [moduleId]: next };
    });
  };

  const selectAllDraft = (moduleId: string): void => {
    setPermDraft((prev) => (prev ? { ...prev, [moduleId]: [...PERMISSION_ACTIONS] } : prev));
  };

  const clearAllDraft = (moduleId: string): void => {
    setPermDraft((prev) => (prev ? { ...prev, [moduleId]: [] } : prev));
  };

  const resetPermDraft = (): void => {
    if (displayRole) {
      setPermDraft(structuredClone(displayRole.permissions));
    }
  };

  const commitRole = (role: WorkspaceRole, toastKey: 'role' | 'permissions'): void => {
    setRoles((prev) => {
      const exists = prev.find((r) => r.id === role.id);
      const next = exists ? prev.map((r) => (r.id === role.id ? role : r)) : [...prev, role];
      persistWorkspaceRoles(next);
      return next;
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
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">{t('users.permissions.rolesTitle')}</p>
            {isAdmin ? (
              <Button type="button" variant="ghost" size="sm" className="h-auto px-0 text-xs" onClick={() => setEdit('new')}>
                <Plus className="mr-1 h-3 w-3" />
                {t('users.permissions.addRole')}
              </Button>
            ) : null}
          </div>
          {roles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              {t('users.permissions.emptyRoles')}
            </div>
          ) : null}
          {roles.map((r) => (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => setSel(r)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSel(r);
                }
              }}
              className={`w-full cursor-pointer rounded-xl border-2 p-3 text-left transition-all ${
                displayRole?.id === r.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {r.isSystem ? (
                      <UserRoleBadge roleId={r.id} />
                    ) : (
                      <SettingsMetaBadge variant={r.badgeVariant}>{workspaceRoleLabel(r, t)}</SettingsMetaBadge>
                    )}
                    {r.isSystem ? (
                      <SettingsMetaBadge variant="muted">{t('users.permissions.systemBadge')}</SettingsMetaBadge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {workspaceRoleDescription(r, t)}
                  </p>
                </div>
                 {!r.isSystem && isAdmin ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEdit(r);
                    }}
                    className="rounded p-1 text-muted-foreground transition-colors hover:text-primary h-auto w-auto p-1 shadow-none hover:bg-transparent"
                    aria-label={t('users.permissions.editRoleDetails', { name: workspaceRoleLabel(r, t) })}
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
