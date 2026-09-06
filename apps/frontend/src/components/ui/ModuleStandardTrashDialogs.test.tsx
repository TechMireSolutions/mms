import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModuleStandardTrashDialogs } from "./ModuleStandardTrashDialogs";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params?.count != null) return `${key}:${params.count}`;
      return key;
    },
  }),
}));

describe("ModuleStandardTrashDialogs", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("renders single trash confirm dialog when pendingTrashId is set", async () => {
    const onConfirmRowTrash = vi.fn();
    const onPendingTrashIdChange = vi.fn();

    await act(async () => {
      root.render(
        <ModuleStandardTrashDialogs
          pendingTrashId="item-123"
          onPendingTrashIdChange={onPendingTrashIdChange}
          confirmBulkOpen={false}
          onConfirmBulkOpenChange={vi.fn()}
          selectedCount={0}
          i18nNamespace="examinations"
          onConfirmRowTrash={onConfirmRowTrash}
          onConfirmBulkTrash={vi.fn()}
        />,
      );
    });

    expect(document.body.textContent).toContain("examinations.trash.deleteTitle");
    expect(document.body.textContent).toContain("examinations.trash.deleteConfirm");
  });

  it("renders bulk restore confirm dialog when showDeleted is true", async () => {
    await act(async () => {
      root.render(
        <ModuleStandardTrashDialogs
          pendingTrashId={null}
          onPendingTrashIdChange={vi.fn()}
          confirmBulkOpen={true}
          onConfirmBulkOpenChange={vi.fn()}
          showDeleted={true}
          selectedCount={4}
          i18nNamespace="examinations"
          onConfirmRowTrash={vi.fn()}
          onConfirmBulkTrash={vi.fn()}
        />,
      );
    });

    expect(document.body.textContent).toContain("examinations.trash.restore");
    expect(document.body.textContent).toContain("examinations.trash.bulkRestoreConfirm:4");
  });
});
