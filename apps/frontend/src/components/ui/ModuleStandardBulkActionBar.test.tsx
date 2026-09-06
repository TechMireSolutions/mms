import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BookOpen } from "lucide-react";
import { ModuleStandardBulkActionBar } from "./ModuleStandardBulkActionBar";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params?.count != null) return `${key}:${params.count}`;
      return key;
    },
  }),
}));

describe("ModuleStandardBulkActionBar", () => {
  it("renders with count label and delete action in active view", () => {
    const html = renderToStaticMarkup(
      <ModuleStandardBulkActionBar
        selectedCount={5}
        showDeleted={false}
        canDelete={true}
        onRequestBulkDelete={vi.fn()}
        onRequestBulkRestore={vi.fn()}
        onClearSelection={vi.fn()}
        leadingIcon={BookOpen}
        i18nNamespace="examinations"
      />,
    );

    expect(html).toContain("examinations.trash.selected:5");
    expect(html).toContain("common.delete");
    expect(html).toContain("common.deselect");
  });

  it("renders with restore action in deleted view", () => {
    const html = renderToStaticMarkup(
      <ModuleStandardBulkActionBar
        selectedCount={3}
        showDeleted={true}
        canDelete={true}
        onRequestBulkDelete={vi.fn()}
        onRequestBulkRestore={vi.fn()}
        onClearSelection={vi.fn()}
        leadingIcon={BookOpen}
        i18nNamespace="examinations"
      />,
    );

    expect(html).toContain("examinations.trash.selected:3");
    expect(html).toContain("examinations.trash.restore");
  });
});
