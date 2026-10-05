/**
 * @file FacultyAssignmentFormModal.tsx
 * @description FormModal for faculty appointment create/edit (Drawer stays read-only).
 */

import { useEffect, useMemo, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { FormModal } from '@/components/ui/FormModal';
import { useTranslation } from '@/hooks/useTranslation';
import type { AssignmentFormState } from '../hooks/useFacultyAssignmentsController';
import { FacultyAssignmentFormFields } from './FacultyAssignmentFormFields';

export interface FacultyAssignmentFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  form: AssignmentFormState;
  departmentOptions: Array<{ value: string; label: string }>;
  designationOptions: Array<{ value: string; label: string }>;
  positionOptions: Array<{ value: string; label: string }>;
  requiresPosition: boolean;
  allowEmptyPosition: boolean;
  showLegacyPositionWarning: boolean;
  isBusy: boolean;
  canAddCatalog?: boolean;
  onOpenAddDepartment?: () => void;
  onOpenAddDesignation?: () => void;
  onOpenAddPosition?: () => void;
  onPatchForm: (patch: Partial<AssignmentFormState>) => void;
  onSubmit: () => void;
  onClose: () => void;
}

function snapshotForm(form: AssignmentFormState): string {
  return JSON.stringify(form);
}

export function FacultyAssignmentFormModal({
  open,
  mode,
  form,
  departmentOptions,
  designationOptions,
  positionOptions,
  requiresPosition,
  allowEmptyPosition,
  showLegacyPositionWarning,
  isBusy,
  canAddCatalog = false,
  onOpenAddDepartment,
  onOpenAddDesignation,
  onOpenAddPosition,
  onPatchForm,
  onSubmit,
  onClose,
}: FacultyAssignmentFormModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [baseline, setBaseline] = useState('');

  useEffect(() => {
    if (open) {
      setBaseline(snapshotForm(form));
    }
    // Capture baseline once when the modal opens — ignore subsequent form edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open edge only
  }, [open]);

  const isDirty = useMemo(
    () => open && baseline.length > 0 && snapshotForm(form) !== baseline,
    [open, form, baseline],
  );

  if (!open) return null;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? t('faculty.assignments.editTitle') : t('faculty.assignments.addTitle')}
      subtitle={t('faculty.assignments.positionHint')}
      icon={Briefcase}
      size="md"
      cancelLabel={t('common.cancel')}
      saveLabel={t('common.save')}
      saving={isBusy}
      saveDisabled={isBusy}
      isDirty={isDirty}
      discardUnsavedTitle={t('faculty.form.discardUnsavedTitle')}
      discardUnsavedDescription={t('faculty.form.discardUnsavedDescription')}
      discardConfirmLabel={t('faculty.form.discardChanges')}
      discardCancelLabel={t('faculty.form.keepEditing')}
      onSave={onSubmit}
    >
      <FacultyAssignmentFormFields
        form={form}
        departmentOptions={departmentOptions}
        designationOptions={designationOptions}
        positionOptions={positionOptions}
        requiresPosition={requiresPosition}
        allowEmptyPosition={allowEmptyPosition}
        showLegacyPositionWarning={showLegacyPositionWarning}
        canAddCatalog={canAddCatalog}
        onOpenAddDepartment={onOpenAddDepartment}
        onOpenAddDesignation={onOpenAddDesignation}
        onOpenAddPosition={onOpenAddPosition}
        onPatchForm={onPatchForm}
      />
    </FormModal>
  );
}
