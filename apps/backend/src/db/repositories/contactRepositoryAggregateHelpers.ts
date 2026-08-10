import { and, eq, isNull, sql, type SQL } from 'drizzle-orm';
import {
  isContactLockedEnabledTab,
  type FieldConfig,
} from '@mms/shared';
import { contacts } from '../schema.js';
import { contactFieldNonEmptySql } from './contactRepositorySql.js';

const LIST_TAB_DATA_KEYS: Record<string, string> = {
  phones: 'phones',
  emails: 'emails',
  addresses: 'addresses',
  socials: 'socials',
  relationship: 'relationshipContacts',
};

const COMPLETENESS_SKIP_TYPES = new Set(['boolean', 'ai_summary']);

export function activeWorkspaceWhere(subdomain: string): SQL {
  return and(eq(contacts.workspaceSubdomain, subdomain), isNull(contacts.deletedAt))!;
}

export function createdAtRawSql(): SQL {
  return sql`NULLIF(trim(COALESCE(${contacts.customData}->>'createdAt', '')), '')`;
}

/** True when required Setup fields/tabs are missing (SQL mirror of JS profile-completeness semantics). */
export function buildProfileIncompleteSql(fieldConfig: FieldConfig): SQL | null {
  const fields = fieldConfig.fields || {};
  const formTabs = (fieldConfig.formTabs || []).filter(
    (tab) => tab.enabled !== false || isContactLockedEnabledTab(tab.key),
  );
  const requiredTabs = new Set(fieldConfig.requiredTabs || []);
  const missingClauses: SQL[] = [];

  for (const tab of formTabs) {
    const listKey = LIST_TAB_DATA_KEYS[tab.key];
    if (listKey) {
      if (!requiredTabs.has(tab.key)) continue;
      missingClauses.push(sql`(
        jsonb_typeof(${contacts.customData}->${listKey}) IS DISTINCT FROM 'array'
        OR jsonb_array_length(${contacts.customData}->${listKey}) = 0
      )`);
      continue;
    }
    const tabFields = (fields[tab.key] || []).filter(
      (field) => field.enabled && !COMPLETENESS_SKIP_TYPES.has(field.type) && field.required,
    );
    for (const field of tabFields) {
      missingClauses.push(sql`(NOT ${contactFieldNonEmptySql(field.key)})`);
    }
  }

  if (missingClauses.length === 0) return null;
  return sql`(${sql.join(missingClauses, sql` OR `)})`;
}
