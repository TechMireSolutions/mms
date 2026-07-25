import { describe, expect, it, vi } from 'vitest';
import { generateFaviconFromLogoUrl } from '@/lib/faviconGenerator';
import * as imageUpload from '@/lib/imageUpload';

vi.mock('@/lib/imageUpload', () => ({
  uploadCanvasImage: vi.fn().mockResolvedValue('https://mock.localhost/uploads/favicon.png'),
}));

interface MockCanvas {
  width: number;
  height: number;
  getContext: (contextId: string) => {
    drawImage: ReturnType<typeof vi.fn>;
    clearRect: ReturnType<typeof vi.fn>;
    getImageData: ReturnType<typeof vi.fn>;
    imageSmoothingEnabled: boolean;
    imageSmoothingQuality: string;
  };
}

describe('generateFaviconFromLogoUrl', () => {
  it('loads image, draws to canvas, and uploads favicon url', async () => {
    const canvasInstances: MockCanvas[] = [];

    const originalCreateElement = document.createElement;
    document.createElement = vi.fn().mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const mockCtx = {
          drawImage: vi.fn(),
          clearRect: vi.fn(),
          getImageData: vi.fn().mockReturnValue({
            data: new Uint8ClampedArray(4 * 200 * 100),
          }),
          imageSmoothingEnabled: false,
          imageSmoothingQuality: 'low',
        };
        const mockCanvas: MockCanvas = {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(mockCtx),
        };
        canvasInstances.push(mockCanvas);
        return mockCanvas as unknown as HTMLCanvasElement;
      }
      return originalCreateElement.call(document, tag);
    });

    const mockImage = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      width: 200,
      height: 100,
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      },
    };

    vi.stubGlobal('Image', function () {
      return mockImage;
    });

    try {
      const url = await generateFaviconFromLogoUrl('https://mock.localhost/logo.png');
      expect(url).toBe('https://mock.localhost/uploads/favicon.png');

      const destCanvas = canvasInstances[0];
      expect(destCanvas.width).toBe(48);
      expect(destCanvas.height).toBe(48);

      const destCtx = destCanvas.getContext('2d');
      expect(destCtx.drawImage).toHaveBeenCalledWith(
        mockImage,
        50, // sx: (200 - 100) / 2
        0,  // sy
        100, // sWidth
        100, // sHeight
        0,   // dx
        0,   // dy
        48,  // dWidth
        48   // dHeight
      );
      expect(imageUpload.uploadCanvasImage).toHaveBeenCalledWith(
        destCanvas as unknown as HTMLCanvasElement,
        'favicon'
      );
    } finally {
      document.createElement = originalCreateElement;
      vi.unstubAllGlobals();
    }
  });
});

