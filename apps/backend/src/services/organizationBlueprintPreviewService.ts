/**
 * @file organizationBlueprintPreviewService.ts
 * @description Non-destructive preview and diff inspection for organizational blueprint templates.
 */

import { and, eq, inArray, isNull } from 'drizzle-orm';
import { findBlueprintById, type BlueprintPreviewDiff } from '@mms/shared';
import {
  facultyDepartments,
  facultyDesignations,
  organizationLocations,
  organizationPositions,
} from '../db/schema.js';
import { withTenantRead } from '../db/tenant-context.js';

export type { BlueprintPreviewDiff };

export async function previewOrganizationBlueprint(
  tenant: string,
  blueprintId: string,
): Promise<BlueprintPreviewDiff> {
  const blueprint = findBlueprintById(blueprintId);
  if (!blueprint) {
    throw new Error(`Blueprint "${blueprintId}" not found`);
  }

  const subdomain = tenant.trim().toLowerCase();

  return withTenantRead(subdomain, async (tx) => {
    // 1. Departments diff
    const deptCodes = blueprint.departments.map((d) => d.code);
    const existingDepts = deptCodes.length > 0
      ? await tx
          .select({ code: facultyDepartments.code, name: facultyDepartments.name })
          .from(facultyDepartments)
          .where(
            and(
              eq(facultyDepartments.workspaceSubdomain, subdomain),
              inArray(facultyDepartments.code, deptCodes),
              isNull(facultyDepartments.deletedAt),
            ),
          )
      : [];
    const existingDeptCodeSet = new Set(existingDepts.map((d) => d.code));
    const toCreateDepts = blueprint.departments.filter((d) => !existingDeptCodeSet.has(d.code));

    // 2. Designations diff
    const desigCodes = blueprint.designations.map((d) => d.code);
    const existingDesigs = desigCodes.length > 0
      ? await tx
          .select({ code: facultyDesignations.code, name: facultyDesignations.name })
          .from(facultyDesignations)
          .where(
            and(
              eq(facultyDesignations.workspaceSubdomain, subdomain),
              inArray(facultyDesignations.code, desigCodes),
              isNull(facultyDesignations.deletedAt),
            ),
          )
      : [];
    const existingDesigCodeSet = new Set(existingDesigs.map((d) => d.code));
    const toCreateDesigs = blueprint.designations.filter((d) => !existingDesigCodeSet.has(d.code));

    // 3. Locations diff
    const locCodes = blueprint.locations.map((l) => l.code);
    const existingLocs = locCodes.length > 0
      ? await tx
          .select({ code: organizationLocations.code, name: organizationLocations.name, type: organizationLocations.type })
          .from(organizationLocations)
          .where(
            and(
              eq(organizationLocations.workspaceSubdomain, subdomain),
              inArray(organizationLocations.code, locCodes),
              isNull(organizationLocations.deletedAt),
            ),
          )
      : [];
    const existingLocCodeSet = new Set(existingLocs.map((l) => l.code));
    const toCreateLocs = blueprint.locations.filter((l) => !existingLocCodeSet.has(l.code));

    // 4. Positions diff
    const posCodes = blueprint.positions.map((p) => p.code);
    const existingPositions = posCodes.length > 0
      ? await tx
          .select({ code: organizationPositions.code, name: organizationPositions.name })
          .from(organizationPositions)
          .where(
            and(
              eq(organizationPositions.workspaceSubdomain, subdomain),
              inArray(organizationPositions.code, posCodes),
              isNull(organizationPositions.deletedAt),
            ),
          )
      : [];
    const existingPosCodeSet = new Set(existingPositions.map((p) => p.code));
    const toCreatePositions = blueprint.positions.filter((p) => !existingPosCodeSet.has(p.code));

    const existingTotal =
      existingDepts.length + existingDesigs.length + existingLocs.length + existingPositions.length;
    const toCreateTotal =
      toCreateDepts.length + toCreateDesigs.length + toCreateLocs.length + toCreatePositions.length;

    return {
      blueprintId: blueprint.id,
      industryType: blueprint.industryType,
      departments: {
        existing: existingDepts,
        toCreate: toCreateDepts.map((d) => ({ code: d.code, name: d.name })),
      },
      designations: {
        existing: existingDesigs,
        toCreate: toCreateDesigs.map((d) => ({ code: d.code, name: d.name })),
      },
      locations: {
        existing: existingLocs,
        toCreate: toCreateLocs.map((l) => ({ code: l.code, name: l.name, type: l.type })),
      },
      positions: {
        existing: existingPositions,
        toCreate: toCreatePositions.map((p) => ({ code: p.code, name: p.name })),
      },
      counts: {
        existingTotal,
        toCreateTotal,
      },
    };
  });
}
