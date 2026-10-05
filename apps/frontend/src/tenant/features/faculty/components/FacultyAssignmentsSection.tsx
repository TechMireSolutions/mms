/**
 * @file FacultyAssignmentsSection.tsx
 * @description Detail-drawer section listing multi-role appointments (read-only list + FormModal writes).
 */

import { useState } from 'react';
import { Briefcase, Plus } from 'lucide-react';
import type { FacultyAssignmentEntity, FacultyMember } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { OrganizationPositionFormModal } from '@/tenant/components/organization/OrganizationPositionFormModal';
import { FacultyAssignmentFormModal } from './FacultyAssignmentFormModal';
import { FacultyAssignmentListItem } from './FacultyAssignmentListItem';
import { FacultyAssignmentsConfirmDialogs } from './FacultyAssignmentsConfirmDialogs';
import { FacultyCatalogCreateOverlays } from './FacultyCatalogCreateOverlays';
import { useFacultyAssignmentsController } from '../hooks/useFacultyAssignmentsController';
import { useFacultyFormCatalogQuickCreate } from '../hooks/useFacultyFormCatalogQuickCreate';

export function FacultyAssignmentsSection({
  faculty,
  canEdit = false,
}: {
  faculty: FacultyMember;
  canEdit?: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const catalogCreate = useFacultyFormCatalogQuickCreate();
  const [createPositionOpen, setCreatePositionOpen] = useState(false);
  const [pendingClose, setPendingClose] = useState<FacultyAssignmentEntity | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FacultyAssignmentEntity | null>(null);
  const ctrl = useFacultyAssignmentsController(faculty);
  const modalOpen = canEdit && ctrl.mode !== 'idle';

  let body: React.JSX.Element;
  if (ctrl.isPending) {
    body = (
      <div className="space-y-2.5">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  } else if (ctrl.isError) {
    body = (
      <ErrorState
        compact
        title={t('faculty.loadFailed')}
        description={t('faculty.loadFailedHint')}
        onRetry={() => void ctrl.refetch()}
      />
    );
  } else if (ctrl.assignments.length === 0) {
    body = (
      <EmptyState
        compact
        icon={Briefcase}
        title={t('faculty.assignments.emptyTitle')}
        description={t('faculty.assignments.emptyHint')}
      />
    );
  } else {
    // Action header (Add) stays outside; list uses Card (DetailSectionCard can't host header actions).
    body = (
      <Card className="divide-y divide-border/50 p-0">
        {ctrl.assignments.map((assignment) => (
          <FacultyAssignmentListItem
            key={assignment.id}
            assignment={assignment}
            positionLabel={
              assignment.positionId
                ? ctrl.positionNameById.get(assignment.positionId) ?? assignment.positionId
                : t('faculty.assignments.vacantPosition')
            }
            canEdit={canEdit}
            busy={ctrl.isBusy}
            onEdit={() => ctrl.openEdit(assignment)}
            onClose={() => setPendingClose(assignment)}
            onDelete={() => setPendingDelete(assignment)}
          />
        ))}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <DetailSectionTitle count={ctrl.isPending || ctrl.isError ? undefined : ctrl.assignments.length}>
          {t('faculty.assignments.title')}
        </DetailSectionTitle>
        {canEdit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 px-3 gap-1.5 text-xs font-medium"
            onClick={ctrl.openAdd}
            disabled={ctrl.isBusy || modalOpen}
          >
            <Plus className="size-3.5" aria-hidden />
            {t('common.add')}
          </Button>
        ) : null}
      </div>

      {body}

      <FacultyAssignmentFormModal
        open={modalOpen}
        mode={ctrl.mode === 'edit' ? 'edit' : 'add'}
        form={ctrl.form}
        departmentOptions={ctrl.departmentOptions}
        designationOptions={ctrl.designationOptions}
        positionOptions={ctrl.positionOptions}
        requiresPosition={ctrl.requiresPosition}
        allowEmptyPosition={ctrl.allowEmptyPosition}
        showLegacyPositionWarning={ctrl.showLegacyPositionWarning}
        isBusy={ctrl.isBusy}
        canAddCatalog={canEdit}
        onOpenAddDepartment={() => catalogCreate.openCreateDepartment(null)}
        onOpenAddDesignation={() => catalogCreate.openCreateDesignation(null)}
        onOpenAddPosition={() => setCreatePositionOpen(true)}
        onPatchForm={(patch) => ctrl.setForm((prev) => ({ ...prev, ...patch }))}
        onSubmit={() => void ctrl.handleSubmit()}
        onClose={ctrl.reset}
      />

      <FacultyCatalogCreateOverlays
        createDepartmentOpen={catalogCreate.createDepartmentOpen}
        onCloseDepartment={catalogCreate.closeDepartment}
        createDesignationOpen={catalogCreate.createDesignationOpen}
        onCloseDesignation={catalogCreate.closeDesignation}
        onDepartmentCreated={(department) => {
          catalogCreate.applyDepartmentCreated(department, (_rowKey, patch) => {
            ctrl.setForm((prev) => ({
              ...prev,
              departmentId: patch.departmentId,
              positionId: '',
            }));
          });
        }}
        onDesignationCreated={(designation) => {
          catalogCreate.applyDesignationCreated(designation, (_rowKey, patch) => {
            ctrl.setForm((prev) => ({
              ...prev,
              designationId: patch.designationId,
              positionId: '',
            }));
          });
        }}
      />

      <OrganizationPositionFormModal
        open={createPositionOpen}
        onClose={() => setCreatePositionOpen(false)}
        onCreated={(positionId) => {
          ctrl.setForm((prev) => ({ ...prev, positionId }));
        }}
      />

      <FacultyAssignmentsConfirmDialogs
        pendingClose={pendingClose}
        pendingDelete={pendingDelete}
        onClearClose={() => setPendingClose(null)}
        onClearDelete={() => setPendingDelete(null)}
        onConfirmClose={ctrl.handleClose}
        onConfirmDelete={ctrl.handleDelete}
      />
    </div>
  );
}
