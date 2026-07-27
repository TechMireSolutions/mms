import { createGenericRepository } from './genericRepository.js';
import { messageTemplates, messageLogs } from '../schema.js';
import type { MessageTemplate, Message } from '@mms/shared';

const templateRepository = createGenericRepository<MessageTemplate, typeof messageTemplates>(
  messageTemplates,
  { conflictTarget: [messageTemplates.workspaceSubdomain, messageTemplates.id] },
);
const logRepository = createGenericRepository<Message, typeof messageLogs>(messageLogs, {
  conflictTarget: [messageLogs.workspaceSubdomain, messageLogs.id],
});

export const listMessageTemplatesByWorkspace = templateRepository.listByWorkspace;
export const replaceMessageTemplatesForWorkspace = templateRepository.replaceForWorkspace;
export const findMessageTemplateById = templateRepository.findById;
export const bulkSaveMessageTemplates = templateRepository.bulkSave;
export const deleteMessageTemplateById = templateRepository.deleteById;

export const listMessageLogsByWorkspace = logRepository.listByWorkspace;
export const replaceMessageLogsForWorkspace = logRepository.replaceForWorkspace;
export const bulkSaveMessageLogs = logRepository.bulkSave;
export const deleteMessageLogsByWorkspace = logRepository.deleteByWorkspace;
