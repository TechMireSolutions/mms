import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { School, Users } from "lucide-react";
import { FacultyPageView } from "./FacultyPageView";

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
  FacultyCommandMetrics: () => <div data-testid="faculty-metrics">Faculty Metrics</div>,
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

vi.mock("@/tenant/hooks/useIndustryTerminology", () => ({
  useIndustryTerminology: () => ({
    facultyLabel: "Faculty Team",
    staffSingular: "Teacher",
    locationLabel: "Campus",
  }),
}));

vi.mock("@/tenant/features/faculty/components/FacultyWorkShell", () => ({
  FacultyWorkShell: () => <div data-testid="faculty-work-shell">Faculty Work Shell</div>,
}));

vi.mock("@/tenant/features/faculty/components/FacultyPageOverlays", () => ({
  FacultyPageOverlays: () => <div data-testid="faculty-page-overlays">Faculty Overlays</div>,
}));

vi.mock("@/tenant/features/faculty/components/FacultyPageHeaderActions", () => ({
  FacultyPageHeaderActions: () => <div>Faculty Header Actions</div>,
}));

describe("FacultyPageView Component", () => {
  it("renders faculty page shell with work shell and overlays", () => {
    const html = renderToStaticMarkup(
      <FacultyPageView
        canWrite={true}
        canExport={true}
        visibleTabs={[
          {
            id: "work",
            label: "Faculties",
            description: "Directory",
            icon: School,
          },
        ]}
        workSubTabs={[
          { key: "faculties", label: "Faculties", icon: Users },
          { key: "departments", label: "Departments", icon: Users },
          { key: "designations", label: "Designations", icon: Users },
        ]}
        activeWorkSubTab="faculties"
        setActiveWorkSubTab={vi.fn()}
        showDirectoryActions={true}
        showWorkHeaderActions={true}
        metricsTotal={12}
        activeTab="work"
        setActiveTab={vi.fn()}
        viewingDeleted={false}
        shownCount={12}
        openCreateForm={vi.fn()}
        openCreateDepartment={vi.fn()}
        openCreateDesignation={vi.fn()}
        onExportEntity={vi.fn()}
        onImportEntity={vi.fn()}
        tabPanelProps={{
          activeTab: "work",
          workTierProps: {} as never,
        }}
        pageOverlaysProps={{} as never}
      />,
    );

    expect(html).toContain("Faculty Team");
    expect(html).toContain("Faculty Work Shell");
    expect(html).toContain("Faculty Overlays");
    expect(html).toContain("Faculty Header Actions");
  });
});
