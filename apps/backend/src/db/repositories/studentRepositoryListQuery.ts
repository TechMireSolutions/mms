import { eq, isNotNull, isNull, ne, sql, type SQL } from 'drizzle-orm';
import {
  isQueryFlagTrue,
  MODULE_METRICS_DEFAULT_PERIOD_DAYS,
  type StudentsListQuery,
} from '@mms/shared';
import { students, studentEnrolledSessions, contacts, sessions, sessionClasses } from '../schema.js';

export const STUDENT_SORT_FIELDS = new Set([
  'name',
  'grNumber',
  'status',
  'gender',
  'registeredDate',
  'dob',
  'studentId',
  'updatedAt',
]);

export function statusExpr(): SQL {
  return sql`lower(trim(COALESCE(${students.status}, 'active')))`;
}

/** Gender from linked contact (Contacts SSOT). */
export function linkedContactGenderExpr(): SQL {
  return sql`lower(trim(COALESCE((
    SELECT c.gender
    FROM ${contacts} c
    WHERE c.workspace_subdomain = ${students.workspaceSubdomain}
      AND c.id = ${students.contactId}
    LIMIT 1
  ), '')))`;
}

/** DOB from linked contact (Contacts SSOT). */
export function linkedContactDobExpr(): SQL {
  return sql`NULLIF(trim(COALESCE((
    SELECT c.dob
    FROM ${contacts} c
    WHERE c.workspace_subdomain = ${students.workspaceSubdomain}
      AND c.id = ${students.contactId}
    LIMIT 1
  ), '')), '')`;
}

/** Display name from linked contact for Work sort (Contacts SSOT). */
export function linkedContactNameSortExpr(): SQL {
  return sql`lower(trim(COALESCE((
    SELECT COALESCE(
      NULLIF(trim(concat_ws(' ', c.first_name, c.last_name)), ''),
      NULLIF(trim(COALESCE(c.name, '')), ''),
      ''
    )
    FROM ${contacts} c
    WHERE c.workspace_subdomain = ${students.workspaceSubdomain}
      AND c.id = ${students.contactId}
    LIMIT 1
  ), '')))`;
}

function grNumberExpr(): SQL {
  return sql`lower(trim(COALESCE(${students.grNumber}, '')))`;
}

function buildSearchSql(search: string): SQL | null {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return null;
  const pattern = `%${normalized}%`;
  return sql`(
    lower(COALESCE(${students.grNumber}, '')) LIKE ${pattern}
    OR lower(COALESCE(${students.studentId}, '')) LIKE ${pattern}
    OR EXISTS (
      SELECT 1 FROM ${contacts} c
      WHERE c.workspace_subdomain = ${students.workspaceSubdomain}
        AND c.id = ${students.contactId}
        AND (
          lower(COALESCE(c.name, '')) LIKE ${pattern}
          OR lower(concat_ws(' ', c.first_name, c.last_name)) LIKE ${pattern}
          OR lower(COALESCE(c.first_name, '')) LIKE ${pattern}
          OR lower(COALESCE(c.last_name, '')) LIKE ${pattern}
          OR COALESCE(c.cnic, '') LIKE ${pattern}
        )
    )
  )`;
}

export function buildOrderBy(sortField: string | undefined, sortDir: 'asc' | 'desc' | undefined): SQL {
  const dir = sortDir === 'desc' ? 'desc' : 'asc';
  const field = sortField?.trim();
  if (!field || !STUDENT_SORT_FIELDS.has(field)) {
    return sql`${students.id} asc`;
  }
  if (field === 'updatedAt') {
    return dir === 'desc'
      ? sql`${students.updatedAt} desc nulls last`
      : sql`${students.updatedAt} asc nulls last`;
  }
  if (field === 'grNumber') {
    const grSort = grNumberExpr();
    return dir === 'desc' ? sql`${grSort} desc nulls last` : sql`${grSort} asc nulls last`;
  }
  if (field === 'status') {
    const statusSort = statusExpr();
    return dir === 'desc' ? sql`${statusSort} desc nulls last` : sql`${statusSort} asc nulls last`;
  }
  if (field === 'gender') {
    const genderSort = linkedContactGenderExpr();
    return dir === 'desc' ? sql`${genderSort} desc nulls last` : sql`${genderSort} asc nulls last`;
  }
  if (field === 'dob') {
    const dobSort = linkedContactDobExpr();
    return dir === 'desc' ? sql`${dobSort} desc nulls last` : sql`${dobSort} asc nulls last`;
  }
  if (field === 'name') {
    const nameSort = linkedContactNameSortExpr();
    return dir === 'desc' ? sql`${nameSort} desc nulls last` : sql`${nameSort} asc nulls last`;
  }
  if (field === 'studentId') {
    return dir === 'desc'
      ? sql`lower(COALESCE(${students.studentId}, '')) desc nulls last`
      : sql`lower(COALESCE(${students.studentId}, '')) asc nulls last`;
  }
  if (field === 'registeredDate') {
    return dir === 'desc'
      ? sql`lower(COALESCE(${students.registeredDate}, '')) desc nulls last`
      : sql`lower(COALESCE(${students.registeredDate}, '')) asc nulls last`;
  }
  return sql`${students.id} asc`;
}

