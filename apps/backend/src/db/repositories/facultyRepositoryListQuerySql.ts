import { eq, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';
import {
  dedupeTrimmedIds,
  isQueryFlagTrue,
  DEFAULT_FACULTY_STATUS,
  FACULTY_SORT_FIELD_SET,
  facultyQuickFilterStatusValue,
  type FacultyListQuery,
} from '@mms/shared';
import { faculty, contacts } from '../schema.js';

/** Shared status expression for Faculty list filters + metrics. */
export function facultyStatusExpr(): SQL {
  return sql`lower(trim(COALESCE(${faculty.status}, ${DEFAULT_FACULTY_STATUS})))`;
}

function specializationExpr(): SQL {
  return sql`trim(COALESCE(${faculty.specialization}, ''))`;
}

export function employeeIdExpr(): SQL {
  return sql`lower(trim(COALESCE(${faculty.employeeId}, '')))`;
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
    WHERE c.workspace_subdomain = ${faculty.workspaceSubdomain}
      AND c.id = ${faculty.contactId}
    LIMIT 1
  ), '')))`;
}

/** Gender from linked contact (Contacts SSOT). */
function linkedContactGenderExpr(): SQL {
  return sql`lower(trim(COALESCE((
    SELECT c.gender
    FROM ${contacts} c
    WHERE c.workspace_subdomain = ${faculty.workspaceSubdomain}
      AND c.id = ${faculty.contactId}
    LIMIT 1
  ), '')))`;
}

function buildSearchSql(search: string): SQL | null {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return null;
  const pattern = `%${normalized}%`;
  return sql`(
    lower(COALESCE(${faculty.employeeId}, '')) LIKE ${pattern}
    OR lower(COALESCE(${faculty.designation}, '')) LIKE ${pattern}
    OR lower(COALESCE(${faculty.specialization}, '')) LIKE ${pattern}
    OR lower(COALESCE(${faculty.qualification}, '')) LIKE ${pattern}
    OR EXISTS (
      SELECT 1 FROM ${contacts} c
      WHERE c.workspace_subdomain = ${faculty.workspaceSubdomain}
        AND c.id = ${faculty.contactId}
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
  if (!field || !FACULTY_SORT_FIELD_SET.has(field)) {
    return sql`${faculty.id} asc`;
  }
  if (field === 'updatedAt') {
    return dir === 'desc'
      ? sql`${faculty.updatedAt} desc nulls last`
      : sql`${faculty.updatedAt} asc nulls last`;
  }
  if (field === 'name') {
    const nameSort = linkedContactNameSortExpr();
    return dir === 'desc' ? sql`${nameSort} desc nulls last` : sql`${nameSort} asc nulls last`;
  }
  if (field === 'status') {
    const statusSort = facultyStatusExpr();
    return dir === 'desc' ? sql`${statusSort} desc nulls last` : sql`${statusSort} asc nulls last`;
  }
  if (field === 'employeeId') {
    const empSort = employeeIdExpr();
    return dir === 'desc' ? sql`${empSort} desc nulls last` : sql`${empSort} asc nulls last`;
  }
  if (field === 'designation') {
    return dir === 'desc'
      ? sql`lower(COALESCE(${faculty.designation}, '')) desc nulls last`
      : sql`lower(COALESCE(${faculty.designation}, '')) asc nulls last`;
  }
  if (field === 'specialization') {
    const specSort = specializationExpr();
    return dir === 'desc' ? sql`${specSort} desc nulls last` : sql`${specSort} asc nulls last`;
  }
  if (field === 'qualification') {
    return dir === 'desc'
      ? sql`lower(COALESCE(${faculty.qualification}, '')) desc nulls last`
      : sql`lower(COALESCE(${faculty.qualification}, '')) asc nulls last`;
  }
  if (field === 'joinDate') {
    return dir === 'desc'
      ? sql`${faculty.joinDate} desc nulls last`
      : sql`${faculty.joinDate} asc nulls last`;
  }
  return sql`${faculty.id} asc`;
}

export function buildListConditions(subdomain: string, query: FacultyListQuery & { includeDeleted?: boolean }): SQL[] {
  const conditions: SQL[] = [eq(faculty.workspaceSubdomain, subdomain)];

  if (isQueryFlagTrue(query.includeDeleted)) {
    conditions.push(isNotNull(faculty.deletedAt));
  } else {
    conditions.push(isNull(faculty.deletedAt));
  }

  const rawStatuses = dedupeTrimmedIds(query.status);
  if (rawStatuses.length > 0) {
    const statuses = rawStatuses.map((status) => status.toLowerCase());
    conditions.push(sql`${facultyStatusExpr()} IN (${sql.join(
      statuses.map((status) => sql`${status}`),
      sql`, `,
    )})`);
  }

  if (query.specialization?.trim()) {
    conditions.push(sql`${specializationExpr()} = ${query.specialization.trim()}`);
  }

  if ((query as { department?: string }).department?.trim()) {
    conditions.push(sql`lower(trim(COALESCE(${faculty.department}, ''))) = lower(trim(${(query as { department?: string }).department!.trim()}))`);
  }

  if ((query as { designation?: string }).designation?.trim()) {
    conditions.push(sql`lower(trim(COALESCE(${faculty.designation}, ''))) = lower(trim(${(query as { designation?: string }).designation!.trim()}))`);
  }

  if ((query as { reportingFacultyId?: string }).reportingFacultyId?.trim()) {
    conditions.push(eq(faculty.reportingFacultyId, (query as { reportingFacultyId?: string }).reportingFacultyId!.trim()));
  }

  if (query.gender?.trim()) {
    const genderFilter = query.gender.trim().toLowerCase();
    conditions.push(sql`${linkedContactGenderExpr()} = ${genderFilter}`);
  }

  const quickFilter = query.quickFilter;
  if (quickFilter && quickFilter !== 'all') {
    if (quickFilter === 'missingEmployeeId') {
      conditions.push(sql`NULLIF(trim(COALESCE(${faculty.employeeId}, '')), '') IS NULL`);
    } else {
      const statusValue = facultyQuickFilterStatusValue(quickFilter);
      if (statusValue) conditions.push(sql`${facultyStatusExpr()} = ${statusValue}`);
    }
  }

  const search = query.search?.trim();
  if (search) {
    const searchSql = buildSearchSql(search);
    if (searchSql) conditions.push(searchSql);
  }

  return conditions;
}

