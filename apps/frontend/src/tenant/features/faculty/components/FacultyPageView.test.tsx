import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { School } from "lucide-react";
import { TeachersPageView } from "./FacultyPageView";

vi.mock("@/components/ui/ModulePageShell", () => ({
  ModulePageShell: ({ headerTitle, children, headerActions, metricsStrip }: {
    headerTitle: string;
    children: React.ReactNode;
    headerActions?: React.ReactNode;
    metricsStrip?: React.ReactNode;
  }) => (
    <div data-testid="module-page-shell">
      <h1>{headerTitle}</h1>
      <div>{headerActions}</div>
      <div>{metricsStrip}</div>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock("@/tenant/features/faculty/components/FacultyCommandMetrics", () => ({
  FacultyCommandMetrics: () => <div data-testid="teachers-metrics">Teacher Metrics</div>,
  TeachersCommandMetrics: () => <div data-testid="teachers-metrics">Teacher Metrics</div>,
}));

vi.mock("@/components/ui/ResponsiveAccordionTabs", () => ({
  ResponsiveAccordionTabs: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion-tabs">{children}</div>
  ),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/features/faculty/components/FacultyWorkTier", () => ({
  FacultyWorkTier: () => <div data-testid="teachers-work-tier">Teacher Work Tier</div>,
  TeachersWorkTier: () => <div data-testid="teachers-work-tier">Teacher Work Tier</div>,
}));

vi.mock("@/tenant/features/faculty/components/FacultyPageOverlays", () => ({
  FacultyPageOverlays: () => <div data-testid="teachers-page-overlays">Teacher Overlays</div>,
  TeachersPageOverlays: () => <div data-testid="teachers-page-overlays">Teacher Overlays</div>,
}));

describe("TeachersPageView Component", () => {
  it("renders teacher page shell with header actions, metrics, and work tier", () => {
    const html = renderToStaticMarkup(
      <TeachersPageView
        canWrite={true}
        canExport={true}
        visibleTabs={[
          {
            id: "work",
            label: "Work",
            description: "Directory",
            icon: School,
          },
        ]}
        metricsTotal={12}
        activeTab="work"
        setActiveTab={vi.fn()}
        viewingDeleted={false}
        shownCount={12}
        openCreateForm={vi.fn()}
        handleExportCSV={vi.fn()}
        tabPanelProps={{
          activeTab: "work",
          workTierProps: {} as never,
        }}
        pageOverlaysProps={{} as never}
      />,
    );

    expect(html).toContain("nav.faculty");
    expect(html).toContain("Teacher Work Tier");
    expect(html).toContain("Teacher Overlays");
  });
});
