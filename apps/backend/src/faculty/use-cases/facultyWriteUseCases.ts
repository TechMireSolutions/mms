import type { TeacherRecord, TeacherWrite } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../lib/livePush.js';
import type { FacultyRepository as TeachersRepository } from '../repository/facultyRepository.js';
import { facultyRepository as teachersRepository } from '../repository/facultyRepositoryAdapter.js';
import { mergeTeacherPatch, prepareTeacherRecord } from './facultyNormalizeUseCases.js';
import { ensureFacultyDesignationLookup } from './facultyLookupsService.js';
import { generateNextEmployeeId } from './facultyEmployeeIdService.js';
import {
  HierarchyValidationError,
  HierarchyCycleError,
  validateReportingHierarchy,
} from './facultyHierarchyValidator.js';
import { handleImplicitRestore, saveDesignationOnCreate } from './facultyWriteHelpers.js';

export { HierarchyValidationError, HierarchyCycleError, validateReportingHierarchy };

export interface CreateTeacherResult {
  record: TeacherRecord;
  /** True when an archived teacher with the same contactId was restored instead of inserting. */
  restored: boolean;
}

/** Thrown when a create would un-delete an archived teacher without delete permission. */
export class TeacherPermissionError extends Error {
  readonly statusCode = 403;
  readonly type = 'forbidden';
  constructor(message = 'Restoring an archived teacher requires delete permission') {
    super(message);
    this.name = 'TeacherPermissionError';
  }
}

export interface CreateTeacherOptions {
  /** False when the caller lacks `teachers.delete`; blocks implicit restore. */
  canRestore?: boolean;
}

/**
 * Creates a faculty member. When the incoming record carries a `contactId` that matches a
 * soft-deleted faculty (re-registration), the archived row is restored in place.
 */
export async function createTeacher(
  record: TeacherRecord | TeacherWrite | Record<string, unknown>,
  repo: TeachersRepository = teachersRepository,
  options: CreateTeacherOptions = {},
): Promise<CreateTeacherResult> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');

    const rawRecord = record as Record<string, unknown>;
    const customDes = (typeof rawRecord.customDesignation === 'string' ? rawRecord.customDesignation.trim() : '') ||
      (typeof rawRecord.designation === 'string' ? rawRecord.designation.trim() : '');
    if (customDes) await ensureFacultyDesignationLookup(tenant, customDes);

    const normalized = prepareTeacherRecord(record);

    if (!normalized.employeeId || !normalized.employeeId.trim()) {
      const generated = await generateNextEmployeeId(tenant);
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
        if (options.canRestore === false) throw new TeacherPermissionError();
        const merged = await handleImplicitRestore(tenant, archived as TeacherRecord, normalized, rawRecord, repo.save.bind(repo));
        return { record: merged, restored: true };
      }
    }

    await repo.save(tenant, normalized);
    await saveDesignationOnCreate(tenant, normalized, rawRecord);
    return { record: normalized, restored: false };
  });
  await broadcastCollection('faculty');
  await broadcastCollection('teachers');
  return result;
}

export async function updateTeacherById(
  id: string,
  record: TeacherRecord | TeacherWrite | Record<string, unknown>,
  repo: TeachersRepository = teachersRepository,
): Promise<TeacherRecord | null> {
  const saved = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return null;
    const existing = await repo.findById(tenant, id);
    if (!existing || existing.deletedAt) return null;

    const rawRecord = record as Record<string, unknown>;
    const customDes = (typeof rawRecord.customDesignation === 'string' ? rawRecord.customDesignation.trim() : '') ||
      (typeof rawRecord.designation === 'string' ? rawRecord.designation.trim() : '');
    if (customDes) await ensureFacultyDesignationLookup(tenant, customDes);

    const normalized = prepareTeacherRecord({
      ...mergeTeacherPatch(existing, record),
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
    await broadcastCollection('teachers');
  }
  return saved;
}

export type CreateFacultyResult = CreateTeacherResult;
export type CreateFacultyOptions = CreateTeacherOptions;
export const FacultyPermissionError = TeacherPermissionError;
export const createFaculty = createTeacher;
export const updateFacultyById = updateTeacherById;
