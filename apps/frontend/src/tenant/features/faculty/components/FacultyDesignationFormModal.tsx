import React, { useEffect, useMemo, useState } from 'react';
import { Award } from 'lucide-react';
import { workspaceRoleLabel, type FacultyDesignationDefinition, type WorkspaceRole } from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/FormPrimitives';
import { FormModal } from '@/components/ui/FormModal';
import { FORM_INPUT } from '@/components/ui/formStyles';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { slugifyDepartmentCode } from '../hooks/useFacultyDepartmentsController';

export interface FacultyDesignationFormModalProps {
  open: boolean;
  onClose: () => void;
  designation: FacultyDesignationDefinition | null;
  workspaceRoles: readonly WorkspaceRole[];
  isPending: boolean;
  designationOptions?: readonly FacultyDesignationDefinition[];
  onSave: (payload: Pick<FacultyDesignationDefinition, 'id' | 'code' | 'name' | 'hierarchyRank' | 'isActive' | 'assignableRoles'>) => Promise<void>;
}

export function FacultyDesignationFormModal({
  open,
  onClose,
  designation,
  workspaceRoles,
  isPending,
  designationOptions = [],
  onSave,
}: FacultyDesignationFormModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [reportingDesignationId, setReportingDesignationId] = useState('');
  const [hierarchyRank, setHierarchyRank] = useState(1);
  const [assignableRoles, setAssignableRoles] = useState<string[]>([]);

  const availableDesignations = useMemo(
    () => designationOptions.filter((d) => d.id !== designation?.id),
    [designationOptions, designation?.id],
  );

  const reportingOptions = useMemo(() => [
    { value: '', label: t('faculty.designations.topLevel') },
    ...availableDesignations.map((d) => ({
      value: d.id,
      label: d.name,
    })),
  ], [availableDesignations, t]);

  useEffect(() => {
    if (open) {
      if (designation) {
        setName(designation.name);
        const existingSuperior = availableDesignations
          .filter((d) => d.hierarchyRank < designation.hierarchyRank)
          .sort((a, b) => b.hierarchyRank - a.hierarchyRank)[0];
        setReportingDesignationId(existingSuperior ? existingSuperior.id : '');
        setHierarchyRank(designation.hierarchyRank);
        setAssignableRoles(designation.assignableRoles ?? []);
      } else {
        setName('');
        setReportingDesignationId('');
        setHierarchyRank(1);
        setAssignableRoles([]);
      }
    }
  }, [open, designation, availableDesignations]);

  const handleReportingDesignationChange = (val: string) => {
    setReportingDesignationId(val);
    if (!val) {
      setHierarchyRank(1);
    } else {
      const parent = availableDesignations.find((d) => d.id === val);
      setHierarchyRank(parent ? Math.min(99, parent.hierarchyRank + 1) : 2);
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const trimmedCode = designation?.code || slugifyDepartmentCode(trimmedName) || `des-${Date.now().toString(36)}`;

    await onSave({
      id: designation?.id || crypto.randomUUID(),
      name: trimmedName,
      code: trimmedCode,
      hierarchyRank,
      isActive: designation?.isActive ?? true,
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
      saveDisabled={isPending || !name.trim()}
      onSave={() => void handleSubmit()}
    >
      <div className="space-y-4 py-1 text-start">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t('faculty.designations.name')} id="modal-designation-name" required>
            <Input
              id="modal-designation-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={FORM_INPUT}
              disabled={isPending}
              autoFocus
            />
          </Field>

          <Field label={t('faculty.designations.reportingDesignation')} id="modal-designation-reporting">
            <FormSelect
              id="modal-designation-reporting"
              name="reportingDesignationId"
              value={reportingDesignationId}
              onChange={handleReportingDesignationChange}
              options={reportingOptions}
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
