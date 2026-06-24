import { describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT_ID,
  buildStorageKeysFromSnapshot,
  buildWorkspaceBackupEnvelope,
  extractBackupRawKeys,
  summarizeWorkspaceBackup,
  validateWorkspaceBackupJson,
} from './backupTypes.js';

const PREFIX = 'mms_t:demo:';

describe('backupTypes', () => {
  it('builds and unwraps versioned envelope', () => {
    const keys = {
      'mms_t:demo:students': '[]',
      'mms_t:demo:branding': '{}',
    };
    const json = buildWorkspaceBackupEnvelope(keys, { subdomain: 'demo', dataSource: 'server' });
    const raw = extractBackupRawKeys(JSON.parse(json));
    expect(raw).toEqual(keys);
  });

  it('validates envelope and remaps tenant keys', () => {
    const keys = {
      'mms_t:other:students': '[{"id":"1"}]',
      'mms_t:other:global_settings': '{"language":"en"}',
    };
    const json = buildWorkspaceBackupEnvelope(keys, { subdomain: 'other' });
    const result = validateWorkspaceBackupJson(json, PREFIX);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.data)).toEqual([
        `${PREFIX}students`,
        `${PREFIX}global_settings`,
      ]);
    }
  });

  it('accepts legacy flat export format', () => {
    const legacy = JSON.stringify({
      'mms_t:legacy:contacts': '[]',
    });
    const result = validateWorkspaceBackupJson(legacy, PREFIX);
    expect(result.ok).toBe(true);
  });

  it('summarizes collections and objects', () => {
    const json = buildWorkspaceBackupEnvelope(
      {
        'mms_t:demo:students': '[{"id":"1"}]',
        'mms_t:demo:branding': '{"madrasaName":"Test"}',
      },
      { subdomain: 'demo' },
    );
    const summary = summarizeWorkspaceBackup(json, PREFIX);
    expect(summary.ok).toBe(true);
    if (summary.ok) {
      expect(summary.summary.keyCount).toBe(2);
      expect(summary.summary.collectionCount).toBe(1);
      expect(summary.summary.objectCount).toBe(1);
      expect(summary.summary.legacyFormat).toBe(false);
      expect(summary.summary.subdomain).toBe('demo');
      expect(summary.summary.dataSource).toBeNull();
    }
  });

  it('builds storage keys from server snapshot', () => {
    const keys = buildStorageKeysFromSnapshot(
      {
        collections: { students: [{ id: '1' }], contacts: [] },
        objects: { branding: { madrasaName: 'Test' } },
      },
      'mms_t:demo:',
    );
    expect(Object.keys(keys).sort()).toEqual([
      'mms_t:demo:branding',
      'mms_t:demo:contacts',
      'mms_t:demo:students',
    ]);
    expect(JSON.parse(keys['mms_t:demo:students'])).toEqual([{ id: '1' }]);
  });

  it('rejects invalid format', () => {
    expect(validateWorkspaceBackupJson('not json', PREFIX).ok).toBe(false);
    expect(validateWorkspaceBackupJson('[]', PREFIX).ok).toBe(false);
    expect(
      extractBackupRawKeys({ format: BACKUP_FORMAT_ID, keys: { bad: 1 } }),
    ).toBeNull();
  });

  it('rejects prototype pollution in envelope and keys', () => {
    const maliciousEnvelope = JSON.stringify({
      format: BACKUP_FORMAT_ID,
      version: 1,
      exportedAt: '2026-06-23T00:00:00Z',
      subdomain: 'demo',
      stats: { keyCount: 1, collectionCount: 0, objectCount: 1, byteSize: 100 },
      keys: {
        'mms_t:demo:settings': '{"__proto__": {"polluted": true}}',
      },
    });
    const res = validateWorkspaceBackupJson(maliciousEnvelope, PREFIX);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errorKey).toBe('backup.securityViolation');
    }

    const maliciousEnvelopePrototypeKey = JSON.stringify({
      format: BACKUP_FORMAT_ID,
      version: 1,
      exportedAt: '2026-06-23T00:00:00Z',
      subdomain: 'demo',
      stats: { keyCount: 1, collectionCount: 0, objectCount: 1, byteSize: 100 },
      keys: {
        'mms_t:demo:__proto__': '{}',
      },
    });
    const res2 = validateWorkspaceBackupJson(maliciousEnvelopePrototypeKey, PREFIX);
    expect(res2.ok).toBe(false);
    if (!res2.ok) {
      expect(res2.errorKey).toBe('backup.securityViolation');
    }
  });

  it('rejects restricted platform keys', () => {
    const maliciousPlatformKey = JSON.stringify({
      format: BACKUP_FORMAT_ID,
      version: 1,
      exportedAt: '2026-06-23T00:00:00Z',
      subdomain: 'demo',
      stats: { keyCount: 1, collectionCount: 0, objectCount: 1, byteSize: 100 },
      keys: {
        'mms_t:demo:workspaces': '[]',
      },
    });
    const res = validateWorkspaceBackupJson(maliciousPlatformKey, PREFIX);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errorKey).toBe('backup.securityViolation');
    }

    const maliciousPlatformPrefixedKey = JSON.stringify({
      format: BACKUP_FORMAT_ID,
      version: 1,
      exportedAt: '2026-06-23T00:00:00Z',
      subdomain: 'demo',
      stats: { keyCount: 1, collectionCount: 0, objectCount: 1, byteSize: 100 },
      keys: {
        'mms_t:demo:platform_super_users': '[]',
      },
    });
    const res2 = validateWorkspaceBackupJson(maliciousPlatformPrefixedKey, PREFIX);
    expect(res2.ok).toBe(false);
    if (!res2.ok) {
      expect(res2.errorKey).toBe('backup.securityViolation');
    }
  });

  it('deduplicates collection items by id', () => {
    const duplicateData = JSON.stringify({
      format: BACKUP_FORMAT_ID,
      version: 1,
      exportedAt: '2026-06-23T00:00:00Z',
      subdomain: 'demo',
      stats: { keyCount: 1, collectionCount: 1, objectCount: 0, byteSize: 100 },
      keys: {
        'mms_t:demo:students': '[{"id":"1","name":"A"},{"id":"2","name":"B"},{"id":"1","name":"A-dup"}]',
      },
    });
    const res = validateWorkspaceBackupJson(duplicateData, PREFIX);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const parsedVal = JSON.parse(res.data[`${PREFIX}students`]);
      expect(parsedVal).toEqual([
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ]);
    }
  });
});
