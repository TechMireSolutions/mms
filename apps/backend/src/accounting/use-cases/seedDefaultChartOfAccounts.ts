import { randomUUID } from 'node:crypto';
import { ACCOUNTING_MODULE_MANIFEST, DEFAULT_CHART_OF_ACCOUNTS, accountListSchema, type Account } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { ConflictError } from '../../lib/httpErrors.js';
import { broadcastCollection } from '../../services/websocketService.js';
import { seedAccountsIfEmpty, type SeedAccountsResult } from '../../db/repositories/accountingAccountsSeed.js';

export interface SeedDefaultChartDependencies {
  seed?: (tenant: string, records: Account[]) => Promise<SeedAccountsResult>;
  broadcast?: (collection: string) => Promise<void>;
}

/**
 * Seeds the default Chart of Accounts into an empty workspace. Refuses with a
 * 409 when any account row exists, so it never modifies or duplicates an
 * existing chart — including one created concurrently by another user.
 */
export async function seedDefaultChartOfAccountsUseCase(
  deps: SeedDefaultChartDependencies = {},
): Promise<{ count: number }> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');

  const records = accountListSchema.parse(
    DEFAULT_CHART_OF_ACCOUNTS.map((account) => ({ ...account, id: `a${randomUUID()}`, isActive: true })),
  );
  const result = await (deps.seed ?? seedAccountsIfEmpty)(tenant, records);
  if (!result.seeded) {
    throw new ConflictError('A Chart of Accounts already exists for this workspace; default accounts were not seeded');
  }
  await (deps.broadcast ?? broadcastCollection)(ACCOUNTING_MODULE_MANIFEST.accountCollectionKey);
  return { count: result.count };
}
