import { eq, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';
import {
  isQueryFlagTrue,
  DEFAULT_TEACHER_STATUS,
  TEACHER_SORT_FIELD_SET,
  teachersQuickFilterStatusValue,
  type TeachersListQuery,
} from '@mms/shared';
import { teachers, contacts } from '../schema.js';

/** Shared status expression for Teachers list filters + metrics. */
export function teacherStatusExpr(): SQL {
  return sql`lower(trim(COALESCE(${teachers.status}, ${DEFAULT_TEACHER_STATUS})))`;
}

function specializationExpr(): SQL {
  return sql`trim(COALESCE(${teachers.specialization}, ''))`;
}

export function employeeIdExpr(): SQL {
  return sql`lower(trim(COALESCE(${teachers.employeeId}, '')))`;
}

/** Display name from linked contact for Work sort (Contacts SSOT). */
function linkedContactNameSortExpr(): SQL {
  return sql`lower(trim(COALESCE((
    SELECT COALESCE(
      NULLIF(trim(concat_ws(' ', c.first_name, c.last_name)), ''),
      NULLIF(trim(COALESCE(c.name, '')), ''),
      ''
    )
    FROM ${contacts} c
    WHERE c.workspace_subdomain = ${teachers.workspaceSubdomain}
      AND c.id = ${teachers.contactId}
    LIMIT 1
  ), '')))`;
}

/** Gender from linked contact (Contacts SSOT). */
function linkedContactGenderExpr(): SQL {
  return sql`lower(trim(COALESCE((
    SELECT c.gender
    FROM ${contacts} c
    WHERE c.workspace_subdomain = ${teachers.workspaceSubdomain}
      AND c.id = ${teachers.contactId}
    LIMIT 1
  ), '')))`;
}

function buildSearchSql(search: string): SQL | null {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return null;
  const pattern = `%${normalized}%`;
  return sql`(
    lower(COALESCE(${teachers.employeeId}, '')) LIKE ${pattern}
    OR lower(COALESCE(${teachers.specialization}, '')) LIKE ${pattern}
    OR lower(COALESCE(${teachers.qualification}, '')) LIKE ${pattern}
    OR EXISTS (
      SELECT 1 FROM ${contacts} c
      WHERE c.workspace_subdomain = ${teachers.workspaceSubdomain}
        AND c.id = ${teachers.contactId}
        AND (
          lower(COALESCE(c.name, '')) LIKE ${pattern}
          OR lower(concat_ws(' ', c.first_name, c.last_name)) LIKE ${pattern}
          OR lower(COALESCE(c.first_name, '')) LIKE ${pattern}
          OR lower(COALESCE(c.last_name, '')) LIKE ${pattern}
        )
    )
  )`;
}

export function buildOrderBy(sortField: string | undefined, sortDir: 'asc' | 'desc' | undefined): SQL {
  const dir = sortDir === 'desc' ? 'desc' : 'asc';
  const field = sortField?.trim();
  if (!field || !TEACHER_SORT_FIELD_SET.has(field)) {
    return sql`${teachers.id} asc`;
  }
  if (field === 'updatedAt') {
    return dir === 'desc'
      ? sql`${teachers.updatedAt} desc nulls last`
      : sql`${teachers.updatedAt} asc nulls last`;
  }
  if (field === 'name') {
    const nameSort = linkedContactNameSortExpr();
    return dir === 'desc' ? sql`${nameSort} desc nulls last` : sql`${nameSort} asc nulls last`;
  }
  if (field === 'status') {
    const statusSort = teacherStatusExpr();
    return dir === 'desc' ? sql`${statusSort} desc nulls last` : sql`${statusSort} asc nulls last`;
  }
  if (field === 'employeeId') {
    const empSort = employeeIdExpr();
    return dir === 'desc' ? sql`${empSort} desc nulls last` : sql`${empSort} asc nulls last`;
  }
  if (field === 'specialization') {
    const specSort = specializationExpr();
    return dir === 'desc' ? sql`${specSort} desc nulls last` : sql`${specSort} asc nulls last`;
  }
  if (field === 'joinDate') {
    return dir === 'desc'
      ? sql`${teachers.joinDate} desc nulls last`
      : sql`${teachers.joinDate} asc nulls last`;
  }
  return sql`${teachers.id} asc`;
}

export function buildListConditions(subdomain: string, query: TeachersListQuery & { includeDeleted?: boolean }): SQL[] {
  const conditions: SQL[] = [eq(teachers.workspaceSubdomain, subdomain)];

  if (isQueryFlagTrue(query.includeDeleted)) {
    conditions.push(isNotNull(teachers.deletedAt));
  } else {
    conditions.push(isNull(teachers.deletedAt));
  }

  if (query.status?.trim()) {
    const statuses = query.status
      .split(',')
      .map((status) => status.trim().toLowerCase())
      .filter(Boolean);
    if (statuses.length > 0) {
      conditions.push(sql`${teacherStatusExpr()} IN (${sql.join(
        statuses.map((status) => sql`${status}`),
        sql`, `,
      )})`);
    }
  }

  if (query.specialization?.trim()) {
    conditions.push(sql`${specializationExpr()} = ${query.specialization.trim()}`);
  }

  if (query.gender?.trim()) {
    const genderFilter = query.gender.trim().toLowerCase();
    conditions.push(sql`${linkedContactGenderExpr()} = ${genderFilter}`);
  }

  const quickFilter = query.quickFilter;
  if (quickFilter && quickFilter !== 'all') {
    if (quickFilter === 'missingEmployeeId') {
      conditions.push(sql`NULLIF(trim(COALESCE(${teachers.employeeId}, '')), '') IS NULL`);
    } else {
      const statusValue = teachersQuickFilterStatusValue(quickFilter);
      if (statusValue) conditions.push(sql`${teacherStatusExpr()} = ${statusValue}`);
    }
  }

  const search = query.search?.trim();
  if (search) {
    const searchSql = buildSearchSql(search);
    if (searchSql) conditions.push(searchSql);
  }

  return conditions;
}
