import { eq } from 'drizzle-orm';
import { customFields } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export interface CustomFieldBackupRow {
  id: string;
  tabId: string;
  key: string;
  label: string;
  type: string;
  enabled?: boolean;
  required?: boolean;
  unique?: boolean;
  placeholder?: string | null;
  description?: string | null;
  defaultValue?: string | null;
  options?: string[] | null;
  minValue?: number | null;
  maxValue?: number | null;
  mask?: string | null;
  allowedExtensions?: string | null;
  maxFileSize?: number | null;
  sortOrder?: number;
  hasData?: boolean;
  isSystem?: boolean;
  deletedAt?: Date | string | null;
  deletedBy?: string | null;
  deletionReason?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

/** Full-workspace list for admin backup snapshots. */
export async function listAllCustomFieldsByWorkspace(
  workspaceSubdomain: string,
): Promise<CustomFieldBackupRow[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(customFields)
      .where(eq(customFields.workspaceSubdomain, subdomain))
      .orderBy(customFields.sortOrder);

    return rows.map((row) => ({
      id: row.id,
      tabId: row.tabId,
      key: row.key,
      label: row.label,
      type: row.type,
      enabled: row.enabled,
      required: row.required,
      unique: row.unique,
      placeholder: row.placeholder,
      description: row.description,
      defaultValue: row.defaultValue,
      options: (row.options as string[] | null) ?? null,
      minValue: row.minValue,
      maxValue: row.maxValue,
      mask: row.mask,
      allowedExtensions: row.allowedExtensions,
      maxFileSize: row.maxFileSize,
      sortOrder: row.sortOrder,
      hasData: row.hasData,
      isSystem: row.isSystem,
      deletedAt: row.deletedAt,
      deletedBy: row.deletedBy,
      deletionReason: row.deletionReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  });
}

/** Admin restore wipe+replace for the whole workspace. */
export async function replaceCustomFieldsForWorkspace(
  workspaceSubdomain: string,
  fields: CustomFieldBackupRow[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(customFields).where(eq(customFields.workspaceSubdomain, subdomain));
    if (fields.length === 0) return;

    const seen = new Set<string>();
    const values = [];
    for (const [index, field] of fields.entries()) {
      const tabId = String(field.tabId || '').trim();
      const key = String(field.key || '').trim();
      const id = String(field.id || '').trim();
      if (!tabId || !key || !id) continue;
      if (seen.has(id)) continue;
      seen.add(id);

      values.push({
        id,
        workspaceSubdomain: subdomain,
        tabId,
        key,
        label: String(field.label || key),
        type: String(field.type || 'text'),
        enabled: field.enabled !== false,
        required: field.required === true,
        unique: field.unique === true,
        placeholder: field.placeholder ?? null,
        description: field.description ?? null,
        defaultValue: field.defaultValue ?? null,
        options: Array.isArray(field.options) ? field.options : null,
        minValue: typeof field.minValue === 'number' ? field.minValue : null,
        maxValue: typeof field.maxValue === 'number' ? field.maxValue : null,
        mask: field.mask ?? null,
        allowedExtensions: field.allowedExtensions ?? null,
        maxFileSize: typeof field.maxFileSize === 'number' ? field.maxFileSize : null,
        sortOrder: typeof field.sortOrder === 'number' ? field.sortOrder : index,
        hasData: field.hasData === true,
        isSystem: field.isSystem === true,
        deletedAt: field.deletedAt ? new Date(field.deletedAt) : null,
        deletedBy: field.deletedBy ?? null,
        deletionReason: field.deletionReason ?? null,
        createdAt: field.createdAt ? new Date(field.createdAt) : new Date(),
        updatedAt: field.updatedAt ? new Date(field.updatedAt) : new Date(),
      });
    }

    if (values.length > 0) {
      await tx.insert(customFields).values(values);
    }
  });
}
