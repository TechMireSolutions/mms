import { and, eq, inArray, sql } from 'drizzle-orm';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';
import { applyTitleCaseRecursive } from '@mms/shared';
import { getDb } from '../dbClient.js';

export interface GenericRepoOptions {
  updateStrategy?: 'merge' | 'overwrite';
  conflictTarget?: AnyPgColumn | AnyPgColumn[];
}

type GenericTableRow = {
  id: string | number;
  customData: unknown;
};

type GenericTable = AnyPgTable & {
  id: AnyPgColumn;
  workspaceSubdomain: AnyPgColumn;
  customData: AnyPgColumn;
  updatedAt: AnyPgColumn;
};

export function createGenericRepository<
  T extends { id: string | number },
  Table extends GenericTable,
>(table: Table, options: GenericRepoOptions = {}) {
  const { updateStrategy = 'merge' } = options;
  const dbTable: AnyPgTable = table;

  function rowToRecord(row: GenericTableRow): T {
    return {
      ...(row.customData as Omit<T, 'id'>),
      id: row.id,
    } as T;
  }

  async function listByWorkspace(workspaceSubdomain: string): Promise<T[]> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const rows = await getDb()
      .select()
      .from(dbTable)
      .where(eq(table.workspaceSubdomain, subdomain));
    return (rows as GenericTableRow[]).map(rowToRecord);
  }

  async function findById(workspaceSubdomain: string, id: string): Promise<T | null> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const rows = await getDb()
      .select()
      .from(dbTable)
      .where(and(eq(table.workspaceSubdomain, subdomain), eq(table.id, id)));
    const row = (rows as GenericTableRow[])[0];
    return row ? rowToRecord(row) : null;
  }

  async function findByIds(workspaceSubdomain: string, ids: string[]): Promise<T[]> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    if (ids.length === 0) return [];
    const rows = await getDb()
      .select()
      .from(dbTable)
      .where(and(eq(table.workspaceSubdomain, subdomain), inArray(table.id, ids)));
    return (rows as GenericTableRow[]).map(rowToRecord);
  }

  async function save(workspaceSubdomain: string, record: T): Promise<void> {
    const processedRecord = applyTitleCaseRecursive(record) as T;
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const id = String(processedRecord.id);
    const { id: _, ...extra } = processedRecord;
    const db = getDb();

    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: table.id })
        .from(dbTable)
        .where(and(eq(table.workspaceSubdomain, subdomain), eq(table.id, id)));

      if (existing.length > 0) {
        if (updateStrategy === 'overwrite') {
          await tx
            .update(dbTable)
            .set({
              customData: extra,
              updatedAt: new Date(),
            })
            .where(and(eq(table.workspaceSubdomain, subdomain), eq(table.id, id)));
        } else {
          await tx
            .update(dbTable)
            .set({
              customData: sql`COALESCE(${table.customData}, '{}'::jsonb) || ${JSON.stringify(extra)}::jsonb`,
              updatedAt: new Date(),
            })
            .where(and(eq(table.workspaceSubdomain, subdomain), eq(table.id, id)));
        }
      } else {
        await tx.insert(dbTable).values({
          id,
          workspaceSubdomain: subdomain,
          customData: extra,
          updatedAt: new Date(),
        });
      }
    });
  }

  async function bulkSave(workspaceSubdomain: string, list: T[]): Promise<void> {
    if (list.length === 0) return;
    const processedList = applyTitleCaseRecursive(list) as T[];
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const db = getDb();

    const values = processedList.map((record) => {
      const id = String(record.id);
      const { id: _, ...extra } = record;
      return {
        id,
        workspaceSubdomain: subdomain,
        customData: extra,
        updatedAt: new Date(),
      };
    });

    await db
      .insert(dbTable)
      .values(values)
      .onConflictDoUpdate({
        target: options.conflictTarget || table.id,
        set: {
          customData: sql`COALESCE(${table.customData}, '{}'::jsonb) || excluded.custom_data`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }

  async function deleteById(workspaceSubdomain: string, id: string): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    await getDb()
      .delete(dbTable)
      .where(and(eq(table.workspaceSubdomain, subdomain), eq(table.id, id)));
  }

  async function replaceForWorkspace(
    workspaceSubdomain: string,
    list: T[],
  ): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const db = getDb();

    await db.transaction(async (tx) => {
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
          customData: extra,
          updatedAt: new Date(),
        });
      }

      if (values.length > 0) {
        await tx.insert(dbTable).values(values);
      }
    });
  }

  async function deleteByWorkspace(workspaceSubdomain: string): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    await getDb()
      .delete(dbTable)
      .where(eq(table.workspaceSubdomain, subdomain));
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
