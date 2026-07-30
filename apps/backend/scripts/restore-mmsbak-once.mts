import 'dotenv/config';
import { readFileSync } from 'node:fs';
import {
  decryptWorkspaceBackup,
  parseEncryptedBackupFile,
  parseStorageKeysToSnapshot,
  tenantLocalStoragePrefix,
  validateWorkspaceBackupJson,
} from '@mms/shared';
import { initializeDatabaseConnection } from '../src/db/dbConnection.js';
import { runWithTenant } from '../src/lib/tenantContext.js';
import { synchronizeData } from '../src/services/dbSyncService.js';

const BACKUP_PATH = process.env.BACKUP_PATH!;
const PASSWORD = process.env.BACKUP_PASSWORD!;
const TARGET = process.env.TARGET_SUBDOMAIN!;

const raw = readFileSync(BACKUP_PATH, 'utf8');
const meta = parseEncryptedBackupFile(raw);
if (!meta) throw new Error('not an encrypted .mmsbak file');

console.log(`source subdomain: ${meta.subdomain}  ->  target: ${TARGET}`);

let plaintext: string | null = null;
for (const password of PASSWORD.split('||')) {
  const attempt = await decryptWorkspaceBackup(raw, {
    adminEmail: meta.adminEmail,
    password,
  });
  if (attempt.ok) {
    plaintext = attempt.plaintext;
    break;
  }
}
if (!plaintext) throw new Error('decrypt failed for every supplied password');

const prefix = tenantLocalStoragePrefix(TARGET);
// Deliberately omits `expectedSubdomain`: this is a cross-workspace remap the UI blocks.
const validated = validateWorkspaceBackupJson(plaintext, prefix);
if (!validated.ok) throw new Error(`validation failed: ${validated.errorKey}`);

const snapshot = parseStorageKeysToSnapshot(validated.data, prefix);
const collections = snapshot.collections ?? {};

console.log(
  'restoring:',
  Object.entries(collections)
    .filter(([, rows]) => Array.isArray(rows) && rows.length > 0)
    .map(([name, rows]) => `${name}=${(rows as unknown[]).length}`)
    .sort()
    .join('  '),
);
console.log('objects:', Object.keys(snapshot.objects ?? {}).length);

initializeDatabaseConnection();
await runWithTenant(TARGET, async () => {
  await synchronizeData(snapshot);
});

console.log('restore complete');
process.exit(0);
