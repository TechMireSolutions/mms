import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_CONTACT_PREFERENCES, type Contact } from "@mms/shared";
import { ContactsListDesktopTable } from "./ContactsListDesktopTable";

vi.mock("@/lib/contexts/ContactConfigContext", () => ({
  useContactConfig: () => ({
    prefs: DEFAULT_CONTACT_PREFERENCES,
    countryCodesMap: {},
    countryCodes: [],
    getColumnWidth: () => 120,
    setColumnWidth: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/features/contacts/components/ContactsTableHeader", () => ({
  ContactsTableHeader: () => <thead data-testid="table-header"><tr><th>Header</th></tr></thead>,
}));

vi.mock("@/tenant/features/contacts/components/ContactTableRow", () => ({
  ContactTableRow: ({ contact }: { contact: { name: string } }) => (
    <tr data-testid="table-row"><td>{contact.name}</td></tr>
  ),
}));

const mockContact: Contact = {
  id: "cnt-1",
  name: "Zayd Harith",
  firstName: "Zayd",
  lastName: "Harith",
  type: "student",
  status: "active",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("ContactsListDesktopTable Component", () => {
  it("renders table with header, rows, and footer count", () => {
    const html = renderToStaticMarkup(
      <ContactsListDesktopTable
        contacts={[mockContact]}
        selected={[]}
        onSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        sortField="name"
        sortDir="asc"
        onSort={vi.fn()}
      />,
    );

    expect(html).toContain("table-header");
    expect(html).toContain("Zayd Harith");
  });
});
