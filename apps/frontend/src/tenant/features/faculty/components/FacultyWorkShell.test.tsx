import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyWorkShell } from "./FacultyWorkShell";

vi.mock("@/components/ui/SubTabBar", () => ({
  SubTabBar: ({ tabs, value }: { tabs: Array<{ key: string; label: string }>; value: string }) => (
    <div data-testid="sub-tabs">
      {tabs.map((tab) => (
        <span key={tab.key} data-active={tab.key === value}>{tab.label}</span>
      ))}
    </div>
  ),
}));

vi.mock("@/tenant/features/faculty/components/FacultyWorkTier", () => ({
  FacultyWorkTier: () => <div>Faculty Directory</div>,
}));

vi.mock("@/tenant/features/faculty/components/FacultyDepartmentsSetupSection", () => ({
  FacultyDepartmentsSetupSection: () => <div>Departments Panel</div>,
}));

vi.mock("@/tenant/features/faculty/components/FacultyDesignationsSetupSection", () => ({
  FacultyDesignationsSetupSection: () => <div>Designations Panel</div>,
}));

vi.mock("@/components/ui/ModuleTierMotion", () => ({
  ModuleTierMotion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("FacultyWorkShell", () => {
  const subTabs = [
    { key: "faculties" as const, label: "Faculties" },
    { key: "departments" as const, label: "Departments" },
    { key: "designations" as const, label: "Designations" },
  ];

  it("renders directory under faculties sub-tab", () => {
    const html = renderToStaticMarkup(
      <FacultyWorkShell
        subTabs={subTabs}
        activeSubTab="faculties"
        onSubTabChange={vi.fn()}
        directoryProps={{} as never}
        onRequestAddDepartment={vi.fn()}
        onRequestAddDesignation={vi.fn()}
      />,
    );
    expect(html).toContain("Faculties");
    expect(html).toContain("Faculty Directory");
    expect(html).not.toContain("Departments Panel");
  });

  it("renders departments catalog under departments sub-tab", () => {
    const html = renderToStaticMarkup(
      <FacultyWorkShell
        subTabs={subTabs}
        activeSubTab="departments"
        onSubTabChange={vi.fn()}
        directoryProps={{} as never}
      />,
    );
    expect(html).toContain("Departments Panel");
    expect(html).not.toContain("Faculty Directory");
  });
});
