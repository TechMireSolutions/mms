import { and, asc, eq } from 'drizzle-orm';
import type {
  FacultyDesignationDefinition,
  FacultyDesignationWrite,
} from '@mms/shared';
import {
  facultyDesignationRoles,
  facultyDesignations,
} from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';

export {
  listFacultyDesignationAssignments,
  findCurrentFacultyDesignationAssignment,
  listCurrentFacultyDesignationAssignments,
  saveFacultyDesignationAssignment,
  deleteFacultyDesignationAssignment,
} from './facultyDesignationAssignmentRepository.js';

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
