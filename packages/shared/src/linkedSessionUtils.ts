import {
  normalizeIdLinkedName,
  resolveEntityName,
  type NamedEntity,
} from './contactLinkPolicy.js';

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
