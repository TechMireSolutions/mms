/**
 * @file FacultyAssignmentReportingChain.tsx
 * @description Primary-appointment reporting chain strip (BiDi-safe join).
 */

import type React from 'react';
import { joinHierarchyLabels } from '@/components/ui/joinHierarchyLabels';
import { useTranslation } from '@/hooks/useTranslation';
import { useAssignmentManagerChain } from '@/tenant/features/faculty/hooks/useFacultyAssignments';

function chainNodeLabel(node: Record<string, unknown>): string {
  const facultyName = typeof node.facultyName === 'string' ? node.facultyName.trim() : '';
  if (facultyName) return facultyName;
  const name = typeof node.name === 'string' ? node.name.trim() : '';
  if (name) return name;
  return typeof node.id === 'string' ? node.id : '';
}

export function FacultyAssignmentReportingChain({
  assignmentId,
}: {
  assignmentId: string;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const chainQuery = useAssignmentManagerChain(assignmentId, Boolean(assignmentId));
  const chain = chainQuery.data ?? [];

  if (!assignmentId) return null;

  if (chainQuery.isPending) {
    return (
      <p className="text-xs text-muted-foreground text-start" aria-busy="true">
        <span className="font-medium text-foreground">{t('faculty.assignments.reportingChain')}: </span>
        {t('faculty.table.emptyDash')}
      </p>
    );
  }

  if (chain.length === 0) return null;

  const labels = chain.map((node) => chainNodeLabel(node)).filter(Boolean);
  if (labels.length === 0) return null;

  return (
    <p className="text-xs text-muted-foreground text-start">
      <span className="font-medium text-foreground">{t('faculty.assignments.reportingChain')}: </span>
      {joinHierarchyLabels(labels)}
    </p>
  );
}
