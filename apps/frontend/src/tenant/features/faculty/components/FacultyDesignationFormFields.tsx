import React from 'react';
import { workspaceRoleLabel, type WorkspaceRole } from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/FormPrimitives';
import { FORM_INPUT } from '@/components/ui/formStyles';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';

export interface FacultyDesignationFormFieldsProps {
  name: string;
  code: string;
  parentDesignationId: string;
  isActive: boolean;
  assignableRoles: string[];
  parentOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  workspaceRoles: readonly WorkspaceRole[];
  isPending: boolean;
  onNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onParentChange: (value: string) => void;
  onActiveChange: (isActive: boolean) => void;
  onAssignableRolesChange: (roles: string[]) => void;
}

export function FacultyDesignationFormFields({
  name,
  code,
  parentDesignationId,
  isActive,
  assignableRoles,
  parentOptions,
  statusOptions,
  workspaceRoles,
  isPending,
  onNameChange,
  onCodeChange,
  onParentChange,
  onActiveChange,
  onAssignableRolesChange,
}: FacultyDesignationFormFieldsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 py-1 text-start">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={t('faculty.designations.name')} id="modal-designation-name" required>
          <Input
            id="modal-designation-name"
            name="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className={FORM_INPUT}
            disabled={isPending}
            autoFocus
          />
        </Field>

        <Field label={t('faculty.designations.code')} id="modal-designation-code" required>
          <Input
            id="modal-designation-code"
            name="code"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            className={FORM_INPUT}
            maxLength={32}
            disabled={isPending}
          />
        </Field>

        <Field label={t('faculty.designations.parentDesignation')} id="modal-designation-parent">
          <FormSelect
            id="modal-designation-parent"
            name="parentDesignationId"
            value={parentDesignationId}
            onChange={onParentChange}
            options={parentOptions}
            disabled={isPending}
          />
        </Field>

        <Field label={t('common.status')} id="modal-designation-status" required>
          <FormSelect
            id="modal-designation-status"
            name="status"
            value={isActive ? 'active' : 'inactive'}
            onChange={(val) => onActiveChange(val === 'active')}
            options={statusOptions}
            disabled={isPending}
          />
        </Field>
      </div>

      <Field label={t('faculty.designations.roles')} id="modal-designation-roles">
        <div id="modal-designation-roles" className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
          {workspaceRoles.map((role) => {
            const checked = assignableRoles.includes(role.id);
            return (
              <div key={role.id} className="flex min-h-11 items-center gap-2">
                <Checkbox
                  id={`modal-role-${role.id}`}
                  checked={checked}
                  disabled={isPending}
                  onCheckedChange={(next) =>
                    onAssignableRolesChange(
                      next === true
                        ? [...new Set([...assignableRoles, role.id])]
                        : assignableRoles.filter((id) => id !== role.id),
                    )
                  }
                />
                <label htmlFor={`modal-role-${role.id}`} className="cursor-pointer text-sm select-none">
                  {workspaceRoleLabel(role, t)}
                </label>
              </div>
            );
          })}
        </div>
      </Field>
    </div>
  );
}
