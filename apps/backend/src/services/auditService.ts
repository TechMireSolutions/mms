import { randomBytes } from 'node:crypto';
import { AUDIT_LOG_COLLECTION, type AuditLogEntry } from '@mms/shared';
import { fetchCollection, persistCollection } from './dbSyncService.js';
import { getRequestTenant } from '../lib/tenantContext.js';

export interface RecordAuditInput {
  userId: string;
  userEmail?: string;
  action: string;
  entityType: 'collection' | 'object';
  entityId: string;
  summary?: string;
}

/**
 * Appends an audit log entry. Failures are logged and do not block the parent write.
 */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    const existing = (await fetchCollection(AUDIT_LOG_COLLECTION)) as AuditLogEntry[];
    const rows = Array.isArray(existing) ? existing : [];
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${randomBytes(4).toString('hex')}`,
      at: new Date().toISOString(),
      userId: input.userId,
      userEmail: input.userEmail,
      tenant: getRequestTenant(),
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
    };
    await persistCollection(AUDIT_LOG_COLLECTION, [...rows, entry]);
  } catch (error) {
    console.error('audit_log append failed:', error);
  }
}

/** Keys and collections that trigger audit on write. */
export const AUDITED_OBJECTS = new Set(['global_settings', 'branding', 'contact_field_config']);
export const AUDITED_COLLECTIONS = new Set(['users', 'contacts']);
