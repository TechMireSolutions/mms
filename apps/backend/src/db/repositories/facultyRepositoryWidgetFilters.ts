import { and, eq, isNull, sql, type SQL } from 'drizzle-orm';
import type { TeachersWidgetQuery } from '@mms/shared';
import { teachers, contacts } from '../schema.js';

export function activeWorkspaceWhere(subdomain: string): SQL {
  return and(eq(teachers.workspaceSubdomain, subdomain), isNull(teachers.deletedAt))!;
}

export function resolveTeacherFieldExpr(field: string): SQL {
  const f = field.trim();
  if (f === 'status') return sql`COALESCE(${teachers.status}, 'active')`;
  if (f === 'employeeId' || f === 'employee_id') return sql`COALESCE(${teachers.employeeId}, '')`;
  if (f === 'specialization') return sql`COALESCE(${teachers.specialization}, '')`;
  if (f === 'qualification') return sql`COALESCE(${teachers.qualification}, '')`;
  if (f === 'joinDate' || f === 'join_date') return sql`COALESCE(${teachers.joinDate}, '')`;
  if (f === 'notes') return sql`COALESCE(${teachers.notes}, '')`;
  if (f === 'department') return sql`COALESCE(${teachers.department}, '')`;
  if (f === 'designation') return sql`COALESCE(${teachers.designation}, '')`;
  if (f === 'hierarchyRank' || f === 'hierarchy_rank') return sql`COALESCE(${teachers.hierarchyRank}::text, '10')`;
  if (f === 'reportingFacultyId' || f === 'reporting_faculty_id') return sql`COALESCE(${teachers.reportingFacultyId}, '')`;

  // M-3 fix: linked contact fields now include an explicit
  // `c.workspace_subdomain = current_setting('app.current_tenant', true)` guard.
  // This ensures the sub-select is always bounded to the active tenant even if
  // the session RLS variable is set differently from the outer query column.
  if (f === 'gender') {
    return sql`COALESCE((SELECT c.gender FROM ${contacts} c WHERE c.workspace_subdomain = current_setting('app.current_tenant', true) AND c.id = ${teachers.contactId} LIMIT 1), '')`;
  }
  if (f === 'dob') {
    return sql`COALESCE((SELECT c.dob::text FROM ${contacts} c WHERE c.workspace_subdomain = current_setting('app.current_tenant', true) AND c.id = ${teachers.contactId} LIMIT 1), '')`;
  }
  if (f === 'city') {
    return sql`COALESCE((SELECT c.city FROM ${contacts} c WHERE c.workspace_subdomain = current_setting('app.current_tenant', true) AND c.id = ${teachers.contactId} LIMIT 1), '')`;
  }
  if (f === 'name') {
    return sql`COALESCE((SELECT COALESCE(NULLIF(trim(concat_ws(' ', c.first_name, c.last_name)), ''), c.name) FROM ${contacts} c WHERE c.workspace_subdomain = current_setting('app.current_tenant', true) AND c.id = ${teachers.contactId} LIMIT 1), '')`;
  }

  return sql`''`;
}

export function singleFilterSql(
  field: string | undefined,
  operator: TeachersWidgetQuery['filterOperator'],
  value: string | undefined,
): SQL | null {
  const trimmedField = field?.trim();
  if (!trimmedField || value == null || value === '') return null;
  const fieldExpr = resolveTeacherFieldExpr(trimmedField);
  const op = operator ?? 'equals';
  const valNormalized = value.trim().toLowerCase();

  if (op === 'equals') {
    return sql`lower(trim(${fieldExpr}::text)) = ${valNormalized}`;
  }
  if (op === 'contains') {
    return sql`lower(${fieldExpr}::text) LIKE ${`%${valNormalized}%`}`;
  }
  if (op === 'gt') {
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return sql`NULLIF(trim(${fieldExpr}::text), '')::numeric > ${num}`;
  }
  if (op === 'lt') {
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return sql`NULLIF(trim(${fieldExpr}::text), '')::numeric < ${num}`;
  }
  return null;
}

export function widgetFilterSql(query: TeachersWidgetQuery): SQL | null {
  const clauses: SQL[] = [];
  const legacy = singleFilterSql(query.filterField, query.filterOperator, query.filterValue);
  if (legacy) clauses.push(legacy);
  for (const rule of query.filters ?? []) {
    const clause = singleFilterSql(rule.field, rule.operator, rule.value);
    if (clause) clauses.push(clause);
  }
  if (clauses.length === 0) return null;
  if (clauses.length === 1) return clauses[0]!;
  return sql`(${sql.join(clauses, sql` AND `)})`;
}

export function resolveChartLimit(query: TeachersWidgetQuery): number {
  const requested = query.chartLimit ?? 8;
  return Math.min(Math.max(requested, 1), 50);
}
