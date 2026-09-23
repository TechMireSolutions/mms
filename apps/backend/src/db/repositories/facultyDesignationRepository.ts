import { and, asc, desc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm';
import type {
  FacultyDesignationAssignment,
  FacultyDesignationAssignmentWrite,
  FacultyDesignationDefinition,
  FacultyDesignationWrite,
} from '@mms/shared';
import {
  facultyDesignationAssignments,
  facultyDesignationRoles,
  facultyDesignations,
} from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';

function iso(value: Date): string {
  return value.toISOString();
}

/** Lists tenant designation definitions with their assignable roles. */
export async function listFacultyDesignations(tenant: string): Promise<FacultyDesignationDefinition[]> {
  const workspaceSubdomain = tenant.trim().toLowerCase();
  return withTenantRead(workspaceSubdomain, async (tx) => {
    const [definitions, roles] = await Promise.all([
      tx.select({
        id: facultyDesignations.id,
        code: facultyDesignations.code,
        name: facultyDesignations.name,
        hierarchyRank: facultyDesignations.hierarchyRank,
        isActive: facultyDesignations.isActive,
        createdAt: facultyDesignations.createdAt,
        updatedAt: facultyDesignations.updatedAt,
      }).from(facultyDesignations)
        .where(eq(facultyDesignations.workspaceSubdomain, workspaceSubdomain))
        .orderBy(asc(facultyDesignations.hierarchyRank), asc(facultyDesignations.name)),
      tx.select({ designationId: facultyDesignationRoles.designationId, roleKey: facultyDesignationRoles.roleKey })
        .from(facultyDesignationRoles)
        .where(eq(facultyDesignationRoles.workspaceSubdomain, workspaceSubdomain))
        .orderBy(asc(facultyDesignationRoles.roleKey)),
    ]);
    const rolesByDesignation = new Map<string, string[]>();
    for (const role of roles) {
      rolesByDesignation.set(role.designationId, [...(rolesByDesignation.get(role.designationId) ?? []), role.roleKey]);
    }
    return definitions.map((definition) => ({
      ...definition,
      assignableRoles: rolesByDesignation.get(definition.id) ?? [],
      createdAt: iso(definition.createdAt),
      updatedAt: iso(definition.updatedAt),
    }));
  });
}

/** Upserts one designation definition and atomically replaces its role allow-list. */
export async function saveFacultyDesignation(
  tenant: string,
  input: FacultyDesignationWrite,
): Promise<FacultyDesignationDefinition> {
  const workspaceSubdomain = tenant.trim().toLowerCase();
  await withTenant(workspaceSubdomain, async (tx) => {
    await tx.insert(facultyDesignations).values({
      workspaceSubdomain,
      id: input.id,
      code: input.code,
      name: input.name,
      hierarchyRank: input.hierarchyRank,
      isActive: input.isActive,
    }).onConflictDoUpdate({
      target: [facultyDesignations.workspaceSubdomain, facultyDesignations.id],
      set: {
        code: input.code,
        name: input.name,
        hierarchyRank: input.hierarchyRank,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    });
    await tx.delete(facultyDesignationRoles).where(and(
      eq(facultyDesignationRoles.workspaceSubdomain, workspaceSubdomain),
      eq(facultyDesignationRoles.designationId, input.id),
    ));
    if (input.assignableRoles.length > 0) {
      await tx.insert(facultyDesignationRoles).values(
        [...new Set(input.assignableRoles)].map((roleKey) => ({ workspaceSubdomain, designationId: input.id, roleKey })),
      );
    }
  });
  const saved = (await listFacultyDesignations(workspaceSubdomain)).find((designation) => designation.id === input.id);
  if (!saved) throw new Error('Designation could not be loaded after save');
  return saved;
}

/** Lists complete designation history, including designation rank and role projection. */
export async function listFacultyDesignationAssignments(
  tenant: string,
  facultyId: string,
): Promise<FacultyDesignationAssignment[]> {
  const workspaceSubdomain = tenant.trim().toLowerCase();
  return withTenantRead(workspaceSubdomain, async (tx) => {
    const rows = await tx.select({
      id: facultyDesignationAssignments.id,
      facultyId: facultyDesignationAssignments.facultyId,
      designationId: facultyDesignationAssignments.designationId,
      designationName: facultyDesignations.name,
      hierarchyRank: facultyDesignations.hierarchyRank,
      startsOn: facultyDesignationAssignments.startsOn,
      endsOn: facultyDesignationAssignments.endsOn,
      notes: facultyDesignationAssignments.notes,
      createdAt: facultyDesignationAssignments.createdAt,
      updatedAt: facultyDesignationAssignments.updatedAt,
    }).from(facultyDesignationAssignments)
      .innerJoin(facultyDesignations, and(
        eq(facultyDesignations.workspaceSubdomain, facultyDesignationAssignments.workspaceSubdomain),
        eq(facultyDesignations.id, facultyDesignationAssignments.designationId),
      ))
      .where(and(
        eq(facultyDesignationAssignments.workspaceSubdomain, workspaceSubdomain),
        eq(facultyDesignationAssignments.facultyId, facultyId),
      ))
      .orderBy(desc(facultyDesignationAssignments.startsOn));
    const definitions = await listFacultyDesignations(workspaceSubdomain);
    const rolesByDesignation = new Map(definitions.map((definition) => [definition.id, definition.assignableRoles]));
    return rows.map((row) => ({
      ...row,
      endsOn: row.endsOn ?? null,
      notes: row.notes ?? null,
      assignableRoles: rolesByDesignation.get(row.designationId) ?? [],
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    }));
  });
}

/** Returns the single designation assignment effective on a given date. */
export async function findCurrentFacultyDesignationAssignment(
  tenant: string,
  facultyId: string,
  onDate = new Date().toISOString().slice(0, 10),
): Promise<FacultyDesignationAssignment | null> {
  const history = await listFacultyDesignationAssignments(tenant, facultyId);
  return history.find((assignment) => assignment.startsOn <= onDate && (!assignment.endsOn || assignment.endsOn >= onDate)) ?? null;
}

/** Batch-loads the effective designation for directory and hierarchy projections. */
export async function listCurrentFacultyDesignationAssignments(
  tenant: string,
  facultyIds: string[],
  onDate = new Date().toISOString().slice(0, 10),
): Promise<Map<string, FacultyDesignationAssignment>> {
  if (facultyIds.length === 0) return new Map();
  const workspaceSubdomain = tenant.trim().toLowerCase();
  return withTenantRead(workspaceSubdomain, async (tx) => {
    const [rows, roles] = await Promise.all([
      tx.select({
        id: facultyDesignationAssignments.id,
        facultyId: facultyDesignationAssignments.facultyId,
        designationId: facultyDesignationAssignments.designationId,
        designationName: facultyDesignations.name,
        hierarchyRank: facultyDesignations.hierarchyRank,
        startsOn: facultyDesignationAssignments.startsOn,
        endsOn: facultyDesignationAssignments.endsOn,
        notes: facultyDesignationAssignments.notes,
        createdAt: facultyDesignationAssignments.createdAt,
        updatedAt: facultyDesignationAssignments.updatedAt,
      }).from(facultyDesignationAssignments)
        .innerJoin(facultyDesignations, and(
          eq(facultyDesignations.workspaceSubdomain, facultyDesignationAssignments.workspaceSubdomain),
          eq(facultyDesignations.id, facultyDesignationAssignments.designationId),
        ))
        .where(and(
          eq(facultyDesignationAssignments.workspaceSubdomain, workspaceSubdomain),
          inArray(facultyDesignationAssignments.facultyId, facultyIds),
          lte(facultyDesignationAssignments.startsOn, onDate),
          or(isNull(facultyDesignationAssignments.endsOn), gte(facultyDesignationAssignments.endsOn, onDate)),
        )),
      tx.select({ designationId: facultyDesignationRoles.designationId, roleKey: facultyDesignationRoles.roleKey })
        .from(facultyDesignationRoles)
        .where(eq(facultyDesignationRoles.workspaceSubdomain, workspaceSubdomain)),
    ]);
    const rolesByDesignation = new Map<string, string[]>();
    for (const role of roles) {
      rolesByDesignation.set(role.designationId, [...(rolesByDesignation.get(role.designationId) ?? []), role.roleKey]);
    }
    return new Map(rows.map((row) => [row.facultyId, {
      ...row,
      endsOn: row.endsOn ?? null,
      notes: row.notes ?? null,
      assignableRoles: rolesByDesignation.get(row.designationId) ?? [],
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    }]));
  });
}

/** Adds or updates a period; the database exclusion constraint rejects every overlap. */
export async function saveFacultyDesignationAssignment(
  tenant: string,
  input: FacultyDesignationAssignmentWrite,
): Promise<FacultyDesignationAssignment> {
  const workspaceSubdomain = tenant.trim().toLowerCase();
  await withTenant(workspaceSubdomain, async (tx) => {
    const [designation] = await tx.select({ id: facultyDesignations.id, isActive: facultyDesignations.isActive })
      .from(facultyDesignations)
      .where(and(
        eq(facultyDesignations.workspaceSubdomain, workspaceSubdomain),
        eq(facultyDesignations.id, input.designationId),
      )).limit(1);
    if (!designation?.isActive) throw new Error('Designation is missing or inactive');
    await tx.insert(facultyDesignationAssignments).values({
      workspaceSubdomain,
      id: input.id,
      facultyId: input.facultyId,
      designationId: input.designationId,
      startsOn: input.startsOn,
      endsOn: input.endsOn ?? null,
      notes: input.notes ?? null,
    }).onConflictDoUpdate({
      target: [facultyDesignationAssignments.workspaceSubdomain, facultyDesignationAssignments.id],
      set: {
        designationId: input.designationId,
        startsOn: input.startsOn,
        endsOn: input.endsOn ?? null,
        notes: input.notes ?? null,
        updatedAt: new Date(),
      },
    });
  });
  const saved = (await listFacultyDesignationAssignments(workspaceSubdomain, input.facultyId))
    .find((assignment) => assignment.id === input.id);
  if (!saved) throw new Error('Designation assignment could not be loaded after save');
  return saved;
}

/**
 * Deletes a designation assignment by id.
 * Rejects with status 409 when the member has no other assignment —
 * a faculty member must always have at least one designation on record.
 */
export async function deleteFacultyDesignationAssignment(
  tenant: string,
  facultyId: string,
  assignmentId: string,
): Promise<void> {
  const workspaceSubdomain = tenant.trim().toLowerCase();
  await withTenant(workspaceSubdomain, async (tx) => {
    // Verify the target row belongs to this faculty member.
    const [target] = await tx.select({ id: facultyDesignationAssignments.id })
      .from(facultyDesignationAssignments)
      .where(and(
        eq(facultyDesignationAssignments.workspaceSubdomain, workspaceSubdomain),
        eq(facultyDesignationAssignments.facultyId, facultyId),
        eq(facultyDesignationAssignments.id, assignmentId),
      )).limit(1);
    if (!target) {
      const err = new Error('Designation assignment not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    // Guard: the member must retain at least one other assignment after deletion.
    const remaining = await tx.select({ id: facultyDesignationAssignments.id })
      .from(facultyDesignationAssignments)
      .where(and(
        eq(facultyDesignationAssignments.workspaceSubdomain, workspaceSubdomain),
        eq(facultyDesignationAssignments.facultyId, facultyId),
      ));
    if (remaining.length <= 1) {
      const err = new Error(
        'Cannot delete the only designation assignment. A faculty member must retain at least one designation record.',
      ) as Error & { statusCode: number };
      err.statusCode = 409;
      throw err;
    }

    await tx.delete(facultyDesignationAssignments).where(and(
      eq(facultyDesignationAssignments.workspaceSubdomain, workspaceSubdomain),
      eq(facultyDesignationAssignments.id, assignmentId),
    ));
  });
}
