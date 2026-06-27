import { uploadCanvasImage } from '@/lib/imageUpload';

/**
 * Finds the bounding box of non-transparent content (alpha > 10) in the image,
 * crops to it, and centers it on a square canvas to remove excessive empty margins.
 * Falls back to null if the image is blank, has zero size, or reading pixel data fails (e.g. CORS).
 */
function trimAndCenterImage(img: HTMLImageElement): HTMLCanvasElement | null {
  try {
    const width = img.width;
    const height = img.height;
    if (width === 0 || height === 0) return null;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return null;

    tempCtx.drawImage(img, 0, 0);
    const imgData = tempCtx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let hasContent = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 10) { // Ignore near-invisible/fully transparent background padding
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasContent = true;
        }
      }
    }

    if (!hasContent) return null;

    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const maxDim = Math.max(w, h);

    const squareCanvas = document.createElement('canvas');
    squareCanvas.width = maxDim;
    squareCanvas.height = maxDim;
    const squareCtx = squareCanvas.getContext('2d');
    if (!squareCtx) return null;

    // Draw the cropped non-transparent content centered on the square canvas
    const dx = (maxDim - w) / 2;
    const dy = (maxDim - h) / 2;
    squareCtx.drawImage(tempCanvas, minX, minY, w, h, dx, dy, w, h);

    return squareCanvas;
  } catch {
    return null;
  }
}

/**
 * Automatically generates a square favicon from an uploaded logo image URL
 * and uploads the optimized result to the backend using modern canvas best practices.
 * Trims transparent borders first to ensure the icon renders at maximum visual scale.
 */
export async function generateFaviconFromLogoUrl(logoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // Clear canvas to preserve alpha channel transparency
        ctx.clearRect(0, 0, 48, 48);

        let resized = false;
        const trimmedCanvas = trimAndCenterImage(img);

        if (trimmedCanvas) {
          if (typeof window.createImageBitmap !== 'undefined') {
            try {
              const bitmap = await window.createImageBitmap(trimmedCanvas, 0, 0, trimmedCanvas.width, trimmedCanvas.height, {
                resizeWidth: 48,
                resizeHeight: 48,
                resizeQuality: 'high',
              });
              ctx.drawImage(bitmap, 0, 0);
              bitmap.close();
              resized = true;
            } catch {
              // Fallback to 2d canvas smoothing
            }
          }

          if (!resized) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(trimmedCanvas, 0, 0, trimmedCanvas.width, trimmedCanvas.height, 0, 0, 48, 48);
            resized = true;
          }
        }

        if (!resized) {
          // Center crop to a square aspect ratio (1:1) - Fallback
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;

          if (typeof window.createImageBitmap !== 'undefined') {
            try {
              const bitmap = await window.createImageBitmap(img, sx, sy, size, size, {
                resizeWidth: 48,
                resizeHeight: 48,
                resizeQuality: 'high',
              });
              ctx.drawImage(bitmap, 0, 0);
              bitmap.close();
              resized = true;
            } catch {
              // Fallback
            }
          }

          if (!resized) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, sx, sy, size, size, 0, 0, 48, 48);
          }
        }

        const faviconUrl = await uploadCanvasImage(canvas, 'favicon');
        resolve(faviconUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load logo image'));
    img.src = logoUrl;
  });
}
