import { randomUUID } from 'node:crypto';
import type { FacultyDepartmentImportBody, FacultyDesignationImportBody } from '@mms/shared';
import {
  listFacultyDepartments,
  saveFacultyDepartment,
} from '../../db/repositories/facultyDepartmentRepository.js';
import {
  listFacultyDesignations,
  saveFacultyDesignation,
} from '../../db/repositories/facultyDesignationRepository.js';

export interface CatalogImportJobContext {
  tenant: string;
  userId: string;
  updateProgress: (current: number, total: number) => Promise<void>;
}

export interface CatalogImportJobResult {
  imported: number;
  failed: number;
  total: number;
}

/** Upsert departments by code; resolve parentCode after all rows exist. */
export async function runFacultyDepartmentsImportJob(
  payload: { rows: FacultyDepartmentImportBody['rows'] },
  context: CatalogImportJobContext,
): Promise<CatalogImportJobResult> {
  const rows = payload.rows ?? [];
  const total = rows.length;
  let imported = 0;
  await context.updateProgress(0, total);

  const existing = await listFacultyDepartments(context.tenant);
  type DeptRef = { id: string; code: string; name: string; parentId: string | null; isActive: boolean };
  const byCode = new Map<string, DeptRef>(
    existing.map((d) => [
      d.code.trim().toLowerCase(),
      {
        id: d.id,
        code: d.code,
        name: d.name,
        parentId: d.parentId ?? null,
        isActive: d.isActive ?? true,
      },
    ]),
  );

  // First pass: upsert without parent links.
  for (let i = 0; i < total; i += 1) {
    const row = rows[i];
    try {
      const key = row.code.trim().toLowerCase();
      const prior = byCode.get(key);
      const id = prior?.id ?? randomUUID();
      await saveFacultyDepartment(context.tenant, {
        id,
        workspaceSubdomain: context.tenant,
        name: row.name,
        code: row.code.trim(),
        parentId: prior?.parentId ?? null,
        isActive: row.isActive ?? true,
        updatedBy: context.userId,
      });
      byCode.set(key, {
        id,
        name: row.name,
        code: row.code.trim(),
        isActive: row.isActive ?? true,
        parentId: prior?.parentId ?? null,
      });
      imported += 1;
    } catch {
      // Continue batch
    }
    if ((i + 1) % 10 === 0 || i + 1 === total) {
      await context.updateProgress(i + 1, total);
    }
  }

  // Second pass: apply parentCode links.
  for (const row of rows) {
    if (!row.parentCode?.trim()) continue;
    const child = byCode.get(row.code.trim().toLowerCase());
    const parent = byCode.get(row.parentCode.trim().toLowerCase());
    if (!child || !parent || child.id === parent.id) continue;
    try {
      await saveFacultyDepartment(context.tenant, {
        id: child.id,
        workspaceSubdomain: context.tenant,
        name: child.name,
        code: child.code,
        parentId: parent.id,
        isActive: child.isActive,
        updatedBy: context.userId,
      });
    } catch {
      // ignore parent-link failures
    }
  }

  return { imported, failed: total - imported, total };
}

/** Upsert designations by code. */
export async function runFacultyDesignationsImportJob(
  payload: { rows: FacultyDesignationImportBody['rows'] },
  context: CatalogImportJobContext,
): Promise<CatalogImportJobResult> {
  const rows = payload.rows ?? [];
  const total = rows.length;
  let imported = 0;
  await context.updateProgress(0, total);

  const existing = await listFacultyDesignations(context.tenant);
  const byCode = new Map(existing.map((d) => [d.code.trim().toLowerCase(), d]));

  for (let i = 0; i < total; i += 1) {
    const row = rows[i];
    try {
      const key = row.code.trim().toLowerCase();
      const prior = byCode.get(key);
      const id = prior?.id ?? randomUUID();
      await saveFacultyDesignation(context.tenant, {
        id,
        code: row.code.trim(),
        name: row.name,
        hierarchyRank: row.hierarchyRank ?? prior?.hierarchyRank ?? 10,
        isActive: row.isActive ?? true,
        assignableRoles: row.assignableRoles ?? prior?.assignableRoles ?? [],
      });
      imported += 1;
    } catch {
      // Continue batch
    }
    if ((i + 1) % 10 === 0 || i + 1 === total) {
      await context.updateProgress(i + 1, total);
    }
  }

  return { imported, failed: total - imported, total };
}

export function buildCatalogImportJobLabel(
  entity: string,
  result: CatalogImportJobResult,
): string {
  if (result.failed > 0) {
    return `Imported ${result.imported}/${result.total} ${entity} (${result.failed} failed)`;
  }
  return `Imported ${result.imported} ${entity}`;
}
