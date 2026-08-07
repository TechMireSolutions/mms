import { students } from '../schema.js';
import {
  countJsonbFieldUsageByKeys,
  jsonbCustomDataFieldNonEmptySql,
} from './jsonbFieldUsage.js';

/** Non-empty custom_data value for a Students field key. */
export function studentFieldNonEmptySql(fieldKey: string) {
  return jsonbCustomDataFieldNonEmptySql(students.customData, fieldKey);
}

/**
 * Counts active students with a non-empty value for each field key (SQL, no full-list load).
 * Single-pass `count(*) FILTER` per key. Every requested key is present (default 0).
 */
export async function countStudentFieldUsageByKeys(
  tenant: string,
  fieldKeys: string[],
): Promise<Record<string, number>> {
  return countJsonbFieldUsageByKeys({
    tenant,
    fieldKeys,
    table: students,
    customDataCol: students.customData,
    workspaceSubdomainCol: students.workspaceSubdomain,
    deletedAtCol: students.deletedAt,
  });
}
