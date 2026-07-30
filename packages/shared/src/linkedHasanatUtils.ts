import {
  normalizeIdLinkedName,
  resolveEntityName,
  type NamedEntity,
} from './contactLinkPolicy.js';

export interface HasanatDistributionLike extends Record<string, unknown> {
  recipientType?: string;
  recipientStudentId?: string;
  recipientTeacherId?: string;
  recipientName?: string;
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
  students: NamedEntity[],
  teachers: NamedEntity[],
): T {
  if (!row || typeof row !== "object") return row;
  if (row.recipientStudentId) {
    return {
      ...row,
      recipientName: resolveEntityName(row.recipientStudentId, students) || row.recipientName,
    };
  }
  if (row.recipientTeacherId) {
    return {
      ...row,
      recipientName: resolveEntityName(row.recipientTeacherId, teachers) || row.recipientName,
    };
  }
  return row;
}

export function normalizeHasanatRedemption<T extends Record<string, unknown>>(row: T): T {
  if (!row || typeof row !== "object") return row;
  return normalizeIdLinkedName(row, 'distributionId', 'studentName');
}

export function hydrateHasanatRedemption<T extends Record<string, unknown>>(
  row: T,
  distributions: HasanatDistributionLike[],
): T {
  if (!row || typeof row !== "object") return row;
  const list = Array.isArray(distributions) ? distributions : [];
  const distribution = list.find((d) => String(d.id) === String(row.distributionId));
  const recipientName = distribution?.recipientName
    ?? (distribution?.recipientStudentId
      ? resolveEntityName(distribution.recipientStudentId, [])
      : '');
  return {
    ...row,
    studentName: recipientName || row.studentName,
  };
}

export function normalizeHasanatPayout<T extends Record<string, unknown>>(row: T): T {
  if (!row || typeof row !== "object") return row;
  return normalizeIdLinkedName(row, 'studentId', 'studentName');
}

export function hydrateHasanatPayout<T extends Record<string, unknown>>(
  row: T,
  students: NamedEntity[],
): T {
  if (!row || typeof row !== "object") return row;
  return {
    ...row,
    studentName: resolveEntityName(row.studentId as string | number, students) || row.studentName,
  };
}
