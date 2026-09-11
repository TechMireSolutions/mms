/**
 * Standard audit columns selected from Drizzle tables containing
 * timestamp mode: 'date' and softDeleteColumns mixin.
 */
export interface DrizzleAuditSelectRow {
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  deletedAt?: Date | string | null;
  deletedBy?: string | null;
  deletionReason?: string | null;
  restoredAt?: Date | string | null;
  restoredBy?: string | null;
  deletedWithCascade?: boolean | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type DbAuditRow = DrizzleAuditSelectRow;

export interface ContractAuditFields {
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
  restoredAt?: string;
  restoredBy?: string;
  deletedWithCascade?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

function toIsoString(val: Date | string | null | undefined): string | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

/**
 * Maps raw Drizzle audit and soft-delete columns to contract-compliant ISO string representations.
 */
export function mapAuditTimestamps<T extends DrizzleAuditSelectRow>(row: T): ContractAuditFields {
  const fields: ContractAuditFields = {};
  if (row.createdAt) fields.createdAt = toIsoString(row.createdAt);
  if (row.updatedAt) fields.updatedAt = toIsoString(row.updatedAt);
  if (row.deletedAt) fields.deletedAt = toIsoString(row.deletedAt);
  if (row.deletedBy != null) fields.deletedBy = row.deletedBy;
  if (row.deletionReason != null) fields.deletionReason = row.deletionReason;
  if (row.restoredAt) fields.restoredAt = toIsoString(row.restoredAt);
  if (row.restoredBy != null) fields.restoredBy = row.restoredBy;
  if (row.deletedWithCascade != null) fields.deletedWithCascade = Boolean(row.deletedWithCascade);
  if (row.createdBy != null) fields.createdBy = row.createdBy;
  if (row.updatedBy != null) fields.updatedBy = row.updatedBy;
  return fields;
}
