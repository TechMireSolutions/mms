import { describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT_ID,
  buildStorageKeysFromSnapshot,
  buildWorkspaceBackupEnvelope,
  buildWorkspaceBackupEnvelopeAsync,
  computeBackupChecksum,
  extractBackupRawKeys,
  summarizeWorkspaceBackup,
  validateWorkspaceBackupJson,
  validateWorkspaceBackupJsonAsync,
  isBackupErrorKey,
  createBackupHistoryEntry,
  findRestrictedKeyInSnapshot,
  parseStorageKeysToSnapshot,
  SETTINGS_KEY_TO_MODULE,
  MODULE_TO_SETTINGS_KEY,
  validateAndNormalizeSnapshot,
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

  it('validates same-workspace envelope and remaps tenant keys', () => {
    const keys = {
      'mms_t:other:students': '[{"id":"1"}]',
      'mms_t:other:global_settings': '{"language":"en"}',
    };
    const json = buildWorkspaceBackupEnvelope(keys, { subdomain: 'other' });
    const result = validateWorkspaceBackupJson(json, PREFIX, 'other');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.data)).toEqual([
        `${PREFIX}students`,
        `${PREFIX}global_settings`,
      ]);
    }
  });

  it('rejects a backup created for another workspace', () => {
    const json = buildWorkspaceBackupEnvelope(
      { 'mms_t:other:contacts': '[]' },
      { subdomain: 'other' },
    );
    const result = validateWorkspaceBackupJson(json, PREFIX, 'demo');
    expect(result).toEqual({ ok: false, errorKey: 'backup.workspaceMismatch' });
  });

  it('rejects unidentified and legacy backups when workspace identity is required', () => {
    const unidentified = buildWorkspaceBackupEnvelope(
      { 'mms_t:demo:contacts': '[]' },
      { subdomain: null },
    );
    expect(validateWorkspaceBackupJson(unidentified, PREFIX, 'demo')).toEqual({
      ok: false,
      errorKey: 'backup.workspaceUnidentified',
    });

    const legacy = JSON.stringify({ 'mms_t:demo:contacts': '[]' });
    expect(validateWorkspaceBackupJson(legacy, PREFIX, 'demo')).toEqual({
      ok: false,
      errorKey: 'backup.workspaceUnidentified',
    });
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

  it('rejects backup with users collection but no admin user', () => {
    const backupDataNoAdmin = JSON.stringify({
      format: BACKUP_FORMAT_ID,
      version: 1,
      exportedAt: '2026-06-23T00:00:00Z',
      subdomain: 'demo',
      stats: { keyCount: 1, collectionCount: 1, objectCount: 0, byteSize: 100 },
      keys: {
        'mms_t:demo:users': '[{"id":"1","name":"A","role":"teacher"},{"id":"2","name":"B","role":"assistant_teacher"}]',
      },
    });
    const res = validateWorkspaceBackupJson(backupDataNoAdmin, PREFIX);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errorKey).toBe('backup.missingAdminUser');
    }
  });

  it('accepts backup with users collection containing at least one admin user', () => {
    const backupDataWithAdmin = JSON.stringify({
      format: BACKUP_FORMAT_ID,
      version: 1,
      exportedAt: '2026-06-23T00:00:00Z',
      subdomain: 'demo',
      stats: { keyCount: 1, collectionCount: 1, objectCount: 0, byteSize: 100 },
      keys: {
        'mms_t:demo:users': '[{"id":"1","name":"A","role":"teacher"},{"id":"2","name":"B","role":"admin"}]',
      },
    });
    const res = validateWorkspaceBackupJson(backupDataWithAdmin, PREFIX);
    expect(res.ok).toBe(true);
  });

  describe('isBackupErrorKey', () => {
    it('returns true if string starts with backup.', () => {
      expect(isBackupErrorKey('backup.invalidFormat')).toBe(true);
      expect(isBackupErrorKey('backup.restoreFailed')).toBe(true);
    });

    it('returns false if string does not start with backup.', () => {
      expect(isBackupErrorKey('settings.backupResetToast')).toBe(false);
      expect(isBackupErrorKey('some random error')).toBe(false);
    });
  });

  describe('createBackupHistoryEntry', () => {
    it('creates a workspace backup record entry successfully', () => {
      const now = new Date('2026-06-23T12:00:00.000Z');
      const stats = { keyCount: 5, collectionCount: 3, objectCount: 2, byteSize: 1000 };
      const meta = {
        fileName: 'backup.json',
        encrypted: false,
        adminEmail: 'admin@madrasa.app',
        maxInlineBytes: 500,
      };

      const entry = createBackupHistoryEntry('test-data', now, 'Test Backup', stats, meta);

      expect(entry.id).toMatch(/^b\d+$/);
      expect(entry.name).toBe('Test Backup');
      expect(entry.date).toBe('2026-06-23T12:00:00.000Z');
      expect(entry.size).toBe('9 B');
      expect(entry.status).toBe('success');
      expect(entry.data).toBe('test-data');
      expect(entry.keyCount).toBe(5);
      expect(entry.collectionCount).toBe(3);
      expect(entry.objectCount).toBe(2);
      expect(entry.fileName).toBe('backup.json');
      expect(entry.encrypted).toBe(false);
      expect(entry.adminEmail).toBe('admin@madrasa.app');
    });

    it('omits data if it exceeds maxInlineBytes limit', () => {
      const now = new Date();
      const stats = { keyCount: 1, collectionCount: 0, objectCount: 1, byteSize: 10 };
      const meta = {
        fileName: 'backup.json',
        encrypted: true,
        adminEmail: 'admin@madrasa.app',
        maxInlineBytes: 5,
      };

      const entry = createBackupHistoryEntry('long-test-data', now, 'Test Backup', stats, meta);
      expect(entry.data).toBeUndefined();
    });
  });

  describe('findRestrictedKeyInSnapshot', () => {
    it('returns null if there are no restricted keys', () => {
      const snapshot = {
        collections: {
          students: [{ id: '1' }],
        },
        objects: {
          branding: { madrasaName: 'Test' },
        },
      };
      expect(findRestrictedKeyInSnapshot(snapshot)).toBeNull();
    });

    it('identifies restricted collection key', () => {
      const snapshot = {
        collections: {
          workspaces: [{ id: '1' }],
        },
      };
      expect(findRestrictedKeyInSnapshot(snapshot)).toBe('workspaces');
    });

    it('identifies restricted object key', () => {
      const snapshot = {
        objects: {
          platform_super_users: {},
        },
      };
      expect(findRestrictedKeyInSnapshot(snapshot)).toBe('platform_super_users');
    });
  });

  describe('parseStorageKeysToSnapshot', () => {
    it('parses flat prefixed keys into snapshots of collections and objects', () => {
      const keys = {
        [`${PREFIX}students`]: '[{"id":"1","name":"A"}]',
        [`${PREFIX}branding`]: '{"madrasaName":"Test"}',
        'mms_t:other:students': '[]', // mismatch prefix
        'random_key': 'value',
      };
      const snapshot = parseStorageKeysToSnapshot(keys, PREFIX);
      expect(snapshot.collections).toEqual({
        students: [{ id: '1', name: 'A' }],
      });
      expect(snapshot.objects).toEqual({
        branding: { madrasaName: 'Test' },
      });
    });

    it('handles non-JSON or plain string values as objects', () => {
      const keys = {
        [`${PREFIX}plain`]: 'plain_text_value',
      };
      const snapshot = parseStorageKeysToSnapshot(keys, PREFIX);
      expect(snapshot.objects).toEqual({
        plain: 'plain_text_value',
      });
      expect(snapshot.collections).toEqual({});
    });
  });

  describe('validateAndNormalizeSnapshot', () => {
    it('succeeds for valid snapshots', () => {
      const snapshot = {
        collections: {
          students: [{ id: '1', name: 'A' }],
        },
        objects: {
          branding: { madrasaName: 'Test' },
        },
      };
      const result = validateAndNormalizeSnapshot(snapshot);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.collections?.students).toEqual([{ id: '1', name: 'A' }]);
      }
    });

    it('rejects prototype pollution in snapshot collections/objects', () => {
      const badSnapshot = JSON.parse(
        '{"collections": {"students": [{"id": "1", "__proto__": {"polluted": true}}]}}'
      );
      expect(validateAndNormalizeSnapshot(badSnapshot).ok).toBe(false);
    });

    it('rejects restricted keys in snapshot', () => {
      const badSnapshot = {
        collections: {
          workspaces: [],
        },
      };
      expect(validateAndNormalizeSnapshot(badSnapshot).ok).toBe(false);
    });

    it('strips server-only object keys instead of rejecting the restore', () => {
      const snapshot = {
        collections: {
          users: [{ id: 'u-1', role: 'admin' }],
        },
        objects: {
          branding: { madrasaName: 'Test' },
          user_export_artifacts: { u1: {} },
          email_integration_secrets: { smtpPassword: 'secret' },
          contact_google_sync_by_user: { u1: { clientSecret: 'x' } },
        },
      };
      const result = validateAndNormalizeSnapshot(snapshot);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.objects).toEqual({ branding: { madrasaName: 'Test' } });
      }
    });

    it('deduplicates collection items by id', () => {
      const snapshot = {
        collections: {
          students: [
            { id: '1', name: 'A' },
            { id: '2', name: 'B' },
            { id: '1', name: 'Dup' },
          ],
        },
      };
      const result = validateAndNormalizeSnapshot(snapshot);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.collections?.students).toEqual([
          { id: '1', name: 'A' },
          { id: '2', name: 'B' },
        ]);
      }
    });

    it('rejects users restore without admin user', () => {
      const snapshot = {
        collections: {
          users: [
            { id: '1', role: 'teacher' },
          ],
        },
      };
      expect(validateAndNormalizeSnapshot(snapshot).ok).toBe(false);
    });
  });

  describe('settings mappings', () => {
    it('correctly maps settings keys to module IDs', () => {
      expect(SETTINGS_KEY_TO_MODULE.contact_field_config).toBe('contacts');
      expect(SETTINGS_KEY_TO_MODULE.enrollments_settings).toBe('enrollments');
      expect(SETTINGS_KEY_TO_MODULE.examinations_settings).toBe('examinations');
      expect(SETTINGS_KEY_TO_MODULE.question_bank_settings).toBe('questionBank');
    });

    it('correctly maps module IDs to settings keys with singular and plural compatibility', () => {
      expect(MODULE_TO_SETTINGS_KEY.contacts).toBe('contact_field_config');
      expect(MODULE_TO_SETTINGS_KEY.enrollments).toBe('enrollments_settings');
      expect(MODULE_TO_SETTINGS_KEY.enrollment).toBe('enrollments_settings');
      expect(MODULE_TO_SETTINGS_KEY.examinations).toBe('examinations_settings');
      expect(MODULE_TO_SETTINGS_KEY.examination).toBe('examinations_settings');
      expect(MODULE_TO_SETTINGS_KEY['question-bank']).toBe('question_bank_settings');
      expect(MODULE_TO_SETTINGS_KEY.questionBank).toBe('question_bank_settings');
    });
  });

  describe('modern backup features (checksum, versioning, entity breakdown)', () => {
    it('computes and embeds SHA-256 checksum in async envelope', async () => {
      const keys = {
        'mms_t:demo:students': '[{"id":"s-1"}]',
        'mms_t:demo:contacts': '[{"id":"c-1"}]',
      };
      const json = await buildWorkspaceBackupEnvelopeAsync(keys, { subdomain: 'demo' });
      const parsed = JSON.parse(json);

      expect(parsed.checksum).toBeDefined();
      expect(parsed.checksum).toMatch(/^[a-f0-9]{64}$/i);
      expect(parsed.stats.entityBreakdown).toEqual({
        students: 1,
        contacts: 1,
      });

      const validResult = await validateWorkspaceBackupJsonAsync(json, PREFIX, 'demo');
      expect(validResult.ok).toBe(true);
    });

    it('rejects backup when checksum does not match modified payload', async () => {
      const keys = {
        'mms_t:demo:contacts': '[{"id":"c-1"}]',
      };
      const json = await buildWorkspaceBackupEnvelopeAsync(keys, { subdomain: 'demo' });
      const parsed = JSON.parse(json);

      // Tamper with payload keys
      parsed.keys['mms_t:demo:contacts'] = '[{"id":"c-tampered"}]';
      const tamperedJson = JSON.stringify(parsed);

      const result = await validateWorkspaceBackupJsonAsync(tamperedJson, PREFIX, 'demo');
      expect(result).toEqual({ ok: false, errorKey: 'backup.checksumMismatch' });
    });

    it('rejects backup with future unsupported schema version', () => {
      const keys = {
        'mms_t:demo:contacts': '[{"id":"c-1"}]',
      };
      const json = buildWorkspaceBackupEnvelope(keys, { subdomain: 'demo' });
      const parsed = JSON.parse(json);
      parsed.version = 999;
      const futureJson = JSON.stringify(parsed);

      const result = validateWorkspaceBackupJson(futureJson, PREFIX, 'demo');
      expect(result).toEqual({ ok: false, errorKey: 'backup.unsupportedFutureVersion' });
    });

    it('provides entity breakdown and checksum in summary', async () => {
      const keys = {
        'mms_t:demo:students': '[{"id":"1"},{"id":"2"}]',
        'mms_t:demo:contacts': '[{"id":"1"}]',
        'mms_t:demo:general_settings': '{"name":"Madrasa"}',
      };
      const json = await buildWorkspaceBackupEnvelopeAsync(keys, { subdomain: 'demo' });
      const summaryResult = summarizeWorkspaceBackup(json, PREFIX);

      expect(summaryResult.ok).toBe(true);
      if (summaryResult.ok) {
        expect(summaryResult.summary.entityBreakdown).toEqual({
          students: 2,
          contacts: 1,
        });
        expect(summaryResult.summary.checksum).toBeDefined();
        expect(summaryResult.summary.version).toBe(1);
      }
    });
  });
});

