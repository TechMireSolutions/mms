import { describe, expect, it } from 'vitest';
import { withTenant, withGlobalTenant } from '../db/tenant-context.js';

/**
 * Regression tests for the tenant-isolation fail-closed guard.
 *
 * A falsy tenant makes `applyTenantTransactionGuards` set
 * `app.rls_bypass = 'on'`, which makes every tenant RLS policy match ALL rows.
 * That must never happen implicitly: global access requires an explicit opt-in,
 * so a caller binding an unset request property fails loudly instead of
 * silently running without row-level security.
 */
describe('withTenant fail-closed guard', () => {
  it('rejects an empty tenant instead of bypassing RLS', async () => {
    await expect(withTenant(null, async () => 'ran')).rejects.toThrow(
      /refusing to run with RLS bypassed/,
    );
    await expect(withTenant(undefined, async () => 'ran')).rejects.toThrow(
      /refusing to run with RLS bypassed/,
    );
    await expect(withTenant('', async () => 'ran')).rejects.toThrow(
      /refusing to run with RLS bypassed/,
    );
  });

  it('rejects the literal strings "undefined"/"null" as tenant ids', async () => {
    await expect(withTenant('undefined', async () => 'ran')).rejects.toThrow(
      /literal string/,
    );
    await expect(withTenant('null', async () => 'ran')).rejects.toThrow(
      /literal string/,
    );
  });

  it('points the caller at the explicit global escape hatch', async () => {
    await expect(withTenant(null, async () => 'ran')).rejects.toThrow(
      /allowGlobal: true/,
    );
  });

  it('rejects an empty tenant even when readOnly is requested', async () => {
    await expect(withTenant(null, async () => 'ran', { readOnly: true })).rejects.toThrow(
      /refusing to run with RLS bypassed/,
    );
  });

  it('allows global work through the explicit helper', async () => {
    // The guard must not reject an intentional global call. In the test
    // environment there is no pool, so `withTenant` falls back to running the
    // callback directly (see tenant-context.ts) rather than bypassing RLS.
    await expect(withGlobalTenant(async () => 'ran')).resolves.toBe('ran');
  });
});
