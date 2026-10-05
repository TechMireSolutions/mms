import { sql, type SQL } from 'drizzle-orm';
import { faculty } from '../schema.js';
import { primaryAssignmentEffectiveOnDateSql } from './facultyPrimaryAppointmentEffective.js';

/**
 * FROM clause: faculty + LATERAL primary appointment + catalog + contact joins.
 * List/widget queries that filter/sort/group by dept/designation/rank/contact MUST use this.
 */
export function facultyWithPrimaryAppointmentFromSql(): SQL {
  return sql`
    FROM ${faculty}
    LEFT JOIN LATERAL (
      SELECT a.department_id, a.designation_id, a.position_id
      FROM faculty_assignments a
      WHERE a.workspace_subdomain = ${faculty.workspaceSubdomain}
        AND a.faculty_id = ${faculty.id}
        AND a.is_primary = true
        AND a.deleted_at IS NULL
        AND a.status = 'active'
        AND ${primaryAssignmentEffectiveOnDateSql('a')}
      ORDER BY a.start_date DESC
      LIMIT 1
    ) pa ON true
    LEFT JOIN faculty_departments pa_dept
      ON pa_dept.workspace_subdomain = ${faculty.workspaceSubdomain}
      AND pa_dept.id = pa.department_id
    LEFT JOIN faculty_designations pa_desig
      ON pa_desig.workspace_subdomain = ${faculty.workspaceSubdomain}
      AND pa_desig.id = pa.designation_id
    LEFT JOIN contacts fc
      ON fc.workspace_subdomain = ${faculty.workspaceSubdomain}
      AND fc.id = ${faculty.contactId}
  `;
}

/** Department name from LATERAL join aliases (requires facultyWithPrimaryAppointmentFromSql). */
export function joinedPrimaryDepartmentNameExpr(): SQL {
  return sql`COALESCE(pa_dept.name, '')`;
}

/** Designation name from LATERAL join aliases. */
export function joinedPrimaryDesignationNameExpr(): SQL {
  return sql`COALESCE(pa_desig.name, '')`;
}

/** Hierarchy rank from LATERAL join aliases. */
export function joinedPrimaryHierarchyRankExpr(): SQL {
  return sql`COALESCE(pa_desig.hierarchy_rank, 10)`;
}

/** Linked contact display name (requires facultyWithPrimaryAppointmentFromSql). */
export function joinedContactNameExpr(): SQL {
  return sql`COALESCE(
    NULLIF(trim(concat_ws(' ', fc.first_name, fc.last_name)), ''),
    NULLIF(trim(COALESCE(fc.name, '')), ''),
    ''
  )`;
}

/** Linked contact gender (requires facultyWithPrimaryAppointmentFromSql). */
export function joinedContactGenderExpr(): SQL {
  return sql`lower(trim(COALESCE(fc.gender, '')))`;
}

/**
 * Supervisor filter using LATERAL pa.position_id (one primary lookup already done).
 * Requires facultyWithPrimaryAppointmentFromSql in FROM.
 */
export function joinedReportsToFacultyExpr(supervisorFacultyId: string): SQL {
  return sql`EXISTS (
    SELECT 1
    FROM faculty_assignments sup_a
    INNER JOIN organization_positions sup_pos
      ON sup_pos.workspace_subdomain = sup_a.workspace_subdomain
      AND sup_pos.id = sup_a.position_id
      AND sup_pos.deleted_at IS NULL
    INNER JOIN organization_positions sub_pos
      ON sub_pos.workspace_subdomain = ${faculty.workspaceSubdomain}
      AND sub_pos.id = pa.position_id
      AND sub_pos.deleted_at IS NULL
    WHERE sup_a.workspace_subdomain = ${faculty.workspaceSubdomain}
      AND sup_a.faculty_id = ${supervisorFacultyId}
      AND sup_a.is_primary = true
      AND sup_a.deleted_at IS NULL
      AND sup_a.status = 'active'
      AND ${primaryAssignmentEffectiveOnDateSql('sup_a')}
      AND sub_pos.parent_position_id = sup_pos.id
  )`;
}
