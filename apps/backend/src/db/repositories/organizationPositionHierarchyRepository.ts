/**
 * @file organizationPositionHierarchyRepository.ts
 * @description Hierarchy queries, cycle checks, and tree construction for organization positions.
 */

import { and, eq, isNull, sql } from 'drizzle-orm';
import type { OrganizationPositionTreeNode, PositionOccupant } from '@mms/shared';
import { facultyAssignments, organizationPositions, faculty, contacts } from '../schema.js';
import { withTenantRead } from '../tenant-context.js';
import { positionHierarchySql } from './positionHierarchySql.js';

export interface PositionFlatHierarchyRow extends Record<string, unknown> {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  designationId: string;
  locationId: string | null;
  parentPositionId: string | null;
  capacity: number;
  depth: number;
  isCycle: boolean;
}

export async function findDescendantPositions(
  tenant: string,
  rootPositionId: string,
  maxDepth = 20,
): Promise<PositionFlatHierarchyRow[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const result = await tx.execute<PositionFlatHierarchyRow>(
      positionHierarchySql(subdomain, rootPositionId, 'down', maxDepth),
    );
    return result.rows;
  });
}

export async function findAncestorPositions(
  tenant: string,
  positionId: string,
  maxDepth = 20,
): Promise<PositionFlatHierarchyRow[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const result = await tx.execute<PositionFlatHierarchyRow>(
      positionHierarchySql(subdomain, positionId, 'up', maxDepth),
    );
    return result.rows;
  });
}

export async function checkPositionCycleSafe(
  tenant: string,
  childId: string,
  parentId: string,
): Promise<{ safe: boolean; reason?: string }> {
  if (childId === parentId) {
    return { safe: false, reason: 'Position cannot report to itself' };
  }
  const ancestors = await findAncestorPositions(tenant, parentId);
  const cycleFound = ancestors.some((p) => p.id === childId || p.isCycle);
  if (cycleFound) {
    return { safe: false, reason: 'Proposed hierarchy would create a reporting cycle' };
  }
  return { safe: true };
}

export async function getOrganizationPositionTree(
  tenant: string,
): Promise<OrganizationPositionTreeNode[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    // 1. Fetch all non-deleted positions
    const posRows = await tx
      .select({
        id: organizationPositions.id,
        code: organizationPositions.code,
        name: organizationPositions.name,
        departmentId: organizationPositions.departmentId,
        designationId: organizationPositions.designationId,
        locationId: organizationPositions.locationId,
        parentPositionId: organizationPositions.parentPositionId,
        capacity: organizationPositions.capacity,
      })
      .from(organizationPositions)
      .where(and(eq(organizationPositions.workspaceSubdomain, subdomain), isNull(organizationPositions.deletedAt)))
      .orderBy(organizationPositions.name);

    if (posRows.length === 0) return [];

    // 2. Fetch active occupants for these positions
    const occupantsRows = await tx
      .select({
        assignmentId: facultyAssignments.id,
        facultyId: facultyAssignments.facultyId,
        positionId: facultyAssignments.positionId,
        isPrimary: facultyAssignments.isPrimary,
        employeeId: faculty.employeeId,
        userId: faculty.userId,
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        contactAvatar: contacts.avatar,
      })
      .from(facultyAssignments)
      .innerJoin(faculty, eq(facultyAssignments.facultyId, faculty.id))
      .leftJoin(contacts, eq(faculty.contactId, contacts.id))
      .where(
        and(
          eq(facultyAssignments.workspaceSubdomain, subdomain),
          isNull(facultyAssignments.deletedAt),
          isNull(facultyAssignments.endDate),
          sql`${facultyAssignments.positionId} IS NOT NULL`,
        ),
      );

    const occupantsByPosition = new Map<string, PositionOccupant[]>();
    for (const row of occupantsRows) {
      if (!row.positionId) continue;
      const list = occupantsByPosition.get(row.positionId) ?? [];
      const fullName = [row.contactFirstName, row.contactLastName].filter(Boolean).join(' ') || 'Unnamed Staff';
      list.push({
        assignmentId: row.assignmentId,
        facultyId: row.facultyId,
        facultyName: fullName,
        employeeId: row.employeeId,
        avatarUrl: row.contactAvatar,
        isPrimary: row.isPrimary,
        userId: row.userId,
      });
      occupantsByPosition.set(row.positionId, list);
    }

    // 3. Assemble node lookup
    const nodeMap = new Map<string, OrganizationPositionTreeNode>();
    for (const p of posRows) {
      const occupants = occupantsByPosition.get(p.id) ?? [];
      nodeMap.set(p.id, {
        id: p.id,
        code: p.code,
        name: p.name,
        departmentId: p.departmentId ?? '',
        designationId: p.designationId ?? '',
        locationId: p.locationId,
        parentPositionId: p.parentPositionId,
        capacity: p.capacity,
        occupants,
        vacanciesCount: Math.max(0, p.capacity - occupants.length),
        children: [],
      });
    }

    // 4. Link children into parents
    const roots: OrganizationPositionTreeNode[] = [];
    for (const node of nodeMap.values()) {
      if (node.parentPositionId && nodeMap.has(node.parentPositionId)) {
        nodeMap.get(node.parentPositionId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  });
}
