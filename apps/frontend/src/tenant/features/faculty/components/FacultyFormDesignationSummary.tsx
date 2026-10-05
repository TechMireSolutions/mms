/**
 * @file FacultyFormDesignationSummary.tsx
 * @description Read-only primary appointment summary for edit FacultyForm (writes live in drawer).
 */

import { Award } from 'lucide-react';
import { WarningCallout } from '@/components/ui/WarningCallout';
import { WORK_SURFACE_INNER } from '@/components/ui/formStyles';
import { useTranslation } from '@/hooks/useTranslation';
import type { FacultyDesignationDefinition, FacultyMember } from '@mms/shared';
import { useOrganizationPositions } from '@/tenant/hooks/collections/organization';
import { cn } from '@/lib/utils';

function holdingPositionId(holding: unknown): string | null {
  if (!holding || typeof holding !== 'object') return null;
  const positionId = (holding as { positionId?: unknown }).positionId;
  return typeof positionId === 'string' && positionId.trim() ? positionId : null;
}

export function FacultyFormDesignationSummary({
  facultyDraft,
  designationOptions = [],
  showCollectionTitle = false,
}: {
  facultyDraft: Partial<FacultyMember>;
  designationOptions?: FacultyDesignationDefinition[];
  showCollectionTitle?: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { data: positions = [] } = useOrganizationPositions();
  const designationName =
    facultyDraft.designation
    || designationOptions.find((d) => d.id === facultyDraft.designationId)?.name
    || facultyDraft.designationId
    || t('faculty.table.emptyDash');
  const departmentName = facultyDraft.department || facultyDraft.departmentId || t('faculty.table.emptyDash');
  const primaryHolding = facultyDraft.designations?.find((h) => h.isPrimary)
    ?? facultyDraft.designations?.[0];
  const positionId =
    holdingPositionId(primaryHolding)
    || (typeof (facultyDraft as { positionId?: string }).positionId === 'string'
      ? (facultyDraft as { positionId?: string }).positionId ?? null
      : null);
  const positionLabel = positionId
    ? positions.find((p) => p.id === positionId)?.name ?? positionId
    : t('faculty.assignments.vacantPosition');

  return (
    <div className="space-y-3 text-start">
      {showCollectionTitle ? (
        <div className="flex items-center gap-2">
          <Award className="size-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold text-foreground">{t('faculty.form.tab.designation')}</h3>
        </div>
      ) : null}
      <WarningCallout
        tone="info"
        density="compact"
        description={t('faculty.form.primaryRoleAssignmentsHint')}
      />
      <div className={cn('space-y-1 p-3.5 text-sm', WORK_SURFACE_INNER)}>
        <p className="font-medium text-foreground">{designationName}</p>
        <p className="text-xs text-muted-foreground">
          {departmentName}
          {' · '}
          {positionLabel}
        </p>
        <p className="text-xs text-muted-foreground pt-1">{t('faculty.form.manageAppointmentsCta')}</p>
      </div>
    </div>
  );
}
