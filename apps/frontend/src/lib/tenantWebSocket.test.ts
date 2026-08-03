import { describe, expect, it } from 'vitest';
import {
  parseTenantDatabaseUpdate,
  resolveTenantWebSocketUrl,
} from '@/lib/tenantWebSocket';

describe('tenantWebSocket', () => {
  it('parses database-update messages', () => {
    expect(
      parseTenantDatabaseUpdate(
        JSON.stringify({ event: 'database-update', type: 'collection', key: 'contacts' }),
      ),
    ).toEqual({
      event: 'database-update',
      type: 'collection',
      key: 'contacts',
    });
  });

  it('rejects malformed payloads', () => {
    expect(parseTenantDatabaseUpdate('not-json')).toBeNull();
    expect(parseTenantDatabaseUpdate(JSON.stringify({ event: 'ping' }))).toBeNull();
    expect(
      parseTenantDatabaseUpdate(
        JSON.stringify({ event: 'database-update', type: 'collection', key: '' }),
      ),
    ).toBeNull();
  });

  it('resolves relative /api/ws to same-origin ws URL', () => {
    const url = resolveTenantWebSocketUrl();
    expect(url.endsWith('/api/ws')).toBe(true);
    expect(url.startsWith('ws://') || url.startsWith('wss://')).toBe(true);
  });
});
