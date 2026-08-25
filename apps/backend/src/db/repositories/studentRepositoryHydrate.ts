import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { type Student } from '@mms/shared';
import { students, studentEnrolledSessions } from '../schema.js';
import { withTenant, type AppDb } from '../tenant-context.js';
import { studentRowToRecord } from './studentRepositoryMappers.js';

export async function hydrateStudentsList(
  tx: AppDb,
  subdomain: string,
  rows: (typeof students.$inferSelect)[],
): Promise<Student[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const sessionRows = await tx
    .select()
    .from(studentEnrolledSessions)
    .where(
      and(
        eq(studentEnrolledSessions.workspaceSubdomain, subdomain),
        inArray(studentEnrolledSessions.studentId, ids),
      ),
    );

  const sessionsByStudentId = new Map<string, (typeof studentEnrolledSessions.$inferSelect)[]>();
  for (const s of sessionRows) {
    const list = sessionsByStudentId.get(s.studentId) ?? [];
    list.push(s);
    sessionsByStudentId.set(s.studentId, list);
  }

  return rows.map((row) => studentRowToRecord(row, sessionsByStudentId.get(row.id) ?? []));
}

export interface ListStudentsOptions {
  includeDeleted?: boolean;
  deleted?: 'active' | 'deleted' | 'all';
}

function resolveDeletedCondition(options?: ListStudentsOptions) {
  if (options?.deleted === 'deleted') {
    return isNotNull(students.deletedAt);
  }
  if (options?.deleted === 'all' || options?.includeDeleted) {
    return undefined;
  }
  return isNull(students.deletedAt);
}

export async function listStudentsByWorkspace(
  tenant: string,
  options?: ListStudentsOptions,
): Promise<Student[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const conditions = [eq(students.workspaceSubdomain, subdomain)];
    const deletedCond = resolveDeletedCondition(options);
    if (deletedCond) conditions.push(deletedCond);

    const rows = await tx
      .select()
      .from(students)
      .where(and(...conditions));
    return hydrateStudentsList(tx, subdomain, rows);
  });
}

export async function findStudentById(tenant: string, id: string): Promise<Student | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(students)
      .where(and(eq(students.workspaceSubdomain, subdomain), eq(students.id, id)))
      .limit(1);
    if (rows.length === 0) return null;
    const hydrated = await hydrateStudentsList(tx, subdomain, rows);
    return hydrated[0] ?? null;
  });
}

export async function findStudentsByIds(tenant: string, ids: string[]): Promise<Student[]> {
  const subdomain = tenant.trim().toLowerCase();
  if (ids.length === 0) return [];
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(students)
      .where(and(eq(students.workspaceSubdomain, subdomain), inArray(students.id, ids)));
    return hydrateStudentsList(tx, subdomain, rows);
  });
}

export async function countStudentsByWorkspace(
  tenant: string,
  options?: ListStudentsOptions,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const conditions = [eq(students.workspaceSubdomain, subdomain)];
    const deletedCond = resolveDeletedCondition(options);
    if (deletedCond) conditions.push(deletedCond);

    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(and(...conditions));
    return Number(rows[0]?.count ?? 0);
  });
}
