import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_CONTACT_PREFERENCES, type Contact } from "@mms/shared";
import { ContactsListCards } from "./ContactsListCards";

vi.mock("@/lib/contexts/ContactConfigContext", () => ({
  useContactConfig: () => ({
    prefs: DEFAULT_CONTACT_PREFERENCES,
    countryCodesMap: {},
    countryCodes: [],
    columnRegistry: [],
    isColumnVisible: () => true,
  }),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/features/contacts/components/ContactCardItem", () => ({
  ContactCardItem: ({ contact }: { contact: { name: string } }) => (
    <div data-testid="contact-card-item">{contact.name}</div>
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

describe("ContactsListCards Component", () => {
  it("renders card item for each contact", () => {
    const html = renderToStaticMarkup(
      <ContactsListCards
        contacts={[mockContact]}
        selected={[]}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(html).toContain("contact-card-item");
    expect(html).toContain("Zayd Harith");
  });
});
