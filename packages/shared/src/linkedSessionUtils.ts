import {
  createNamedEntityLookupMap,
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
  teachers: NamedEntity[] | Map<string, NamedEntity>,
): SessionClassLike[] {
  if (!classes || !Array.isArray(classes)) return [];
  const lookup = teachers instanceof Map
    ? teachers
    : (teachers.length > 8 ? createNamedEntityLookupMap(teachers) : teachers);
  let hasChanges = false;
  const mapped = classes.map((cls) => {
    if (!cls || typeof cls !== "object") return cls;
    const current = cls.teacherName;
    const resolved = resolveEntityName(cls.teacherId, lookup) || current;
    if (resolved === current) return cls;
    hasChanges = true;
    return {
      ...cls,
      teacherName: resolved,
    };
  });
  return hasChanges ? mapped : classes;
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
  teachers: NamedEntity[] | Map<string, NamedEntity>,
): SessionLike[] {
  if (!sessions || !Array.isArray(sessions)) return [];
  const lookup = teachers instanceof Map
    ? teachers
    : (teachers.length > 8 ? createNamedEntityLookupMap(teachers) : teachers);
  return sessions.map((session) => {
    if (!session || typeof session !== "object") return session;
    if (!Array.isArray(session.classes)) return session;
    const nextClasses = hydrateSessionClasses(session.classes, lookup);
    if (nextClasses === session.classes) return session;
    return { ...session, classes: nextClasses };
  });
}
