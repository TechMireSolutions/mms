import { sql, type SQL } from 'drizzle-orm';
import {
  faculty,
  facultyAssignments,
  facultyDepartments,
  facultyDesignations,
} from '../schema.js';

/** Primary active appointment designation name (FA + catalog SSOT). */
export function primaryDesignationNameExpr(): SQL {
  return sql`COALESCE((
    SELECT g.name
    FROM ${facultyAssignments} a
    INNER JOIN ${facultyDesignations} g
      ON g.workspace_subdomain = a.workspace_subdomain AND g.id = a.designation_id
    WHERE a.workspace_subdomain = ${faculty.workspaceSubdomain}
      AND a.faculty_id = ${faculty.id}
      AND a.is_primary = true
      AND a.deleted_at IS NULL
    ORDER BY a.start_date DESC
    LIMIT 1
  ), ${faculty.designation}, '')`;
}

/** Primary active appointment department name (FA + catalog SSOT). */
export function primaryDepartmentNameExpr(): SQL {
  return sql`COALESCE((
    SELECT d.name
    FROM ${facultyAssignments} a
    INNER JOIN ${facultyDepartments} d
      ON d.workspace_subdomain = a.workspace_subdomain AND d.id = a.department_id
    WHERE a.workspace_subdomain = ${faculty.workspaceSubdomain}
      AND a.faculty_id = ${faculty.id}
      AND a.is_primary = true
      AND a.deleted_at IS NULL
    ORDER BY a.start_date DESC
    LIMIT 1
  ), ${faculty.department}, '')`;
}
