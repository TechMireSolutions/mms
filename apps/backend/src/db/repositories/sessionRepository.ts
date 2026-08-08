import { type SessionRecord } from '../../validation/sessionSchemas.js';
import { sessions } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

export const sessionRepo = createGenericRepository<SessionRecord, typeof sessions>(sessions, {
  conflictTarget: [sessions.workspaceSubdomain, sessions.id],
  syncDeletedAtColumn: true,
});

export const sessionRowToRecord = sessionRepo.rowToRecord;
export const listSessionsByWorkspace = sessionRepo.listByWorkspace;
export const findSessionById = sessionRepo.findById;
export const findSessionsByIds = sessionRepo.findByIds;
export const saveSession = sessionRepo.save;
export const bulkSaveSessions = sessionRepo.bulkSave;
export const deleteSession = sessionRepo.deleteById;
export const replaceSessionsForWorkspace = sessionRepo.replaceForWorkspace;
export const deleteSessionsByWorkspace = sessionRepo.deleteByWorkspace;
