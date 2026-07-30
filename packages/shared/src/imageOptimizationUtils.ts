/**
 * Preferred client-side encode formats, best-first.
 * AVIF gives the smallest files; WebP is the broad-support fallback.
 */
export const IMAGE_ENCODE_FORMATS = ["image/avif", "image/webp"] as const;

const IMAGE_EXT_BY_TYPE: Record<string, string> = {
  "image/avif": ".avif",
  "image/webp": ".webp",
};

/** Max raw picker file size before client-side AVIF encode (bytes). */
export const IMAGE_UPLOAD_MAX_INPUT_BYTES = 2 * 1024 * 1024;

/** Resize/encode presets — AVIF first, WebP fallback; used by every image uploader. */
export const IMAGE_UPLOAD_PRESETS = {
  avatar: { maxWidth: 300, maxHeight: 300, quality: 0.78, formats: IMAGE_ENCODE_FORMATS },
  logo: { maxWidth: 200, maxHeight: 200, quality: 0.82, formats: IMAGE_ENCODE_FORMATS },
  favicon: { maxWidth: 64, maxHeight: 64, quality: 0.82, formats: IMAGE_ENCODE_FORMATS },
  general: { maxWidth: 800, maxHeight: 800, quality: 0.82, formats: IMAGE_ENCODE_FORMATS },
} as const;

/** Supported image-upload optimization preset names. */
export type ImageUploadPurpose = keyof typeof IMAGE_UPLOAD_PRESETS;

/** Returns the canonical filename extension for an encoded image MIME type. */
export function imageExtensionForMime(mimeType: string): string {
  return IMAGE_EXT_BY_TYPE[mimeType] ?? ".webp";
}

function canvasToBlobAsync(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Encodes a canvas to the best-available modern format (AVIF → WebP), returning
 * the encoded blob and its actual MIME type.
 */
export async function canvasToOptimizedBlob(
  canvas: HTMLCanvasElement,
  quality = 0.82,
  formats: readonly string[] = IMAGE_ENCODE_FORMATS,
): Promise<{ blob: Blob; type: string } | null> {
  for (const type of formats) {
    const blob = await canvasToBlobAsync(canvas, type, quality);
    if (blob && blob.type === type) return { blob, type };
  }
  const fallback = await canvasToBlobAsync(canvas, "image/webp", quality);
  if (fallback) return { blob: fallback, type: fallback.type || "image/webp" };
  return null;
}

/**
 * Encodes a canvas to an optimized data URL (AVIF → WebP).
 */
export function canvasToOptimizedDataUrl(canvas: HTMLCanvasElement, quality = 0.82): string {
  for (const type of IMAGE_ENCODE_FORMATS) {
    const url = canvas.toDataURL(type, quality);
    if (url.startsWith(`data:${type}`)) return url;
  }
  return canvas.toDataURL("image/webp", quality);
}

/**
 * Resizes and compresses an image file on the client side, preferring AVIF and
 * falling back to WebP (then the original file).
 */
export function optimizeImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    formats?: readonly string[];
  } = {},
): Promise<File> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.82,
    formats = IMAGE_ENCODE_FORMATS,
  } = options;

  if (
    typeof window === "undefined"
    || typeof FileReader === "undefined"
    || !file.type.startsWith("image/")
  ) {
    return Promise.resolve(file);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const image = new Image();
      image.onload = async () => {
        let width = image.width;
        let height = image.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const canvasContext = canvas.getContext("2d");
        if (!canvasContext) {
          resolve(file);
          return;
        }

        canvasContext.drawImage(image, 0, 0, width, height);

        const encoded = await canvasToOptimizedBlob(canvas, quality, formats);
        if (!encoded) {
          resolve(file);
          return;
        }

        const extension = IMAGE_EXT_BY_TYPE[encoded.type] || ".webp";
        const optimizedFile = new File(
          [encoded.blob],
          file.name.replace(/\.[^/.]+$/, "") + extension,
          {
            type: encoded.type,
            lastModified: Date.now(),
          },
        );
        resolve(optimizedFile);
      };
      image.onerror = () => resolve(file);
      image.src = loadEvent.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Encodes a user-selected image using the requested upload preset.
 */
export function prepareImageForUpload(
  file: File,
  purpose: ImageUploadPurpose = "general",
): Promise<File> {
  return optimizeImage(file, IMAGE_UPLOAD_PRESETS[purpose]);
}
