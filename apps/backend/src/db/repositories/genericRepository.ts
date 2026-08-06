import { and, eq, inArray, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';
import { applyTitleCaseRecursive, stripContactClientSoftDeleteFields } from '@mms/shared';
import { withTenantTransaction } from '../withTenantTransaction.js';

export interface GenericRepoOptions {
  updateStrategy?: 'merge' | 'overwrite';
  /** Required for bulkSave on composite-PK tenant tables. */
  conflictTarget?: AnyPgColumn | AnyPgColumn[];
  /** When true, mirrors record.deletedAt into the table's deleted_at column. */
  syncDeletedAtColumn?: boolean;
  /** When true, mirrors record.contactId into the table's contact_id column (keeps JSONB). */
  syncContactIdColumn?: boolean;
  /** When true, mirrors record.status into the table's status column (keeps JSONB). */
  syncStatusColumn?: boolean;
  /** When true, mirrors record.grNumber into the table's gr_number column (keeps JSONB). */
  syncGrNumberColumn?: boolean;
}

/** Soft-delete scope for list queries on tables with a typed deleted_at column. */
export type SoftDeleteListFilter = 'active' | 'deleted' | 'all';

export interface ListByWorkspaceOptions {
  deleted?: SoftDeleteListFilter;
}

type GenericTableRow = {
  id: string | number;
  customData: unknown;
  contactId?: string | null;
  status?: string | null;
  grNumber?: string | null;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  deletionReason?: string | null;
};

type GenericTable = AnyPgTable & {
  id: AnyPgColumn;
  workspaceSubdomain: AnyPgColumn;
  customData: AnyPgColumn;
  updatedAt: AnyPgColumn;
  contactId?: AnyPgColumn;
  status?: AnyPgColumn;
  grNumber?: AnyPgColumn;
  deletedAt?: AnyPgColumn;
  deletedBy?: AnyPgColumn;
  deletionReason?: AnyPgColumn;
};

function deletedAtFromRecord(record: { deletedAt?: unknown }): Date | null {
  const raw = record.deletedAt;
  if (raw == null || raw === '') return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
  const parsed = new Date(String(raw));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function contactIdFromRecord(record: { contactId?: unknown }): string | null {
  if (record.contactId == null || record.contactId === '') return null;
  const trimmed = String(record.contactId).trim();
  return trimmed || null;
}

function statusFromRecord(record: { status?: unknown }): string | null {
  if (record.status == null || record.status === '') return 'active';
  const trimmed = String(record.status).trim().toLowerCase();
  return trimmed || 'active';
}

function grNumberFromRecord(record: { grNumber?: unknown }): string | null {
  if (record.grNumber == null || record.grNumber === '') return null;
  const trimmed = String(record.grNumber).trim();
  return trimmed || null;
}

function softDeleteAuditFromRecord(record: {
  deletedBy?: unknown;
  deletionReason?: unknown;
}): { deletedBy: string | null; deletionReason: string | null } {
  const deletedBy =
    typeof record.deletedBy === 'string' && record.deletedBy.trim()
      ? record.deletedBy.trim()
      : null;
  const deletionReason =
    typeof record.deletionReason === 'string' && record.deletionReason.trim()
      ? record.deletionReason.trim()
      : null;
  return { deletedBy, deletionReason };
}

export function createGenericRepository<
  T extends {
    id: string | number;
    contactId?: unknown;
    status?: unknown;
    grNumber?: unknown;
    deletedAt?: unknown;
    deletedBy?: unknown;
    deletionReason?: unknown;
  },
  Table extends GenericTable,
>(table: Table, options: GenericRepoOptions = {}) {
  const {
    updateStrategy = 'merge',
    syncDeletedAtColumn = false,
    syncContactIdColumn = false,
    syncStatusColumn = false,
    syncGrNumberColumn = false,
  } = options;
  const dbTable: AnyPgTable = table;
  const shouldSyncDeletedAt = Boolean(syncDeletedAtColumn && table.deletedAt);
  const shouldSyncSoftDeleteAudit = Boolean(
    shouldSyncDeletedAt && table.deletedBy && table.deletionReason,
  );
  const shouldSyncContactId = Boolean(syncContactIdColumn && table.contactId);
  const shouldSyncStatus = Boolean(syncStatusColumn && table.status);
  const shouldSyncGrNumber = Boolean(syncGrNumberColumn && table.grNumber);

  function rowToRecord(row: GenericTableRow): T {
    const data = {
      ...(row.customData as Omit<T, 'id'>),
      id: row.id,
    } as T;

    if (shouldSyncDeletedAt) {
      if (row.deletedAt instanceof Date) {
        (data as { deletedAt?: string }).deletedAt = row.deletedAt.toISOString();
      } else {
        return stripContactClientSoftDeleteFields(data as Record<string, unknown>) as T;
      }
      if (shouldSyncSoftDeleteAudit) {
        if (row.deletedBy) {
          (data as { deletedBy?: string }).deletedBy = String(row.deletedBy);
        } else {
          delete (data as { deletedBy?: string }).deletedBy;
        }
        if (row.deletionReason) {
          (data as { deletionReason?: string }).deletionReason = String(row.deletionReason);
        } else {
          delete (data as { deletionReason?: string }).deletionReason;
        }
      }
    }

    // Prefer typed mirrors over JSONB (FK SET NULL / dual-write drift).
    if (shouldSyncContactId) {
      if (row.contactId) {
        (data as { contactId?: string }).contactId = String(row.contactId);
      } else {
        delete (data as { contactId?: string }).contactId;
      }
    }
    if (shouldSyncStatus) {
      const status =
        typeof row.status === 'string' && row.status.trim()
          ? row.status.trim().toLowerCase()
          : 'active';
      (data as { status?: string }).status = status;
    }
    if (shouldSyncGrNumber) {
      if (typeof row.grNumber === 'string' && row.grNumber.trim()) {
        (data as { grNumber?: string }).grNumber = row.grNumber.trim();
      } else {
        delete (data as { grNumber?: string }).grNumber;
      }
    }

    return data;
  }

  function columnPayload(record: T, extra: Record<string, unknown>): Record<string, unknown> {
    const customData = shouldSyncDeletedAt
      ? stripContactClientSoftDeleteFields(extra)
      : extra;
    const payload: Record<string, unknown> = {
      customData,
      updatedAt: new Date(),
    };
    if (shouldSyncDeletedAt) {
      payload.deletedAt = deletedAtFromRecord(record);
    }
    if (shouldSyncSoftDeleteAudit) {
      const audit = softDeleteAuditFromRecord(record);
      payload.deletedBy = audit.deletedBy;
      payload.deletionReason = audit.deletionReason;
    }
    if (shouldSyncContactId) {
      payload.contactId = contactIdFromRecord(record);
    }
    if (shouldSyncStatus) {
      payload.status = statusFromRecord(record);
    }
    if (shouldSyncGrNumber) {
      payload.grNumber = grNumberFromRecord(record);
    }
    return payload;
  }

  function softDeleteConditions(deleted: SoftDeleteListFilter): SQL[] {
    const conditions: SQL[] = [];
    if (shouldSyncDeletedAt && table.deletedAt) {
      if (deleted === 'active') {
        conditions.push(isNull(table.deletedAt));
      } else if (deleted === 'deleted') {
        conditions.push(isNotNull(table.deletedAt));
      }
    }
    return conditions;
  }

  async function listByWorkspace(
    workspaceSubdomain: string,
    listOptions?: ListByWorkspaceOptions,
  ): Promise<T[]> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const deleted = listOptions?.deleted ?? 'all';
    return withTenantTransaction(subdomain, async (tx) => {
      const conditions = [eq(table.workspaceSubdomain, subdomain), ...softDeleteConditions(deleted)];
      const rows = await tx
        .select()
        .from(dbTable)
        .where(and(...conditions));
      return (rows as GenericTableRow[]).map(rowToRecord);
    });
  }

  async function countByWorkspace(
    workspaceSubdomain: string,
    listOptions?: ListByWorkspaceOptions,
  ): Promise<number> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const deleted = listOptions?.deleted ?? 'all';
    return withTenantTransaction(subdomain, async (tx) => {
      const conditions = [eq(table.workspaceSubdomain, subdomain), ...softDeleteConditions(deleted)];
      const rows = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(dbTable)
        .where(and(...conditions));
      return Number(rows[0]?.count ?? 0);
    });
  }

  async function findById(workspaceSubdomain: string, id: string): Promise<T | null> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    return withTenantTransaction(subdomain, async (tx) => {
      const rows = await tx
        .select()
        .from(dbTable)
        .where(and(eq(table.workspaceSubdomain, subdomain), eq(table.id, id)));
      const row = (rows as GenericTableRow[])[0];
      return row ? rowToRecord(row) : null;
    });
  }

  async function findByIds(workspaceSubdomain: string, ids: string[]): Promise<T[]> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    if (ids.length === 0) return [];
    return withTenantTransaction(subdomain, async (tx) => {
      const rows = await tx
        .select()
        .from(dbTable)
        .where(and(eq(table.workspaceSubdomain, subdomain), inArray(table.id, ids)));
      return (rows as GenericTableRow[]).map(rowToRecord);
    });
  }

  async function save(workspaceSubdomain: string, record: T): Promise<void> {
    const processedRecord = applyTitleCaseRecursive(record) as T;
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const id = String(processedRecord.id);
    const { id: _, ...extra } = processedRecord;
    const setPayload = columnPayload(processedRecord, extra as Record<string, unknown>);

    await withTenantTransaction(subdomain, async (tx) => {
      const existing = await tx
        .select({ id: table.id })
        .from(dbTable)
        .where(and(eq(table.workspaceSubdomain, subdomain), eq(table.id, id)));

      if (existing.length > 0) {
        if (updateStrategy === 'overwrite') {
          await tx
            .update(dbTable)
            .set(setPayload)
            .where(and(eq(table.workspaceSubdomain, subdomain), eq(table.id, id)));
        } else {
          const mergeData = setPayload.customData;
          await tx
            .update(dbTable)
            .set({
              ...setPayload,
              customData: sql`COALESCE(${table.customData}, '{}'::jsonb) || ${JSON.stringify(mergeData)}::jsonb`,
            })
            .where(and(eq(table.workspaceSubdomain, subdomain), eq(table.id, id)));
        }
      } else {
        await tx.insert(dbTable).values({
          id,
          workspaceSubdomain: subdomain,
          ...setPayload,
        });
      }
    });
  }

  async function bulkSave(workspaceSubdomain: string, list: T[]): Promise<void> {
    if (list.length === 0) return;
    if (!options.conflictTarget) {
      throw new Error('bulkSave requires conflictTarget for composite tenant primary keys');
    }
    const processedList = applyTitleCaseRecursive(list) as T[];
    const subdomain = workspaceSubdomain.trim().toLowerCase();

    const values = processedList.map((record) => {
      const id = String(record.id);
      const { id: _, ...extra } = record;
      return {
        id,
        workspaceSubdomain: subdomain,
        ...columnPayload(record, extra as Record<string, unknown>),
      };
    });

    // Match single-row `save`: overwrite replaces full JSONB so emptied collections
    // (phones/emails/…) cannot be resurrected by top-level jsonb `||` merge.
    const conflictSet: Record<string, unknown> = {
      customData:
        updateStrategy === 'overwrite'
          ? sql`excluded.custom_data`
          : sql`COALESCE(${table.customData}, '{}'::jsonb) || excluded.custom_data`,
      updatedAt: sql`excluded.updated_at`,
    };
    if (shouldSyncDeletedAt) {
      conflictSet.deletedAt = sql`excluded.deleted_at`;
    }
    if (shouldSyncSoftDeleteAudit) {
      // Preserve prior audit when payload omits deletedBy/reason but keeps deleted_at.
      // Clear audit when restoring (excluded.deleted_at IS NULL).
      conflictSet.deletedBy = sql`CASE
        WHEN excluded.deleted_at IS NULL THEN NULL
        ELSE COALESCE(excluded.deleted_by, ${table.deletedBy})
      END`;
      conflictSet.deletionReason = sql`CASE
        WHEN excluded.deleted_at IS NULL THEN NULL
        ELSE COALESCE(excluded.deletion_reason, ${table.deletionReason})
      END`;
    }
    if (shouldSyncContactId) {
      conflictSet.contactId = sql`excluded.contact_id`;
    }
    if (shouldSyncStatus) {
      conflictSet.status = sql`excluded.status`;
    }
    if (shouldSyncGrNumber) {
      conflictSet.grNumber = sql`excluded.gr_number`;
    }

    await withTenantTransaction(subdomain, async (tx) => {
      await tx
        .insert(dbTable)
        .values(values)
        .onConflictDoUpdate({
          target: options.conflictTarget!,
          set: conflictSet,
        });
    });
  }

  async function deleteById(workspaceSubdomain: string, id: string): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    await withTenantTransaction(subdomain, async (tx) => {
      await tx
        .delete(dbTable)
        .where(and(eq(table.workspaceSubdomain, subdomain), eq(table.id, id)));
    });
  }

  async function replaceForWorkspace(
    workspaceSubdomain: string,
    list: T[],
  ): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();

    await withTenantTransaction(subdomain, async (tx) => {
      await tx.delete(dbTable).where(eq(table.workspaceSubdomain, subdomain));

      if (list.length === 0) return;

      const processedList = applyTitleCaseRecursive(list) as T[];
      const seenIds = new Set<string>();
      const values = [];
      for (const record of processedList) {
        const id = String(record.id);
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        const { id: _, ...extra } = record;
        values.push({
          id,
          workspaceSubdomain: subdomain,
          ...columnPayload(record, extra as Record<string, unknown>),
        });
      }

      if (values.length > 0) {
        await tx.insert(dbTable).values(values);
      }
    });
  }

  async function deleteByWorkspace(workspaceSubdomain: string): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    await withTenantTransaction(subdomain, async (tx) => {
      await tx.delete(dbTable).where(eq(table.workspaceSubdomain, subdomain));
    });
  }

  return {
    rowToRecord,
    listByWorkspace,
    countByWorkspace,
    findById,
    findByIds,
    save,
    bulkSave,
    deleteById,
    replaceForWorkspace,
    deleteByWorkspace,
  };
}
