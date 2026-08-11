import { teachers } from '../schema.js';
import { countJsonbFieldUsageByKeys } from './jsonbFieldUsage.js';

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
