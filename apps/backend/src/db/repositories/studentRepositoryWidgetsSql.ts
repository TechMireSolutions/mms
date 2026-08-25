import { and, eq, isNull, sql, type SQL } from 'drizzle-orm';
import type { StudentsWidgetQuery } from '@mms/shared';
import { students, contacts } from '../schema.js';

export function activeWorkspaceWhere(subdomain: string): SQL {
  return and(eq(students.workspaceSubdomain, subdomain), isNull(students.deletedAt))!;
}

export function resolveStudentFieldExpr(field: string): SQL {
  const f = field.trim();
  if (f === 'status') return sql`COALESCE(${students.status}, 'active')`;
  if (f === 'grNumber' || f === 'gr_number') return sql`COALESCE(${students.grNumber}, '')`;
  if (f === 'studentId' || f === 'student_id') return sql`COALESCE(${students.studentId}, '')`;
  if (f === 'registeredDate' || f === 'registered_date') return sql`COALESCE(${students.registeredDate}, '')`;
  if (f === 'enrollmentDate' || f === 'enrollment_date') return sql`COALESCE(${students.enrollmentDate}, '')`;
  if (f === 'discountType' || f === 'discount_type') return sql`COALESCE(${students.discountType}, '')`;
  if (f === 'discountPct' || f === 'discount_pct') return sql`COALESCE(${students.discountPct}, 0)`;
  if (f === 'registrationType' || f === 'registration_type') return sql`COALESCE(${students.registrationType}, '')`;
  if (f === 'notes') return sql`COALESCE(${students.notes}, '')`;
  if (f === 'fatherName' || f === 'father_name') return sql`COALESCE(${students.fatherName}, '')`;
  if (f === 'motherName' || f === 'mother_name') return sql`COALESCE(${students.motherName}, '')`;
  if (f === 'guardianName' || f === 'guardian_name') return sql`COALESCE(${students.guardianName}, '')`;

  if (f === 'gender') {
    return sql`COALESCE((SELECT c.gender FROM ${contacts} c WHERE c.workspace_subdomain = ${students.workspaceSubdomain} AND c.id = ${students.contactId} LIMIT 1), '')`;
  }
  if (f === 'dob') {
    return sql`COALESCE((SELECT c.dob FROM ${contacts} c WHERE c.workspace_subdomain = ${students.workspaceSubdomain} AND c.id = ${students.contactId} LIMIT 1), '')`;
  }
  if (f === 'city') {
    return sql`COALESCE((SELECT c.city FROM ${contacts} c WHERE c.workspace_subdomain = ${students.workspaceSubdomain} AND c.id = ${students.contactId} LIMIT 1), '')`;
  }
  if (f === 'name') {
    return sql`COALESCE((SELECT COALESCE(NULLIF(trim(concat_ws(' ', c.first_name, c.last_name)), ''), c.name) FROM ${contacts} c WHERE c.workspace_subdomain = ${students.workspaceSubdomain} AND c.id = ${students.contactId} LIMIT 1), '')`;
  }

  return sql`''`;
}

function singleFilterSql(
  field: string | undefined,
  operator: StudentsWidgetQuery['filterOperator'],
  value: string | undefined,
): SQL | null {
  const trimmedField = field?.trim();
  if (!trimmedField || value == null || value === '') return null;
  const fieldExpr = resolveStudentFieldExpr(trimmedField);
  const op = operator ?? 'equals';
  const valNormalized = value.trim().toLowerCase();

  if (op === 'equals') {
    return sql`lower(trim(${fieldExpr}::text)) = ${valNormalized}`;
  }
  if (op === 'contains') {
    return sql`lower(${fieldExpr}::text) LIKE ${`%${valNormalized}%`}`;
  }
  if (op === 'gt') {
    return sql`NULLIF(${fieldExpr}::text, '')::numeric > ${Number(value)}`;
  }
  if (op === 'lt') {
    return sql`NULLIF(${fieldExpr}::text, '')::numeric < ${Number(value)}`;
  }
  return null;
}

export function widgetFilterSql(query: StudentsWidgetQuery): SQL | null {
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

export function resolveChartLimit(query: StudentsWidgetQuery): number {
  const requested = query.chartLimit ?? 8;
  return Math.min(Math.max(requested, 1), 50);
}
