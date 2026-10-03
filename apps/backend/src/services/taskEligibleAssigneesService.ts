/**
 * @file taskEligibleAssigneesService.ts
 * @description Resolves eligible task recipients based on hierarchy authority, user accounts, and delegation settings.
 */

import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import {
  contacts,
  faculty,
  facultyAssignments,
  facultyDepartments,
  organizationPositions,
  tenantUsers,
} from '../db/schema.js';
import { withTenantRead } from '../db/tenant-context.js';
import { findDescendantPositions } from '../db/repositories/organizationPositionHierarchyRepository.js';

export interface EligibleTaskAssignee {
  facultyId: string;
  name: string;
  employeeId?: string | null;
  assignmentId?: string | null;
  positionId?: string | null;
  positionName?: string | null;
  departmentName?: string | null;
  userId: string;
  isSelf: boolean;
}

export async function getEligibleTaskAssignees(
  tenant: string,
  actorUserId: string,
  options: {
    canAssignAnywhere?: boolean;
    delegationScope?: 'descendants' | 'direct_reports';
    allowSelfAssignment?: boolean;
  } = {},
): Promise<EligibleTaskAssignee[]> {
  const subdomain = tenant.trim().toLowerCase();
  const canAssignAnywhere = options.canAssignAnywhere ?? false;
  const delegationScope = options.delegationScope ?? 'descendants';
  const allowSelfAssignment = options.allowSelfAssignment ?? true;

  return withTenantRead(subdomain, async (tx) => {
    // 1. Resolve actor's faculty row & positions
    const actorFacultyRows = await tx
      .select({
        facultyId: faculty.id,
        assignmentId: facultyAssignments.id,
        positionId: facultyAssignments.positionId,
      })
      .from(faculty)
      .leftJoin(
        facultyAssignments,
        and(
          eq(facultyAssignments.facultyId, faculty.id),
          eq(facultyAssignments.workspaceSubdomain, subdomain),
          isNull(facultyAssignments.deletedAt),
          isNull(facultyAssignments.endDate),
        ),
      )
      .where(
        and(
          eq(faculty.workspaceSubdomain, subdomain),
          eq(faculty.userId, actorUserId),
          isNull(faculty.deletedAt),
        ),
      );

    const actorFacultyId = actorFacultyRows[0]?.facultyId ?? null;
    const actorPositionIds = actorFacultyRows
      .map((r) => r.positionId)
      .filter((id): id is string => Boolean(id));

    // 2. Determine allowed position IDs
    let allowedPositionIds = new Set<string>();
    if (!canAssignAnywhere && actorPositionIds.length > 0) {
      if (delegationScope === 'direct_reports') {
        const directReportPositions = await tx
          .select({ id: organizationPositions.id })
          .from(organizationPositions)
          .where(
            and(
              eq(organizationPositions.workspaceSubdomain, subdomain),
              inArray(organizationPositions.parentPositionId, actorPositionIds),
              isNull(organizationPositions.deletedAt),
            ),
          );
        allowedPositionIds = new Set(directReportPositions.map((p) => p.id));
      } else {
        // 'descendants'
        for (const posId of actorPositionIds) {
          const descendants = await findDescendantPositions(subdomain, posId);
          for (const d of descendants) {
            allowedPositionIds.add(d.id);
          }
        }
      }
    }

    // 3. Fetch all active faculty who have an active user account
    const candidateRows = await tx
      .select({
        facultyId: faculty.id,
        employeeId: faculty.employeeId,
        userId: faculty.userId,
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        assignmentId: facultyAssignments.id,
        positionId: facultyAssignments.positionId,
        positionName: organizationPositions.name,
        departmentName: facultyDepartments.name,
      })
      .from(faculty)
      .innerJoin(
        tenantUsers,
        and(
          eq(faculty.userId, tenantUsers.id),
          eq(tenantUsers.workspaceSubdomain, subdomain),
          isNull(tenantUsers.deletedAt),
        ),
      )
      .leftJoin(contacts, eq(faculty.contactId, contacts.id))
      .leftJoin(
        facultyAssignments,
        and(
          eq(facultyAssignments.facultyId, faculty.id),
          eq(facultyAssignments.workspaceSubdomain, subdomain),
          isNull(facultyAssignments.deletedAt),
          isNull(facultyAssignments.endDate),
        ),
      )
      .leftJoin(
        organizationPositions,
        and(
          eq(facultyAssignments.positionId, organizationPositions.id),
          eq(organizationPositions.workspaceSubdomain, subdomain),
          isNull(organizationPositions.deletedAt),
        ),
      )
      .leftJoin(
        facultyDepartments,
        and(
          eq(facultyAssignments.departmentId, facultyDepartments.id),
          eq(facultyDepartments.workspaceSubdomain, subdomain),
          isNull(facultyDepartments.deletedAt),
        ),
      )
      .where(
        and(
          eq(faculty.workspaceSubdomain, subdomain),
          isNotNull(faculty.userId),
          isNull(faculty.deletedAt),
        ),
      );

    const eligibleMap = new Map<string, EligibleTaskAssignee>();

    for (const row of candidateRows) {
      if (!row.userId) continue;

      const isSelf = actorFacultyId !== null && row.facultyId === actorFacultyId;
      if (isSelf) {
        if (!allowSelfAssignment) continue;
      } else if (!canAssignAnywhere) {
        if (!row.positionId || !allowedPositionIds.has(row.positionId)) {
          continue;
        }
      }

      if (!eligibleMap.has(row.facultyId)) {
        const fullName =
          [row.contactFirstName, row.contactLastName].filter(Boolean).join(' ') ||
          row.employeeId ||
          'Staff Member';

        eligibleMap.set(row.facultyId, {
          facultyId: row.facultyId,
          name: fullName,
          employeeId: row.employeeId,
          assignmentId: row.assignmentId,
          positionId: row.positionId,
          positionName: row.positionName,
          departmentName: row.departmentName,
          userId: row.userId,
          isSelf,
        });
      }
    }

    return Array.from(eligibleMap.values());
  });
}
