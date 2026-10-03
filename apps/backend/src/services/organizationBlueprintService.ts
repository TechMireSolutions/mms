/**
 * @file organizationBlueprintService.ts
 * @description Applies organizational blueprint templates to a tenant workspace.
 */

import { lockFacultyHierarchy } from '../db/repositories/facultyAssignmentValidation.js';
import { and, eq, isNull } from 'drizzle-orm';
import { findBlueprintById } from '@mms/shared';
import {
  facultyDepartments,
  facultyDesignations,
  organizationLocations,
  organizationPositions,
} from '../db/schema.js';
import { withTenant } from '../db/tenant-context.js';

export interface ApplyBlueprintResult {
  applied: boolean;
  blueprintId: string;
  industryType: string;
  counts: {
    departments: number;
    designations: number;
    locations: number;
    positions: number;
  };
}

export async function applyOrganizationBlueprint(
  tenant: string,
  blueprintId: string,
  userId?: string,
): Promise<ApplyBlueprintResult> {
  const blueprint = findBlueprintById(blueprintId);
  if (!blueprint) {
    throw new Error(`Blueprint "${blueprintId}" not found`);
  }

  const subdomain = tenant.trim().toLowerCase();

  return withTenant(subdomain, async (tx) => {
    await lockFacultyHierarchy(tx, subdomain);

    // 2. Sync Departments
    const deptMap = new Map<string, string>();
    for (const d of blueprint.departments) {
      const existing = await tx
        .select({ id: facultyDepartments.id })
        .from(facultyDepartments)
        .where(and(
          eq(facultyDepartments.workspaceSubdomain, subdomain),
          eq(facultyDepartments.code, d.code),
          isNull(facultyDepartments.deletedAt),
        ))
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        deptMap.set(d.code, existing[0].id);
      } else {
        const id = crypto.randomUUID();
        await tx.insert(facultyDepartments).values({
          id,
          workspaceSubdomain: subdomain,
          name: d.name,
          code: d.code,
          createdBy: userId ?? null,
          updatedBy: userId ?? null,
        });
        deptMap.set(d.code, id);
      }
    }

    // 3. Sync Designations
    const desigMap = new Map<string, string>();
    for (const dg of blueprint.designations) {
      const existing = await tx
        .select({ id: facultyDesignations.id })
        .from(facultyDesignations)
        .where(and(
          eq(facultyDesignations.workspaceSubdomain, subdomain),
          eq(facultyDesignations.code, dg.code),
          isNull(facultyDesignations.deletedAt),
        ))
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        desigMap.set(dg.code, existing[0].id);
      } else {
        const id = crypto.randomUUID();
        await tx.insert(facultyDesignations).values({
          id,
          workspaceSubdomain: subdomain,
          name: dg.name,
          code: dg.code,
          hierarchyRank: dg.level,
        });
        desigMap.set(dg.code, id);
      }
    }

    // 4. Sync Locations
    const locMap = new Map<string, string>();
    for (const loc of blueprint.locations) {
      const existing = await tx
        .select({ id: organizationLocations.id })
        .from(organizationLocations)
        .where(and(
          eq(organizationLocations.workspaceSubdomain, subdomain),
          eq(organizationLocations.code, loc.code),
          isNull(organizationLocations.deletedAt),
        ))
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        locMap.set(loc.code, existing[0].id);
      } else {
        const parentId = loc.parentCode ? (locMap.get(loc.parentCode) ?? null) : null;
        const [inserted] = await tx
          .insert(organizationLocations)
          .values({
            id: crypto.randomUUID(),
            workspaceSubdomain: subdomain,
            code: loc.code,
            name: loc.name,
            type: loc.type,
            parentLocationId: parentId,
            createdBy: userId ?? null,
            updatedBy: userId ?? null,
          })
          .returning({ id: organizationLocations.id });
        if (inserted) locMap.set(loc.code, inserted.id);
      }
    }

    // 5. Sync Positions
    const posMap = new Map<string, string>();
    for (const pos of blueprint.positions) {
      const deptId = deptMap.get(pos.departmentCode);
      const desigId = desigMap.get(pos.designationCode);
      if (!deptId || !desigId) continue;

      const existing = await tx
        .select({ id: organizationPositions.id })
        .from(organizationPositions)
        .where(and(
          eq(organizationPositions.workspaceSubdomain, subdomain),
          eq(organizationPositions.code, pos.code),
          isNull(organizationPositions.deletedAt),
        ))
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        posMap.set(pos.code, existing[0].id);
      } else {
        const locId = pos.locationCode ? (locMap.get(pos.locationCode) ?? null) : null;
        const parentPosId = pos.parentPositionCode ? (posMap.get(pos.parentPositionCode) ?? null) : null;
        const [inserted] = await tx
          .insert(organizationPositions)
          .values({
            id: crypto.randomUUID(),
            workspaceSubdomain: subdomain,
            code: pos.code,
            name: pos.name,
            departmentId: deptId,
            designationId: desigId,
            locationId: locId,
            parentPositionId: parentPosId,
            capacity: pos.capacity ?? 1,
            createdBy: userId ?? null,
            updatedBy: userId ?? null,
          })
          .returning({ id: organizationPositions.id });
        if (inserted) posMap.set(pos.code, inserted.id);
      }
    }

    return {
      applied: true,
      blueprintId: blueprint.id,
      industryType: blueprint.industryType,
      counts: {
        departments: deptMap.size,
        designations: desigMap.size,
        locations: locMap.size,
        positions: posMap.size,
      },
    };
  });
}
