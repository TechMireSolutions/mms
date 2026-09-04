import {
  createNamedEntityLookupMap,
  normalizeIdLinkedName,
  resolveEntityName,
  type NamedEntity,
} from './contactLinkPolicy.js';

export interface HasanatDistributionLike extends Record<string, unknown> {
  id?: string | number;
  recipientType?: string;
  recipientStudentId?: string;
  recipientTeacherId?: string;
  recipientName?: string;
}

export function createHasanatDistributionLookupMap<T extends HasanatDistributionLike>(
  distributions: readonly T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (let i = 0; i < distributions.length; i++) {
    const d = distributions[i];
    if (d?.id != null) map.set(String(d.id), d);
  }
  return map;
}

export function normalizeHasanatDistribution<T extends HasanatDistributionLike>(row: T): T {
  if (!row || typeof row !== "object") return row;
  if (row.recipientStudentId) {
    return normalizeIdLinkedName(row, 'recipientStudentId', 'recipientName');
  }
  if (row.recipientTeacherId) {
    return normalizeIdLinkedName(row, 'recipientTeacherId', 'recipientName');
  }
  return row;
}

export function hydrateHasanatDistribution<T extends HasanatDistributionLike>(
  row: T,
  students: NamedEntity[] | Map<string, NamedEntity>,
  teachers: NamedEntity[] | Map<string, NamedEntity>,
): T {
  if (!row || typeof row !== "object") return row;
  if (row.recipientStudentId) {
    const current = row.recipientName;
    const resolved = resolveEntityName(row.recipientStudentId, students) || current;
    if (resolved === current) return row;
    return {
      ...row,
      recipientName: resolved,
    };
  }
  if (row.recipientTeacherId) {
    const current = row.recipientName;
    const resolved = resolveEntityName(row.recipientTeacherId, teachers) || current;
    if (resolved === current) return row;
    return {
      ...row,
      recipientName: resolved,
    };
  }
  return row;
}

export function hydrateHasanatDistributionList<T extends HasanatDistributionLike>(
  rows: T[],
  students: NamedEntity[] | Map<string, NamedEntity>,
  teachers: NamedEntity[] | Map<string, NamedEntity>,
): T[] {
  if (!rows || !Array.isArray(rows)) return [];
  const studentLookup = students instanceof Map
    ? students
    : (students.length > 8 ? createNamedEntityLookupMap(students) : students);
  const teacherLookup = teachers instanceof Map
    ? teachers
    : (teachers.length > 8 ? createNamedEntityLookupMap(teachers) : teachers);
  return rows.map((r) => hydrateHasanatDistribution(r, studentLookup, teacherLookup));
}

export function normalizeHasanatRedemption<T extends Record<string, unknown>>(row: T): T {
  if (!row || typeof row !== "object") return row;
  return normalizeIdLinkedName(row, 'distributionId', 'studentName');
}

export function hydrateHasanatRedemption<T extends Record<string, unknown>>(
  row: T,
  distributions: HasanatDistributionLike[] | Map<string, HasanatDistributionLike>,
): T {
  if (!row || typeof row !== "object") return row;
  const distribution = distributions instanceof Map
    ? distributions.get(String(row.distributionId))
    : (Array.isArray(distributions)
        ? (distributions.length > 8
            ? createHasanatDistributionLookupMap(distributions).get(String(row.distributionId))
            : distributions.find((d) => String(d.id) === String(row.distributionId)))
        : undefined);
  const recipientName = distribution?.recipientName
    ?? (distribution?.recipientStudentId
      ? resolveEntityName(distribution.recipientStudentId, [])
      : '');
  const current = row.studentName;
  const resolved = recipientName || current;
  if (resolved === current) return row;
  return {
    ...row,
    studentName: resolved,
  };
}

export function hydrateHasanatRedemptionList<T extends Record<string, unknown>>(
  rows: T[],
  distributions: HasanatDistributionLike[] | Map<string, HasanatDistributionLike>,
): T[] {
  if (!rows || !Array.isArray(rows)) return [];
  const distLookup = distributions instanceof Map
    ? distributions
    : createHasanatDistributionLookupMap(distributions);
  return rows.map((r) => hydrateHasanatRedemption(r, distLookup));
}

export function normalizeHasanatPayout<T extends Record<string, unknown>>(row: T): T {
  if (!row || typeof row !== "object") return row;
  return normalizeIdLinkedName(row, 'studentId', 'studentName');
}

export function hydrateHasanatPayout<T extends Record<string, unknown>>(
  row: T,
  students: NamedEntity[] | Map<string, NamedEntity>,
): T {
  if (!row || typeof row !== "object") return row;
  const current = row.studentName;
  const resolved = resolveEntityName(row.studentId as string | number, students) || current;
  if (resolved === current) return row;
  return {
    ...row,
    studentName: resolved,
  };
}

export function hydrateHasanatPayoutList<T extends Record<string, unknown>>(
  rows: T[],
  students: NamedEntity[] | Map<string, NamedEntity>,
): T[] {
  if (!rows || !Array.isArray(rows)) return [];
  const studentLookup = students instanceof Map
    ? students
    : (students.length > 8 ? createNamedEntityLookupMap(students) : students);
  return rows.map((r) => hydrateHasanatPayout(r, studentLookup));
}
