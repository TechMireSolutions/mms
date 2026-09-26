import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CHART_OF_ACCOUNTS, type Account } from '@mms/shared';
import { runWithTenant } from '../lib/tenantContext.js';
import { ConflictError } from '../lib/httpErrors.js';
import { seedDefaultChartOfAccountsUseCase } from '../accounting/use-cases/seedDefaultChartOfAccounts.js';

describe('seedDefaultChartOfAccountsUseCase', () => {
  it('seeds the full default chart with unique ids and broadcasts', async () => {
    const seed = vi.fn(async (_tenant: string, records: Account[]) => ({ seeded: true as const, count: records.length }));
    const broadcast = vi.fn(async () => undefined);

    const result = await runWithTenant('acme', () => seedDefaultChartOfAccountsUseCase({ seed, broadcast }));

    expect(result.count).toBe(DEFAULT_CHART_OF_ACCOUNTS.length);
    const [tenant, records] = seed.mock.calls[0];
    expect(tenant).toBe('acme');
    expect(records.map((record) => record.code)).toEqual(DEFAULT_CHART_OF_ACCOUNTS.map((account) => account.code));
    expect(new Set(records.map((record) => record.id)).size).toBe(records.length);
    expect(records.every((record) => record.isActive)).toBe(true);
    expect(broadcast).toHaveBeenCalledWith('accounting_accounts');
  });

  it('refuses with a conflict and does not broadcast when accounts already exist', async () => {
    const seed = vi.fn(async () => ({ seeded: false as const, existing: 3 }));
    const broadcast = vi.fn(async () => undefined);

    await expect(
      runWithTenant('acme', () => seedDefaultChartOfAccountsUseCase({ seed, broadcast })),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('requires a tenant context', async () => {
    const seed = vi.fn();
    await expect(runWithTenant(null, () => seedDefaultChartOfAccountsUseCase({ seed }))).rejects.toThrow('Tenant context required');
    expect(seed).not.toHaveBeenCalled();
  });
});
