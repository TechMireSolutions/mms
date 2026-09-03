import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  IMAGE_UPLOAD_MAX_BYTES,
  assertAllowedImageMime,
  categoryForUploadPurpose,
  ensureUploadCategoryDir,
  imageExtensionForMime,
  type ImageUploadPurpose,
} from '../config/uploadConfig.js';

/**
 * Sniffs the actual image container from magic bytes so a client cannot store
 * arbitrary content (e.g. HTML/JS) under an image extension by lying about the
 * mimetype. Returns 'avif' | 'webp' | null.
 */
export function sniffImageFormat(buffer: Buffer): 'avif' | 'webp' | null {
  if (buffer.length < 12) return null;
  const ascii = (start: number, end: number) => buffer.toString('latin1', start, end);
  // WebP: "RIFF" .... "WEBP"
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  // AVIF: ISO-BMFF "ftyp" box with major brand avif/avis
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12);
    if (brand === 'avif' || brand === 'avis') return 'avif';
  }
  return null;
}

/**
 * Persists a client-encoded AVIF/WebP image and returns its public URL path.
 */
export async function saveUploadedImage(
  buffer: Buffer,
  mimeType: string,
  purpose: ImageUploadPurpose,
): Promise<string> {
  assertAllowedImageMime(mimeType);

  if (buffer.length === 0) {
    throw Object.assign(new Error('Image file is empty'), {
      statusCode: 400,
      type: 'validation_error',
    });
  }

  if (buffer.length > IMAGE_UPLOAD_MAX_BYTES) {
    throw Object.assign(new Error('Image file is too large'), {
      statusCode: 400,
      type: 'validation_error',
    });
  }

  // Content sniffing: reject files whose magic bytes don't match the declared type.
  const sniffed = sniffImageFormat(buffer);
  const expected = mimeType === 'image/avif' ? 'avif' : 'webp';
  if (sniffed !== expected) {
    throw Object.assign(new Error('Image content does not match the declared format'), {
      statusCode: 400,
      type: 'validation_error',
    });
  }

  const category = categoryForUploadPurpose(purpose);
  const dir = await ensureUploadCategoryDir(category);
  const ext = imageExtensionForMime(mimeType);
  const filename = `${randomUUID()}${ext}`;
  await writeFile(join(dir, filename), buffer);

  return `/uploads/${category}/${filename}`;
}
