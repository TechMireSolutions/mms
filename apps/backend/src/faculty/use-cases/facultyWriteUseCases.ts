import type { FacultyRecord, FacultyWrite } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../lib/livePush.js';
import type { FacultyRepository } from '../repository/facultyRepository.js';
import { facultyRepository } from '../repository/facultyRepositoryAdapter.js';
import { mergeFacultyPatch, prepareFacultyRecord } from './facultyNormalizeUseCases.js';
import { ensureFacultyDesignationLookup } from './facultyLookupsService.js';
import { generateNextFacultyEmployeeId } from './facultyEmployeeIdService.js';
import {
  HierarchyValidationError,
  HierarchyCycleError,
  validateReportingHierarchy,
} from './facultyHierarchyValidator.js';
import { handleImplicitRestore, saveDesignationOnCreate } from './facultyWriteHelpers.js';

export { HierarchyValidationError, HierarchyCycleError, validateReportingHierarchy };

export interface CreateFacultyResult {
  record: FacultyRecord;
  /** True when an archived faculty member with the same contactId was restored instead of inserting. */
  restored: boolean;
}

/** Thrown when a create would un-delete an archived faculty member without delete permission. */
export class FacultyPermissionError extends Error {
  readonly statusCode = 403;
  readonly type = 'forbidden';
  constructor(message = 'Restoring an archived faculty member requires delete permission') {
    super(message);
    this.name = 'FacultyPermissionError';
  }
}

export interface CreateFacultyOptions {
  /** False when the caller lacks `faculty.delete`; blocks implicit restore. */
  canRestore?: boolean;
}

/**
 * Creates a faculty member. When the incoming record carries a `contactId` that matches a
 * soft-deleted faculty (re-registration), the archived row is restored in place.
 */
export async function createFaculty(
  record: FacultyRecord | FacultyWrite | Record<string, unknown>,
  repo: FacultyRepository = facultyRepository,
  options: CreateFacultyOptions = {},
): Promise<CreateFacultyResult> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');

    const rawRecord = record as Record<string, unknown>;
    const customDes = (typeof rawRecord.customDesignation === 'string' ? rawRecord.customDesignation.trim() : '') ||
      (typeof rawRecord.designation === 'string' ? rawRecord.designation.trim() : '');
    if (customDes) await ensureFacultyDesignationLookup(tenant, customDes);

    const normalized = prepareFacultyRecord(record);

    if (!normalized.employeeId || !normalized.employeeId.trim()) {
      const generated = await generateNextFacultyEmployeeId(tenant);
      normalized.employeeId = generated.employeeId;
    }

    const targetRank = typeof (normalized as { hierarchyRank?: number }).hierarchyRank === 'number'
      ? (normalized as { hierarchyRank?: number }).hierarchyRank!
      : 10;
    const targetSupervisor = (normalized as { reportingFacultyId?: string | null }).reportingFacultyId
      ? String((normalized as { reportingFacultyId?: string | null }).reportingFacultyId).trim()
      : null;
    await validateReportingHierarchy(tenant, normalized.id != null ? String(normalized.id) : undefined, targetRank, targetSupervisor, repo);

    const contactId = normalized.contactId != null ? String(normalized.contactId).trim() : '';
    if (contactId) {
      const archived = await repo.findSoftDeletedByContactId(tenant, contactId);
      if (archived) {
        if (options.canRestore === false) throw new FacultyPermissionError();
        const merged = await handleImplicitRestore(tenant, archived as FacultyRecord, normalized, rawRecord, repo.save.bind(repo));
        return { record: merged, restored: true };
      }
    }

    await repo.save(tenant, normalized);
    await saveDesignationOnCreate(tenant, normalized, rawRecord);
    return { record: normalized, restored: false };
  });
  await broadcastCollection('faculty');
  return result;
}

export async function updateFacultyById(
  id: string,
  record: FacultyRecord | FacultyWrite | Record<string, unknown>,
  repo: FacultyRepository = facultyRepository,
): Promise<FacultyRecord | null> {
  const saved = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return null;
    const existing = await repo.findById(tenant, id);
    if (!existing || existing.deletedAt) return null;

    const rawRecord = record as Record<string, unknown>;
    const customDes = (typeof rawRecord.customDesignation === 'string' ? rawRecord.customDesignation.trim() : '') ||
      (typeof rawRecord.designation === 'string' ? rawRecord.designation.trim() : '');
    if (customDes) await ensureFacultyDesignationLookup(tenant, customDes);

    const normalized = prepareFacultyRecord({
      ...mergeFacultyPatch(existing, record),
      id,
    });

    const targetRank = typeof (normalized as { hierarchyRank?: number }).hierarchyRank === 'number'
      ? (normalized as { hierarchyRank?: number }).hierarchyRank!
      : 10;
    const targetSupervisor = (normalized as { reportingFacultyId?: string | null }).reportingFacultyId
      ? String((normalized as { reportingFacultyId?: string | null }).reportingFacultyId).trim()
      : null;
    await validateReportingHierarchy(tenant, id, targetRank, targetSupervisor, repo);

    const directSubordinates = repo.findSubordinates ? await repo.findSubordinates(tenant, id) : [];
    for (const sub of directSubordinates) {
      const subRank = (sub as { hierarchyRank?: number }).hierarchyRank ?? 10;
      if (subRank <= targetRank) {
        throw new HierarchyValidationError(
          `Cannot set hierarchy rank to ${targetRank}: faculty has a subordinate (${sub.id}) with rank ${subRank}. Subordinates must have lower authority than their supervisor.`,
        );
      }
    }

    await repo.save(tenant, normalized);
    return normalized;
  });
  if (saved) {
    await broadcastCollection('faculty');
  }
  return saved;
}
