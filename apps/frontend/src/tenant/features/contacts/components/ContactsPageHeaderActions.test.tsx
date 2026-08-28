import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactsPageHeaderActions } from "./ContactsPageHeaderActions";

vi.mock("@/components/ui/ActionButton", () => ({
  ActionButton: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="action-button">{children}</button>
  ),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ContactsPageHeaderActions Component", () => {
  it("renders duplicates, export, and add contact action buttons", () => {
    const html = renderToStaticMarkup(
      <ContactsPageHeaderActions
        canExport={true}
        canRead={true}
        canWrite={true}
        viewingDeleted={false}
        openingDuplicates={false}
        onOpenDuplicates={vi.fn()}
        onExport={vi.fn()}
        onAddContact={vi.fn()}
      />,
    );

    expect(html).toContain("contacts.duplicates");
    expect(html).toContain("common.export");
    expect(html).toContain("contacts.addContact");
  });
});
