import { describe, expect, it } from 'vitest';
import {
  decryptWorkspaceBackup,
  encryptWorkspaceBackup,
  isEncryptedBackupPayload,
} from './backupCrypto.js';
import { buildWorkspaceBackupEnvelope } from './backupTypes.js';

const CREDS = { adminEmail: 'admin@madrasa.app', password: 'Pa$$w0rd' };

describe('backupCrypto', () => {
  it('encrypts and decrypts a workspace backup', async () => {
    const plaintext = buildWorkspaceBackupEnvelope(
      { 'mms_t:demo:students': '[]' },
      { subdomain: 'demo', dataSource: 'server' },
    );
    const encrypted = await encryptWorkspaceBackup(plaintext, CREDS, {
      subdomain: 'demo',
      tenantLabel: 'Dar ul Quran',
    });
    expect(isEncryptedBackupPayload(encrypted)).toBe(true);

    const result = await decryptWorkspaceBackup(encrypted, CREDS);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plaintext).toBe(plaintext);
      expect(result.meta.tenantLabel).toBe('Dar ul Quran');
    }
  });

  it('rejects wrong password', async () => {
    const encrypted = await encryptWorkspaceBackup('{"test":true}', CREDS);
    const result = await decryptWorkspaceBackup(encrypted, {
      adminEmail: CREDS.adminEmail,
      password: 'wrong',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKey).toBe('backup.decryptFailed');
    }
  });

  it('rejects email mismatch', async () => {
    const encrypted = await encryptWorkspaceBackup('{"test":true}', CREDS);
    const result = await decryptWorkspaceBackup(encrypted, {
      adminEmail: 'other@madrasa.app',
      password: CREDS.password,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKey).toBe('backup.decryptEmailMismatch');
    }
  });
});
