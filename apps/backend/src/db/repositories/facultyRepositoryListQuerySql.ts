import { eq, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';
import {
  dedupeTrimmedIds,
  isQueryFlagTrue,
  DEFAULT_FACULTY_STATUS,
  FACULTY_SORT_FIELD_SET,
  facultyQuickFilterStatusValue,
  type FacultyListQuery,
} from '@mms/shared';
import { faculty } from '../schema.js';
import {
  joinedContactGenderExpr,
  joinedContactNameExpr,
  joinedPrimaryDepartmentNameExpr,
  joinedPrimaryDesignationNameExpr,
  joinedReportsToFacultyExpr,
} from './facultyPrimaryAppointmentSql.js';

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

function buildSearchSql(search: string): SQL | null {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return null;
  const pattern = `%${normalized}%`;
  return sql`(
    lower(COALESCE(${faculty.employeeId}, '')) LIKE ${pattern}
    OR lower(${joinedPrimaryDesignationNameExpr()}) LIKE ${pattern}
    OR lower(${joinedPrimaryDepartmentNameExpr()}) LIKE ${pattern}
    OR lower(COALESCE(${faculty.specialization}, '')) LIKE ${pattern}
    OR lower(COALESCE(${faculty.qualification}, '')) LIKE ${pattern}
    OR lower(${joinedContactNameExpr()}) LIKE ${pattern}
    OR lower(COALESCE(fc.first_name, '')) LIKE ${pattern}
    OR lower(COALESCE(fc.last_name, '')) LIKE ${pattern}
  )`;
}

/** ORDER BY — requires LATERAL primary-appointment FROM (pa_dept / pa_desig / fc). */
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
    const nameSort = sql`lower(trim(${joinedContactNameExpr()}))`;
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
    const designationSort = joinedPrimaryDesignationNameExpr();
    return dir === 'desc'
      ? sql`lower(${designationSort}) desc nulls last`
      : sql`lower(${designationSort}) asc nulls last`;
  }
  if (field === 'department') {
    const departmentSort = joinedPrimaryDepartmentNameExpr();
    return dir === 'desc'
      ? sql`lower(${departmentSort}) desc nulls last`
      : sql`lower(${departmentSort}) asc nulls last`;
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

/** WHERE conditions — requires LATERAL primary-appointment FROM for dept/desig/supervisor/contact. */
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
    const dept = (query as { department?: string }).department!.trim();
    conditions.push(sql`lower(trim(${joinedPrimaryDepartmentNameExpr()})) = lower(trim(${dept}))`);
  }

  if ((query as { designation?: string }).designation?.trim()) {
    const desig = (query as { designation?: string }).designation!.trim();
    conditions.push(sql`lower(trim(${joinedPrimaryDesignationNameExpr()})) = lower(trim(${desig}))`);
  }

  if ((query as { reportingFacultyId?: string }).reportingFacultyId?.trim()) {
    const supervisorId = (query as { reportingFacultyId?: string }).reportingFacultyId!.trim();
    conditions.push(joinedReportsToFacultyExpr(supervisorId));
  }

  if (query.gender?.trim()) {
    const genderFilter = query.gender.trim().toLowerCase();
    conditions.push(sql`${joinedContactGenderExpr()} = ${genderFilter}`);
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
