import { and, desc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm';
import type {
  FacultyDesignationAssignment,
  FacultyDesignationAssignmentWrite,
} from '@mms/shared';
import {
  facultyDesignationAssignments,
  facultyDesignationRoles,
  facultyDesignations,
} from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import { syncFacultyCurrentDesignation } from './facultyDesignationSync.js';
import { listFacultyDesignations } from './facultyDesignationRepository.js';

function iso(value: Date): string {
  return value.toISOString();
}

const ASSIGNMENT_COLUMNS = {
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
};

interface RawAssignmentRow {
  id: string;
  facultyId: string;
  designationId: string;
  designationName: string;
  hierarchyRank: number;
  startsOn: string;
  endsOn: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapAssignmentRow(
  row: RawAssignmentRow,
  rolesByDesignation: Map<string, string[]>,
): FacultyDesignationAssignment {
  return {
    ...row,
    endsOn: row.endsOn ?? null,
    notes: row.notes ?? null,
    assignableRoles: rolesByDesignation.get(row.designationId) ?? [],
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

/** Lists complete designation history, including designation rank and role projection. */
export async function listFacultyDesignationAssignments(
  tenant: string,
  facultyId: string,
): Promise<FacultyDesignationAssignment[]> {
  const workspaceSubdomain = tenant.trim().toLowerCase();
  return withTenantRead(workspaceSubdomain, async (tx) => {
    const rows = await tx.select(ASSIGNMENT_COLUMNS).from(facultyDesignationAssignments)
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
    return rows.map((row) => mapAssignmentRow(row, rolesByDesignation));
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
      tx.select(ASSIGNMENT_COLUMNS).from(facultyDesignationAssignments)
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
    return new Map(rows.map((row) => [row.facultyId, mapAssignmentRow(row, rolesByDesignation)]));
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
    await syncFacultyCurrentDesignation(tx, workspaceSubdomain, input.facultyId);
  });
  const saved = (await listFacultyDesignationAssignments(workspaceSubdomain, input.facultyId))
    .find((assignment) => assignment.id === input.id);
  if (!saved) throw new Error('Designation assignment could not be loaded after save');
  return saved;
}

export { deleteFacultyDesignationAssignment } from './facultyDesignationDeleteRepository.js';
