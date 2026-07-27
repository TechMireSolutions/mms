import { createGenericRepository } from './genericRepository.js';
import { messageTemplates, messageLogs } from '../schema.js';
import type { MessageTemplate, Message } from '@mms/shared';
import { sql } from 'drizzle-orm';
import { withTenantTransaction } from '../withTenantTransaction.js';

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

/** Soft-archives active message logs for a workspace in one tenant-scoped update. */
export async function softDeleteActiveMessageLogs(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const deletedAt = new Date().toISOString();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.execute(sql`
      UPDATE message_logs
      SET
        custom_data = COALESCE(custom_data, '{}'::jsonb) || jsonb_build_object('deletedAt', ${deletedAt}::text),
        updated_at = NOW()
      WHERE workspace_subdomain = ${subdomain}
        AND (custom_data->>'deletedAt') IS NULL
    `);
  });
}
