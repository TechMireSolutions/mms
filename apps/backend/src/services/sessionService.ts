import {
  sessionListSchema,
  sessionRecordSchema,
  type SessionRecord,
} from '../validation/sessionSchemas.js';
import { defineCollectionCrudService } from './collectionCrudService.js';
import { persistCollection } from './dbSyncService.js';

const COLLECTION = 'sessions';

const normalize = (record: SessionRecord): SessionRecord => sessionRecordSchema.parse(record);

const crud = defineCollectionCrudService(COLLECTION, sessionListSchema, normalize);

export async function loadSessions(options?: { includeDeleted?: boolean }): Promise<SessionRecord[]> {
  const all = await crud.load();
  return options?.includeDeleted ? all : all.filter((row) => !row.deletedAt);
}

export const createSession = crud.create;
export const updateSessionById = crud.updateById;

export async function deleteSessionById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const all = await crud.load();
  const index = all.findIndex((row) => String(row.id) === id);
  if (index < 0 || all[index].deletedAt) return false;
  all[index] = {
    ...all[index],
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletionReason: deletionReason || undefined,
  };
  await persistCollection(COLLECTION, all);
  return true;
}

export async function restoreSessionById(id: string): Promise<boolean> {
  const all = await crud.load();
  const index = all.findIndex((row) => String(row.id) === id);
  if (index < 0 || !all[index].deletedAt) return false;
  const { deletedAt: _deletedAt, deletedBy: _deletedBy, deletionReason: _deletionReason, ...rest } = all[index];
  all[index] = rest as SessionRecord;
  await persistCollection(COLLECTION, all);
  return true;
}
