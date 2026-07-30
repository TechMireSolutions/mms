import {
  normalizeIdLinkedName,
  resolveEntityName,
  type NamedEntity,
} from './contactLinkPolicy.js';

export function normalizeAssessmentResult<T extends Record<string, unknown>>(row: T): T {
  if (!row || typeof row !== "object") return row;
  return normalizeIdLinkedName(row, 'studentId', 'studentName');
}

export function hydrateAssessmentResult<T extends Record<string, unknown>>(
  row: T,
  students: NamedEntity[],
): T {
  if (!row || typeof row !== "object") return row;
  return {
    ...row,
    studentName: resolveEntityName(row.studentId as string | number, students) || row.studentName,
  };
}
