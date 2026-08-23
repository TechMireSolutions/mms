import { and, eq, isNull, isNotNull, ne, sql, type SQL } from 'drizzle-orm';
import type {
  StudentsWidgetAggregateResult,
  StudentsWidgetQuery,
} from '@mms/shared';
import { students, contacts, contactEmails } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { studentRowToRecord } from './studentRepository.js';

function activeWorkspaceWhere(subdomain: string): SQL {
  return and(eq(students.workspaceSubdomain, subdomain), isNull(students.deletedAt))!;
}

function resolveStudentFieldExpr(field: string): SQL {
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

  // Linked contact fields
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

function widgetFilterSql(query: StudentsWidgetQuery): SQL | null {
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

function resolveChartLimit(query: StudentsWidgetQuery): number {
  const requested = query.chartLimit ?? 8;
  return Math.min(Math.max(requested, 1), 50);
}

/** SQL widget aggregates for students (Contacts parity). */
export async function aggregateStudentsWidgetQueries(
  tenant: string,
  queries: StudentsWidgetQuery[],
): Promise<Record<string, StudentsWidgetAggregateResult>> {
  const subdomain = tenant.trim().toLowerCase();
  const results: Record<string, StudentsWidgetAggregateResult> = {};
  if (queries.length === 0) return results;

  return withTenant(subdomain, async (tx) => {
    const totalRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(activeWorkspaceWhere(subdomain));
    const totalCount = Number(totalRows[0]?.count ?? 0);

    for (const query of queries) {
      const filterSql = widgetFilterSql(query);
      const whereClause = filterSql
        ? and(activeWorkspaceWhere(subdomain), filterSql)
        : activeWorkspaceWhere(subdomain);
      const chartLimit = resolveChartLimit(query);

      let value = 0;
      if (query.operation === 'count' || query.operation === 'percentage') {
        const countRows = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(students)
          .where(whereClause);
        const filteredCount = Number(countRows[0]?.count ?? 0);
        value =
          query.operation === 'percentage'
            ? totalCount > 0
              ? Math.round((filteredCount / totalCount) * 100)
              : 0
            : filteredCount;
      } else if (query.operation === 'sum' || query.operation === 'avg') {
        const target = query.targetField?.trim() || '';
        if (target) {
          const targetExpr = resolveStudentFieldExpr(target);
          const aggRows = await tx
            .select({
              sum: sql<number>`coalesce(sum(NULLIF(${targetExpr}::text, '')::numeric), 0)`,
              count: sql<number>`count(*) FILTER (WHERE NULLIF(${targetExpr}::text, '') IS NOT NULL)::int`,
            })
            .from(students)
            .where(whereClause);
          const sum = Number(aggRows[0]?.sum ?? 0);
          const count = Number(aggRows[0]?.count ?? 0);
          value = query.operation === 'sum' ? sum : count > 0 ? Math.round(sum / count) : 0;
        }
      }

      const xAxis = query.xAxisField?.trim() || 'status';
      const xAxisExpr = resolveStudentFieldExpr(xAxis);
      const groupExpr = sql<string>`COALESCE(NULLIF(trim(${xAxisExpr}::text), ''), 'Unknown')`;

      const chartRows = await tx
        .select({
          name: groupExpr,
          value: sql<number>`count(*)::int`,
        })
        .from(students)
        .where(whereClause)
        .groupBy(groupExpr)
        .orderBy(sql`count(*) desc`)
        .limit(chartLimit);

      let chartData = chartRows.map((row) => ({
        name: row.name,
        value: Number(row.value ?? 0),
      }));

      if (query.operation === 'sum' || query.operation === 'avg') {
        const target = query.targetField?.trim() || '';
        if (target) {
          const targetExpr = resolveStudentFieldExpr(target);
          const numericChart = await tx
            .select({
              name: groupExpr,
              sum: sql<number>`coalesce(sum(NULLIF(${targetExpr}::text, '')::numeric), 0)`,
              count: sql<number>`count(*) FILTER (WHERE NULLIF(${targetExpr}::text, '') IS NOT NULL)::int`,
            })
            .from(students)
            .where(whereClause)
            .groupBy(groupExpr)
            .limit(chartLimit);
          chartData = numericChart
            .map((row) => {
              const sum = Number(row.sum ?? 0);
              const count = Number(row.count ?? 0);
              return {
                name: row.name,
                value: query.operation === 'sum' ? sum : count > 0 ? Math.round(sum / count) : 0,
              };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, chartLimit);
        }
      }

      results[query.id] = { value, totalCount, chartData };
    }

    return results;
  });
}

export async function listStudentLinkedContactIdsSql(
  tenant: string,
  excludeStudentId?: string,
): Promise<Array<string | number>> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const conditions: SQL[] = [eq(students.workspaceSubdomain, subdomain), isNull(students.deletedAt)];
    if (excludeStudentId?.trim()) {
      conditions.push(ne(students.id, excludeStudentId.trim()));
    }
    const rows = await tx
      .select({
        contactId: students.contactId,
      })
      .from(students)
      .where(and(...conditions));
    return rows
      .map((row) => row.contactId)
      .filter((id): id is string => Boolean(id && id.trim()));
  });
}

