import { teachers } from '../schema.js';
import {
  countJsonbFieldUsageByKeys,
  jsonbCustomDataFieldNonEmptySql,
} from './jsonbFieldUsage.js';

/** Non-empty custom_data value for a Teachers field key. */
export function teacherFieldNonEmptySql(fieldKey: string) {
  return jsonbCustomDataFieldNonEmptySql(teachers.customData, fieldKey);
}

/**
 * Counts active teachers with a non-empty value for each field key (SQL, no full-list load).
 */
export async function countTeacherFieldUsageByKeys(
  tenant: string,
  fieldKeys: string[],
): Promise<Record<string, number>> {
  return countJsonbFieldUsageByKeys({
    tenant,
    fieldKeys,
    table: teachers,
    customDataCol: teachers.customData,
    workspaceSubdomainCol: teachers.workspaceSubdomain,
    deletedAtCol: teachers.deletedAt,
  });
}
