import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FilterToolbar } from "@/components/common/FilterToolbar";
import { TranslationContext, type TranslationFunction } from "@/lib/contexts/TranslationContext";

const mockContext = {
  language: "en",
  t: ((key: string) => key) as TranslationFunction,
  isLoading: false,
  dir: "ltr" as const,
  isRtl: false,
};

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TranslationContext.Provider value={mockContext}>
      {children}
    </TranslationContext.Provider>
  );
}

describe("FilterToolbar", () => {
  it("renders search input, filter buttons, chips, and toggles", () => {
    const html = renderToStaticMarkup(
      <TestWrapper>
        <FilterToolbar
          searchInputId="test-search-input"
          searchQuery="Ali"
          onSearchChange={() => {}}
          searchPlaceholder="Search students..."
          filterButton={<button type="button">Filter Options</button>}
          filterChips={<span id="active-chip">Active Filter</span>}
          viewMode="table"
          onViewModeChange={() => {}}
          trashToggle={{
            showDeleted: false,
            onToggle: () => {},
            showActiveLabel: "Active Records",
            showDeletedLabel: "Trash Records",
          }}
        >
          <button type="button">Custom Action</button>
        </FilterToolbar>
      </TestWrapper>
    );

    expect(html).toContain('id="test-search-input"');
    expect(html).toContain('placeholder="Search students..."');
    expect(html).toContain("Filter Options");
    expect(html).toContain("Active Filter");
    expect(html).toContain("Custom Action");
    expect(html).toContain("Trash Records");
  });
});
