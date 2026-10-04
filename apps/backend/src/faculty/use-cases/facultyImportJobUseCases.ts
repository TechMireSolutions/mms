import { randomUUID } from 'node:crypto';
import type { FacultyImportJobPayload } from '@mms/shared';
import { listFacultyDepartments } from '../../db/repositories/facultyDepartmentRepository.js';
import { listFacultyDesignations } from '../../db/repositories/facultyDesignationRepository.js';
import {
  createFaculty,
  loadFacultyPage,
  updateFacultyById,
} from '../../services/facultyService.js';

export interface FacultyImportJobContext {
  tenant: string;
  userId: string;
  updateProgress: (current: number, total: number) => Promise<void>;
}

export interface FacultyImportJobResult {
  imported: number;
  failed: number;
  total: number;
}

/** Upsert faculty by employeeId; create requires contactId. */
export async function runFacultyMembersImportJob(
  payload: FacultyImportJobPayload,
  context: FacultyImportJobContext,
): Promise<FacultyImportJobResult> {
  const rows = payload.rows ?? [];
  const total = rows.length;
  let imported = 0;
  await context.updateProgress(0, total);

  const departments = await listFacultyDepartments(context.tenant);
  const designations = await listFacultyDesignations(context.tenant);
  const deptByCode = new Map(departments.map((d) => [d.code.trim().toLowerCase(), d]));
  const desigByCode = new Map(designations.map((d) => [d.code.trim().toLowerCase(), d]));

  for (let i = 0; i < total; i += 1) {
    const row = rows[i];
    try {
      const deptName = row.department
        ? (deptByCode.get(row.department.trim().toLowerCase())?.name ?? row.department)
        : undefined;
      const desig = row.designation
        ? desigByCode.get(row.designation.trim().toLowerCase())
        : undefined;

      let existingId: string | undefined;
      if (row.employeeId?.trim()) {
        const page = await loadFacultyPage({
          search: row.employeeId.trim(),
          limit: 20,
          page: 1,
        });
        const match = (page.faculty ?? []).find(
          (f) =>
            String(f.employeeId ?? '')
              .trim()
              .toLowerCase() === row.employeeId!.trim().toLowerCase(),
        );
        if (match?.id) existingId = String(match.id);
      }

      const patch: Record<string, unknown> = {};
      if (row.employeeId) patch.employeeId = row.employeeId.trim();
      if (row.specialization) patch.specialization = row.specialization;
      if (deptName) patch.department = deptName;
      if (desig) {
        patch.designation = desig.name;
        patch.designationId = desig.id;
      } else if (row.designation) {
        patch.designation = row.designation;
      }
      if (row.status) patch.status = row.status;
      if (row.qualification) patch.qualification = row.qualification;
      if (row.joinDate) patch.joinDate = row.joinDate;

      if (existingId) {
        await updateFacultyById(existingId, patch);
      } else {
        const contactId = row.contactId?.trim();
        if (!contactId) throw new Error('contactId required to create faculty');
        await createFaculty({
          id: randomUUID(),
          contactId,
          ...patch,
        });
      }
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

export function buildFacultyImportJobLabel(result: FacultyImportJobResult): string {
  if (result.failed > 0) {
    return `Imported ${result.imported}/${result.total} faculty (${result.failed} failed)`;
  }
  return `Imported ${result.imported} faculty`;
}
