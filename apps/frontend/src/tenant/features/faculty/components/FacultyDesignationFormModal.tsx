import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { workspaceRoleLabel, type FacultyDesignationDefinition, type WorkspaceRole } from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/FormPrimitives';
import { FormModal } from '@/components/ui/FormModal';
import { FORM_INPUT } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/useTranslation';
import { slugifyDepartmentCode } from '../hooks/useFacultyDepartmentsController';

export interface FacultyDesignationFormModalProps {
  open: boolean;
  onClose: () => void;
  designation: FacultyDesignationDefinition | null;
  workspaceRoles: readonly WorkspaceRole[];
  isPending: boolean;
  onSave: (payload: Pick<FacultyDesignationDefinition, 'id' | 'code' | 'name' | 'hierarchyRank' | 'isActive' | 'assignableRoles'>) => Promise<void>;
}

const DEFAULT_DRAFT = { id: '', name: '', code: '', hierarchyRank: 4, isActive: true, assignableRoles: [] as string[] };

export function FacultyDesignationFormModal({
  open,
  onClose,
  designation,
  workspaceRoles,
  isPending,
  onSave,
}: FacultyDesignationFormModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hierarchyRank, setHierarchyRank] = useState(4);
  const [isActive, setIsActive] = useState(true);
  const [assignableRoles, setAssignableRoles] = useState<string[]>([]);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  useEffect(() => {
    if (open) {
      if (designation) {
        setName(designation.name);
        setCode(designation.code);
        setHierarchyRank(designation.hierarchyRank);
        setIsActive(designation.isActive);
        setAssignableRoles(designation.assignableRoles ?? []);
        setCodeManuallyEdited(true);
      } else {
        setName(DEFAULT_DRAFT.name);
        setCode(DEFAULT_DRAFT.code);
        setHierarchyRank(DEFAULT_DRAFT.hierarchyRank);
        setIsActive(DEFAULT_DRAFT.isActive);
        setAssignableRoles(DEFAULT_DRAFT.assignableRoles);
        setCodeManuallyEdited(false);
      }
    }
  }, [open, designation]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!codeManuallyEdited && !designation) {
      setCode(slugifyDepartmentCode(val));
    }
  };

  const handleCodeChange = (val: string) => {
    setCode(slugifyDepartmentCode(val));
    setCodeManuallyEdited(true);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim() || slugifyDepartmentCode(trimmedName);
    if (!trimmedName || !trimmedCode) return;

    await onSave({
      id: designation?.id || crypto.randomUUID(),
      name: trimmedName,
      code: trimmedCode,
      hierarchyRank,
      isActive,
      assignableRoles,
    });
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={designation ? t('faculty.designations.editDesignation') : t('faculty.designations.addDesignation')}
      subtitle={t('faculty.designations.modalSubtitle')}
      icon={Award}
      size="lg"
      cancelLabel={t('common.cancel')}
      saveLabel={designation ? t('common.save') : t('faculty.designations.addDesignation')}
      saving={isPending}
      saveDisabled={isPending || !name.trim() || !code.trim()}
      onSave={() => void handleSubmit()}
    >
      <div className="space-y-4 py-1 text-start">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t('faculty.designations.name')} id="modal-designation-name" required>
            <Input
              id="modal-designation-name"
              name="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
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
              onChange={(e) => handleCodeChange(e.target.value)}
              className={FORM_INPUT}
              maxLength={32}
              disabled={isPending}
            />
          </Field>

          <Field label={t('faculty.form.hierarchyRank')} id="modal-designation-rank" required>
            <Input
              id="modal-designation-rank"
              name="hierarchyRank"
              type="text"
              inputMode="numeric"
              min={1}
              max={99}
              value={hierarchyRank}
              onChange={(e) => setHierarchyRank(Number(e.target.value) || 1)}
              className={FORM_INPUT}
              disabled={isPending}
            />
          </Field>

          <Field label={t('faculty.designations.active')} id="modal-designation-active">
            <div className="flex min-h-11 items-center gap-3">
              <Switch
                id="modal-designation-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isPending}
              />
              <span className="text-sm text-muted-foreground">
                {isActive ? t('faculty.status.active') : t('faculty.status.inactive')}
              </span>
            </div>
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
                      setAssignableRoles((current) =>
                        next === true
                          ? [...new Set([...current, role.id])]
                          : current.filter((id) => id !== role.id),
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
    </FormModal>
  );
}
