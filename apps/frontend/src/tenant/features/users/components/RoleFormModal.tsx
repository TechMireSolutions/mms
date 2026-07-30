import { useEffect, useState } from 'react';
import type React from 'react';
import {
  PERMISSION_ACTIONS,
  type PermissionAction,
  type PermissionMap,
  type RbacModuleDef,
  type WorkspaceRole,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { FormModal } from '@/components/ui/FormModal';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { PermissionMatrix } from '@/tenant/features/users/components/PermissionMatrix';

interface RoleFormModalProps {
  open: boolean;
  title: string;
  role?: WorkspaceRole | null;
  visibleModules: readonly RbacModuleDef[];
  onSave: (role: WorkspaceRole) => void;
  onClose: () => void;
}

export function RoleFormModal({
  open,
  title,
  role,
  visibleModules,
  onSave,
  onClose,
}: RoleFormModalProps): React.JSX.Element {
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
    setPerms((previousPermissions) => {
      const currentActions = previousPermissions[moduleId] || [];
      const updatedActions = currentActions.includes(action)
        ? currentActions.filter((permissionAction) => permissionAction !== action)
        : [...currentActions, action];
      return { ...previousPermissions, [moduleId]: updatedActions };
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
              onChange={(event) => setName(event.target.value)}
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
              onChange={(event) => setDesc(event.target.value)}
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
