import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ModuleScaffold } from "@/components/common/ModuleScaffold";
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

describe("ModuleScaffold", () => {
  it("renders SEO metadata, header, and children correctly", () => {
    const html = renderToStaticMarkup(
      <TestWrapper>
        <ModuleScaffold
          seoTitle="Students Directory | MMS"
          seoDescription="Manage student records and admissions"
          headerTitle="Students"
          headerSubtitle="Active enrolled directory"
          metricsStrip={<div id="test-metrics">Metrics Content</div>}
        >
          <div id="test-content">Main Directory Content</div>
        </ModuleScaffold>
      </TestWrapper>
    );

    expect(html).toContain("<title>Students Directory | MMS</title>");
    expect(html).toContain('name="description" content="Manage student records and admissions"');
    expect(html).toContain("Students");
    expect(html).toContain("Active enrolled directory");
    expect(html).toContain("Metrics Content");
    expect(html).toContain("Main Directory Content");
  });

  it("renders tabs when tabs configuration is provided", () => {
    const tabs = [
      { id: "work", label: "Directory" },
      { id: "reports", label: "Analytics" },
      { id: "setup", label: "Settings" },
    ];

    const html = renderToStaticMarkup(
      <TestWrapper>
        <ModuleScaffold
          seoTitle="Finance | MMS"
          seoDescription="Finance management"
          tabs={tabs}
          activeTab="work"
          onTabChange={() => {}}
        >
          <div>Tab Content</div>
        </ModuleScaffold>
      </TestWrapper>
    );

    expect(html).toContain("Directory");
    expect(html).toContain("Analytics");
    expect(html).toContain("Settings");
    expect(html).toContain("Tab Content");
  });
});
