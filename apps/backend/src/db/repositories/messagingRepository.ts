/** Messaging repository public surface — templates, logs, queries, metrics. */
export {
  templateRowToRecord,
  listMessageTemplatesByWorkspace,
  findMessageTemplateById,
  bulkSaveMessageTemplates,
  replaceMessageTemplatesForWorkspace,
  deleteMessageTemplateById,
} from './messagingTemplatesRepository.js';
export {
  logRowToRecord,
  listMessageLogsByWorkspace,
  replaceMessageLogsForWorkspace,
  bulkSaveMessageLogs,
  deleteMessageLogsByWorkspace,
  insertMessageLogs,
} from './messagingLogsRepository.js';
export type {
  MessageLogsFilterQuery,
  MessageLogsPageResult,
  MessagingMetricsFilterQuery,
} from './messagingLogsQueryRepository.js';
export {
  queryFilteredMessageLogs,
  queryMessagingMetrics,
  softDeleteActiveMessageLogs,
} from './messagingLogsQueryRepository.js';
