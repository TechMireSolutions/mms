import React, { useEffect, useMemo, useState } from 'react';
import { Award } from 'lucide-react';
import type { FacultyDesignationDefinition, WorkspaceRole } from '@mms/shared';
import { FormModal } from '@/components/ui/FormModal';
import { useTranslation } from '@/hooks/useTranslation';
import { slugifyDepartmentCode } from '../hooks/useFacultyDepartmentsController';
import { FacultyDesignationFormFields } from './FacultyDesignationFormFields';

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
  const [code, setCode] = useState('');
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [parentDesignationId, setParentDesignationId] = useState('');
  const [hierarchyRank, setHierarchyRank] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [assignableRoles, setAssignableRoles] = useState<string[]>([]);

  const availableDesignations = useMemo(
    () => designationOptions.filter((d) => d.id !== designation?.id),
    [designationOptions, designation?.id],
  );

  const parentOptions = useMemo(() => [
    { value: '', label: t('faculty.designations.topLevel') },
    ...availableDesignations.map((d) => ({ value: d.id, label: d.name })),
  ], [availableDesignations, t]);

  const statusOptions = useMemo(() => [
    { value: 'active', label: t('faculty.status.active') },
    { value: 'inactive', label: t('faculty.status.inactive') },
  ], [t]);

  useEffect(() => {
    if (!open) return;
    if (designation) {
      setName(designation.name);
      setCode(designation.code);
      setCodeManuallyEdited(true);
      const existingParent = availableDesignations
        .filter((d) => d.hierarchyRank < designation.hierarchyRank)
        .sort((a, b) => b.hierarchyRank - a.hierarchyRank)[0];
      setParentDesignationId(existingParent ? existingParent.id : '');
      setHierarchyRank(designation.hierarchyRank);
      setIsActive(designation.isActive);
      setAssignableRoles(designation.assignableRoles ?? []);
      return;
    }
    setName('');
    setCode('');
    setCodeManuallyEdited(false);
    setParentDesignationId('');
    setHierarchyRank(1);
    setIsActive(true);
    setAssignableRoles([]);
  }, [open, designation, availableDesignations]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!codeManuallyEdited && !designation) setCode(slugifyDepartmentCode(val));
  };

  const handleCodeChange = (val: string) => {
    setCode(slugifyDepartmentCode(val));
    setCodeManuallyEdited(true);
  };

  const handleParentDesignationChange = (val: string) => {
    setParentDesignationId(val);
    if (!val) {
      setHierarchyRank(1);
      return;
    }
    const parent = availableDesignations.find((d) => d.id === val);
    setHierarchyRank(parent ? Math.min(99, parent.hierarchyRank + 1) : 2);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const trimmedCode =
      code.trim() || slugifyDepartmentCode(trimmedName) || `des-${Date.now().toString(36)}`;
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
      <FacultyDesignationFormFields
        name={name}
        code={code}
        parentDesignationId={parentDesignationId}
        isActive={isActive}
        assignableRoles={assignableRoles}
        parentOptions={parentOptions}
        statusOptions={statusOptions}
        workspaceRoles={workspaceRoles}
        isPending={isPending}
        onNameChange={handleNameChange}
        onCodeChange={handleCodeChange}
        onParentChange={handleParentDesignationChange}
        onActiveChange={setIsActive}
        onAssignableRolesChange={setAssignableRoles}
      />
    </FormModal>
  );
}
