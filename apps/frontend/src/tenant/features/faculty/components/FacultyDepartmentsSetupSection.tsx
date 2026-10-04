import React, { useState } from 'react';
import type { FacultyDepartmentEntity } from '@mms/shared';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ErrorState } from '@/components/ui/ErrorState';
import { ModuleTierMotion } from '@/components/ui/ModuleTierMotion';
import { notify } from '@/lib/notify';
import { FacultyDepartmentsTable } from './FacultyDepartmentsTable';
import { FacultyDepartmentFormModal } from './FacultyDepartmentFormModal';
import { useFacultyDepartmentsController } from '../hooks/useFacultyDepartmentsController';
import {
  useFacultyDepartments,
  useSaveFacultyDepartment,
} from '../hooks/useFacultyDepartments';

/** Departments work surface — same directory chrome as Faculties (toolbar + table/cards). */
export function FacultyDepartmentsSetupSection(): React.JSX.Element {
  const {
    t,
    departments,
    orderedDepartments,
    parentOptions,
    isPending,
    handleDelete,
  } = useFacultyDepartmentsController();
  const query = useFacultyDepartments();
  const saveMutation = useSaveFacultyDepartment();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<FacultyDepartmentEntity | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<FacultyDepartmentEntity | null>(null);

  const handleStartEdit = (dept: FacultyDepartmentEntity) => {
    setEditingDepartment(dept);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingDepartment(null);
  };

  const handleSave = async (payload: {
    id?: string;
    name: string;
    code: string;
    parentId: string | null;
    isActive: boolean;
  }) => {
    try {
      await saveMutation.mutateAsync({
        id: payload.id || crypto.randomUUID(),
        name: payload.name,
        code: payload.code,
        parentId: payload.parentId,
        isActive: payload.isActive,
      });
      notify.success(t('faculty.setup.departmentSaved'));
    } catch {
      notify.error(t('faculty.setup.lookupsSaveFailed'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    await handleDelete(deptToDelete);
    setDeptToDelete(null);
  };

  return (
    <ErrorBoundary>
      <ModuleTierMotion tier="work-departments" className="space-y-5">
        {query.isError ? (
          <ErrorState
            title={t('faculty.setup.departmentsLoadFailed')}
            description={t('faculty.loadFailedHint')}
            onRetry={() => void query.refetch()}
          />
        ) : (
          <FacultyDepartmentsTable
            departments={departments}
            orderedDepartments={orderedDepartments}
            editingDepartmentId={editingDepartment?.id}
            isPending={isPending || saveMutation.isPending}
            isLoading={query.isLoading}
            onEdit={handleStartEdit}
            onDelete={(d) => setDeptToDelete(d)}
          />
        )}

        <FacultyDepartmentFormModal
          open={modalOpen}
          onClose={handleCloseModal}
          department={editingDepartment}
          parentOptions={parentOptions}
          existingDepartments={departments}
          isPending={saveMutation.isPending}
          onSave={handleSave}
        />

        <ConfirmAlertDialog
          open={Boolean(deptToDelete)}
          onOpenChange={(open) => !open && setDeptToDelete(null)}
          title={t('faculty.setup.deleteDepartment')}
          description={
            deptToDelete
              ? t('faculty.setup.deleteDepartmentConfirm', { name: deptToDelete.name })
              : ''
          }
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          destructive
          onConfirm={handleConfirmDelete}
        />
      </ModuleTierMotion>
    </ErrorBoundary>
  );
}