export function buildListConditions(
  subdomain: string,
  query: StudentsListQuery,
): SQL[] {
  const conditions: SQL[] = [eq(students.workspaceSubdomain, subdomain)];

  if (isQueryFlagTrue(query.includeDeleted)) {
    conditions.push(isNotNull(students.deletedAt));
  } else {
    conditions.push(isNull(students.deletedAt));
  }

  if (query.status?.trim()) {
    const statuses = query.status
      .split(',')
      .map((status) => status.trim().toLowerCase())
      .filter(Boolean);
    if (statuses.length > 0) {
      conditions.push(sql`${statusExpr()} IN (${sql.join(
        statuses.map((status) => sql`${status}`),
        sql`, `,
      )})`);
    }
  }

  if (query.gender?.trim()) {
    const genderFilter = query.gender.trim().toLowerCase();
    conditions.push(sql`${linkedContactGenderExpr()} = ${genderFilter}`);
  }

  const quickFilter = query.quickFilter;
  if (quickFilter && quickFilter !== 'all') {
    if (quickFilter === 'new') {
      const since = sql`now() - (${MODULE_METRICS_DEFAULT_PERIOD_DAYS} * interval '1 day')`;
      conditions.push(sql`COALESCE(
        NULLIF(trim(COALESCE(${students.registeredDate}, '')), '')::timestamptz,
        ${students.createdAt}
      ) >= ${since}`);
    } else if (quickFilter === 'missingGr') {
      conditions.push(sql`(${students.grNumber} is null or trim(${students.grNumber}) = '')`);
    } else {
      conditions.push(sql`${statusExpr()} = ${quickFilter}`);
    }
  }

  const search = query.search?.trim();
  if (search) {
    const searchSql = buildSearchSql(search);
    if (searchSql) conditions.push(searchSql);
  }

  if (query.sessionId?.trim()) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM ${studentEnrolledSessions} ses
      WHERE ses.workspace_subdomain = ${students.workspaceSubdomain}
        AND ses.student_id = ${students.id}
        AND ses.session_id = ${query.sessionId.trim()}
    )`);
  }

  const className = query.className?.trim();
  if (className) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM ${studentEnrolledSessions} ses
      JOIN ${sessions} s ON s.workspace_subdomain = ses.workspace_subdomain AND s.id = ses.session_id
      JOIN ${sessionClasses} sc ON sc.workspace_subdomain = s.workspace_subdomain AND sc.session_id = s.id
      WHERE ses.workspace_subdomain = ${students.workspaceSubdomain}
        AND ses.student_id = ${students.id}
        AND s.deleted_at IS NULL
        AND sc.name = ${className}
    )`);
  }

  const relatedContactIds = query.relatedContactIds
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean) ?? [];
  const fatherName = query.fatherName?.trim().toLowerCase();
  const relationshipConditions: SQL[] = [];
  if (relatedContactIds.length > 0) {
    relationshipConditions.push(sql`${students.fatherContactId} IN (${sql.join(
      relatedContactIds.map((id) => sql`${id}`),
      sql`, `,
    )})`);
    relationshipConditions.push(sql`${students.guardianContactId} IN (${sql.join(
      relatedContactIds.map((id) => sql`${id}`),
      sql`, `,
    )})`);
  }
  if (fatherName) {
    relationshipConditions.push(
      sql`lower(trim(COALESCE(${students.fatherName}, ''))) = ${fatherName}`,
    );
  }
  if (relationshipConditions.length > 0) {
    conditions.push(sql`(${sql.join(relationshipConditions, sql` OR `)})`);
  }

  if (query.excludeId?.trim()) {
    conditions.push(ne(students.id, query.excludeId.trim()));
  }

  return conditions;
}
