import { buildCsvContent } from './csvUtils.js';
import type { FacultyDepartmentEntity } from './facultyDepartmentTypes.js';
import type { FacultyDesignationDefinition } from './facultyDesignationTypes.js';

export const FACULTY_DEPARTMENT_CSV_COLUMNS = [
  { id: 'code', label: 'code' },
  { id: 'name', label: 'name' },
  { id: 'parentCode', label: 'parentCode' },
  { id: 'isActive', label: 'isActive' },
] as const;

export const FACULTY_DESIGNATION_CSV_COLUMNS = [
  { id: 'code', label: 'code' },
  { id: 'name', label: 'name' },
  { id: 'hierarchyRank', label: 'hierarchyRank' },
  { id: 'isActive', label: 'isActive' },
  { id: 'assignableRoles', label: 'assignableRoles' },
] as const;

export function buildFacultyDepartmentExportRows(
  departments: FacultyDepartmentEntity[],
): string[][] {
  const byId = new Map(departments.map((d) => [d.id, d]));
  const header = FACULTY_DEPARTMENT_CSV_COLUMNS.map((c) => c.label);
  const rows = departments.map((d) => {
    const parentCode = d.parentId ? (byId.get(d.parentId)?.code ?? '') : '';
    return [
      d.code,
      d.name,
      parentCode,
      d.isActive === false ? 'false' : 'true',
    ];
  });
  return [header, ...rows];
}

export function buildFacultyDesignationExportRows(
  designations: FacultyDesignationDefinition[],
): string[][] {
  const header = FACULTY_DESIGNATION_CSV_COLUMNS.map((c) => c.label);
  const rows = designations.map((d) => [
    d.code,
    d.name,
    String(d.hierarchyRank),
    d.isActive === false ? 'false' : 'true',
    (d.assignableRoles ?? []).join(';'),
  ]);
  return [header, ...rows];
}

export function facultyDepartmentsToCsv(departments: FacultyDepartmentEntity[]): string {
  return buildCsvContent(buildFacultyDepartmentExportRows(departments));
}

export function facultyDesignationsToCsv(designations: FacultyDesignationDefinition[]): string {
  return buildCsvContent(buildFacultyDesignationExportRows(designations));
}
