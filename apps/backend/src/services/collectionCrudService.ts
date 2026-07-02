import type { ZodType } from 'zod';
import { fetchCollection, persistCollection } from './dbSyncService.js';

type IdentifiedRecord = { id: string | number };

export function defineCollectionCrudService<T extends IdentifiedRecord>(
  collectionName: string,
  listSchema: ZodType<T[]>,
  normalize: (record: T) => T,
) {
  async function load(): Promise<T[]> {
    const collectionRows = await fetchCollection(collectionName);
    const parsed = listSchema.safeParse(collectionRows ?? []);
    return parsed.success ? parsed.data : [];
  }

  async function create(record: T): Promise<T> {
    const rows = await load();
    const normalized = normalize(record);
    rows.push(normalized);
    await persistCollection(collectionName, rows);
    return normalized;
  }

  async function updateById(id: string, record: T): Promise<T | null> {
    const rows = await load();
    const index = rows.findIndex((row) => String(row.id) === id);
    if (index < 0) return null;
    const updated = normalize({ ...record, id: record.id ?? id });
    rows[index] = updated;
    await persistCollection(collectionName, rows);
    return updated;
  }

  async function deleteById(id: string): Promise<boolean> {
    const rows = await load();
    const remainingRows = rows.filter((row) => String(row.id) !== id);
    if (remainingRows.length === rows.length) return false;
    await persistCollection(collectionName, remainingRows);
    return true;
  }

  return { load, create, updateById, deleteById };
}
