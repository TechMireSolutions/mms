import {
  sessionListSchema,
  sessionRecordSchema,
  type SessionRecord,
} from '../validation/sessionSchemas.js';
import { defineCollectionCrudService } from './collectionCrudService.js';

const COLLECTION = 'sessions';

const normalize = (record: SessionRecord): SessionRecord => sessionRecordSchema.parse(record);

const crud = defineCollectionCrudService(COLLECTION, sessionListSchema, normalize);

export const loadSessions = crud.load;
export const createSession = crud.create;
export const updateSessionById = crud.updateById;
export const deleteSessionById = crud.deleteById;
