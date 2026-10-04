/**
 * @file FacultyAssignmentsSection.tsx
 * @description Detail-drawer section listing multi-role appointments and position occupancy.
 */

import { Briefcase, Plus } from 'lucide-react';
import type { FacultyMember } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import { OrganizationPositionFormModal } from '@/tenant/components/organization/OrganizationPositionFormModal';
import { FacultyAssignmentFormCard } from './FacultyAssignmentFormCard';
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
  const {
    assignments,
    isPending,
    mode,
    form,
    setForm,
    departmentOptions,
    designationOptions,
    positionOptions,
    positionNameById,
    requiresPosition,
    allowEmptyPosition,
    showLegacyPositionWarning,
    isBusy,
    reset,
    openEdit,
    openAdd,
    handleSubmit,
  } = useFacultyAssignmentsController(faculty);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <DetailSectionTitle>{t('faculty.assignments.title')}</DetailSectionTitle>
        {canEdit && mode === 'idle' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 px-3 gap-1.5 text-xs font-medium"
            onClick={openAdd}
          >
            <Plus className="size-3.5" aria-hidden />
            {t('common.add')}
          </Button>
        )}
      </div>

      {canEdit && mode !== 'idle' && (
        <FacultyAssignmentFormCard
          mode={mode}
          form={form}
          departmentOptions={departmentOptions}
          designationOptions={designationOptions}
          positionOptions={positionOptions}
          requiresPosition={requiresPosition}
          allowEmptyPosition={allowEmptyPosition}
          showLegacyPositionWarning={showLegacyPositionWarning}
          isBusy={isBusy}
          canAddCatalog={canEdit}
          onOpenAddDepartment={() => catalogCreate.openCreateDepartment(null)}
          onOpenAddDesignation={() => catalogCreate.openCreateDesignation(null)}
          onOpenAddPosition={() => setCreatePositionOpen(true)}
          onPatchForm={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          onSubmit={() => void handleSubmit()}
          onCancel={reset}
        />
      )}

      <Card className="divide-y divide-border/50 p-0">
        {assignments.map((assignment) => {
          const positionLabel = assignment.positionId
            ? positionNameById.get(assignment.positionId) ?? assignment.positionId
            : t('faculty.assignments.vacantPosition');
          return (
            <div
              key={assignment.id}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-foreground truncate">
                  {assignment.designationName ?? assignment.designationId}
                  {assignment.isPrimary ? ` · ${t('faculty.assignments.primaryBadge')}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {assignment.departmentName ?? assignment.departmentId}
                  {' · '}
                  {positionLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {assignment.startDate}
                  {' – '}
                  {assignment.endDate ?? t('faculty.designations.present')}
                </p>
              </div>
              {canEdit && mode === 'idle' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-11 shrink-0"
                  onClick={() => openEdit(assignment)}
                >
                  {t('common.edit')}
                </Button>
              )}
            </div>
          );
        })}

        {!isPending && assignments.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Briefcase className="size-8 text-muted-foreground/40" aria-hidden />
            <p className="text-sm text-muted-foreground">{t('faculty.assignments.empty')}</p>
          </div>
        )}
      </Card>

      <FacultyCatalogCreateOverlays
        createDepartmentOpen={catalogCreate.createDepartmentOpen}
        onCloseDepartment={catalogCreate.closeDepartment}
        createDesignationOpen={catalogCreate.createDesignationOpen}
        onCloseDesignation={catalogCreate.closeDesignation}
        onDepartmentCreated={(department) => {
          catalogCreate.applyDepartmentCreated(department, (_rowKey, patch) => {
            setForm((prev) => ({
              ...prev,
              departmentId: patch.departmentId,
              positionId: '',
            }));
          });
        }}
        onDesignationCreated={(designation) => {
          catalogCreate.applyDesignationCreated(designation, (_rowKey, patch) => {
            setForm((prev) => ({
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
          setForm((prev) => ({ ...prev, positionId }));
        }}
      />
    </div>
  );
}
