import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ModuleWorkDirectoryShell } from "./ModuleWorkDirectoryShell";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params?.count != null) return `${key}:${params.count}`;
      return key;
    },
  }),
}));

describe("ModuleWorkDirectoryShell", () => {
  it("renders toolbar, filter button, and children", () => {
    const html = renderToStaticMarkup(
      <ModuleWorkDirectoryShell
        i18nNamespace="students"
        search="Ali"
        onSearchChange={vi.fn()}
        hasActiveFilters={true}
        onClearFilters={vi.fn()}
        filterButton={<button type="button">CustomFilterButton</button>}
        viewMode="table"
        onViewModeChange={vi.fn()}
        canDelete={true}
        viewingDeleted={false}
        onToggleDeleted={vi.fn()}
      >
        <div data-testid="directory-table">Directory Table Content</div>
      </ModuleWorkDirectoryShell>,
    );

    expect(html).toContain("CustomFilterButton");
    expect(html).toContain("Directory Table Content");
    expect(html).toContain("common.clearFilters");
    expect(html).toContain("students.filters");
  });

  it("renders filter chips and bulkActionBar slot when provided", () => {
    const html = renderToStaticMarkup(
      <ModuleWorkDirectoryShell
        i18nNamespace="students"
        search=""
        onSearchChange={vi.fn()}
        hasActiveFilters={true}
        onClearFilters={vi.fn()}
        filterButton={<span>Filter</span>}
        filterChips={[
          { key: "gender", label: "Gender", onRemove: vi.fn() },
        ]}
        bulkActionBar={<div data-testid="bulk-bar">Bulk Actions Bar</div>}
        viewMode="cards"
        onViewModeChange={vi.fn()}
        canDelete={false}
        viewingDeleted={false}
        onToggleDeleted={vi.fn()}
      >
        <div>Cards View</div>
      </ModuleWorkDirectoryShell>,
    );

    expect(html).toContain("Bulk Actions Bar");
    expect(html).toContain("Cards View");
    expect(html).toContain("Gender");
  });
});
