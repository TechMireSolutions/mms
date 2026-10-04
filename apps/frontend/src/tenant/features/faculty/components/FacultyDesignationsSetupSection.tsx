import React, { useState } from 'react';
import type { FacultyDesignationDefinition } from '@mms/shared';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ErrorState } from '@/components/ui/ErrorState';
import { ModuleTierMotion } from '@/components/ui/ModuleTierMotion';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import {
  useDeleteFacultyDesignation,
  useFacultyDesignations,
  useSaveFacultyDesignation,
} from '../hooks/useFacultyDesignations';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { FacultyDesignationsTable } from './FacultyDesignationsTable';
import { FacultyDesignationFormModal } from './FacultyDesignationFormModal';

/** Designations work surface — same directory chrome as Faculties (toolbar + table/cards). */
export function FacultyDesignationsSetupSection(): React.JSX.Element {
  const { t } = useTranslation();
  const query = useFacultyDesignations();
  const save = useSaveFacultyDesignation();
  const remove = useDeleteFacultyDesignation();
  const workspaceRoles = useWorkspaceRoles();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<FacultyDesignationDefinition | null>(null);
  const [designationToDelete, setDesignationToDelete] = useState<FacultyDesignationDefinition | null>(null);

  const isPending = save.isPending || remove.isPending;

  const handleStartEdit = (designation: FacultyDesignationDefinition) => {
    setEditingDesignation(designation);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingDesignation(null);
  };

  const handleSave = async (
    payload: Pick<FacultyDesignationDefinition, 'id' | 'code' | 'name' | 'hierarchyRank' | 'isActive' | 'assignableRoles'>,
  ) => {
    await save.mutateAsync({
      ...payload,
      id: payload.id || crypto.randomUUID(),
    });
    notify.success(t('faculty.designations.saved'));
  };

  const handleConfirmDelete = async () => {
    if (!designationToDelete) return;
    try {
      await remove.mutateAsync(designationToDelete.id);
      notify.success(t('faculty.designations.deleted'));
      if (editingDesignation?.id === designationToDelete.id) {
        handleCloseModal();
      }
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('faculty.designations.deleteFailed'));
    } finally {
      setDesignationToDelete(null);
    }
  };

  return (
    <ErrorBoundary>
      <ModuleTierMotion tier="work-designations" className="space-y-5">
        {query.isError ? (
          <ErrorState
            title={t('faculty.designations.loadFailed')}
            description={t('faculty.loadFailedHint')}
            onRetry={() => void query.refetch()}
          />
        ) : (
          <FacultyDesignationsTable
            designations={query.data ?? []}
            roles={workspaceRoles}
            editingDesignationId={editingDesignation?.id}
            isPending={isPending}
            isLoading={query.isLoading}
            onEdit={handleStartEdit}
            onDelete={(d) => setDesignationToDelete(d)}
          />
        )}

        <FacultyDesignationFormModal
          open={modalOpen}
          onClose={handleCloseModal}
          designation={editingDesignation}
          workspaceRoles={workspaceRoles}
          isPending={save.isPending}
          designationOptions={query.data ?? []}
          onSave={handleSave}
        />

        <ConfirmAlertDialog
          open={Boolean(designationToDelete)}
          onOpenChange={(open) => !open && setDesignationToDelete(null)}
          title={t('faculty.designations.deleteDesignation')}
          description={
            designationToDelete
              ? t('faculty.designations.deleteDesignationConfirm', { name: designationToDelete.name })
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
