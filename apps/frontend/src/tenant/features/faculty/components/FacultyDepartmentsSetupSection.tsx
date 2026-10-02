import React, { useMemo, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import type { FacultyDepartmentEntity } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { SectionCard } from '@/components/ui/SectionCard';
import { notify } from '@/lib/notify';
import { FacultyDepartmentsTable } from './FacultyDepartmentsTable';
import { FacultyDepartmentFormModal } from './FacultyDepartmentFormModal';
import { useFacultyDepartmentsController } from '../hooks/useFacultyDepartmentsController';
import { useSaveFacultyDepartment } from '../hooks/useFacultyDepartments';
import { useFacultyContractList } from '../hooks/useFacultyTsrHooks';

/** Normalized department catalog management using the faculty_departments table. */
export function FacultyDepartmentsSetupSection(): React.JSX.Element {
  const {
    t,
    departments,
    orderedDepartments,
    parentOptions,
    isLoading,
    isPending,
    handleDelete,
  } = useFacultyDepartmentsController();
  const saveMutation = useSaveFacultyDepartment();

  const facultyListQuery = useFacultyContractList({ limit: 100 });
  const allFaculty = ((facultyListQuery.data as { faculty?: Array<{ id: string; name: string }> })?.faculty ?? []);

  const facultyOptions = useMemo(
    () => allFaculty.map((f) => ({ value: f.id, label: f.name })),
    [allFaculty],
  );

  const facultyMap = useMemo(
    () => new Map(allFaculty.map((f) => [f.id, f.name])),
    [allFaculty],
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<FacultyDepartmentEntity | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<FacultyDepartmentEntity | null>(null);

  const handleOpenAdd = () => {
    setEditingDepartment(null);
    setModalOpen(true);
  };

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
    headFacultyId: string | null;
  }) => {
    try {
      await saveMutation.mutateAsync({
        id: payload.id || crypto.randomUUID(),
        name: payload.name,
        code: payload.code,
        parentId: payload.parentId,
        headFacultyId: payload.headFacultyId,
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
    <SectionCard
      title={t('faculty.setup.departmentsTitle')}
      icon={Building2}
      accentColor="primary"
      actions={
        <Button
          type="button"
          size="sm"
          onClick={handleOpenAdd}
          className="gap-1.5 min-h-9"
        >
          <Plus className="size-4" aria-hidden />
          <span>{t('faculty.setup.addDepartment')}</span>
        </Button>
      }
    >
      <div className="space-y-4 text-start">
        <p className="text-sm text-muted-foreground">{t('faculty.setup.departmentsHint')}</p>

        <FacultyDepartmentsTable
          departments={departments}
          orderedDepartments={orderedDepartments}
          facultyMap={facultyMap}
          editingDepartmentId={editingDepartment?.id}
          isPending={isPending || saveMutation.isPending}
          isLoading={isLoading}
          onEdit={handleStartEdit}
          onDelete={(d) => setDeptToDelete(d)}
        />

        <FacultyDepartmentFormModal
          open={modalOpen}
          onClose={handleCloseModal}
          department={editingDepartment}
          parentOptions={parentOptions}
          facultyOptions={facultyOptions}
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
      </div>
    </SectionCard>
  );
}
