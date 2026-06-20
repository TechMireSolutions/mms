import {
  deriveBrandColorsFromPalette,
  type LogoBrandColors,
} from '@mms/shared';
import { resolveApiUrl } from '@/lib/apiClient';

export interface ExtractLogoBrandColorsOptions {
  /** Longest canvas edge when sampling pixels (performance vs accuracy). */
  sampleSize?: number;
  /** Maximum dominant swatches passed to the derivation step. */
  maxSwatches?: number;
  /** Alpha threshold (0–255); transparent pixels are ignored. */
  minAlpha?: number;
  /** Bits per channel when quantizing similar pixels (higher = more precision). */
  quantizeBits?: number;
}

const DEFAULT_OPTIONS: Required<ExtractLogoBrandColorsOptions> = {
  sampleSize: 72,
  maxSwatches: 10,
  minAlpha: 40,
  quantizeBits: 4,
};

function quantizeChannel(value: number, bits: number): number {
  const levels = 1 << bits;
  const step = 255 / (levels - 1);
  return Math.round(Math.round(value / step) * step);
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (channel: number) =>
    Math.max(0, Math.min(255, channel)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function isInlineImageSource(src: string): boolean {
  return src.startsWith('data:') || src.startsWith('blob:');
}

function normalizeImageSource(src: string): string {
  const trimmed = src.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || isInlineImageSource(trimmed)) {
    return trimmed;
  }
  return resolveApiUrl(trimmed);
}

function inferImageMimeFromUrl(url: string): string | null {
  const path = url.split('?')[0]?.toLowerCase() ?? '';
  if (path.endsWith('.avif')) return 'image/avif';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  return null;
}

function normalizeFetchedImageBlob(blob: Blob, url: string): Blob {
  if (blob.type.startsWith('image/')) return blob;
  const inferred = inferImageMimeFromUrl(url);
  if (!inferred) {
    throw new Error('Invalid image payload');
  }
  return new Blob([blob], { type: inferred });
}

/** Fetches server-stored AVIF/WebP logos as a blob URL so canvas sampling is not tainted in dev. */
async function resolveImageLoadSource(
  src: string,
): Promise<{ src: string; revoke?: () => void }> {
  const normalized = normalizeImageSource(src);
  if (!normalized) {
    throw new Error('empty_image_source');
  }

  if (isInlineImageSource(normalized)) {
    return { src: normalized };
  }

  const response = await fetch(normalized, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to fetch image for colour extraction');
  }

  const blob = normalizeFetchedImageBlob(await response.blob(), normalized);
  const objectUrl = URL.createObjectURL(blob);
  return { src: objectUrl, revoke: () => URL.revokeObjectURL(objectUrl) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image for colour extraction'));
    image.src = src;
  });
}

function sampleDominantSwatches(
  imageData: ImageData,
  options: Required<ExtractLogoBrandColorsOptions>,
): string[] {
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    if (a < options.minAlpha) continue;

    const qr = quantizeChannel(r, options.quantizeBits);
    const qg = quantizeChannel(g, options.quantizeBits);
    const qb = quantizeChannel(b, options.quantizeBits);
    const key = `${qr}|${qg}|${qb}`;

    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      existing.r += r;
      existing.g += g;
      existing.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  return [...buckets.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, options.maxSwatches)
    .map(([, bucket]) =>
      rgbToHex(
        Math.round(bucket.r / bucket.count),
        Math.round(bucket.g / bucket.count),
        Math.round(bucket.b / bucket.count),
      ),
    );
}

/**
 * Samples a logo image and derives accessible primary/accent brand colours.
 * Accepts data URLs (fresh uploads) and stored `/uploads/…` AVIF/WebP paths.
 * Browser-only — uses canvas pixel sampling with transparency filtering and quantization.
 */
export async function extractLogoBrandColors(
  imageSource: string,
  options?: ExtractLogoBrandColorsOptions,
): Promise<LogoBrandColors | null> {
  if (!imageSource.trim()) return null;

  const resolved = { ...DEFAULT_OPTIONS, ...options };
  let revokeObjectUrl: (() => void) | undefined;

  try {
    const loadSource = await resolveImageLoadSource(imageSource);
    revokeObjectUrl = loadSource.revoke;

    const image = await loadImage(loadSource.src);
    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight, 1);
    const scale = resolved.sampleSize / longestEdge;
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);
    const swatches = sampleDominantSwatches(pixels, resolved);

    return deriveBrandColorsFromPalette(swatches);
  } catch {
    return null;
  } finally {
    revokeObjectUrl?.();
  }
}
