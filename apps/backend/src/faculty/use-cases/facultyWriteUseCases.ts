import type { TeacherRecord, TeacherWrite } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../lib/livePush.js';
import type { FacultyRepository as TeachersRepository } from '../repository/facultyRepository.js';
import { facultyRepository as teachersRepository } from '../repository/facultyRepositoryAdapter.js';
import { mergeTeacherPatch, prepareTeacherRecord } from './facultyNormalizeUseCases.js';
import { ensureFacultyDesignationLookup } from './facultyLookupsService.js';
import { generateNextEmployeeId } from './facultyEmployeeIdService.js';

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

export class HierarchyValidationError extends Error {
  readonly statusCode = 400;
  readonly type = 'validation_error';
  constructor(message = 'Supervisor must hold a higher seniority rank (lower hierarchy rank) than the subordinate') {
    super(message);
    this.name = 'HierarchyValidationError';
  }
}

export class HierarchyCycleError extends Error {
  readonly statusCode = 400;
  readonly type = 'validation_error';
  constructor(message = 'Circular reporting hierarchy detected. A faculty member cannot report to their subordinate or themselves.') {
    super(message);
    this.name = 'HierarchyCycleError';
  }
}

export async function validateReportingHierarchy(
  tenant: string,
  facultyId: string | undefined,
  hierarchyRank: number,
  reportingFacultyId: string | null | undefined,
  repo: TeachersRepository,
): Promise<void> {
  if (!reportingFacultyId || !reportingFacultyId.trim()) return;
  const supervisorId = reportingFacultyId.trim();

  if (facultyId && supervisorId === String(facultyId).trim()) {
    throw new HierarchyCycleError('A faculty member cannot report to themselves');
  }

  const supervisor = await repo.findById(tenant, supervisorId);
  if (!supervisor || (supervisor as { deletedAt?: string | null }).deletedAt) {
    throw new HierarchyValidationError('Specified reporting supervisor does not exist or has been deleted');
  }

  const supervisorRank = (supervisor as { hierarchyRank?: number }).hierarchyRank ?? 10;
  if (supervisorRank >= hierarchyRank) {
    throw new HierarchyValidationError(
      `Supervisor (rank ${supervisorRank}) must have a higher authority level (lower rank number) than the subordinate (rank ${hierarchyRank})`,
    );
  }

  if (facultyId) {
    const visited = new Set<string>([facultyId]);
    let currentSupervisorId: string | null = supervisorId;
    let depth = 0;
    while (currentSupervisorId && depth < 50) {
      if (visited.has(currentSupervisorId)) {
        throw new HierarchyCycleError('Circular reporting hierarchy detected in the supervisory chain');
      }
      visited.add(currentSupervisorId);
      const parent = await repo.findById(tenant, currentSupervisorId);
      if (!parent) break;
      currentSupervisorId = (parent as { reportingFacultyId?: string | null }).reportingFacultyId ?? null;
      depth += 1;
    }
  }
}

export interface CreateTeacherOptions {
  /** False when the caller lacks `teachers.delete`; blocks implicit restore. */
  canRestore?: boolean;
}

/**
 * Creates a faculty member. When the incoming record carries a `contactId` that matches a
 * soft-deleted faculty (re-registration), the archived row is restored in place —
 * its id/createdAt are preserved, deletion markers cleared, and incoming fields
 * overlaid (Contacts/Students restore-on-create parity).
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
    const customDes = typeof rawRecord.customDesignation === 'string' && rawRecord.customDesignation.trim()
      ? rawRecord.customDesignation.trim()
      : typeof rawRecord.designation === 'string' && rawRecord.designation.trim()
        ? rawRecord.designation.trim()
        : '';
    if (customDes) {
      await ensureFacultyDesignationLookup(tenant, customDes);
    }

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
    await validateReportingHierarchy(
      tenant,
      normalized.id != null ? String(normalized.id) : undefined,
      targetRank,
      targetSupervisor,
      repo,
    );

    const contactId = normalized.contactId != null ? String(normalized.contactId).trim() : '';

    if (contactId) {
      const archived = await repo.findSoftDeletedByContactId(tenant, contactId);
      if (archived) {
        if (options.canRestore === false) {
          throw new TeacherPermissionError();
        }
        const merged = prepareTeacherRecord({
          ...archived,
          ...normalized,
          id: archived.id,
        });
        await repo.save(tenant, merged);
        return { record: merged, restored: true };
      }
    }

    await repo.save(tenant, normalized);
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
    const customDes = typeof rawRecord.customDesignation === 'string' && rawRecord.customDesignation.trim()
      ? rawRecord.customDesignation.trim()
      : typeof rawRecord.designation === 'string' && rawRecord.designation.trim()
        ? rawRecord.designation.trim()
        : '';
    if (customDes) {
      await ensureFacultyDesignationLookup(tenant, customDes);
    }

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

    // Validate that new hierarchyRank does not invert authority over existing direct subordinates
    const directSubordinates = repo.findSubordinates
      ? await repo.findSubordinates(tenant, id)
      : [];
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

