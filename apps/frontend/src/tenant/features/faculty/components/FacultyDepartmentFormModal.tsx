import React, { useEffect, useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
import type { FacultyDepartmentEntity } from '@mms/shared';
import { Field } from '@/components/ui/FormPrimitives';
import { FormModal } from '@/components/ui/FormModal';
import { FormSelect } from '@/components/ui/FormSelect';
import { FORM_INPUT } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { slugifyDepartmentCode } from '../hooks/useFacultyDepartmentsController';

export interface FacultyDepartmentFormModalProps {
  open: boolean;
  onClose: () => void;
  department: FacultyDepartmentEntity | null;
  parentOptions: { value: string; label: string }[];
  existingDepartments: FacultyDepartmentEntity[];
  isPending: boolean;
  onSave: (payload: {
    id?: string;
    name: string;
    code: string;
    parentId: string | null;
    isActive: boolean;
  }) => Promise<void>;
}

export function FacultyDepartmentFormModal({
  open,
  onClose,
  department,
  parentOptions,
  existingDepartments,
  isPending,
  onSave,
}: FacultyDepartmentFormModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  const statusOptions = useMemo(() => [
    { value: 'active', label: t('faculty.status.active') },
    { value: 'inactive', label: t('faculty.status.inactive') },
  ], [t]);

  useEffect(() => {
    if (open) {
      if (department) {
        setName(department.name);
        setCode(department.code);
        setParentId(department.parentId || '');
        setIsActive(department.isActive !== false);
        setCodeManuallyEdited(true);
      } else {
        setName('');
        setCode('');
        setParentId('');
        setIsActive(true);
        setCodeManuallyEdited(false);
      }
    }
  }, [open, department]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!codeManuallyEdited && !department) {
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

    const editingId = department?.id;
    const isDuplicate = existingDepartments.some(
      (d) => d.id !== editingId && d.code.toLowerCase() === trimmedCode.toLowerCase(),
    );
    if (isDuplicate) {
      notify.error(t('faculty.setup.departmentCodeDuplicate'));
      return;
    }

    await onSave({
      id: editingId,
      name: trimmedName,
      code: trimmedCode,
      parentId: parentId.trim() || null,
      isActive,
    });
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={department ? t('faculty.setup.editDepartment') : t('faculty.setup.addDepartment')}
      subtitle={t('faculty.setup.addDepartmentSubtitle')}
      icon={Building2}
      size="md"
      cancelLabel={t('common.cancel')}
      saveLabel={department ? t('faculty.setup.updateDepartment') : t('faculty.setup.addDepartment')}
      saving={isPending}
      saveDisabled={isPending || !name.trim()}
      onSave={() => void handleSubmit()}
    >
      <div className="space-y-4 py-1 text-start">
        <Field label={t('faculty.setup.departmentName')} id="department-form-name" required>
          <Input
            id="department-form-name"
            name="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t('faculty.setup.departmentNamePlaceholder')}
            className={FORM_INPUT}
            disabled={isPending}
            autoFocus
          />
        </Field>

        <Field label={t('faculty.setup.departmentCode')} id="department-form-code" required>
          <Input
            id="department-form-code"
            name="code"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={t('faculty.setup.departmentCodePlaceholder')}
            className={FORM_INPUT}
            maxLength={32}
            disabled={isPending}
          />
        </Field>

        <Field label={t('faculty.setup.parentDepartment')} id="department-form-parent">
          <FormSelect
            id="department-form-parent"
            value={parentId}
            onChange={setParentId}
            options={parentOptions}
            disabled={isPending}
          />
        </Field>

        <Field label={t('common.status')} id="department-form-status" required>
          <FormSelect
            id="department-form-status"
            name="status"
            value={isActive ? 'active' : 'inactive'}
            onChange={(val) => setIsActive(val === 'active')}
            options={statusOptions}
            disabled={isPending}
          />
        </Field>
      </div>
    </FormModal>
  );
}
