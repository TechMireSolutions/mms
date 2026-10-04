import type { FacultyDesignationHolding, FacultyRecord } from '@mms/shared';
import { facultyDesignationHoldingsSchema } from '@mms/shared';
import { saveFacultyAssignment } from '../../db/repositories/facultyAssignmentRepository.js';
import { prepareFacultyRecord } from './facultyNormalizeUseCases.js';

function resolveHoldingDates(
  normalized: FacultyRecord,
  rawRecord: Record<string, unknown>,
  holding: FacultyDesignationHolding,
): { startsOn: string; endsOn: string | null } {
  const startsOn =
    (typeof holding.startsOn === 'string' && holding.startsOn.trim())
    || (typeof rawRecord.designationStartsOn === 'string' && rawRecord.designationStartsOn.trim())
    || (typeof normalized.joinDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(normalized.joinDate)
      ? normalized.joinDate
      : new Date().toISOString().slice(0, 10));

  const endsOn =
    holding.endsOn != null && String(holding.endsOn).trim()
      ? String(holding.endsOn).trim()
      : (typeof rawRecord.designationEndsOn === 'string' && rawRecord.designationEndsOn.trim()
        ? rawRecord.designationEndsOn.trim()
        : null);

  return { startsOn, endsOn };
}

function resolveHoldingDepartmentId(
  holding: FacultyDesignationHolding,
  rawRecord: Record<string, unknown>,
): string {
  if (typeof holding.departmentId === 'string' && holding.departmentId.trim()) {
    return holding.departmentId.trim();
  }
  return typeof rawRecord.departmentId === 'string' ? rawRecord.departmentId.trim() : '';
}

/** Parse designations[] from create payload, or synthesize one row from legacy designationId. */
export function parseDesignationHoldings(rawRecord: Record<string, unknown>): FacultyDesignationHolding[] {
  const parsed = facultyDesignationHoldingsSchema.safeParse(rawRecord.designations);
  if (parsed.success && parsed.data.length > 0) {
    return parsed.data.filter((row) => row.designationId.trim().length > 0);
  }

  const designationId = typeof rawRecord.designationId === 'string' ? rawRecord.designationId.trim() : '';
  if (!designationId) return [];
  const departmentId = typeof rawRecord.departmentId === 'string' ? rawRecord.departmentId.trim() : '';
  return [{
    designationId,
    status: 'active',
    ...(departmentId ? { departmentId } : {}),
  }];
}

async function persistDesignationHoldings(
  tenant: string,
  facultyId: string,
  holdings: FacultyDesignationHolding[],
  normalized: FacultyRecord,
  rawRecord: Record<string, unknown>,
): Promise<void> {
  if (holdings.length === 0) return;

  let primaryAssigned = false;
  let writeIndex = 0;
  for (const holding of holdings) {
    const departmentId = resolveHoldingDepartmentId(holding, rawRecord);
    if (!departmentId) continue;

    const { startsOn, endsOn } = resolveHoldingDates(normalized, rawRecord, holding);
    const status = holding.status === 'inactive' ? 'inactive' : 'active';
    const isPrimary = status === 'active' && !primaryAssigned
      ? (holding.isPrimary !== false)
      : false;
    if (isPrimary) primaryAssigned = true;
    writeIndex += 1;

    await saveFacultyAssignment(tenant, {
      id: `fa-${facultyId}-${writeIndex}`,
      workspaceSubdomain: tenant,
      facultyId,
      departmentId,
      designationId: holding.designationId,
      startDate: startsOn,
      endDate: endsOn,
      isPrimary,
      status,
      notes: null,
    });
  }
}

/**
 * Handles the implicit restore path when
 * an incoming `contactId` matches a soft-deleted faculty row.
 *
 * Returns the merged + persisted record (already saved via `repo.save`).
 */
export async function handleImplicitRestore(
  tenant: string,
  archived: FacultyRecord,
  normalized: FacultyRecord,
  rawRecord: Record<string, unknown>,
  save: (tenant: string, record: FacultyRecord) => Promise<void>,
): Promise<FacultyRecord> {
  const merged = prepareFacultyRecord({
    ...archived,
    ...normalized,
    id: archived.id,
  });
  await save(tenant, merged);

  const holdings = parseDesignationHoldings(rawRecord);
  if (holdings.length > 0) {
    try {
      await persistDesignationHoldings(tenant, String(merged.id), holdings, merged, rawRecord);
    } catch {
      // Non-fatal: overlap / unique conflicts with existing appointments — skip silently.
    }
  }
  return merged;
}

/**
 * Saves initial designation holdings after a fresh faculty record has been persisted.
 * Writes faculty_assignments only (FA SSOT); does not dual-write legacy FDA rows.
 */
export async function saveDesignationOnCreate(
  tenant: string,
  normalized: FacultyRecord,
  rawRecord: Record<string, unknown>,
): Promise<void> {
  const holdings = parseDesignationHoldings(rawRecord);
  if (holdings.length === 0) return;
  await persistDesignationHoldings(tenant, String(normalized.id), holdings, normalized, rawRecord);
}
