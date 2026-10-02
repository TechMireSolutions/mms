import React, { useState } from 'react';
import { Award, Plus } from 'lucide-react';
import type { FacultyDesignationDefinition } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/SectionCard';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { useFacultyDesignations, useSaveFacultyDesignation } from '../hooks/useFacultyDesignations';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { FacultyDesignationsTable } from './FacultyDesignationsTable';
import { FacultyDesignationFormModal } from './FacultyDesignationFormModal';

/** Dynamic designation catalog, including authority rank and allowed workspace roles. */
export function FacultyDesignationsSetupSection(): React.JSX.Element {
  const { t } = useTranslation();
  const query = useFacultyDesignations();
  const save = useSaveFacultyDesignation();
  const workspaceRoles = useWorkspaceRoles();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<FacultyDesignationDefinition | null>(null);

  const handleOpenAdd = () => {
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
          isPending={save.isPending}
          isLoading={query.isLoading}
          onEdit={handleStartEdit}
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
      </div>
    </SectionCard>
  );
}
