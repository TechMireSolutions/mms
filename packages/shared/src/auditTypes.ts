import { z } from 'zod';

export const auditLogEntrySchema = z
  .object({
    id: z.string(),
    at: z.string(),
    userId: z.string(),
    userEmail: z.string().optional(),
    tenant: z.string().nullable().optional(),
    action: z.string(),
    entityType: z.enum(['collection', 'object']),
    entityId: z.string(),
    summary: z.string().optional(),
  })
  .strict();

export const auditLogEntryInsertSchema = z
  .object({
    id: z.string().optional(),
    at: z.string(),
    userId: z.string(),
    userEmail: z.string().optional(),
    tenant: z.string().nullable().optional(),
    action: z.string(),
    entityType: z.enum(['collection', 'object']),
    entityId: z.string(),
    summary: z.string().optional(),
  })
  .strict();

/** Append-only audit trail entry stored in `audit_log` collection. */
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
export type AuditLogEntryInsert = z.infer<typeof auditLogEntryInsertSchema>;

/** Collection key identifier for the audit log trail. */
export const AUDIT_LOG_COLLECTION = 'audit_log' as const;
