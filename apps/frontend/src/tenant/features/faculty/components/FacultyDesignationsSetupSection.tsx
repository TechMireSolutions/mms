import React, { useState } from 'react';
import { Award, Plus } from 'lucide-react';
import type { FacultyDesignationDefinition } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { SectionCard } from '@/components/ui/SectionCard';
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

export interface FacultyDesignationsSetupSectionProps {
  /** When set, Add opens the page-level create modal instead of a local one. */
  onRequestAdd?: () => void;
}

/** Dynamic designation catalog, including authority rank and allowed workspace roles. */
export function FacultyDesignationsSetupSection({
  onRequestAdd,
}: FacultyDesignationsSetupSectionProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const query = useFacultyDesignations();
  const save = useSaveFacultyDesignation();
  const remove = useDeleteFacultyDesignation();
  const workspaceRoles = useWorkspaceRoles();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<FacultyDesignationDefinition | null>(null);
  const [designationToDelete, setDesignationToDelete] = useState<FacultyDesignationDefinition | null>(null);

  const isPending = save.isPending || remove.isPending;

  const handleOpenAdd = () => {
    if (onRequestAdd) {
      onRequestAdd();
      return;
    }
    setEditingDesignation(null);
    setModalOpen(true);
  };

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
    <SectionCard
      title={t('faculty.designations.setupTitle')}
      icon={Award}
      accentColor="primary"
      actions={
        <Button
          type="button"
          size="sm"
          onClick={handleOpenAdd}
          className="gap-1.5 min-h-9"
        >
          <Plus className="size-4" aria-hidden />
          <span>{t('faculty.designations.addDesignation')}</span>
        </Button>
      }
    >
      <div className="space-y-4 text-start">
        <p className="text-sm text-muted-foreground">{t('faculty.designations.setupHint')}</p>

        <FacultyDesignationsTable
          designations={query.data ?? []}
          roles={workspaceRoles}
          editingDesignationId={editingDesignation?.id}
          isPending={isPending}
          isLoading={query.isLoading}
          onEdit={handleStartEdit}
          onDelete={(d) => setDesignationToDelete(d)}
        />

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
      </div>
    </SectionCard>
  );
}
