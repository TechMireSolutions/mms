import {
  normalizeIdLinkedName,
  resolveEntityName,
  type NamedEntity,
} from './contactLinkPolicy.js';

export function normalizeStudentLinkedRows<T extends Record<string, unknown>>(
  rows: T[],
  idField = 'studentId',
  nameField = 'studentName',
): T[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row) => {
    if (!row || typeof row !== "object") return row;
    return normalizeIdLinkedName(row, idField, nameField);
  });
}

export function hydrateStudentLinkedRows<T extends Record<string, unknown>>(
  rows: T[],
  students: NamedEntity[],
  idField = 'studentId',
  nameField = 'studentName',
): T[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row) => {
    if (!row || typeof row !== "object") return row;
    return {
      ...row,
      [nameField]: resolveEntityName(row[idField] as string | number, students) || row[nameField],
    };
  });
}
