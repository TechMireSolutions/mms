/**
 * @file FacultyAssignmentSubordinates.tsx
 * @description Primary-appointment direct-reports strip (BiDi-safe join).
 */

import type React from 'react';
import { joinHierarchyLabels } from '@/components/ui/joinHierarchyLabels';
import { useTranslation } from '@/hooks/useTranslation';
import { useAssignmentSubordinates } from '@/tenant/features/faculty/hooks/useFacultyAssignments';

function nodeLabel(node: Record<string, unknown>): string {
  const name = typeof node.facultyName === 'string' ? node.facultyName.trim() : '';
  if (name) return name;
  const fallback = typeof node.name === 'string' ? node.name.trim() : '';
  return fallback || (typeof node.facultyId === 'string' ? node.facultyId : '');
}

export function FacultyAssignmentSubordinates({
  assignmentId,
}: {
  assignmentId: string;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const query = useAssignmentSubordinates(assignmentId, Boolean(assignmentId));
  const tree = query.data ?? [];

  if (!assignmentId) return null;

  if (query.isPending) {
    return (
      <p className="text-xs text-muted-foreground text-start" aria-busy="true">
        <span className="font-medium text-foreground">{t('faculty.assignments.subordinates')}: </span>
        {t('faculty.table.emptyDash')}
      </p>
    );
  }

  if (tree.length === 0) return null;
  const labels = tree.map((node) => nodeLabel(node)).filter(Boolean);
  if (labels.length === 0) return null;

  return (
    <p className="text-xs text-muted-foreground text-start">
      <span className="font-medium text-foreground">{t('faculty.assignments.subordinates')}: </span>
      {joinHierarchyLabels(labels)}
    </p>
  );
}
