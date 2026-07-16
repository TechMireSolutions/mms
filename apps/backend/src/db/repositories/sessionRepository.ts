import { type SessionRecord } from '../../validation/sessionSchemas.js';
import { sessions } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const repo = createGenericRepository<SessionRecord, typeof sessions>(sessions, { conflictTarget: [sessions.workspaceSubdomain, sessions.id] });

export const listSessionsByWorkspace = repo.listByWorkspace;
export const findSessionById = repo.findById;
export const findSessionsByIds = repo.findByIds;
export const saveSession = repo.save;
export const bulkSaveSessions = repo.bulkSave;
export const deleteSession = repo.deleteById;
export const replaceSessionsForWorkspace = repo.replaceForWorkspace;
export const deleteSessionsByWorkspace = repo.deleteByWorkspace;
