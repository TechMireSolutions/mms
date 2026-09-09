import { createCipheriv, createDecipheriv, randomBytes, hash } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'enc:aes256gcm:';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getDerivedKey(explicitKey?: string): Buffer {
  const secretSource =
    explicitKey ||
    process.env.AT_REST_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    process.env.DATABASE_URL ||
    'mms-default-at-rest-secret-key-32b';
  return hash('sha256', secretSource, 'buffer');
}

/**
 * Encrypts sensitive string data at rest using AES-256-GCM.
 * Output format: enc:aes256gcm:<iv_hex>:<tag_hex>:<ciphertext_hex>
 */
export function encryptSecretAtRest(plaintext?: string | null, explicitKey?: string): string | undefined {
  if (!plaintext) return undefined;
  if (plaintext.startsWith(PREFIX)) return plaintext; // already encrypted

  const key = getDerivedKey(explicitKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`;
}

/**
 * Decrypts sensitive string data at rest.
 * Gracefully handles unencrypted values for seamless backward-compatibility.
 */
export function decryptSecretAtRest(value?: string | null, explicitKey?: string): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith(PREFIX)) return value; // plaintext fallback

  try {
    const parts = value.slice(PREFIX.length).split(':');
    if (parts.length !== 3) return value;

    const [ivHex, tagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) return value;

    const key = getDerivedKey(explicitKey);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    // If decryption fails (e.g. key changed), return undefined or log safely without leaking data
    return undefined;
  }
}
