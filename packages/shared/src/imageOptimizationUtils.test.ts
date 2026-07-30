import { describe, expect, it, vi } from "vitest";
import {
  IMAGE_ENCODE_FORMATS,
  IMAGE_UPLOAD_PRESETS,
  canvasToOptimizedBlob,
  canvasToOptimizedDataUrl,
  imageExtensionForMime,
} from "./imageOptimizationUtils.js";

describe("imageOptimizationUtils", () => {
  it("maps supported MIME types and defaults unknown types to WebP", () => {
    expect(imageExtensionForMime("image/avif")).toBe(".avif");
    expect(imageExtensionForMime("image/webp")).toBe(".webp");
    expect(imageExtensionForMime("image/png")).toBe(".webp");
  });

  it("keeps every upload preset on the canonical format order", () => {
    expect(IMAGE_ENCODE_FORMATS).toEqual(["image/avif", "image/webp"]);
    expect(Object.values(IMAGE_UPLOAD_PRESETS).every(
      (preset) => preset.formats === IMAGE_ENCODE_FORMATS,
    )).toBe(true);
  });

  it("accepts the first canvas blob whose MIME type matches", async () => {
    const toBlob = vi.fn((callback: BlobCallback, type?: string) => {
      callback(new Blob(["image"], { type }));
    });
    const canvas = { toBlob } as unknown as HTMLCanvasElement;

    const result = await canvasToOptimizedBlob(canvas);

    expect(result?.type).toBe("image/avif");
    expect(toBlob).toHaveBeenCalledTimes(1);
  });

  it("falls through unsupported data URL encoders to WebP", () => {
    const toDataURL = vi.fn((type?: string) => (
      type === "image/avif" ? "data:image/png;base64,png" : `data:${type};base64,webp`
    ));
    const canvas = { toDataURL } as unknown as HTMLCanvasElement;

    expect(canvasToOptimizedDataUrl(canvas)).toBe("data:image/webp;base64,webp");
    expect(toDataURL).toHaveBeenCalledTimes(2);
  });
});
