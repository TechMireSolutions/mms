import { describe, expect, it } from 'vitest';
import {
  parseTenantDatabaseUpdate,
  parseTenantJobEvent,
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

  it('parses job-progress and job-completed events', () => {
    const progressEvent = JSON.stringify({
      event: 'job-progress',
      tenantId: 'tenant-1',
      jobId: 'job-402',
      progress: { current: 50, total: 100, percent: 50 },
    });
    expect(parseTenantJobEvent(progressEvent)).toEqual({
      event: 'job-progress',
      tenantId: 'tenant-1',
      jobId: 'job-402',
      progress: { current: 50, total: 100, percent: 50 },
    });

    const completedEvent = JSON.stringify({
      event: 'job-completed',
      tenantId: 'tenant-1',
      jobId: 'job-402',
      hasDownload: true,
    });
    expect(parseTenantJobEvent(completedEvent)).toEqual({
      event: 'job-completed',
      tenantId: 'tenant-1',
      jobId: 'job-402',
      hasDownload: true,
    });
  });

  it('rejects invalid job event payloads', () => {
    expect(parseTenantJobEvent('invalid')).toBeNull();
    expect(parseTenantJobEvent(JSON.stringify({ event: 'unknown' }))).toBeNull();
    expect(parseTenantJobEvent(JSON.stringify({ event: 'job-progress' }))).toBeNull(); // Missing tenantId and jobId
  });

  it('resolves relative /api/ws to same-origin ws URL', () => {
    const url = resolveTenantWebSocketUrl();
    expect(url.endsWith('/api/ws')).toBe(true);
    expect(url.startsWith('ws://') || url.startsWith('wss://')).toBe(true);
  });
});
