import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactsBulkActionBar } from "./ContactsBulkActionBar";

vi.mock("@/components/ui/ModuleWorkBulkActionBar", () => ({
  ModuleWorkBulkActionBar: ({ countLabel, deleteAction }: {
    countLabel: string;
    deleteAction?: { label: string; onClick: () => void };
  }) => (
    <div data-testid="bulk-action-bar">
      <span>{countLabel}</span>
      {deleteAction && <button>{deleteAction.label}</button>}
    </div>
  ),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params?.count !== undefined) return `${key}:${params.count}`;
      return key;
    },
  }),
}));

describe("ContactsBulkActionBar Component", () => {
  it("renders bulk action bar with selection count and actions", () => {
    const html = renderToStaticMarkup(
      <ContactsBulkActionBar
        selectedCount={3}
        viewingDeleted={false}
        bulkActions={["delete", "export"]}
        canWriteMessaging={true}
        canExport={true}
        canDelete={true}
        selectedTargets={{
          waTargets: [],
          smsReady: [],
          emailReady: [],
        }}
        onWhatsApp={vi.fn()}
        onSms={vi.fn()}
        onEmail={vi.fn()}
        onBulkExport={vi.fn()}
        onRequestBulkDelete={vi.fn()}
        onRequestBulkRestore={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );

    expect(html).toContain("contacts.selectedCount:3");
    expect(html).toContain("contacts.bulkDelete");
  });
});
