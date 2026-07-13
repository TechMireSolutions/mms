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