export async function countStudentsForNextGrNumber(
  tenant: string,
  regDate: string,
  restartAnnually: boolean,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  const year = regDate ? new Date(regDate).getFullYear() : new Date().getFullYear();
  return withTenant(subdomain, async (tx) => {
    const base = and(eq(students.workspaceSubdomain, subdomain), isNull(students.deletedAt));
    if (!restartAnnually) {
      const rows = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(base);
      return Number(rows[0]?.count ?? 0);
    }
    const yearStr = String(year);
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(
        and(
          base,
          sql`(
            COALESCE(${students.registeredDate}, '') LIKE ${`${yearStr}%`}
            OR COALESCE(${students.grNumber}, '') LIKE ${`%${yearStr}%`}
          )`,
        ),
      );
    return Number(rows[0]?.count ?? 0);
  });
}

export async function findStudentRegistrationConflictSql(
  tenant: string,
  input: {
    excludeId?: string;
    contactId?: string | number;
    email?: string;
    name?: string;
    dob?: string;
    grNumber?: string;
  },
): Promise<'contact' | 'email' | 'nameDob' | 'grNumber' | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const exclude = input.excludeId?.trim();
    const baseConditions: SQL[] = [
      eq(students.workspaceSubdomain, subdomain),
      isNull(students.deletedAt),
    ];
    if (exclude) baseConditions.push(ne(students.id, exclude));

    if (input.contactId != null && String(input.contactId).trim() !== '') {
      const contactId = String(input.contactId).trim();
      const rows = await tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            ...baseConditions,
            eq(students.contactId, contactId),
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'contact';
    }

    const email = input.email?.trim().toLowerCase();
    if (email) {
      const rows = await tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            ...baseConditions,
            sql`EXISTS (
              SELECT 1 FROM ${contacts} c
              LEFT JOIN ${contactEmails} ce ON ce.workspace_subdomain = c.workspace_subdomain AND ce.contact_id = c.id
              WHERE c.workspace_subdomain = ${students.workspaceSubdomain}
                AND c.id = ${students.contactId}
                AND (
                  lower(trim(COALESCE(c.email, ''))) = ${email}
                  OR lower(trim(COALESCE(ce.address, ''))) = ${email}
                )
            )`,
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'email';
    }

    const grNumber = input.grNumber?.trim().toLowerCase();
    if (grNumber) {
      const rows = await tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            ...baseConditions,
            sql`lower(trim(COALESCE(${students.grNumber}, ''))) = ${grNumber}`,
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'grNumber';
    }

    const name = input.name?.trim().toLowerCase();
    const dob = input.dob?.trim();
    if (name && dob) {
      const rows = await tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            ...baseConditions,
            sql`EXISTS (
              SELECT 1 FROM ${contacts} c
              WHERE c.workspace_subdomain = ${students.workspaceSubdomain}
                AND c.id = ${students.contactId}
                AND (
                  lower(trim(COALESCE(c.name, ''))) = ${name}
                  OR lower(trim(concat_ws(' ', c.first_name, c.last_name))) = ${name}
                )
                AND NULLIF(trim(c.dob), '') = ${dob}
            )`,
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'nameDob';
    }

    return null;
  });
}

/**
 * Finds a soft-deleted student whose `contact_id` matches (re-registration
 * restore-on-create probe). Only deleted rows are candidates so an active
 * duplicate is never accidentally restored.
 */
export async function findSoftDeletedStudentByContactIdSql(
  tenant: string,
  contactId: string,
): Promise<ReturnType<typeof studentRowToRecord> | null> {
  const subdomain = tenant.trim().toLowerCase();
  const trimmedContactId = contactId.trim();
  if (!trimmedContactId) return null;
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(students)
      .where(
        and(
          eq(students.workspaceSubdomain, subdomain),
          eq(students.contactId, trimmedContactId),
          isNotNull(students.deletedAt),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? studentRowToRecord(row) : null;
  });
}
