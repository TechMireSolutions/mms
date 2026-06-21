/** Deduplicated non-empty registry ids for batch resolve (globle2 §10). */
export function uniqueRegistryIds(ids: (string | number | null | undefined)[]): string[] {
  return [...new Set(
    ids
      .filter((id) => id !== null && id !== undefined && String(id).length > 0)
      .map(String),
  )].sort();
}

export function collectTeacherIdsFromClasses(
  classes: { teacherId?: string | number | null }[] | undefined,
): string[] {
  return uniqueRegistryIds((classes ?? []).map((cls) => cls.teacherId));
}

export function collectTeacherIdsFromSessions(
  sessions: { classes?: { teacherId?: string | number | null }[] }[],
): string[] {
  return uniqueRegistryIds(
    sessions.flatMap((session) => (session.classes ?? []).map((cls) => cls.teacherId)),
  );
}
