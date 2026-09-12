import { describe, expect, it } from "vitest";
import {
  alignElements,
  boxesIntersect,
  newId,
  snap,
  type BoundingBox,
} from "./invoiceTemplateEditorUtils";

describe("invoiceTemplateEditorUtils", () => {
  describe("snap", () => {
    it("snaps coordinates to the nearest grid step", () => {
      expect(snap(0)).toBe(0);
      expect(snap(2)).toBe(4);
      expect(snap(3)).toBe(4);
      expect(snap(5)).toBe(4);
      expect(snap(6)).toBe(8);
      expect(snap(15)).toBe(16);
    });
  });

  describe("newId", () => {
    it("generates distinct prefixed identifiers", () => {
      const id1 = newId();
      const id2 = newId();
      expect(id1.startsWith("el_")).toBe(true);
      expect(id2.startsWith("el_")).toBe(true);
      expect(id1).not.toBe(id2);
    });
  });

  describe("boxesIntersect", () => {
    it("returns true when two bounding boxes overlap", () => {
      const boxA: BoundingBox = { x: 10, y: 10, w: 50, h: 50 };
      const boxB: BoundingBox = { x: 30, y: 30, w: 50, h: 50 };
      expect(boxesIntersect(boxA, boxB)).toBe(true);
    });

    it("returns false when bounding boxes do not overlap", () => {
      const boxA: BoundingBox = { x: 10, y: 10, w: 20, h: 20 };
      const boxB: BoundingBox = { x: 100, y: 100, w: 20, h: 20 };
      expect(boxesIntersect(boxA, boxB)).toBe(false);
    });

    it("returns false when bounding boxes only touch edges", () => {
      const boxA: BoundingBox = { x: 10, y: 10, w: 20, h: 20 };
      const boxB: BoundingBox = { x: 30, y: 10, w: 20, h: 20 };
      expect(boxesIntersect(boxA, boxB)).toBe(false);
    });
  });

  describe("alignElements", () => {
    const sampleElements = [
      { id: "el_1", x: 10, y: 20, w: 60, h: 30 },
      { id: "el_2", x: 40, y: 50, w: 80, h: 40 },
      { id: "el_3", x: 100, y: 100, w: 50, h: 20 },
    ];

    it("does nothing when fewer than 2 elements are selected", () => {
      const result = alignElements(sampleElements, ["el_1"], "left");
      expect(result).toEqual(sampleElements);
    });

    it("aligns selected elements to the left (min x)", () => {
      const result = alignElements(sampleElements, ["el_1", "el_2"], "left");
      expect(result.find((el) => el.id === "el_1")?.x).toBe(12); // snapped min (10 -> 12)
      expect(result.find((el) => el.id === "el_2")?.x).toBe(12);
      expect(result.find((el) => el.id === "el_3")?.x).toBe(100); // untouched
    });

    it("aligns selected elements to the top (min y)", () => {
      const result = alignElements(sampleElements, ["el_1", "el_2"], "top");
      expect(result.find((el) => el.id === "el_1")?.y).toBe(20);
      expect(result.find((el) => el.id === "el_2")?.y).toBe(20);
      expect(result.find((el) => el.id === "el_3")?.y).toBe(100);
    });

    it("aligns selected elements to the right (max x + w)", () => {
      // el_1 right edge: 10 + 60 = 70. el_2 right edge: 40 + 80 = 120. Max = 120.
      const result = alignElements(sampleElements, ["el_1", "el_2"], "right");
      expect(result.find((el) => el.id === "el_1")?.x).toBe(60); // 120 - 60 = 60
      expect(result.find((el) => el.id === "el_2")?.x).toBe(40); // 120 - 80 = 40
    });

    it("aligns selected elements to the bottom (max y + h)", () => {
      // el_1 bottom: 20 + 30 = 50. el_2 bottom: 50 + 40 = 90. Max = 90.
      const result = alignElements(sampleElements, ["el_1", "el_2"], "bottom");
      expect(result.find((el) => el.id === "el_1")?.y).toBe(60); // 90 - 30 = 60
      expect(result.find((el) => el.id === "el_2")?.y).toBe(52); // 90 - 40 = 50 -> snapped 52
    });
  });
});
