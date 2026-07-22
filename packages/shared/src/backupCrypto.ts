import { z } from 'zod';
import type { AppTranslationKey } from './appTranslations.js';
import type { BackupCryptoCredentials } from './backupTypes.js';

/** Encrypted on-disk backup wrapper (plaintext is a workspace backup envelope). */
export const ENCRYPTED_BACKUP_FORMAT_ID = 'mms-encrypted-workspace-backup' as const;

export const ENCRYPTED_BACKUP_VERSION = 1;

export const BACKUP_KDF_ITERATIONS = 310_000;

export interface EncryptedWorkspaceBackupFile {
  format: typeof ENCRYPTED_BACKUP_FORMAT_ID;
  version: number;
  subdomain: string | null;
  tenantLabel: string | null;
  adminEmail: string;
  kdf: 'PBKDF2';
  hash: 'SHA-256';
  cipher: 'AES-GCM';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

export const encryptedWorkspaceBackupFileSchema = z.object({
  format: z.literal(ENCRYPTED_BACKUP_FORMAT_ID),
  version: z.number(),
  subdomain: z.string().nullable(),
  tenantLabel: z.string().nullable(),
  adminEmail: z.string(),
  kdf: z.literal('PBKDF2'),
  hash: z.literal('SHA-256'),
  cipher: z.literal('AES-GCM'),
  iterations: z.number(),
  salt: z.string(),
  iv: z.string(),
  ciphertext: z.string(),
});


export type BackupDecryptResult =
  | { ok: true; plaintext: string; meta: EncryptedWorkspaceBackupFile }
  | { ok: false; errorKey: AppTranslationKey };

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('backup.cryptoUnavailable');
  }
  return subtle;
}

function randomBytes(length: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(length));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function asArrayBuffer(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const arrayBufferBytes = new Uint8Array(bytes.length);
  arrayBufferBytes.set(bytes);
  return arrayBufferBytes;
}

/** Normalizes admin email + password into KDF input (never persisted). */
export function normalizeBackupPrincipal(email: string, password: string): string {
  return `${email.trim().toLowerCase()}\0${password}`;
}

export function isEncryptedBackupPayload(text: string): boolean {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return parsed.format === ENCRYPTED_BACKUP_FORMAT_ID;
  } catch {
    return false;
  }
}

export function parseEncryptedBackupFile(text: string): EncryptedWorkspaceBackupFile | null {
  try {
    const parsed = JSON.parse(text);
    const validated = encryptedWorkspaceBackupFileSchema.safeParse(parsed);
    return validated.success ? validated.data : null;
  } catch {
    return null;
  }
}

async function deriveBackupKey(
  email: string,
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(normalizeBackupPrincipal(email, password)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return subtle.deriveKey(
    { name: 'PBKDF2', salt: asArrayBuffer(salt), iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypts a workspace backup JSON string with the tenant admin credentials. */
export async function encryptWorkspaceBackup(
  plaintext: string,
  credentials: BackupCryptoCredentials,
  meta?: { subdomain?: string | null; tenantLabel?: string | null },
): Promise<string> {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveBackupKey(
    credentials.adminEmail,
    credentials.password,
    salt,
    BACKUP_KDF_ITERATIONS,
  );

  const ciphertext = await getSubtle().encrypt(
    { name: 'AES-GCM', iv: asArrayBuffer(iv) },
    key,
    new TextEncoder().encode(plaintext),
  );

  const envelope: EncryptedWorkspaceBackupFile = {
    format: ENCRYPTED_BACKUP_FORMAT_ID,
    version: ENCRYPTED_BACKUP_VERSION,
    subdomain: meta?.subdomain ?? null,
    tenantLabel: meta?.tenantLabel ?? null,
    adminEmail: credentials.adminEmail.trim().toLowerCase(),
    kdf: 'PBKDF2',
    hash: 'SHA-256',
    cipher: 'AES-GCM',
    iterations: BACKUP_KDF_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };

  return JSON.stringify(envelope);
}

/** Decrypts an encrypted backup file using admin email + password. */
export async function decryptWorkspaceBackup(
  fileJson: string,
  credentials: BackupCryptoCredentials,
): Promise<BackupDecryptResult> {
  const parsed = parseEncryptedBackupFile(fileJson);
  if (!parsed) {
    return { ok: false, errorKey: 'backup.invalidFormat' };
  }

  const email = credentials.adminEmail.trim().toLowerCase();
  if (email !== parsed.adminEmail.trim().toLowerCase()) {
    return { ok: false, errorKey: 'backup.decryptEmailMismatch' };
  }

  try {
    const salt = base64ToBytes(parsed.salt);
    const iv = base64ToBytes(parsed.iv);
    const key = await deriveBackupKey(email, credentials.password, salt, parsed.iterations);
    const plainBuffer = await getSubtle().decrypt(
      { name: 'AES-GCM', iv: asArrayBuffer(iv) },
      key,
      asArrayBuffer(base64ToBytes(parsed.ciphertext)),
    );
    const plaintext = new TextDecoder().decode(plainBuffer);
    return { ok: true, plaintext, meta: parsed };
  } catch {
    return { ok: false, errorKey: 'backup.decryptFailed' };
  }
}
