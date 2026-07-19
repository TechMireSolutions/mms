import {
  hydrateContactProfile,
  normalizeContactLinkedRecord,
  normalizeIdLinkedName,
  resolveEntityName,
  type ContactLike,
  type NamedEntity,
} from './contactLinkPolicy.js';
import { hydrateStudentFromContacts, normalizeStoredStudent } from './studentUtils.js';
import { hydrateTeacherFromContact, normalizeStoredTeacher } from './teacherUtils.js';
import type { Teacher } from './teacherTypes.js';
import type { Student } from './studentTypes.js';

export interface SessionClassLike extends Record<string, unknown> {
  id?: string;
  teacherId?: string;
  teacherName?: string;
}

export interface SessionLike extends Record<string, unknown> {
  classes?: SessionClassLike[];
}

export function normalizeSessionClasses(classes: SessionClassLike[]): SessionClassLike[] {
  if (!classes || !Array.isArray(classes)) return [];
  return classes.map((cls) => {
    if (!cls || typeof cls !== "object") return cls;
    return normalizeIdLinkedName(cls, 'teacherId', 'teacherName');
  });
}

export function hydrateSessionClasses(
  classes: SessionClassLike[],
  teachers: NamedEntity[],
): SessionClassLike[] {
  if (!classes || !Array.isArray(classes)) return [];
  return classes.map((cls) => {
    if (!cls || typeof cls !== "object") return cls;
    return {
      ...cls,
      teacherName: resolveEntityName(cls.teacherId, teachers) || cls.teacherName,
    };
  });
}

export function normalizeSessionsCollection(sessions: SessionLike[]): SessionLike[] {
  if (!sessions || !Array.isArray(sessions)) return [];
  return sessions.map((session) => {
    if (!session || typeof session !== "object") return session;
    if (!Array.isArray(session.classes)) return session;
    return { ...session, classes: normalizeSessionClasses(session.classes) };
  });
}

export function hydrateSessionsCollection(
  sessions: SessionLike[],
  teachers: NamedEntity[],
): SessionLike[] {
  if (!sessions || !Array.isArray(sessions)) return [];
  return sessions.map((session) => {
    if (!session || typeof session !== "object") return session;
    if (!Array.isArray(session.classes)) return session;
    return { ...session, classes: hydrateSessionClasses(session.classes, teachers) };
  });
}

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

export function stripWorkspaceUserProfileFields<T extends Record<string, unknown>>(user: T): T {
  if (!user || typeof user !== "object") return user;
  return normalizeContactLinkedRecord(user);
}

export function hydrateWorkspaceUserProfile<T extends Record<string, unknown>>(
  user: T,
  contacts: ContactLike[],
): T {
  if (!user || typeof user !== "object") return user;
  const hydrated = hydrateContactProfile(user, contacts);
  const name = String(hydrated.name ?? '');
  if (name && !hydrated.avatarInitials) {
    return {
      ...hydrated,
      avatarInitials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    };
  }
  return hydrated;
}

export function normalizeActivityLog<T extends Record<string, unknown>>(log: T): T {
  if (!log || typeof log !== "object") return log;
  return normalizeIdLinkedName(log, 'userId', 'userName');
}

export function hydrateActivityLog<T extends Record<string, unknown>>(
  log: T,
  users: NamedEntity[],
): T {
  if (!log || typeof log !== "object") return log;
  return {
    ...log,
    userName: resolveEntityName(log.userId as string | number, users) || log.userName,
  };
}

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

/** Strips a denormalized actor label when the workspace user id is set. */
export function normalizeUserActorField<T extends Record<string, unknown>>(
  row: T,
  userIdField: string,
  labelField: string,
): T {
  if (!row || typeof row !== "object") return row;
  return normalizeIdLinkedName(row, userIdField, labelField);
}

/** Hydrates an actor display label from workspace users. */
export function hydrateUserActorField<T extends Record<string, unknown>>(
  row: T,
  userIdField: string,
  labelField: string,
  users: NamedEntity[],
): T {
  if (!row || typeof row !== "object") return row;
  return {
    ...row,
    [labelField]: resolveEntityName(row[userIdField] as string | number, users) || row[labelField],
  };
}

export {
  normalizeStoredStudent,
  hydrateStudentFromContacts,
  normalizeStoredTeacher,
  hydrateTeacherFromContact,
};
export type { Student, Teacher };
