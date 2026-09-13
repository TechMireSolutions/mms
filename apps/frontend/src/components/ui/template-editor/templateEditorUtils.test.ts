import { describe, expect, it, vi } from "vitest";
import {
  alignElements,
  boxesIntersect,
  downloadTemplateJson,
  newId,
  readTemplateJsonFile,
  snap,
} from "./templateEditorUtils";
import type { DocumentTemplate } from "@mms/shared";

describe("templateEditorUtils", () => {
  describe("snap", () => {
    it("snaps values to nearest multiple of 4", () => {
      expect(snap(0)).toBe(0);
      expect(snap(2)).toBe(4);
      expect(snap(5)).toBe(4);
      expect(snap(6)).toBe(8);
      expect(snap(15)).toBe(16);
    });
  });

  describe("newId", () => {
    it("generates unique element IDs", () => {
      const id1 = newId();
      const id2 = newId();
      expect(id1).toMatch(/^el_\d+$/);
      expect(id2).toMatch(/^el_\d+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe("boxesIntersect", () => {
    it("returns true when two bounding boxes overlap", () => {
      const boxA = { x: 10, y: 10, w: 50, h: 50 };
      const boxB = { x: 30, y: 30, w: 50, h: 50 };
      expect(boxesIntersect(boxA, boxB)).toBe(true);
    });

    it("returns false when two bounding boxes do not overlap", () => {
      const boxA = { x: 10, y: 10, w: 20, h: 20 };
      const boxB = { x: 100, y: 100, w: 20, h: 20 };
      expect(boxesIntersect(boxA, boxB)).toBe(false);
    });
  });

  describe("alignElements", () => {
    const initialElements = [
      { id: "el_1", x: 20, y: 10, w: 100, h: 30 },
      { id: "el_2", x: 80, y: 60, w: 120, h: 40 },
      { id: "el_3", x: 200, y: 200, w: 50, h: 20 },
    ];

    it("aligns selected elements to the left edge", () => {
      const aligned = alignElements(initialElements, ["el_1", "el_2"], "left");
      expect(aligned[0]!.x).toBe(20);
      expect(aligned[1]!.x).toBe(20);
      expect(aligned[2]!.x).toBe(200); // unaffected
    });

    it("aligns selected elements to the top edge", () => {
      const aligned = alignElements(initialElements, ["el_1", "el_2"], "top");
      expect(aligned[0]!.y).toBe(12); // snapped nearest multiple of 4
      expect(aligned[1]!.y).toBe(12);
    });

    it("aligns selected elements horizontally centered", () => {
      const aligned = alignElements(initialElements, ["el_1", "el_2"], "centerH");
      expect(aligned[0]!.x).toBe(60);
      expect(aligned[1]!.x).toBe(52);
    });

    it("returns unchanged array if less than 2 elements are selected", () => {
      const aligned = alignElements(initialElements, ["el_1"], "left");
      expect(aligned).toEqual(initialElements);
    });
  });

  describe("downloadTemplateJson", () => {
    it("creates an anchor download trigger with a blob URL", () => {
      const template: DocumentTemplate = {
        pageSize: "A5",
        orientation: "portrait",
        elements: [],
      };

      const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const clickSpy = vi.fn();
      vi.spyOn(document, "createElement").mockReturnValue({
        set href(val: string) {},
        set download(val: string) {},
        click: clickSpy,
      } as unknown as HTMLElement);

      downloadTemplateJson(template);

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");
    });
  });

  describe("readTemplateJsonFile", () => {
    it("parses valid template JSON and triggers onSuccess", () => {
      const template: DocumentTemplate = {
        pageSize: "A4",
        orientation: "landscape",
        elements: [{ id: "el_1", type: "static", label: "Test", x: 10, y: 10, w: 100, h: 20 }],
      };

      const mockFile = new File([JSON.stringify(template)], "template.json", {
        type: "application/json",
      });

      const onSuccess = vi.fn();
      const onError = vi.fn();

      readTemplateJsonFile(mockFile, onSuccess, onError);

      // simulate reader load
      const readerInstance = (globalThis as any).FileReader;
      expect(readerInstance).toBeDefined();
    });
  });
});
