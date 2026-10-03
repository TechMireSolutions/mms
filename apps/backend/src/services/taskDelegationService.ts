/**
 * @file taskDelegationService.ts
 * @description Hierarchy-based task assignment authorization and assignee validation.
 */

import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { TaskAssigneeInput } from '@mms/shared';
import { facultyAssignments, faculty, organizationPositions, tenantUsers } from '../db/schema.js';
import { withTenantRead } from '../db/tenant-context.js';
import { findDescendantPositions } from '../db/repositories/organizationPositionHierarchyRepository.js';

export interface DelegationValidationResult {
  valid: boolean;
  resolvedAssignees: Array<{
    facultyId: string;
    facultyAssignmentId?: string | null;
    positionId?: string | null;
    userId: string;
  }>;
  reason?: string;
}

export async function validateTaskDelegation(
  tenant: string,
  actorUserId: string,
  targetAssignees: TaskAssigneeInput[],
  options: {
    canAssignAnywhere?: boolean;
    delegationScope?: 'descendants' | 'direct_reports';
    allowSelfAssignment?: boolean;
  } = {},
): Promise<DelegationValidationResult> {
  const subdomain = tenant.trim().toLowerCase();
  const canAssignAnywhere = options.canAssignAnywhere ?? false;
  const delegationScope = options.delegationScope ?? 'descendants';
  const allowSelfAssignment = options.allowSelfAssignment ?? true;

  if (targetAssignees.length === 0) {
    return { valid: true, resolvedAssignees: [] };
  }

  return withTenantRead(subdomain, async (tx) => {
    // 1. Resolve actor's faculty member & occupied positions
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

    // 2. Load all target faculty members & users
    const targetFacultyIds = [...new Set(targetAssignees.map((a) => a.facultyId))];
    const targetFacultyRows = await tx
      .select({
        facultyId: faculty.id,
        userId: faculty.userId,
        userDeletedAt: tenantUsers.deletedAt,
        assignmentId: facultyAssignments.id,
        positionId: facultyAssignments.positionId,
      })
      .from(faculty)
      .leftJoin(tenantUsers, and(eq(faculty.userId, tenantUsers.id), eq(tenantUsers.workspaceSubdomain, subdomain)))
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
          inArray(faculty.id, targetFacultyIds),
          isNull(faculty.deletedAt),
        ),
      );

    const targetByFacultyId = new Map<string, typeof targetFacultyRows[0]>();
    for (const r of targetFacultyRows) {
      if (!targetByFacultyId.has(r.facultyId) || r.assignmentId) {
        targetByFacultyId.set(r.facultyId, r);
      }
    }

    // 3. If actor lacks assign_anywhere, precalculate allowed position IDs
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

    // 4. Validate each target assignee
    const resolvedAssignees: DelegationValidationResult['resolvedAssignees'] = [];

    for (const input of targetAssignees) {
      const match = targetByFacultyId.get(input.facultyId);
      if (!match) {
        return { valid: false, resolvedAssignees: [], reason: `Staff member "${input.facultyId}" not found` };
      }

      // Must have an active user account
      if (!match.userId || match.userDeletedAt !== null) {
        return {
          valid: false,
          resolvedAssignees: [],
          reason: `Assignee cannot receive tasks because they do not have an active user account`,
        };
      }

      // Hierarchy validation
      const isSelf = actorFacultyId && match.facultyId === actorFacultyId;
      if (isSelf) {
        if (!allowSelfAssignment) {
          return { valid: false, resolvedAssignees: [], reason: `Self-assignment is disabled by policy` };
        }
      } else if (!canAssignAnywhere) {
        const targetPosId = input.positionId ?? match.positionId;
        if (!targetPosId || !allowedPositionIds.has(targetPosId)) {
          return {
            valid: false,
            resolvedAssignees: [],
            reason: `You do not have organizational authority to assign tasks to staff outside your reporting line`,
          };
        }
      }

      resolvedAssignees.push({
        facultyId: match.facultyId,
        facultyAssignmentId: input.facultyAssignmentId ?? match.assignmentId ?? null,
        positionId: input.positionId ?? match.positionId ?? null,
        userId: match.userId,
      });
    }

    return { valid: true, resolvedAssignees };
  });
}
