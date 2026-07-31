import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';
import { applyTitleCaseRecursive, stripContactClientSoftDeleteFields } from '@mms/shared';
import { withTenantTransaction } from '../withTenantTransaction.js';

export interface GenericRepoOptions {
  updateStrategy?: 'merge' | 'overwrite';
  /** Required for bulkSave on composite-PK tenant tables. */
  conflictTarget?: AnyPgColumn | AnyPgColumn[];
  /** When true, mirrors record.deletedAt into the table's deleted_at column. */
  syncDeletedAtColumn?: boolean;
}

/** Soft-delete scope for list queries on tables with a typed deleted_at column. */
export type SoftDeleteListFilter = 'active' | 'deleted' | 'all';

export interface ListByWorkspaceOptions {
  deleted?: SoftDeleteListFilter;
}

type GenericTableRow = {
  id: string | number;
  customData: unknown;
  deletedAt?: Date | null;
};

type GenericTable = AnyPgTable & {
  id: AnyPgColumn;
  workspaceSubdomain: AnyPgColumn;
  customData: AnyPgColumn;
  updatedAt: AnyPgColumn;
  deletedAt?: AnyPgColumn;
};

function deletedAtFromRecord(record: { deletedAt?: unknown }): Date | null {
  const raw = record.deletedAt;
  if (raw == null || raw === '') return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
  const parsed = new Date(String(raw));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function createGenericRepository<
  T extends { id: string | number; deletedAt?: unknown },
  Table extends GenericTable,
>(table: Table, options: GenericRepoOptions = {}) {
  const { updateStrategy = 'merge', syncDeletedAtColumn = false } = options;
  const dbTable: AnyPgTable = table;
  const shouldSyncDeletedAt = Boolean(syncDeletedAtColumn && table.deletedAt);

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
    return payload;
  }

  async function listByWorkspace(
    workspaceSubdomain: string,
    listOptions?: ListByWorkspaceOptions,
  ): Promise<T[]> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const deleted = listOptions?.deleted ?? 'all';
    return withTenantTransaction(subdomain, async (tx) => {
      const conditions = [eq(table.workspaceSubdomain, subdomain)];
      if (shouldSyncDeletedAt && table.deletedAt) {
        if (deleted === 'active') {
          conditions.push(isNull(table.deletedAt));
        } else if (deleted === 'deleted') {
          conditions.push(isNotNull(table.deletedAt));
        }
      }
      const rows = await tx
        .select()
        .from(dbTable)
        .where(and(...conditions));
      return (rows as GenericTableRow[]).map(rowToRecord);
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

    const conflictSet: Record<string, unknown> = {
      customData: sql`COALESCE(${table.customData}, '{}'::jsonb) || excluded.custom_data`,
      updatedAt: sql`excluded.updated_at`,
    };
    if (shouldSyncDeletedAt) {
      conflictSet.deletedAt = sql`excluded.deleted_at`;
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
    findById,
    findByIds,
    save,
    bulkSave,
    deleteById,
    replaceForWorkspace,
    deleteByWorkspace,
  };
}
