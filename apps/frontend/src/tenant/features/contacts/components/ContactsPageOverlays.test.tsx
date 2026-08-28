import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactsPageOverlays } from "./ContactsPageOverlays";

vi.mock("@/lib/contexts/ContactConfigContext", () => ({
  useContactConfig: () => ({
    formTabsReady: true,
  }),
}));

vi.mock("@/tenant/features/contacts/components/ContactsPageConfirmDialogs", () => ({
  ContactsPageConfirmDialogs: () => <div data-testid="confirm-dialogs">Dialogs</div>,
}));

describe("ContactsPageOverlays Component", () => {
  it("renders overlay chrome and dialogs", () => {
    const html = renderToStaticMarkup(
      <ContactsPageOverlays
        canWrite={true}
        canDelete={true}
        showForm={false}
        editContact={null}
        defaultCountry="Pakistan"
        defaultCity="Karachi"
        defaultProvince="Sindh"
        onCloseForm={vi.fn()}
        onSave={vi.fn()}
        showDuplicates={false}
        onCloseDuplicates={vi.fn()}
        onMerge={vi.fn()}
        messagingTarget={null}
        onCloseComposer={vi.fn()}
        viewContact={null}
        onCloseView={vi.fn()}
        onEditFromDrawer={vi.fn()}
        allContactsForLinks={[]}
        bulkDeleteOpen={false}
        onBulkDeleteOpenChange={vi.fn()}
        selectedCount={0}
        onConfirmBulkDelete={vi.fn()}
        deleteTarget={null}
        onDeleteTargetOpenChange={vi.fn()}
        onConfirmSingleDelete={vi.fn()}
        bulkRestoreOpen={false}
        onBulkRestoreOpenChange={vi.fn()}
        onConfirmBulkRestore={vi.fn()}
      />,
    );

    expect(html).toContain("confirm-dialogs");
  });
});
