import type { MessagingRepository } from './messagingRepository.js';
import {
  listMessageTemplatesByWorkspace,
  replaceMessageTemplatesForWorkspace,
  bulkSaveMessageTemplates,
  deleteMessageTemplateById,
  findMessageTemplateById,
  listMessageLogsByWorkspace,
  replaceMessageLogsForWorkspace,
  insertMessageLogs,
  queryFilteredMessageLogs,
  queryMessagingMetrics,
  softDeleteActiveMessageLogs,
} from '../../db/repositories/messagingRepository.js';

/**
 * Drizzle-backed adapter for {@link MessagingRepository}. Delegates to the
 * existing concrete repository functions (no SQL rewrite in this pass).
 */
export const messagingRepository: MessagingRepository = {
  listMessageTemplatesByWorkspace,
  findMessageTemplateById,
  bulkSaveMessageTemplates,
  replaceMessageTemplatesForWorkspace,
  deleteMessageTemplateById,
  listMessageLogsByWorkspace,
  replaceMessageLogsForWorkspace,
  insertMessageLogs,
  queryFilteredMessageLogs,
  queryMessagingMetrics,
  softDeleteActiveMessageLogs,
};
