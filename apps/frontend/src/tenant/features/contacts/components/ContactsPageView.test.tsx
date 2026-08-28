import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Users } from "lucide-react";
import { ContactsPageView } from "./ContactsPageView";

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

vi.mock("@/components/ui/ResponsiveAccordionTabs", () => ({
  ResponsiveAccordionTabs: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion-tabs">{children}</div>
  ),
}));

vi.mock("@/tenant/features/contacts/components/ContactsCommandMetrics", () => ({
  ContactsCommandMetrics: () => <div data-testid="contacts-metrics">Metrics</div>,
}));

vi.mock("@/tenant/features/contacts/components/ContactsDataBanner", () => ({
  default: () => <div data-testid="data-banner">Banner</div>,
}));

vi.mock("@/tenant/features/contacts/components/ContactsSyncConflictPanel", () => ({
  default: () => <div data-testid="conflict-panel">Conflict Panel</div>,
}));

vi.mock("@/tenant/features/contacts/components/ContactsPageOverlays", () => ({
  ContactsPageOverlays: () => <div data-testid="page-overlays">Overlays</div>,
}));

vi.mock("@/tenant/features/contacts/components/ContactsWorkTier", () => ({
  ContactsWorkTier: () => <div data-testid="work-tier">Work Tier</div>,
}));

vi.mock("@/tenant/features/contacts/components/ContactsPageHeaderActions", () => ({
  ContactsPageHeaderActions: () => <div data-testid="header-actions">Actions</div>,
}));

describe("ContactsPageView Component", () => {
  it("renders presentational contacts page with header, tabs, and work tier", () => {
    const html = renderToStaticMarkup(
      <ContactsPageView
        t={((key: string) => key) as never}
        visibleTopTabs={[
          {
            id: "work",
            label: "Work",
            description: "Directory",
            icon: Users,
          },
        ]}
        effectiveTab="work"
        setActiveTab={vi.fn()}
        canExport={true}
        canRead={true}
        canWrite={true}
        viewingDeleted={false}
        openingDuplicates={false}
        handleOpenDuplicates={vi.fn()}
        handleExportCSV={vi.fn()}
        handleNew={vi.fn()}
        shownCount={10}
        pendingCount={0}
        conflictCount={0}
        flushing={false}
        flush={vi.fn()}
        openConflictReview={vi.fn()}
        conflictPanelOpen={false}
        setConflictPanelOpen={vi.fn()}
        tabPanelProps={{
          workTierProps: {} as never,
          setupTierProps: {} as never,
        }}
        overlayProps={{} as never}
      />,
    );

    expect(html).toContain("nav.contacts");
    expect(html).toContain("Work Tier");
    expect(html).toContain("Overlays");
  });
});
