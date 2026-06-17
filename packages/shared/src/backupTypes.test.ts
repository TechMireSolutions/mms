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
});
