export interface DbAuditRow {
  createdAt?: Date | null;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  deletionReason?: string | null;
  restoredAt?: Date | null;
  restoredBy?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface ContractAuditFields {
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
  restoredAt?: string;
  restoredBy?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Maps raw Drizzle audit and soft-delete columns to contract-compliant ISO string representations.
 */
export function mapAuditTimestamps<T extends DbAuditRow>(row: T): ContractAuditFields {
  const fields: ContractAuditFields = {};
  if (row.createdAt) fields.createdAt = row.createdAt.toISOString();
  if (row.updatedAt) fields.updatedAt = row.updatedAt.toISOString();
  if (row.deletedAt) fields.deletedAt = row.deletedAt.toISOString();
  if (row.deletedBy != null) fields.deletedBy = row.deletedBy;
  if (row.deletionReason != null) fields.deletionReason = row.deletionReason;
  if (row.restoredAt) fields.restoredAt = row.restoredAt.toISOString();
  if (row.restoredBy != null) fields.restoredBy = row.restoredBy;
  if (row.createdBy != null) fields.createdBy = row.createdBy;
  if (row.updatedBy != null) fields.updatedBy = row.updatedBy;
  return fields;
}
