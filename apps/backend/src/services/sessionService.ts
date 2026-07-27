import {
  sessionRecordSchema,
  type SessionRecord,
} from '../validation/sessionSchemas.js';
import {
  listSessionsByWorkspace,
  findSessionById,
  saveSession,
} from '../db/repositories/sessionRepository.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { paginateSessions, type SessionsListQuery, type Session } from '@mms/shared';

const crud = createGenericRelationalService<SessionRecord>({
  repo: {
    listByWorkspace: listSessionsByWorkspace,
    findById: findSessionById,
    save: saveSession,
  },
  schema: sessionRecordSchema,
  websocketCollection: 'sessions',
  idPrefix: 'sess',
});

export const loadSessions = crud.loadAll;
export const createSession = crud.create;
export const updateSessionById = crud.updateById;
export const deleteSessionById = crud.deleteById;
export const restoreSessionById = crud.restoreById;
export const bulkSoftDeleteSessions = crud.bulkDeleteByIds;
export const bulkRestoreSessions = crud.bulkRestoreByIds;

export async function loadSessionsPage(query: SessionsListQuery & { includeDeleted?: boolean }) {
  const rows = await loadSessions({ includeDeleted: query.includeDeleted });
  const scoped = query.includeDeleted
    ? (rows as Session[]).filter((row) => Boolean(row.deletedAt))
    : (rows as Session[]);
  return paginateSessions(scoped, query);
}
